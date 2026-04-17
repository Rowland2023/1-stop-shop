import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // VIEW & AUTH STATES
  const [view, setView] = useState("grid"); 
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [user, setUser] = useState(null); // Becomes { phone: "..." } after login
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  // TRACKING & ACCOUNT STATES
  const [trackingData, setTrackingData] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [userOrders, setUserOrders] = useState([]); 

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // --- 2. RESTORED AUTH NAVIGATION ---
  const renderAuthLinks = () => {
    if (user) {
      return <li className="nav-auth"><span>Hi, {user.phone || 'Member'}</span></li>;
    }
    return (
      <>
        <li className="nav-auth">
          <button className="nav-btn-link" onClick={() => { setView("auth"); setAuthMode("login"); }}>Login</button>
        </li>
        <li className="nav-auth">
          <button className="register-link" onClick={() => { setView("auth"); setAuthMode("register"); }}>Register</button>
        </li>
      </>
    );
  };

  const subTotalValue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalDue = subTotalValue + (cart.length > 0 ? 1500 : 0);

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="main-header">
        <div className="logo-section">
          <h1>MeBuy</h1>
        </div>

        {/* 1. CENTER SEARCH BAR */}
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

        {/* 2. FAR RIGHT AUTH & CART */}
        <div className="header-right-group">
          <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
            🛒 Cart ({cart.length})
          </button>
          {!user ? (
            <>
              <button className="auth-btn" onClick={() => setView("auth")}>Login</button>
              <button className="auth-btn register" onClick={() => setView("auth")}>Register</button>
            </>
          ) : (
            <span className="user-welcome">Hi, {user.phone}</span>
          )}
        </div>
      </header>

      <nav className="category-nav">
        {/* Navigation links for Home, Tracking, etc. */}
        <button onClick={() => setView("grid")}>Home</button>
        <button onClick={() => setView("tracking")}>Track Order</button>
        <button onClick={() => setView("account")}>Account</button>
      </nav>

      {/* ... (Main Content Grid stays the same) ... */}

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          {/* ... Cart items list ... */}
          <div className="total-section">
            <p>Total: <strong>₦{totalDue.toLocaleString()}</strong></p>
            
            {/* 3. ORANGE CURVED CHECKOUT BUTTONS */}
            <button className="orange-curved-btn checkout" onClick={checkoutWithPaystack}>
              PROCEED TO CHECKOUT
            </button>
            <button className="orange-curved-btn clear" onClick={() => setCart([])}>
              CLEAR CART
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;