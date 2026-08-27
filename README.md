# ⚡ MealSprint — Food Ordering & Management Web Application

MealSprint is a modern, full-stack food delivery and restaurant management single-page web application (SPA). Built with **Python (FastAPI)**, **MySQL (SQLAlchemy ORM)**, and **Vanilla JavaScript**, it offers secure JWT authentication, role-based authorization (Admin / Customer), authoritative server-side cart pricing, and live order tracking.

---

## 🚀 Key Features

* **Role-Based Authentication:** Unified sign-in/registration with customer and admin roles, Argon2 password hashing, and JWT token authorization.
* **Modern Single-Page UI:** Clean responsive design with Font Awesome vector icons, sticky bottom cart counter, and modal popups.
* **Customer Journey:** Search and filter restaurants by city/cuisine/status, dynamic menu counter, authoritative cart calculation, address entry, and mock payments.
* **Admin Management Panel:** Full CRUD capabilities to create, edit, and delete restaurants and menu items, toggle restaurant status (Open/Closed), and manage item availability.
* **Order Tracking & Cancellation:** Real-time lifecycle management (`PENDING`, `CONFIRMED`, `CANCELLED`).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Database** | MySQL 8.0+, SQLAlchemy 2.0 ORM, PyMySQL |
| **Security** | PyJWT, Pwdlib (Argon2), Pydantic v2 |
| **Frontend** | HTML5, CSS3 (Custom Variables), Vanilla JavaScript (Fetch API) |
| **Icons** | Font Awesome 6.5 (SVG/CDN) |

---

## 📁 Project Structure

```text
mealsprint/
│
├── .env                  # Local MySQL credentials & JWT secrets
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
│
├── backend/
│   ├── main.py           # FastAPI app entry point & CRUD routes
│   ├── config.py         # Environment variables configuration
│   ├── database.py       # SQLAlchemy engine & session dependency
│   ├── models.py         # MySQL database models (Users, Restaurants, Items, Orders)
│   ├── schemas.py        # Pydantic v2 validation schemas
│   ├── security.py       # Argon2 password hashing & JWT token handlers
│   └── seed.py           # Database seeder script
│
└── frontend/
    ├── index.html        # Single-page application markup
    ├── style.css         # Responsive styling & theme variables
    └── app.js            # State management, API calls & DOM manipulation
⚙️ Installation & Setup Guide1. Database CreationOpen MySQL Workbench or your terminal:SQLCREATE DATABASE IF NOT EXISTS mealsprint_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
2. Virtual Environment SetupOpen terminal in the project root:Bash# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (Command Prompt):
venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate
3. Install Dependencies  Bashpip install -r requirements.txt
4. Configure Environment VariablesCreate a .env file in the project root:Code snippetDATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/mealsprint_db
SECRET_KEY=mealsprint_super_secret_development_key_32_bytes_long_987654321
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EMAIL_FROM=no-reply@mealsprint.local
5. Seed Initial DataBashpython backend/seed.py
🏃 Running the ApplicationStart Backend ServerBashuvicorn backend.main:app --reload
Interactive API Documentation (Swagger UI): http://127.0.0.1:8000/docsStart Frontend ClientIn a second terminal:Bashcd frontend
python -m http.server 3000
Open in browser: http://localhost:3000🔑 Default Test AccountsRoleEmailPasswordAccessAdminadmin@mealsprint.comAdmin@12345Restaurant/Menu CRUD & Live Status ManagementCustomeruser@mealsprint.comUser@12345Restaurant Discovery, Ordering & Payment📡 REST API Endpoints Overview

Authentication

POST /auth/register — Register a customer or admin accountPOST /auth/login — Login and receive JWT access tokenGET /auth/me — Introspect active user profile

Restaurants

GET /restaurants — List all restaurants with search/city/cuisine filtersGET /restaurants/{id} — Fetch restaurant details and menu itemsPOST /admin/restaurants — Create a restaurant (Admin only)PUT /admin/restaurants/{id} — Update restaurant details/status (Admin only)DELETE /admin/restaurants/{id} — Delete a restaurant (Admin only)

Menu Items

GET /foods — List food items filtered by restaurantPOST /admin/foods — Add a new food item (Admin only)PUT /admin/foods/{id} — Update food item price/availability (Admin only)DELETE /admin/foods/{id} — Delete food item (Admin only)

Orders & Payment

POST /orders — Place order with authoritative database pricingGET /orders — List authenticated user's ordersPUT /orders/{id}/pay — Process mock payment and confirm orderDELETE /orders/{id} — Cancel an eligible order