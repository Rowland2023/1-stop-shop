import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (path) => {
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  return `${CLOUDINARY_BASE}${path}`;
};
function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  const rawPath = product.image_display || (product.additional_images?.[0]?.image);
  const displayImage = getImageUrl(rawPath);

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)}>
        <img src={displayImage} alt={product.name} className="zoom-effect" />
      </div>
      <h3>{product.name}</h3>
      <p className="price-text">₦{parseFloat(product.price).toLocaleString()}</p>
      <div className="qty-row">
        <input type="number" min="1" value={tempQty} onChange={(e) => setTempQty(parseInt(e.target.value) || 1)} />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>Add to Cart</button>
      </div>
    </div>
  );
}

function App() {
  // --- CORE STATES ---
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("shop_cart_data");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- VIEW & UI STATES ---
  const [view, setView] = useState("grid"); // 'grid', 'tracking', 'account', 'auth'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  
  // --- AUTH & USER STATES ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [authData, setAuthData] = useState({ phone: "", password: "" });

  // --- TRACKING & HISTORY STATES ---
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- API: AUTHENTICATION ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setView("grid");
      } else {
        alert(data.message || "Auth failed");
      }
    } catch (err) { alert("Backend unreachable"); }
  };

  // --- 1. PERSISTENCE & DATA FETCHING ---
  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
        const productData = Array.isArray(data) ? data : (data.results || []);
        setProducts(productData);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/`)
        .then((res) => res.json())
        .then((data) => {
          const ordersArray = Array.isArray(data) ? data : (data.results || []);
          setUserOrders(ordersArray);
        })
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view, user]);

  // --- 2. LOGIC HANDLERS ---
  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
  };

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Enter an Order ID");
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) setTrackingData(data);
      else alert("Order not found.");
    } catch (err) { alert("Connection failed."); }
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) + 1500;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user ? `${user.phone}@mebuy.com` : 'guest@mebuy.com',
      amount: Math.round(totalAmount * 100),
      currency: 'NGN',
      callback: (response) => {
        setIsProcessing(false);
        setCart([]);
        alert("Payment Successful! Reference: " + response.reference);
      },
      onClose: () => setIsProcessing(false)
    });
    handler.openIframe();
  };

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      {/* HEADER SECTION - Brand and Cart Toggle */}
      <header className="brand-header">
        <div className="header-inner">
          <h1 onClick={() => setView("grid")} className="logo-text">MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            <span className="cart-icon">🛒</span>
            <span className="cart-count">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      {/* NAVIGATION SECTION - Optimized for visibility */}
      <nav className="main-nav">
        <div className="nav-container">
          {/* LEFT LINKS */}
          <div className="nav-group left">
            <button className="nav-link-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button className="nav-link-item" onClick={() => {setView("tracking"); setTrackingData(null)}}>Tracking</button>
          </div>

          {/* CENTRALIZED SEARCH BAR */}
          <div className="central-search-wrapper">
            <div className="search-pill">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm} 
                onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} 
              />
              <button className="orange-go-btn" onClick={() => setView("grid")}>GO</button>
            </div>
          </div>

          {/* RIGHT LINKS */}
          <div className="nav-group right">
            <button className="nav-link-item" onClick={() => setView("account")}>Account</button>
            {!user ? (
              <>
                <button className="nav-link-item auth-highlight" onClick={() => {setView("auth"); setAuthMode("register")}}>Join</button>
                <button className="nav-link-item" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button>
              </>
            ) : (
              <span className="user-tag">👤 {user.phone}</span>
            )}
          </div>
        </div>
      </nav>

      <div className="content-layout">
        {/* LEFT SIDEBAR SECTION */}
        <aside className="left-sidebar">
          <h3>Categories</h3>
          <nav className="side-nav">
            {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
              <button key={catId} className={category === catId ? "active" : ""} 
                onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
                {catId.toUpperCase()}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main>
          {view === "tracking" && (
            <div className="view-container tracking-screen">
              <h1>📦 Track Your Shipment</h1>
              <div className="track-search-box">
                <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
                <button className="track-btn-action" onClick={handleTrackOrder}>Check Status</button>
              </div>
              {trackingData && (
                <div className="tracking-timeline">
                  <div className="step completed"><div className="bullet"></div><div className="info"><strong>Confirmed</strong></div></div>
                  <div className="step active"><div className="bullet"></div><div className="info"><strong>Status: {trackingData.status}</strong></div></div>
                </div>
              )}
            </div>
          )}

          {view === "account" && (
            <div className="view-container account-screen">
              <h1>Order History</h1>
              <div className="order-history">
                {userOrders.map((order) => (
                  <div key={order.id} className="history-item">
                    <strong>Order #{order.id} - ₦{parseFloat(order.total_price || 0).toLocaleString()}</strong>
                    <button className="re-download-btn" onClick={() => window.open(`${BASE_URL}/api/invoices/generate?order_id=${order.id}`, "_blank")}>PDF</button>
                  </div>
                ))}
                {userOrders.length === 0 && <p>No orders found.</p>}
              </div>
            </div>
          )}

          {view === "auth" && (
            <div className="view-container auth-screen">
              <h1>{authMode === "login" ? "Login" : "Create Account"}</h1>
              <div className="auth-form">
                <input type="text" placeholder="Phone Number" className="auth-input" />
                <input type="password" placeholder="Password" className="auth-input" />
                <button className="orange-curved-btn" onClick={() => {setUser({phone: "Member"}); setView("grid")}}>
                  {authMode === "login" ? "Sign In" : "Register Now"}
                </button>
                <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} style={{cursor:'pointer', marginTop:'10px'}}>
                  {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
                </p>
              </div>
            </div>
          )}

          {view === "grid" && selectedProduct && (
            <div className="view-container detail-screen">
              <button className="back-link" onClick={() => setSelectedProduct(null)}>← Back to Shopping</button>
              <div className="detail-layout">
                <div className="detail-images">
                  <img src={getImageUrl(activeImage || selectedProduct)} alt={selectedProduct.name} />
                  <div className="thumb-strip">
                     {selectedProduct.additional_images?.map((img, i) => (
                       <img key={i} src={getImageUrl({image_path: img.image})} onClick={() => setActiveImage(img.image)} />
                     ))}
                  </div>
                </div>
                <div className="detail-info">
                  <h1>{selectedProduct.name}</h1>
                  <p className="detail-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                  <p>{selectedProduct.description}</p>
                  <button className="add-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                </div>
              </div>
            </div>
          )}

          {view === "grid" && !selectedProduct && (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="product-card">
                  <div className="img-frame" onClick={() => setSelectedProduct(p)}>
                    <img src={getImageUrl(p)} alt={p.name} className="zoom-effect" />
                  </div>
                  <h3>{p.name}</h3>
                  <p>₦{parseFloat(p.price).toLocaleString()}</p>
                  <button className="add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* RIGHT SIDEBAR (CART) SECTION */}
      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name} (x{item.quantity})</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p>Subtotal: ₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</p>
            <p>Shipping: ₦{cart.length > 0 ? "1,500" : "0"}</p>
            <p>Total: <strong>₦{(cart.reduce((s, i) => s + (i.price * i.quantity), 0) + (cart.length > 0 ? 1500 : 0)).toLocaleString()}</strong></p>
            
            <div className="cart-action-stack">
              <button className="orange-curved-btn" disabled={isProcessing} onClick={checkoutWithPaystack}>
                {isProcessing ? "Processing..." : "Checkout Now"}
              </button>
              <button className="clear-cart-btn-curved" onClick={() => setCart([])}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;