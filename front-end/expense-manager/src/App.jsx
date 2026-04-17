import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL = "https://back-end-wdk7.onrender.com"; 
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";

const getImageUrl = (product) => {
  const path = product.image_display || (product.additional_images?.[0]?.image);
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  return `${CLOUDINARY_BASE}${path}`;
};

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null); // Safety: Initialize as null
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const totalDue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) + (cart.length > 0 ? 1500 : 0);

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      {/* --- HEADER: LOGO | SEARCH | AUTH --- */}
      <header className="main-header">
        <div className="logo-section">
          <h1 onClick={() => setView("grid")} style={{cursor:'pointer'}}>MeBuy</h1>
        </div>

        <div className="search-container-center">
          <input 
            type="text" 
            placeholder="SEARCH PRODUCTS..." 
            className="search-input-orange"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-orange">GO</button>
        </div>

        <div className="header-right-group">
          <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
            🛒 Cart ({cart.length})
          </button>
          {!user ? (
            <div className="auth-links">
              <button className="auth-btn" onClick={() => setView("auth")}>Login</button>
              <button className="auth-btn register" onClick={() => setView("auth")}>Register</button>
            </div>
          ) : (
            <span className="user-welcome">Hi, {user.phone}</span>
          )}
        </div>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => setView("grid")}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("tracking")}>Track Order</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
        </ul>
      </nav>

      <div className="content-layout">
        <aside className="left-sidebar">
          <h3>Categories</h3>
          <nav className="side-nav">
            {["food", "electronics", "office", "style&fashion", "sex-toys","rent-house","car-sales","kitchen-items"].map((catId) => (
              <button key={catId} className={category === catId ? "active" : ""} 
                onClick={() => { setCategory(catId); setView("grid"); }}>
                {catId.toUpperCase()}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="img-frame" onClick={() => setSelectedProduct(p)}>
                  <img src={getImageUrl(p)} alt={p.name} className="zoom-effect" />
                </div>
                <h3>{p.name}</h3>
                <p>₦{parseFloat(p.price).toLocaleString()}</p>
                <button className="add-btn" onClick={() => setCart([...cart, p])}>Add to Cart</button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* --- CART SIDEBAR --- */}
      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <span>₦{parseFloat(item.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p>Total: <strong>₦{totalDue.toLocaleString()}</strong></p>
            <button className="orange-curved-btn checkout">PROCEED TO CHECKOUT</button>
            <button className="orange-curved-btn clear" onClick={() => setCart([])}>CLEAR CART</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;