import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Products from './components/Products';
import Categories from './components/Categories';
import Suppliers from './components/Suppliers';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">📦 Inventory Management</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Products</Link>
              <Link to="/categories" className="nav-link">Categories</Link>
              <Link to="/suppliers" className="nav-link">Suppliers</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/suppliers" element={<Suppliers />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


