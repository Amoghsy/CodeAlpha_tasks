# NovaStore - Modern E-Commerce Frontend

A clean, responsive, and high-performance e-commerce frontend built with **vanilla HTML5, CSS3, and JavaScript (ES6+)**. Designed to connect with an Express.js REST API backed by Supabase with automatic local fallback to `mockdata.json` when the backend is offline.

---

## 🚀 Key Features

1. **Home / Product Listing (`index.html`)**
   - Responsive product grid with category filter pills, search input, and sorting (Price, Rating, Name).
   - Dynamic pagination and result counters.
   - Out-of-stock badges and promotional tags.

2. **Product Details Page (`product.html`)**
   - Interactive multi-image gallery with active thumbnail selectors.
   - Live stock indicator ("In Stock", "Only X Left", "Out of Stock").
   - Quantity selector (+/- with max inventory clamping).
   - "Add to Cart" and immediate "Buy Now" flow.
   - Related products recommendation row.

3. **Shopping Cart (`cart.html`)**
   - Editable quantities, item subtotals, and quick removal.
   - Free shipping progress bar ($50 threshold) and promo code discount engine (`SAVE10`, `ALPHA20`, `FREESHIP`).
   - Real-time tax (8%) and shipping calculation.

4. **Checkout Flow (`checkout.html`)**
   - 2-Step checkout: Delivery address form + Payment method picker (Credit/Debit Card or Cash on Delivery).
   - Order summary sidebar with item previews.
   - Place Order API request (`POST /orders`) with confirmation modal and generated Order ID.

5. **Authentication (`login.html` & `register.html`)**
   - Token & user session storage in `localStorage`.
   - Automatic `Authorization: Bearer <token>` attachment on protected requests.
   - Demo 1-click auto-fill helper and password visibility toggle.

6. **Order History (`orders.html`)**
   - View past orders with date, order ID, delivery status badges, items breakdown, and shipping address.
   - "Buy Again" re-order functionality and print receipt action.

---

## 🛠️ Architecture & File Structure

```text
codealpha_ecommerce/
└── Frontend/
    ├── index.html              # Product listing & catalog page
    ├── product.html            # Product details & specifications
    ├── cart.html               # Shopping cart & promo calculations
    ├── checkout.html           # Shipping & order payment
    ├── login.html              # Customer login
    ├── register.html           # Customer registration
    ├── orders.html             # Order history & invoice receipts
    ├── css/
    │   └── styles.css          # Design system & responsive styles
    ├── js/
    │   ├── constants.js        # API Base URL & global configuration
    │   ├── api.js              # Fetch wrapper & mockdata fallback logic
    │   ├── auth.js             # Session management & token handling
    │   ├── cart.js             # Cart state, calculations, & backend sync
    │   └── main.js             # Shared navbar, toast notifications, UI helpers
    └── data/
        └── mockdata.json       # Mock catalog, categories, user, and orders
```

---

## 🌐 API Endpoints Handled

The `api.js` service interacts with standard REST endpoints and provides graceful offline fallback:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/products` | `GET` | Fetch filtered, searched, and paginated product list |
| `/products/:id` | `GET` | Fetch single product by ID |
| `/categories` | `GET` | Fetch all product categories |
| `/auth/login` | `POST` | Authenticate user credentials & receive JWT |
| `/auth/register` | `POST` | Register user and return token |
| `/cart` | `GET` | Retrieve logged-in user cart |
| `/cart/sync` | `POST` | Sync local cart items with backend |
| `/orders` | `GET` | Retrieve past orders for authenticated user |
| `/orders` | `POST` | Create a new order |

---

## 💻 How to Run

1. Open the `codealpha_ecommerce/Frontend` directory in any static server or browser:
   - Using VS Code Live Server extension: Right click `index.html` → **Open with Live Server**.
   - Or using Python: `python -m http.server 3000` (then navigate to `http://localhost:3000`).
2. Configurable Backend URL:
   - Edit [constants.js](file:///d:/My%20Work/Internships/codealpha/codealpha_ecommerce/Frontend/js/constants.js) to point `API_BASE_URL` to your Express.js backend (default: `http://localhost:5000/api`).
