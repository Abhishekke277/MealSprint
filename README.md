# ⚡ MealSprint — Food Ordering & Management Web Application

A modern full-stack food ordering and restaurant management web application built with **FastAPI**, **MySQL**, **SQLAlchemy**, and **Vanilla JavaScript**.

MealSprint provides a complete food-ordering experience for customers and a powerful management dashboard for administrators. The application includes secure JWT authentication, role-based authorization, server-side price validation, restaurant and menu management, mock payments, and order tracking.

---

## 🚀 Key Features

### 🔐 Secure Role-Based Authentication

* Unified registration and login system.
* Supports two user roles:

  * **Customer**
  * **Admin**
* Passwords are securely hashed using **Argon2**.
* JWT-based authentication for protected API routes.
* Role-based authorization for admin-only features.

### 🧑‍🍳 Customer Experience

* Browse available restaurants.
* Search restaurants by name.
* Filter restaurants by:

  * City
  * Cuisine
  * Open/Closed status
* View restaurant menus and available food items.
* Add and remove items from the cart.
* Dynamic cart item counter.
* Enter delivery address during checkout.
* Server-side authoritative cart pricing.
* Mock payment processing.
* View personal orders and their status.
* Cancel eligible orders.

### 🛠️ Admin Management Panel

Administrators can:

* Create new restaurants.
* Update restaurant details.
* Delete restaurants.
* Toggle restaurant status between **Open** and **Closed**.
* Add new menu items.
* Update food prices.
* Update item availability.
* Delete menu items.

### 📦 Order Tracking

Orders follow a simple lifecycle:

```text
PENDING → CONFIRMED
    ↓
CANCELLED
```

Supported order statuses:

* `PENDING`
* `CONFIRMED`
* `CANCELLED`

---

# 🛠️ Technology Stack

| Layer                 | Technology                              |
| --------------------- | --------------------------------------- |
| **Backend**           | Python 3.10+, FastAPI, Uvicorn          |
| **Database**          | MySQL 8.0+, SQLAlchemy 2.0 ORM, PyMySQL |
| **Security**          | PyJWT, Pwdlib with Argon2, Pydantic v2  |
| **Frontend**          | HTML5, CSS3, Vanilla JavaScript         |
| **API Communication** | JavaScript Fetch API                    |
| **Icons**             | Font Awesome 6.5 CDN                    |

---

# 📁 Project Structure

```text
mealsprint/
│
├── .env
├── requirements.txt
├── README.md
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   └── seed.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

### File Description

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `.env`                | Stores database credentials and JWT secrets        |
| `requirements.txt`    | Contains required Python dependencies              |
| `README.md`           | Project documentation                              |
| `backend/main.py`     | FastAPI application and API routes                 |
| `backend/config.py`   | Environment variable configuration                 |
| `backend/database.py` | SQLAlchemy database engine and session setup       |
| `backend/models.py`   | Database models                                    |
| `backend/schemas.py`  | Pydantic request and response schemas              |
| `backend/security.py` | Password hashing and JWT token logic               |
| `backend/seed.py`     | Initial database data seeder                       |
| `frontend/index.html` | SPA structure and markup                           |
| `frontend/style.css`  | Application styling and responsive design          |
| `frontend/app.js`     | API calls, application state, and DOM manipulation |

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd mealsprint
```

---

## 2. Create the MySQL Database

Open **MySQL Workbench** or your MySQL terminal and run:

```sql
CREATE DATABASE IF NOT EXISTS mealsprint_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

## 3. Create a Virtual Environment

Open a terminal in the project root directory.

```bash
python -m venv venv
```

### Activate the Virtual Environment

#### Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

#### Windows Command Prompt

```bash
venv\Scripts\activate.bat
```

#### macOS / Linux

```bash
source venv/bin/activate
```

---

## 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 5. Configure Environment Variables

Create a `.env` file in the project root directory.

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/mealsprint_db

SECRET_KEY=mealsprint_super_secret_development_key_32_bytes_long_987654321

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=1440

EMAIL_FROM=no-reply@mealsprint.local
```

> Replace `YOUR_PASSWORD` with your actual MySQL password.

---

## 6. Seed Initial Data

Run the database seeder to create initial restaurants, food items, and test accounts.

```bash
python backend/seed.py
```

---

# 🏃 Running the Application

## Start the Backend Server

From the project root:

```bash
uvicorn backend.main:app --reload
```

The FastAPI backend will start at:

```text
http://127.0.0.1:8000
```

### Interactive API Documentation

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

## Start the Frontend

