import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL = "https://back-end-wdk7.onrender.com"; 
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null); 
  const [view, setView] = useState("grid"); // 'grid', 'tracking', 'account', 'auth'
  const [searchTerm, setSearchTerm] = useState("");
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [authMode, setAuthMode] = useState("login");

  // Fetch Products
  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Product fetch error:", err));
  }, []);

  // Fetch Orders specifically for the Account View
  const fetchOrders = () => {
    fetch(`${BASE_URL}/api/orders/`)
      .then((res) => res.json())
      .then((data) => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Order fetch error:", err));
  };

  const getImageUrl = (product) => {
    const path = product.image_display || (product.additional_images?.[0]?.image);
    if (!path) return "/static/placeholder.png";
    if (path.startsWith("http")) return path;
    return `${CLOUDINARY_BASE}${path}`;
  };

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Enter an Order ID");
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) setTrackingData(data);
      else alert("Order ID not found.");
    } catch (err) { alert("Server connection failed."); }
  };

  const totalDue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) + (cart.length > 0 ? 1500 : 0);

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDER LOGIC FOR MAIN VIEW ---
  const renderMainContent = () => {
    switch(view) {
      case "tracking":
        return (
          <div className="view-container">
            <h1>📦 Track Your Shipment</h1>
            <div className="track-search-box">
              <input type="text" placeholder="Enter Order ID (e.g. 37)" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
              <button className="track-btn-action" onClick={handleTrackOrder}>CHECK STATUS</button>
            </div>
            {trackingData && (
              <div className="tracking-result-card">
                <h3>Order #{trackingData.id}</h3>
                <p>Status: <span className="status-tag">{trackingData.status || "Processing"}</span></p>
              </div>
            )}
          </div>
        );
      case "account":
        return (
          <div className="view-container">
            <h1>Your Order History</h1>
            <div className="order-history-list">
              {userOrders.length > 0 ? userOrders.map(order => (
                <div key={order.id} className="history-item">
                  <span>Order #{order.id} - ₦{parseFloat(order.total_price || 0).toLocaleString()}</span>
                  <button className="pdf-btn" onClick={() => window.open(`${BASE_URL}/api/invoices/generate?order_id=${order.id}`, "_blank")}>INVOICE PDF</button>
                </div>
              )) : <p>No orders found.</p>}
            </div>
          </div>
        );
      case "auth":
        return (
          <div className="view-container auth-box">
            <h2>{authMode === "login" ? "Login" : "Register"}</h2>
            <div className="auth-form-inner">
              <input type="text" placeholder="Phone Number" className="auth-input" />
              <input type="password" placeholder="Password" className="auth-input" />
              <button className="orange-curved-btn checkout" onClick={() => {setUser({phone: "080123..."}); setView("grid")}}>
                {authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
              <p className="toggle-auth" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
              </p>
            </div>
          </div>
        );
      default: // grid
        return (
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="img-frame">
                  <img src={getImageUrl(p)} alt={p.name} className="zoom-effect" />
                </div>
                <h3>{p.name}</h3>
                <p className="price-tag">₦{parseFloat(p.price).toLocaleString()}</p>
                <button className="add-btn" onClick={() => setCart([...cart, p])}>Add to Cart</button>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="app-grid-wrapper">
      {/* HEADER WITH CENTERED ORANGE SEARCH */}
      <header className="main-header">
        <div className="logo-section" onClick={() => setView("grid")} style={{cursor:'pointer'}}>
          <h1>MeBuy</h1>
        </div>

        <div className="search-container-center">
          <input 
            type="text" 
            placeholder="SEARCH PRODUCTS..." 
            className="search-input-orange"
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}}
          />
          <button className="search-btn-orange">GO</button>
        </div>

        <div className="header-right-group">
          <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
            🛒 Cart ({cart.length})
          </button>
          {!user ? (
            <div className="auth-links">
              <button className="auth-btn" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button>
              <button className="auth-btn register" onClick={() => {setView("auth"); setAuthMode("register")}}>Register</button>
            </div>
          ) : (
            <span className="user-welcome">Hi, {user.phone}</span>
          )}
        </div>
      </header>

      {/* NAVIGATION BAR */}
      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => setView("grid")}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => {setView("tracking"); setTrackingData(null);}}>Track Order</button></li>
          <li><button className="nav-btn-link" onClick={() => {setView("account"); fetchOrders();}}>Account</button></li>
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
          {renderMainContent()}
        </main>
      </div>

      {/* CART SIDEBAR */}
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