"""
eMart Inventory Management System (Tkinter + MySQL)

Professional, SaaS-like dashboard UI (sidebar + topbar + pages) with:
- Dashboard: stat cards, recent activity (audit log), insights
- Inventory: table + filters + search + add/edit/delete/reorder
- Audit Log: action history
- Smart Expiry Predictor: risk model using expiry_date

Database:
- inventory_db
- products(id AI PK, name, category, quantity, price, expiry_date)
- audit_logs(id AI PK, action, description, created_at)

IMPORTANT:
Edit DB_CONFIG below to match your MySQL credentials.
"""

from __future__ import annotations

import datetime as _dt
import tkinter as tk
from dataclasses import dataclass
from tkinter import messagebox, ttk

import mysql.connector
from mysql.connector import Error


# -----------------------------
# MySQL configuration (EDIT ME)
# -----------------------------
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "licet@123",  # <-- put your MySQL password here
    "port": 3306,
}

DB_NAME = "inventory_db"
TABLE_PRODUCTS = "products"
TABLE_AUDIT = "audit_logs"

# Business rules
LOW_STOCK_THRESHOLD = 5
REORDER_INCREMENT = 10
EXPIRING_SOON_DAYS = 7

# UI refresh (ms)
AUTO_REFRESH_MS = 6000


def get_connection(with_database: bool = True):
    """
    Create and return a MySQL connection.
    If with_database=False, connects without specifying a DB (used to create DB).
    """
    cfg = dict(DB_CONFIG)
    if with_database:
        cfg["database"] = DB_NAME
    return mysql.connector.connect(**cfg)