Open a **second terminal**.

Navigate to the frontend directory:

```bash
cd frontend
```

Start the development server:

```bash
python -m http.server 3000
```

Now open:

```text
http://localhost:3000
```

---

# 🔑 Default Test Accounts

The seeder creates the following accounts for testing.

| Role         | Email                  | Password      | Access                                |
| ------------ | ---------------------- | ------------- | ------------------------------------- |
| **Admin**    | `admin@mealsprint.com` | `Admin@12345` | Restaurant and menu management        |
| **Customer** | `user@mealsprint.com`  | `User@12345`  | Restaurant browsing and food ordering |

> ⚠️ These credentials are intended only for development and testing.

---

# 📡 REST API Overview

## 🔐 Authentication

### Register a User

```http
POST /auth/register
```

Registers a new customer or administrator account.

---

### Login

```http
POST /auth/login
```

Authenticates the user and returns a JWT access token.

---

### Get Current User

```http
GET /auth/me
```

Returns the profile of the currently authenticated user.

---

# 🏪 Restaurant Endpoints

### Get Restaurants

```http
GET /restaurants
```

Returns a list of restaurants.

Supports filtering by:

* Search
* City
* Cuisine
* Restaurant status

---

### Get Restaurant Details

```http
GET /restaurants/{id}
```

Returns restaurant details along with its menu items.

---

### Create Restaurant

```http
POST /admin/restaurants
```

**Admin only**

Creates a new restaurant.

---

### Update Restaurant

```http
PUT /admin/restaurants/{id}
```

**Admin only**

Updates restaurant details or its Open/Closed status.

---

### Delete Restaurant

```http
DELETE /admin/restaurants/{id}
```

**Admin only**

Deletes a restaurant.

---

# 🍔 Food Menu Endpoints

### Get Food Items

```http
GET /foods
```

Returns food items and supports filtering by restaurant.

---

### Create Food Item

```http
POST /admin/foods
```

**Admin only**

Adds a new food item to a restaurant menu.

---

### Update Food Item

```http
PUT /admin/foods/{id}
```

**Admin only**

Updates food details, price, or availability.

---

### Delete Food Item

```http
DELETE /admin/foods/{id}
```

**Admin only**

Deletes a food item.

---

# 📦 Orders & Payment

### Place an Order

```http
POST /orders
```

Creates a new order.

Food prices are calculated using the **authoritative prices stored in the database**, helping prevent client-side price manipulation.

---

### Get User Orders

```http
GET /orders
```

Returns all orders belonging to the authenticated user.

---

### Process Payment

```http
PUT /orders/{id}/pay
```

Processes a mock payment and confirms the order.

---

### Cancel an Order

```http
DELETE /orders/{id}
```

Cancels an eligible order.

---

# 🔒 Security Highlights

* Argon2 password hashing.
* JWT-based authentication.
* Role-based authorization.
* Protected admin endpoints.
* Server-side food price validation.
* Pydantic v2 request validation.
* Environment-based configuration.
* Sensitive credentials stored in `.env`.

---

# 💡 Application Architecture

```text
Frontend
   │
   │ HTTP Requests (Fetch API)
   ▼
FastAPI Backend
   │
   ├── Authentication
   ├── Authorization
   ├── Business Logic
   ├── Cart Price Validation
   └── Order Management
   │
   ▼
SQLAlchemy ORM
   │
   ▼
MySQL Database
```

---

# 👨‍💻 Main User Flow

```text
Register / Login
       ↓
Browse Restaurants
       ↓
Search or Filter
       ↓
View Menu
       ↓
Add Items to Cart
       ↓
Enter Delivery Address
       ↓
Create Order
       ↓
Mock Payment
       ↓
Order Confirmed
```

---

# 🧑‍💼 Admin Flow

```text
Admin Login
     ↓
Open Admin Dashboard
     ↓
Manage Restaurants
     ↓
Manage Food Items
     ↓
Update Availability
     ↓
Control Restaurant Status
```

---

# 🎯 Future Improvements

Possible future enhancements include:

* Real payment gateway integration.
* Email notifications.
* Restaurant image uploads.
* Customer profile management.
* Order history improvements.
* Live delivery tracking.
* WebSocket-based real-time updates.
* Restaurant ratings and reviews.
* Pagination and advanced filtering.
* Docker deployment support.

---

# 📄 License

This project is created for **educational and portfolio purposes**.

---

## ⭐ If you like this project, consider giving the repository a star!

**MealSprint — Fast, Simple, and Modern Food Ordering.** 🍔⚡
