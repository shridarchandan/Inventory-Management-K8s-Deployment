# Product Inventory Management System


A full-stack CRUD application for managing products, categories, and suppliers with a modern web interface.

## Features

- **Products Management**: Create, read, update, and delete products with details like name, description, price, quantity, SKU, category, and supplier
- **Categories Management**: Organize products by categories
- **Suppliers Management**: Track supplier information including contact details
- **Modern UI**: Responsive design with a clean, intuitive interface
- **RESTful API**: Well-structured backend API with proper error handling

## Tech Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- RESTful API architecture

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- Modern CSS with responsive design

## Project Structure

```
.
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   └── init.sql            # Sample data
│   ├── models/
│   │   ├── Product.js
│   │   ├── Category.js
│   │   └── Supplier.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── categories.js
│   │   └── suppliers.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Products.js
│   │   │   ├── Categories.js
│   │   │   └── Suppliers.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your PostgreSQL credentials:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=inventory_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

5. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE inventory_db;
   ```

6. Run the database schema:
   ```bash
   psql -U postgres -d inventory_db -f database/schema.sql
   ```

7. (Optional) Load sample data:
   ```bash
   psql -U postgres -d inventory_db -f database/init.sql
   ```

8. Start the backend server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional, defaults to localhost:5000):
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/low-stock/:threshold` - Get low stock products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

## Database Schema

### Products
- id (Primary Key)
- name
- description
- price
- quantity
- sku (Unique)
- category_id (Foreign Key)
- supplier_id (Foreign Key)
- created_at
- updated_at

### Categories
- id (Primary Key)
- name (Unique)
- description
- created_at
- updated_at

### Suppliers
- id (Primary Key)
- name
- email
- phone
- address
- created_at
- updated_at



