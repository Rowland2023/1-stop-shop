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
  const [user, setUser] = useState(null); 
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // Fetch orders when Account view is opened
  useEffect(() => {
    if (view === "account") {
      fetch(`${BASE_URL}/api/orders/`)
        .then((res) => res.json())
        .then((data) => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view]);

  const totalDue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) + (cart.length > 0 ? 1500 : 0);

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Please enter an Order ID");
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) setTrackingData(data);
      else alert("Order not found.");
    } catch (err) { alert("Connection failed."); }
  };

  return (
    <div className="app-grid-wrapper">
      {/* --- HEADER: ORANGE BOLD SEARCH & AUTH --- */}
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
              <button className="auth-btn" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button>
              <button className="auth-btn register" onClick={() => {setView("auth"); setAuthMode("register")}}>Register</button>
            </div>
          ) : (
            <span className="user-welcome">Hi, {user.phone}</span>
          )}
        </div>
      </header>

      {/* --- NAV BAR --- */}
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
          {/* VIEW: TRACKING */}
          {view === "tracking" && (
            <div className="view-container">
              <h1>📦 Track Your Shipment</h1>
              <div className="track-search-box">
                <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
                <button className="track-btn-action" onClick={handleTrackOrder}>Check Status</button>
              </div>
              {trackingData && (
                <div className="tracking-timeline">
                  <p>Order ID: #{trackingData.id} - Status: <strong>{trackingData.status}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ACCOUNT / ORDERS */}
          {view === "account" && (
            <div className="view-container">
              <h1>Order History</h1>
              <div className="order-history">
                {userOrders.map(order => (
                  <div key={order.id} className="history-item">
                    <span>Order #{order.id} - ₦{parseFloat(order.total_price || 0).toLocaleString()}</span>
                    <button onClick={() => window.open(`${BASE_URL}/api/invoices/generate?order_id=${order.id}`, "_blank")}>PDF</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: AUTH (LOGIN/REGISTER) */}
          {view === "auth" && (
            <div className="view-container auth-screen">
              <h2>{authMode === "login" ? "Login" : "Register"}</h2>
              <div className="auth-form">
                <input type="text" placeholder="Phone Number" />
                <input type="password" placeholder="Password" />
                <button className="orange-curved-btn checkout" onClick={() => {setUser({phone: "080..."}); setView("grid")}}>
                  {authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PRODUCT GRID (Default) */}
          {view === "grid" && (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="product-card">
                  <div className="img-frame">
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