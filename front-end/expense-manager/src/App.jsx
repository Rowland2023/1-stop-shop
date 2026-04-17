import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "https://back-end-wdk7.onrender.com";
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
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null); 

  // --- AUTH & TRACKING STATES ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ phone: "", password: "" });
  const [userOrders, setUserOrders] = useState([]);
  const [trackId, setTrackId] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);

  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

  // --- EFFECTS ---
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
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // Fetch orders when user goes to Account view
  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
        .catch(err => console.error("History fetch error", err));
    }
  }, [view, user]);

  // --- LOGIC HANDLERS ---
  const handleAuth = async () => {
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setView("grid");
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) { alert("Server connection failed"); }
  };

  const handleTrackOrder = async () => {
    if (!trackId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${trackId}/`);
      const data = await res.json();
      if (res.ok) setTrackingResult(data);
      else alert("Order not found");
    } catch (err) { alert("Could not connect to tracking service"); }
  };

  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    try {
      const response = await fetch(`${BASE_URL}/api/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: parseInt(item.id), quantity: item.quantity })),
          total: cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2),
          userId: user ? user.id : "guest_001",
        }),
      });
      
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, 
        email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
        amount: Math.round(cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) * 100), 
        currency: 'NGN',
        callback: (res) => {
          setIsProcessing(false);
          setCart([]);
          alert("Payment Successful!");
        },
        onClose: () => setIsProcessing(false)
      });
      handler.openIframe();
    } catch (err) { setIsProcessing(false); }
  };

  const allFiltered = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="header-main">
        <div className="logo-section">
          <h1 onClick={() => setView("grid")} style={{cursor:'pointer'}}>1-Stop Shop</h1>
        </div>
        <div className="header-center-ad">
           <img src="/static/Shoping-ad.jpg" alt="Ad" />
        </div>
        <div className="cart-section">
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            🛒 CART ({cart.reduce((acc, item) => acc + item.quantity, 0)})
          </button>
        </div>
      </header>

      <nav className="unified-nav">
          <button className="nav-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
          <button className="nav-item" onClick={() => setView("tracking")}>Tracking</button>
          
          <div className="search-container-bold">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button className="search-end-orange" onClick={() => setView("grid")}>GO</button>
          </div>

          <button className="nav-item" onClick={() => setView("account")}>Account</button>
          {user ? <span className="user-text">Hi, {user.phone}</span> : <button className="nav-item" onClick={() => setView("auth")}>Login</button>}
      </nav>

      <div className="main-layout">
        <aside className="left-sidebar">
          <h3>Categories</h3>
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map(cat => (
            <button key={cat} className={category === cat ? "cat-btn active" : "cat-btn"} onClick={() => {setCategory(cat); setView("grid");}}>{cat.toUpperCase()}</button>
          ))}
        </aside>

        <main className="content-area">
          {/* TRACKING VIEW */}
          {view === "tracking" && (
            <div className="auth-container">
              <h2>Track Your Order</h2>
              <input className="auth-input" type="text" placeholder="Enter Order ID" value={trackId} onChange={(e) => setTrackId(e.target.value)} />
              <button className="orange-checkout-btn" onClick={handleTrackOrder}>Track Status</button>
              {trackingResult && (
                <div className="tracking-info">
                  <p>Status: <strong>{trackingResult.status}</strong></p>
                  <p>Expected Delivery: {trackingResult.delivery_date}</p>
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT VIEW */}
          {view === "account" && (
            <div className="auth-container">
              <h2>Order History</h2>
              {!user ? <p>Please login to see your orders.</p> : (
                <div className="history-list">
                  {userOrders.map(o => (
                    <div key={o.id} className="history-item">
                      Order #{o.id} - ₦{parseFloat(o.total_price).toLocaleString()} - <em>{o.status}</em>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUTH VIEW */}
          {view === "auth" && (
            <div className="auth-container">
              <h2>{authMode === "login" ? "Login" : "Join Us"}</h2>
              <input className="auth-input" type="text" placeholder="Phone Number" onChange={(e) => setAuthData({...authData, phone: e.target.value})} />
              <input className="auth-input" type="password" placeholder="Password" onChange={(e) => setAuthData({...authData, password: e.target.value})} />
              <button className="orange-checkout-btn" onClick={handleAuth}>{authMode === "login" ? "Login" : "Register"}</button>
              <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} style={{cursor:'pointer', marginTop:'10px'}}>
                {authMode === "login" ? "Need an account? Join here" : "Already have an account? Login"}
              </p>
            </div>
          )}

          {/* GRID VIEW */}
          {view === "grid" && (
            selectedProduct ? (
              <div className="product-review-container">
                <button className="back-link" onClick={() => {setSelectedProduct(null); setActiveImage(null)}}>← Back to Shopping</button>
                <div className="review-flex">
                  <div className="review-images">
                    <div className="main-img-box">
                      <img src={getImageUrl(activeImage || selectedProduct.image_display || selectedProduct.additional_images?.[0]?.image)} alt="main" />
                    </div>
                    <div className="thumb-strip">
                      {selectedProduct.additional_images?.map((img, i) => (
                        <img key={i} src={getImageUrl(img.image)} onClick={() => setActiveImage(img.image)} className={activeImage === img.image ? "active-t" : ""} />
                      ))}
                    </div>
                  </div>
                  <div className="review-details">
                    <h2>{selectedProduct.name}</h2>
                    <h3 className="orange-text">₦{parseFloat(selectedProduct.price).toLocaleString()}</h3>
                    <p>{selectedProduct.description}</p>
                    <button className="orange-checkout-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {allFiltered.slice(0, visibleCount).map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
              </div>
            )
          )}
        </main>

        <aside className={`right-cart-sidebar ${cartOpen ? "open" : ""}`}>
            <h3>Your Cart</h3>
            <div className="cart-scroll">
               {cart.map((item, i) => (
                 <div key={i} className="cart-row">
                   <span>{item.name} x{item.quantity}</span>
                   <strong>₦{(item.price * item.quantity).toLocaleString()}</strong>
                 </div>
               ))}
            </div>
            <div className="cart-footer">
               <button className="clear-cart-btn-curved" onClick={() => setCart([])}>Clear Cart</button>
               <button className="checkout-btn-curved" onClick={checkoutWithPaystack} disabled={isProcessing}>
                 {isProcessing ? "Processing..." : "Checkout Now"}
               </button>
            </div>
        </aside>
      </div>
    </div>
  );
}

export default App;