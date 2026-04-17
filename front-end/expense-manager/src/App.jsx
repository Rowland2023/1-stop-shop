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
      <header>
        <h1>MeBuy</h1>
        <div className="header-right">
             <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>🛒 Cart ({cart.length})</button>
        </div>
      </header>

      {/* Main Navigation with Restored Auth */}
      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); }}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("tracking")}>Track Order</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
          {renderAuthLinks()}
        </ul>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys","rent-house","car-sales","kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} 
              onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
              {catId.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "auth" ? (
          <div className="view-container auth-screen">
            <h2>{authMode === "login" ? "Login to MeBuy" : "Create Account"}</h2>
            <div className="auth-form">
                <input type="text" placeholder="Phone Number" />
                <input type="password" placeholder="Password" />
                <button className="track-btn-action" onClick={() => { setUser({phone: "Member"}); setView("grid"); }}>
                    {authMode === "login" ? "Sign In" : "Sign Up"}
                </button>
                <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                    {authMode === "login" ? "Need an account? Register" : "Have an account? Login"}
                </p>
            </div>
          </div>
        ) : view === "tracking" ? (
          <div className="view-container tracking-screen">
             {/* ... Tracking Logic Stays Same ... */}
             <h1>📦 Track Your Shipment</h1>
             <div className="track-search-box">
               <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
               <button className="track-btn-action">Check Status</button>
             </div>
             <button className="back-btn" onClick={() => setView("grid")}>Back</button>
          </div>
        ) : (
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
        )}
      </main>

      {/* Cart sidebar stays same */}
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
            <button className="vendor-btn paystack" disabled={isProcessing}>Pay with Paystack</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;