def init_db():
    """
    Create database and required tables/columns if they do not exist.
    Safe upgrades:
    - Adds `category` or `expiry_date` if missing.
    - Creates audit log table.
    """
    try:
        # Create DB
        conn = get_connection(with_database=False)
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cur.close()
        conn.close()

        conn = get_connection(with_database=True)
        cur = conn.cursor()

        # Products table (new installs)
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TABLE_PRODUCTS} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                sku VARCHAR(50) NULL,
                supplier VARCHAR(255) NULL,
                quantity INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                expiry_date DATE NULL
            )
            """
        )

        # Upgrade old installs
        try:
            cur.execute(
                f"ALTER TABLE {TABLE_PRODUCTS} "
                "ADD COLUMN category VARCHAR(255) NOT NULL DEFAULT 'General'"
            )
        except Error:
            pass
        try:
            cur.execute(f"ALTER TABLE {TABLE_PRODUCTS} ADD COLUMN expiry_date DATE NULL")
        except Error:
            pass
        try:
            cur.execute(f"ALTER TABLE {TABLE_PRODUCTS} ADD COLUMN sku VARCHAR(50) NULL")
        except Error:
            pass
        try:
            cur.execute(f"ALTER TABLE {TABLE_PRODUCTS} ADD COLUMN supplier VARCHAR(255) NULL")
        except Error:
            pass

        # Audit logs table
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TABLE_AUDIT} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(50) NOT NULL,
                description VARCHAR(500) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.commit()
        cur.close()
        conn.close()
    except Error as e:
        messagebox.showerror(
            "Database Error",
            "Failed to initialize database.\n\n"
            f"Details: {e}\n\n"
            "Check DB_CONFIG and ensure MySQL is running.",
        )


def money(value: float) -> str:
    """Format number as currency-like text (simple)."""
    return f"{value:,.2f}"


def sales_rate_for_category(category: str) -> int:
    """
    Simulated daily sales rate (units/day), based on category keywords.
    This is a demo feature to mimic the dashboard shown in the reference image.
    """
    c = (category or "").strip().lower()
    if not c:
        return 5
    if "dairy" in c or "milk" in c:
        return 25
    if "snack" in c or "chips" in c or "biscuit" in c:
        return 10
    if "beverage" in c or "drink" in c or "cola" in c or "juice" in c:
        return 7
    if "personal" in c or "care" in c or "tooth" in c:
        return 2
    if "house" in c or "clean" in c or "detergent" in c:
        return 1
    return 5


def parse_date_yyyy_mm_dd(value: str) -> _dt.date | None:
    """Parse 'YYYY-MM-DD' to date, or return None for empty."""
    value = value.strip()
    if not value:
        return None
    try:
        return _dt.date.fromisoformat(value)
    except ValueError:
        raise ValueError("Expiry date must be in YYYY-MM-DD format (or leave empty).")


def parse_date_flexible(value: str) -> _dt.date | None:
    """
    Accept either:
    - YYYY-MM-DD (iso)
    - DD-MM-YYYY (common form UI placeholder)
    """
    value = value.strip()
    if not value:
        return None
    # Try ISO first
    try:
        return _dt.date.fromisoformat(value)
    except ValueError:
        pass
    # Try DD-MM-YYYY
    try:
        d, m, y = value.split("-")
        return _dt.date(int(y), int(m), int(d))
    except Exception:
        raise ValueError("Expiry date must be YYYY-MM-DD or DD-MM-YYYY (or leave empty).")


@dataclass(frozen=True)
class Product:
    id: int
    name: str
    category: str
    sku: str | None
    supplier: str | None
    quantity: int
    price: float
    expiry_date: _dt.date | None


class EmartApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("eMart — Inventory Management System")
        self.geometry("1200x720")
        self.minsize(1100, 660)

        init_db()

        # app state
        self.active_page = tk.StringVar(value="Dashboard")
        self.inventory_filter = tk.StringVar(value="ALL")  # ALL / IN / LOW / OUT
        self.inventory_search = tk.StringVar(value="")

        self._build_styles()
        self._build_layout()
        self._switch_page("Dashboard")
        self._schedule_auto_refresh()

    # -----------------------------
    # Styling
    # -----------------------------
    def _build_styles(self):
        style = ttk.Style(self)
        if "vista" in style.theme_names():
            style.theme_use("vista")

        # Colors (light SaaS dashboard feel)
        self.C_BG = "#f6f8fb"
        self.C_PANEL = "#ffffff"
        self.C_SIDEBAR = "#0b1220"
        self.C_SIDEBAR_2 = "#101a30"
        self.C_PRIMARY = "#2563eb"
        self.C_TEXT = "#0f172a"
        self.C_MUTED = "#64748b"
        self.C_BORDER = "#e5e7eb"
        self.C_WARN_BG = "#fff7ed"
        self.C_LOW_BG = "#fff2cc"

        self.configure(bg=self.C_BG)

        style.configure("Card.TFrame", background=self.C_PANEL)
        style.configure("Page.TFrame", background=self.C_BG)
        style.configure("Topbar.TFrame", background=self.C_PANEL)
        style.configure("Sidebar.TFrame", background=self.C_SIDEBAR)

        style.configure("H1.TLabel", background=self.C_PANEL, foreground=self.C_TEXT, font=("Segoe UI", 16, "bold"))
        style.configure("H2.TLabel", background=self.C_BG, foreground=self.C_TEXT, font=("Segoe UI", 14, "bold"))
        style.configure("Muted.TLabel", background=self.C_PANEL, foreground=self.C_MUTED, font=("Segoe UI", 10))
        style.configure("Stat.TLabel", background=self.C_PANEL, foreground=self.C_TEXT, font=("Segoe UI", 18, "bold"))
        style.configure("StatTitle.TLabel", background=self.C_PANEL, foreground=self.C_MUTED, font=("Segoe UI", 10, "bold"))

        style.configure("Primary.TButton", font=("Segoe UI", 10, "bold"))
        style.map(
            "Primary.TButton",
            foreground=[("!disabled", "white")],
            background=[("!disabled", self.C_PRIMARY), ("active", "#1d4ed8")],
        )

        # Treeview styling
        style.configure(
            "Emart.Treeview",
            rowheight=28,
            font=("Segoe UI", 10),
            background=self.C_PANEL,
            fieldbackground=self.C_PANEL,
            bordercolor=self.C_BORDER,
            borderwidth=1,
        )
        style.configure("Emart.Treeview.Heading", font=("Segoe UI", 10, "bold"))

    # -----------------------------
    # Layout
    # -----------------------------
    def _build_layout(self):
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # Sidebar
        self.sidebar = ttk.Frame(self, style="Sidebar.TFrame", width=240)
        self.sidebar.grid(row=0, column=0, sticky="nsw")
        self.sidebar.grid_propagate(False)

        # Main container
        self.main = ttk.Frame(self, style="Page.TFrame")
        self.main.grid(row=0, column=1, sticky="nsew")
        self.main.grid_rowconfigure(1, weight=1)
        self.main.grid_columnconfigure(0, weight=1)

        self._build_sidebar()
        self._build_topbar()
        self._build_pages()

    def _build_sidebar(self):
        brand = tk.Frame(self.sidebar, bg=self.C_SIDEBAR, padx=18, pady=18)
        brand.pack(fill="x")
        tk.Label(brand, text="eMart", fg="white", bg=self.C_SIDEBAR, font=("Segoe UI", 18, "bold")).pack(anchor="w")
        tk.Label(brand, text="Admin Console", fg="#9ca3af", bg=self.C_SIDEBAR, font=("Segoe UI", 10)).pack(anchor="w", pady=(2, 0))

        nav = tk.Frame(self.sidebar, bg=self.C_SIDEBAR, padx=12, pady=10)
        nav.pack(fill="x")

        self.nav_buttons: dict[str, tk.Button] = {}
        for label in ["Dashboard", "Inventory", "Audit Log", "Smart Expiry Predictor"]:
            btn = tk.Button(
                nav,
                text=label,
                anchor="w",
                padx=14,
                pady=10,
                relief="flat",
                bd=0,
                fg="#e5e7eb",
                bg=self.C_SIDEBAR,
                activebackground=self.C_SIDEBAR_2,
                activeforeground="white",
                font=("Segoe UI", 11),
                command=lambda l=label: self._switch_page(l),
            )
            btn.pack(fill="x", pady=4)
            self.nav_buttons[label] = btn

        cta_wrap = tk.Frame(self.sidebar, bg=self.C_SIDEBAR, padx=12, pady=10)
        cta_wrap.pack(side="bottom", fill="x")
        add_btn = tk.Button(
            cta_wrap,
            text="＋ Add Product",
            anchor="center",
            padx=14,
            pady=12,
            relief="flat",
            bd=0,
            fg="white",
            bg=self.C_PRIMARY,
            activebackground="#1d4ed8",
            activeforeground="white",
            font=("Segoe UI", 11, "bold"),
            command=self.open_add_modal,
        )
        add_btn.pack(fill="x", pady=(6, 8))
        tk.Label(cta_wrap, text="Tip: Select a row to edit/delete.", fg="#9ca3af", bg=self.C_SIDEBAR, font=("Segoe UI", 9)).pack(anchor="w")

    def _build_topbar(self):
        top = ttk.Frame(self.main, style="Topbar.TFrame", padding=(18, 12))
        top.grid(row=0, column=0, sticky="ew")
        top.grid_columnconfigure(1, weight=1)

        ttk.Label(top, text="eMart", style="H1.TLabel").grid(row=0, column=0, sticky="w")

        search_wrap = tk.Frame(top, bg=self.C_PANEL)
        search_wrap.grid(row=0, column=1, sticky="ew", padx=(18, 18))
        search_wrap.grid_columnconfigure(0, weight=1)
        self.global_search_var = tk.StringVar(value="")
        self.global_search_entry = ttk.Entry(search_wrap, textvariable=self.global_search_var)
        self.global_search_entry.grid(row=0, column=0, sticky="ew")
        self.global_search_entry.bind("<Return>", lambda _e: self._global_search())

        self.top_stats = tk.Frame(top, bg=self.C_PANEL)
        self.top_stats.grid(row=0, column=2, sticky="e")
        self.top_total_products = tk.Label(self.top_stats, text="Products: —", bg=self.C_PANEL, fg=self.C_MUTED, font=("Segoe UI", 10))
        self.top_total_products.pack(side="left", padx=(0, 14))
        self.top_total_value = tk.Label(self.top_stats, text="Value: —", bg=self.C_PANEL, fg=self.C_MUTED, font=("Segoe UI", 10))
        self.top_total_value.pack(side="left", padx=(0, 14))
        tk.Label(self.top_stats, text="Admin", bg=self.C_PANEL, fg=self.C_TEXT, font=("Segoe UI", 10, "bold")).pack(side="left")

    def _build_pages(self):
        self.pages = ttk.Frame(self.main, style="Page.TFrame", padding=(18, 16))
        self.pages.grid(row=1, column=0, sticky="nsew")
        self.pages.grid_rowconfigure(0, weight=1)
        self.pages.grid_columnconfigure(0, weight=1)

        self.page_frames: dict[str, ttk.Frame] = {}
        self.page_frames["Dashboard"] = self._build_dashboard_page(self.pages)
        self.page_frames["Inventory"] = self._build_inventory_page(self.pages)
        self.page_frames["Audit Log"] = self._build_audit_page(self.pages)
        self.page_frames["Smart Expiry Predictor"] = self._build_expiry_page(self.pages)

        for frame in self.page_frames.values():
            frame.grid(row=0, column=0, sticky="nsew")

    def _set_active_nav(self, label: str):
        for name, btn in self.nav_buttons.items():
            if name == label:
                btn.configure(bg=self.C_SIDEBAR_2, fg="white")
            else:
                btn.configure(bg=self.C_SIDEBAR, fg="#e5e7eb")

    def _switch_page(self, label: str):
        self.active_page.set(label)
        self._set_active_nav(label)
        self.page_frames[label].tkraise()
        self.refresh_current_page()

    # -----------------------------
    # DB helpers (commit/rollback)
    # -----------------------------
    def _db_exec(self, fn):
        conn = None
        try:
            conn = get_connection(True)
            cur = conn.cursor()
            result = fn(cur)
            conn.commit()
            cur.close()
            conn.close()
            return result
        except Error as e:
            if conn is not None:
                try:
                    conn.rollback()
                    conn.close()
                except Exception:
                    pass
            raise e

    def log_action(self, action: str, description: str):
        try:
            self._db_exec(lambda cur: cur.execute(
                f"INSERT INTO {TABLE_AUDIT} (action, description) VALUES (%s, %s)",
                (action, description),
            ))
        except Error:
            pass

    def fetch_products(self, where_sql: str = "", params: tuple = ()) -> list[Product]:
        def _run(cur):
            cur.execute(
                f"SELECT id, name, category, sku, supplier, quantity, price, expiry_date FROM {TABLE_PRODUCTS} {where_sql} ORDER BY id DESC",
                params,
            )
            rows = cur.fetchall()
            items: list[Product] = []
            for r in rows:
                expiry = r[7]
                if isinstance(expiry, _dt.datetime):
                    expiry = expiry.date()
                items.append(
                    Product(
                        id=int(r[0]),
                        name=str(r[1]),
                        category=str(r[2]),
                        sku=(str(r[3]) if r[3] is not None else None),
                        supplier=(str(r[4]) if r[4] is not None else None),
                        quantity=int(r[5]),
                        price=float(r[6]),
                        expiry_date=expiry if isinstance(expiry, _dt.date) else None,
                    )
                )
            return items

        return self._db_exec(_run)

    def get_dashboard_stats(self):
        def _run(cur):
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(quantity),0) FROM {TABLE_PRODUCTS}")
            total_products, total_qty = cur.fetchone()
            cur.execute(f"SELECT COALESCE(SUM(quantity * price),0) FROM {TABLE_PRODUCTS}")
            total_value = float(cur.fetchone()[0] or 0)
            cur.execute(f"SELECT COUNT(*) FROM {TABLE_PRODUCTS} WHERE quantity < %s", (LOW_STOCK_THRESHOLD,))
            low_stock = int(cur.fetchone()[0] or 0)
            cur.execute(
                f"SELECT COUNT(*) FROM {TABLE_PRODUCTS} "
                "WHERE expiry_date IS NOT NULL AND DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND %s",
                (EXPIRING_SOON_DAYS,),
            )
            expiring_soon = int(cur.fetchone()[0] or 0)
            return int(total_products or 0), int(total_qty or 0), total_value, low_stock, expiring_soon

        return self._db_exec(_run)

    def fetch_recent_audit(self, limit: int = 10):
        return self._db_exec(lambda cur: (cur.execute(
            f"SELECT action, description, created_at FROM {TABLE_AUDIT} ORDER BY id DESC LIMIT %s",
            (limit,),
        ), cur.fetchall())[1])

    # -----------------------------
    # Pages
    # -----------------------------
    def _build_dashboard_page(self, parent: ttk.Frame) -> ttk.Frame:
        page = ttk.Frame(parent, style="Page.TFrame")
        page.grid_rowconfigure(2, weight=1)
        page.grid_columnconfigure(0, weight=1)

        ttk.Label(page, text="Dashboard", style="H2.TLabel").grid(row=0, column=0, sticky="w")

        cards = ttk.Frame(page, style="Page.TFrame")
        cards.grid(row=1, column=0, sticky="ew", pady=(12, 12))
        for i in range(4):
            cards.grid_columnconfigure(i, weight=1, uniform="cards")

        self.card_total_products = self._make_stat_card(cards, 0, "Total Products", "—")
        self.card_value = self._make_stat_card(cards, 1, "Inventory Value", "—")
        self.card_low = self._make_stat_card(cards, 2, "Low Stock", "—")
        self.card_expiring = self._make_stat_card(cards, 3, "Expiring Soon", "—")

        body = ttk.Frame(page, style="Page.TFrame")
        body.grid(row=2, column=0, sticky="nsew")
        body.grid_columnconfigure(0, weight=2, uniform="body")
        body.grid_columnconfigure(1, weight=1, uniform="body")
        body.grid_rowconfigure(0, weight=1)

        activity = ttk.Frame(body, style="Card.TFrame", padding=(14, 12))
        activity.grid(row=0, column=0, sticky="nsew", padx=(0, 12))
        activity.grid_rowconfigure(1, weight=1)
        activity.grid_columnconfigure(0, weight=1)
        ttk.Label(activity, text="Recent Activity", style="H1.TLabel").grid(row=0, column=0, sticky="w")
        self.activity_list = tk.Listbox(activity, borderwidth=0, highlightthickness=1, highlightbackground=self.C_BORDER, font=("Segoe UI", 10), activestyle="none")
        self.activity_list.grid(row=1, column=0, sticky="nsew", pady=(10, 0))

        insights = ttk.Frame(body, style="Card.TFrame", padding=(14, 12))
        insights.grid(row=0, column=1, sticky="nsew")
        insights.grid_rowconfigure(1, weight=1)
        insights.grid_columnconfigure(0, weight=1)
        ttk.Label(insights, text="Insights", style="H1.TLabel").grid(row=0, column=0, sticky="w")
        self.insights_text = tk.Text(insights, height=10, wrap="word", borderwidth=0, highlightthickness=1, highlightbackground=self.C_BORDER, font=("Segoe UI", 10))
        self.insights_text.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
        self.insights_text.insert("1.0", "Loading insights…")
        self.insights_text.configure(state="disabled")
        return page

    def _make_stat_card(self, parent, col: int, title: str, value: str):
        card = ttk.Frame(parent, style="Card.TFrame", padding=(14, 12))
        card.grid(row=0, column=col, sticky="ew", padx=(0, 12) if col < 3 else (0, 0))
        ttk.Label(card, text=title, style="StatTitle.TLabel").pack(anchor="w")
        value_label = ttk.Label(card, text=value, style="Stat.TLabel")
        value_label.pack(anchor="w", pady=(8, 0))
        return value_label

    def _build_inventory_page(self, parent: ttk.Frame) -> ttk.Frame:
        page = ttk.Frame(parent, style="Page.TFrame")
        page.grid_rowconfigure(2, weight=1)
        page.grid_columnconfigure(0, weight=1)

        header = ttk.Frame(page, style="Page.TFrame")
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(1, weight=1)
        ttk.Label(header, text="Inventory", style="H2.TLabel").grid(row=0, column=0, sticky="w")
        right = ttk.Frame(header, style="Page.TFrame")
        right.grid(row=0, column=1, sticky="e")
        ttk.Button(right, text="Refresh", command=self.refresh_inventory).pack(side="left", padx=(0, 8))
        ttk.Button(right, text=f"Reorder (+{REORDER_INCREMENT})", command=self.reorder_selected, style="Primary.TButton").pack(side="left", padx=(0, 8))
        ttk.Button(right, text="Edit Selected", command=self.open_edit_modal).pack(side="left", padx=(0, 8))
        ttk.Button(right, text="Delete Selected", command=self.delete_selected).pack(side="left")

        controls = ttk.Frame(page, style="Card.TFrame", padding=(12, 10))
        controls.grid(row=1, column=0, sticky="ew", pady=(12, 12))
        controls.grid_columnconfigure(2, weight=1)
        ttk.Label(controls, text="Search", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        self.inv_search_entry = ttk.Entry(controls, textvariable=self.inventory_search)
        self.inv_search_entry.grid(row=0, column=1, sticky="ew", padx=(8, 12))
        self.inv_search_entry.bind("<Return>", lambda _e: self.refresh_inventory())

        filt = ttk.Frame(controls, style="Card.TFrame")
        filt.grid(row=0, column=2, sticky="w")
        for label, key in [("All", "ALL"), ("In Stock", "IN"), ("Low Stock", "LOW"), ("Out of Stock", "OUT")]:
            ttk.Radiobutton(filt, text=label, value=key, variable=self.inventory_filter, command=self.refresh_inventory).pack(side="left", padx=(0, 10))

        ttk.Button(controls, text="Apply", command=self.refresh_inventory, style="Primary.TButton").grid(row=0, column=3, sticky="e")
        ttk.Button(controls, text="Clear", command=self._clear_inventory_search).grid(row=0, column=4, sticky="e", padx=(8, 0))

        table = ttk.Frame(page, style="Card.TFrame", padding=(10, 8))
        table.grid(row=2, column=0, sticky="nsew")
        table.grid_rowconfigure(0, weight=1)
        table.grid_columnconfigure(0, weight=1)

        columns = ("name", "category", "price", "stock", "expiry")
        self.inv_tree = ttk.Treeview(table, columns=columns, show="headings", style="Emart.Treeview")
        for c, t in [("name", "Name"), ("category", "Category"), ("price", "Price"), ("stock", "Stock"), ("expiry", "Expiry")]:
            self.inv_tree.heading(c, text=t)
        self.inv_tree.column("name", width=340, anchor="w")
        self.inv_tree.column("category", width=170, anchor="w")
        self.inv_tree.column("price", width=120, anchor="e")
        self.inv_tree.column("stock", width=100, anchor="center")
        self.inv_tree.column("expiry", width=130, anchor="center")

        vsb = ttk.Scrollbar(table, orient="vertical", command=self.inv_tree.yview)
        self.inv_tree.configure(yscrollcommand=vsb.set)
        self.inv_tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")

        self.inv_tree.tag_configure("lowstock", background=self.C_LOW_BG)
        self.inv_tree.tag_configure("outstock", background="#ffe4e6")
        self.inv_tree.bind("<<TreeviewSelect>>", self._on_inventory_select)
        self.selected_product_id: int | None = None
        return page

    def _build_audit_page(self, parent: ttk.Frame) -> ttk.Frame:
        page = ttk.Frame(parent, style="Page.TFrame")
        page.grid_rowconfigure(1, weight=1)
        page.grid_columnconfigure(0, weight=1)

        header = ttk.Frame(page, style="Page.TFrame")
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(1, weight=1)
        ttk.Label(header, text="Audit Log", style="H2.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Button(header, text="Refresh", command=self.refresh_audit, style="Primary.TButton").grid(row=0, column=1, sticky="e")

        table = ttk.Frame(page, style="Card.TFrame", padding=(10, 8))
        table.grid(row=1, column=0, sticky="nsew", pady=(12, 0))
        table.grid_rowconfigure(0, weight=1)
        table.grid_columnconfigure(0, weight=1)

        columns = ("action", "description", "time")
        self.audit_tree = ttk.Treeview(table, columns=columns, show="headings", style="Emart.Treeview")
        for c, t in [("action", "Action"), ("description", "Description"), ("time", "Time")]:
            self.audit_tree.heading(c, text=t)
        self.audit_tree.column("action", width=140, anchor="w")
        self.audit_tree.column("description", width=650, anchor="w")
        self.audit_tree.column("time", width=180, anchor="center")

        vsb = ttk.Scrollbar(table, orient="vertical", command=self.audit_tree.yview)
        self.audit_tree.configure(yscrollcommand=vsb.set)
        self.audit_tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        return page

    def _build_expiry_page(self, parent: ttk.Frame) -> ttk.Frame:
        page = ttk.Frame(parent, style="Page.TFrame")
        page.grid_rowconfigure(2, weight=1)
        page.grid_columnconfigure(0, weight=1)

        header = ttk.Frame(page, style="Page.TFrame")
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(1, weight=1)
        ttk.Label(header, text="Smart Expiry Predictor", style="H2.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Button(header, text="Refresh", command=self.refresh_expiry, style="Primary.TButton").grid(row=0, column=1, sticky="e")

        desc = ttk.Frame(page, style="Card.TFrame", padding=(12, 10))
        desc.grid(row=1, column=0, sticky="ew", pady=(12, 12))
        ttk.Label(
            desc,
            text=(
                "Formula: risk_score = (days_to_sell / days_until_expiry) × 100\n"
                "Legend: ≥ 80 → At Risk   |   40–79 → Watch   |   < 40 → Safe"
            ),
            style="Muted.TLabel",
        ).pack(anchor="w")

        table = ttk.Frame(page, style="Card.TFrame", padding=(10, 8))
        table.grid(row=2, column=0, sticky="nsew")
        table.grid_rowconfigure(0, weight=1)
        table.grid_columnconfigure(0, weight=1)

        columns = (
            "name",
            "stock",
            "sales",
            "sell",
            "expiry",
            "risk",
            "recommendation",
        )
        self.exp_tree = ttk.Treeview(table, columns=columns, show="headings", style="Emart.Treeview")
        for c, t in [
            ("name", "PRODUCT NAME"),
            ("stock", "STOCK QTY"),
            ("sales", "DAILY SALES RATE"),
            ("sell", "DAYS TO SELL"),
            ("expiry", "DAYS UNTIL EXPIRY"),
            ("risk", "RISK SCORE"),
            ("recommendation", "RECOMMENDATION"),
        ]:
            self.exp_tree.heading(c, text=t)
        self.exp_tree.column("name", width=320, anchor="w")
        self.exp_tree.column("stock", width=90, anchor="center")
        self.exp_tree.column("sales", width=130, anchor="center")
        self.exp_tree.column("sell", width=110, anchor="center")
        self.exp_tree.column("expiry", width=140, anchor="center")
        self.exp_tree.column("risk", width=110, anchor="center")
        self.exp_tree.column("recommendation", width=220, anchor="w")

        self.exp_tree.tag_configure("risk", background="#ffe4e6")   # red-ish
        self.exp_tree.tag_configure("watch", background="#fff7ed")  # amber-ish
        self.exp_tree.tag_configure("safe", background="#ecfeff")   # cyan-ish
        self.exp_tree.tag_configure("expired", background="#fee2e2")

        vsb = ttk.Scrollbar(table, orient="vertical", command=self.exp_tree.yview)
        self.exp_tree.configure(yscrollcommand=vsb.set)
        self.exp_tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        return page

    # -----------------------------
    # Inventory events/actions
    # -----------------------------
    def _clear_inventory_search(self):
        self.inventory_search.set("")
        self.refresh_inventory()

    def _on_inventory_select(self, _event):
        sel = self.inv_tree.selection()
        if not sel:
            self.selected_product_id = None
            return
        tags = self.inv_tree.item(sel[0], "tags")
        try:
            self.selected_product_id = int(tags[0])
        except Exception:
            self.selected_product_id = None

    def open_add_modal(self):
        self._open_product_modal(mode="add")

    def open_edit_modal(self):
        if not self.selected_product_id:
            messagebox.showwarning("Select a product", "Please select a product in Inventory first.")
            return
        self._open_product_modal(mode="edit", product_id=self.selected_product_id)

    def _open_product_modal(self, mode: str, product_id: int | None = None):
        is_edit = mode == "edit"
        data: Product | None = None
        if is_edit and product_id is not None:
            items = self.fetch_products("WHERE id=%s", (product_id,))
            data = items[0] if items else None
            if not data:
                messagebox.showwarning("Not found", "Selected product no longer exists.")
                self.refresh_inventory()
                return

        win = tk.Toplevel(self)
        win.title("Edit Product" if is_edit else "Add Product")
        win.configure(bg=self.C_BG)
        win.resizable(False, False)
        win.transient(self)
        win.grab_set()

        wrap = ttk.Frame(win, style="Card.TFrame", padding=(16, 14))
        wrap.pack(fill="both", expand=True, padx=16, pady=16)

        wrap.grid_columnconfigure(0, weight=1)
        wrap.grid_columnconfigure(1, weight=1)

        ttk.Label(
            wrap,
            text=("Add New Product" if not is_edit else "Edit Product"),
            style="H1.TLabel",
        ).grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Label(
            wrap,
            text="Fill in the product details below",
            style="Muted.TLabel",
        ).grid(row=1, column=0, columnspan=2, sticky="w", pady=(2, 8))

        name_var = tk.StringVar(value=data.name if data else "")
        sku_var = tk.StringVar(value=(data.sku or "") if data else "")
        cat_var = tk.StringVar(value=data.category if data else "Other")
        price_var = tk.StringVar(value=str(data.price) if data else "")
        supplier_var = tk.StringVar(value=(data.supplier or "") if data else "")
        exp_var = tk.StringVar(value=(data.expiry_date.strftime("%d-%m-%Y") if (data and data.expiry_date) else ""))
        qty_var = tk.StringVar(value=str(data.quantity) if data else "0")
        price_var = tk.StringVar(value=str(data.price) if data else "")

        # Product Name (full width)
        ttk.Label(wrap, text="Product Name", style="Muted.TLabel").grid(row=2, column=0, columnspan=2, sticky="w", pady=(8, 0))
        e1 = ttk.Entry(wrap, textvariable=name_var)
        e1.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(6, 10))

        # Row: SKU + Category dropdown
        left = ttk.Frame(wrap, style="Card.TFrame")
        left.grid(row=4, column=0, sticky="ew", padx=(0, 10))
        right = ttk.Frame(wrap, style="Card.TFrame")
        right.grid(row=4, column=1, sticky="ew")
        left.grid_columnconfigure(0, weight=1)
        right.grid_columnconfigure(0, weight=1)

        ttk.Label(left, text="SKU", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        sku_entry = ttk.Entry(left, textvariable=sku_var)
        sku_entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))

        ttk.Label(right, text="Category", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        categories = ["Dairy", "Bakery", "Produce", "Frozen", "Beverages", "Snacks", "Meat", "Personal Care", "Household", "Other"]
        cat_combo = ttk.Combobox(right, textvariable=cat_var, values=categories, state="readonly")
        cat_combo.grid(row=1, column=0, sticky="ew", pady=(6, 0))

        # Row: Price + Stock Qty
        left2 = ttk.Frame(wrap, style="Card.TFrame")
        left2.grid(row=5, column=0, sticky="ew", padx=(0, 10), pady=(10, 0))
        right2 = ttk.Frame(wrap, style="Card.TFrame")
        right2.grid(row=5, column=1, sticky="ew", pady=(10, 0))
        left2.grid_columnconfigure(0, weight=1)
        right2.grid_columnconfigure(0, weight=1)

        ttk.Label(left2, text="Price (₹)", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        price_entry = ttk.Entry(left2, textvariable=price_var)
        price_entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))

        ttk.Label(right2, text="Stock Qty", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        qty_entry = ttk.Entry(right2, textvariable=qty_var)
        qty_entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))

        # Row: Supplier + Expiry Date
        left3 = ttk.Frame(wrap, style="Card.TFrame")
        left3.grid(row=6, column=0, sticky="ew", padx=(0, 10), pady=(10, 0))
        right3 = ttk.Frame(wrap, style="Card.TFrame")
        right3.grid(row=6, column=1, sticky="ew", pady=(10, 0))
        left3.grid_columnconfigure(0, weight=1)
        right3.grid_columnconfigure(0, weight=1)

        ttk.Label(left3, text="Supplier", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        supplier_entry = ttk.Entry(left3, textvariable=supplier_var)
        supplier_entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))

        ttk.Label(right3, text="Expiry Date", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        exp_entry = ttk.Entry(right3, textvariable=exp_var)
        exp_entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))
        ttk.Label(right3, text="Format: dd-mm-yyyy (or yyyy-mm-dd)", style="Muted.TLabel").grid(row=2, column=0, sticky="w", pady=(4, 0))

        btns = ttk.Frame(wrap, style="Card.TFrame")
        btns.grid(row=7, column=0, columnspan=2, sticky="e", pady=(16, 0))

        def _validate():
            name = name_var.get().strip()
            sku = sku_var.get().strip() or None
            cat = cat_var.get().strip() or "Other"
            if not name or not cat:
                raise ValueError("Name and Category are required.")
            try:
                qty = int(qty_var.get().strip())
            except ValueError:
                raise ValueError("Quantity must be an integer.")
            if qty < 0:
                raise ValueError("Negative stock is not allowed.")
            try:
                price = float(price_var.get().strip())
            except ValueError:
                raise ValueError("Price must be a number.")
            if price < 0:
                raise ValueError("Price cannot be negative.")
            supplier = supplier_var.get().strip() or None
            expiry = parse_date_flexible(exp_var.get())
            return name, sku, cat, price, supplier, qty, expiry

        def _save():
            try:
                name, sku, cat, price, supplier, qty, expiry = _validate()
            except ValueError as ve:
                messagebox.showwarning("Validation", str(ve), parent=win)
                return

            try:
                if is_edit and data:
                    self._db_exec(lambda cur: cur.execute(
                        f"UPDATE {TABLE_PRODUCTS} SET name=%s, category=%s, sku=%s, supplier=%s, quantity=%s, price=%s, expiry_date=%s WHERE id=%s",
                        (name, cat, sku, supplier, qty, price, expiry, data.id),
                    ))
                    self.log_action("UPDATE", f"Product updated: {name} (ID {data.id})")
                    messagebox.showinfo("Success", "Product updated successfully.", parent=win)
                else:
                    self._db_exec(lambda cur: cur.execute(
                        f"INSERT INTO {TABLE_PRODUCTS} (name, category, sku, supplier, quantity, price, expiry_date) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                        (name, cat, sku, supplier, qty, price, expiry),
                    ))
                    self.log_action("ADD", f"Product added: {name} ({cat}), qty {qty}")
                    messagebox.showinfo("Success", "Product added successfully.", parent=win)

                if qty < LOW_STOCK_THRESHOLD:
                    messagebox.showwarning("Low Stock", f"'{name}' is low in stock (qty={qty}). Consider reordering.", parent=win)
                win.destroy()
                self.refresh_current_page()
            except Error as e:
                messagebox.showerror("Database Error", f"Operation failed.\n\n{e}", parent=win)

        ttk.Button(btns, text="Cancel", command=win.destroy).pack(side="right", padx=(10, 0))
        ttk.Button(
            btns,
            text=("UPDATE PRODUCT" if is_edit else "ADD TO INVENTORY"),
            command=_save,
            style="Primary.TButton",
        ).pack(side="right")
        e1.focus_set()

    def delete_selected(self):
        if not self.selected_product_id:
            messagebox.showwarning("Select a product", "Please select a product in Inventory first.")
            return
        pid = self.selected_product_id
        if not messagebox.askyesno("Confirm delete", "Delete selected product? This cannot be undone."):
            return
        try:
            items = self.fetch_products("WHERE id=%s", (pid,))
            pname = items[0].name if items else f"ID {pid}"
            self._db_exec(lambda cur: cur.execute(f"DELETE FROM {TABLE_PRODUCTS} WHERE id=%s", (pid,)))
            self.log_action("DELETE", f"Product deleted: {pname} (ID {pid})")
            messagebox.showinfo("Deleted", "Product deleted successfully.")
            self.selected_product_id = None
            self.refresh_current_page()
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to delete.\n\n{e}")

    def reorder_selected(self):
        if not self.selected_product_id:
            messagebox.showwarning("Select a product", "Please select a product in Inventory first.")
            return
        pid = self.selected_product_id
        try:
            self._db_exec(lambda cur: cur.execute(
                f"UPDATE {TABLE_PRODUCTS} SET quantity = quantity + %s WHERE id=%s",
                (REORDER_INCREMENT, pid),
            ))
            self.log_action("REORDER", f"Reorder applied (+{REORDER_INCREMENT}) to product ID {pid}")
            messagebox.showinfo("Reorder", f"Stock increased by {REORDER_INCREMENT}.")
            self.refresh_current_page()
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to reorder.\n\n{e}")

    # -----------------------------
    # Refresh rendering
    # -----------------------------
    def refresh_current_page(self):
        self._refresh_topbar_stats()
        page = self.active_page.get()
        if page == "Dashboard":
            self.refresh_dashboard()
        elif page == "Inventory":
            self.refresh_inventory()
        elif page == "Audit Log":
            self.refresh_audit()
        else:
            self.refresh_expiry()

    def _refresh_topbar_stats(self):
        try:
            total_products, _total_qty, total_value, _low, _exp = self.get_dashboard_stats()
            self.top_total_products.configure(text=f"Products: {total_products}")
            self.top_total_value.configure(text=f"Value: {money(total_value)}")
        except Error:
            self.top_total_products.configure(text="Products: —")
            self.top_total_value.configure(text="Value: —")

    def refresh_dashboard(self):
        try:
            total_products, total_qty, total_value, low_stock, expiring_soon = self.get_dashboard_stats()
            self.card_total_products.configure(text=str(total_products))
            self.card_value.configure(text=money(total_value))
            self.card_low.configure(text=str(low_stock))
            self.card_expiring.configure(text=str(expiring_soon))

            rows = self.fetch_recent_audit(10)
            self.activity_list.delete(0, "end")
            if not rows:
                self.activity_list.insert("end", "No recent activity yet.")
            else:
                for action, desc, ts in rows:
                    self.activity_list.insert("end", f"[{action}] {desc} — {ts}")

            insights = []
            insights.append(f"• Total quantity across inventory: {total_qty}.")
            insights.append(f"• Inventory value: {money(total_value)}.")
            if low_stock > 0:
                insights.append(f"• {low_stock} item(s) are low stock (under {LOW_STOCK_THRESHOLD}).")
            else:
                insights.append("• Stock levels look healthy.")
            if expiring_soon > 0:
                insights.append(f"• {expiring_soon} item(s) expiring within {EXPIRING_SOON_DAYS} days.")
                insights.append("• Recommendation: apply discount/promo to reduce wastage.")
            else:
                insights.append("• No products expiring soon.")

            self.insights_text.configure(state="normal")
            self.insights_text.delete("1.0", "end")
            self.insights_text.insert("1.0", "\n".join(insights))
            self.insights_text.configure(state="disabled")
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to load dashboard.\n\n{e}")

    def _clear_tree(self, tree: ttk.Treeview):
        for item in tree.get_children():
            tree.delete(item)

    def refresh_inventory(self):
        try:
            where = []
            params = []
            q = self.inventory_search.get().strip()
            if q:
                where.append("name LIKE %s")
                params.append(f"%{q}%")
            f = self.inventory_filter.get()
            if f == "IN":
                where.append("quantity > 0")
            elif f == "LOW":
                where.append("quantity > 0 AND quantity < %s")
                params.append(LOW_STOCK_THRESHOLD)
            elif f == "OUT":
                where.append("quantity = 0")
            where_sql = f"WHERE {' AND '.join(where)}" if where else ""
            items = self.fetch_products(where_sql, tuple(params))

            self._clear_tree(self.inv_tree)
            for p in items:
                expiry = p.expiry_date.isoformat() if p.expiry_date else "—"
                tags = [str(p.id)]
                if p.quantity == 0:
                    tags.append("outstock")
                elif p.quantity < LOW_STOCK_THRESHOLD:
                    tags.append("lowstock")
                self.inv_tree.insert("", "end", values=(p.name, p.category, money(p.price), p.quantity, expiry), tags=tuple(tags))
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to load inventory.\n\n{e}")

    def refresh_audit(self):
        try:
            rows = self._db_exec(lambda cur: (cur.execute(
                f"SELECT action, description, created_at FROM {TABLE_AUDIT} ORDER BY id DESC LIMIT 200"
            ), cur.fetchall())[1])
            self._clear_tree(self.audit_tree)
            for a, d, t in rows:
                self.audit_tree.insert("", "end", values=(a, d, str(t)))
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to load audit log.\n\n{e}")

    def refresh_expiry(self):
        try:
            items = self.fetch_products("WHERE expiry_date IS NOT NULL", ())
            self._clear_tree(self.exp_tree)
            for p in items:
                if not p.expiry_date:
                    continue
                # Simulated daily sales rate (units/day) based on category
                daily_sales = max(1, int(sales_rate_for_category(p.category)))
                days_to_sell = p.quantity / daily_sales if daily_sales > 0 else float("inf")

                # Compute fractional days until expiry (dashboard-like)
                now = _dt.datetime.now()
                expiry_dt = _dt.datetime.combine(p.expiry_date, _dt.time(0, 0, 0))
                days_until_expiry = (expiry_dt - now).total_seconds() / 86400.0

                # Risk score to match the reference screenshot:
                # risk_score = (days_to_sell / days_until_expiry) * 100
                if days_until_expiry <= 0:
                    risk_score = 999.0
                    expiry_text = "Expired"
                    tag = "expired"
                    rec = "Apply discount"
                else:
                    risk_score = (days_to_sell / days_until_expiry) * 100.0
                    expiry_text = f"{days_until_expiry:.1f}d"
                    if risk_score >= 80:
                        tag = "risk"
                        rec = "Apply discount"
                    elif risk_score >= 40:
                        tag = "watch"
                        rec = "Monitor / plan promo"
                    else:
                        tag = "safe"
                        rec = "No action needed"

                # Product code similar to the screenshot (CATEGORY-001)
                if p.sku:
                    code = p.sku.strip().upper()
                else:
                    cat_code = (p.category or "GEN").strip().upper().replace(" ", "")
                    cat_code = cat_code[:5] if len(cat_code) > 5 else cat_code
                    code = f"{cat_code}-{p.id:03d}"
                product_text = f"{p.name}  ({code} • {p.category})"

                self.exp_tree.insert(
                    "",
                    "end",
                    values=(
                        product_text,
                        f"{p.quantity}",
                        f"{daily_sales} /day",
                        f"{days_to_sell:.1f}d",
                        expiry_text,
                        f"{risk_score:.0f}",
                        rec,
                    ),
                    tags=(tag,),
                )
        except Error as e:
            messagebox.showerror("Database Error", f"Failed to load expiry predictor.\n\n{e}")

    # -----------------------------
    # Global search
    # -----------------------------
    def _global_search(self):
        q = self.global_search_var.get().strip()
        self.inventory_search.set(q)
        self._switch_page("Inventory")

    # -----------------------------
    # Auto refresh
    # -----------------------------
    def _schedule_auto_refresh(self):
        self.after(AUTO_REFRESH_MS, self._auto_refresh_tick)

    def _auto_refresh_tick(self):
        try:
            self.refresh_current_page()
        finally:
            self._schedule_auto_refresh()


if __name__ == "__main__":
    app = EmartApp()
    app.mainloop()

