import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";

// --- HELPERS ---
const getImageUrl = (input) => {
  if (!input) return "/static/placeholder.png";
  const path = (typeof input === 'object' && input !== null) ? input.image : input;
  if (typeof path !== 'string') return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${CLOUDINARY_BASE}${cleanPath}`;
};

function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  const gallery = product.additional_images || [];
  const primaryImg = product.main_image_url || (gallery.length > 0 ? gallery[0].image : null);
  const displayImage = getImageUrl(primaryImg);

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)} style={{ cursor: 'pointer' }}>
        <img src={displayImage} alt={product.name} className="zoom-effect" onError={(e) => { e.target.src = "/static/placeholder.png"; }} />
      </div>
      <h3>{product.name}</h3>
      <p className="price-text">₦{parseFloat(product.price || 0).toLocaleString()}</p>
      <div className="qty-row">
        <input type="number" min="1" value={tempQty} onChange={(e) => setTempQty(parseInt(e.target.value) || 1)} />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>Add to Cart</button>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("shop_cart_data")) || []);
  const [cartOpen, setCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMainImage, setActiveMainImage] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ phone: "", password: "", first_name: "" });
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- API: AUTHENTICATION ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    
    // Construct payload explicitly using current state
    const payload = {
      first_name: authData.first_name,
      phone: authData.phone,
      password: authData.password
    };

    console.log("DEBUG: Final Payload sent to " + endpoint + ":", payload);

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json" 
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setView("grid");
      } else { 
        console.error("SERVER REJECTED PAYLOAD:", data);
        alert(data.error || "Authentication failed."); 
      }
    } catch (err) { 
      console.error("Fetch Error:", err);
      alert("Backend unreachable."); 
    }
  };

  // --- DATA FETCHING & PERSISTENCE ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  useEffect(() => { localStorage.setItem("shop_cart_data", JSON.stringify(cart)); }, [cart]);

  // --- HANDLERS ---
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      return existing ? prev.map((i) => i.id === product.id ? {...i, quantity: i.quantity + qty} : i) : [...prev, { ...product, quantity: qty }];
    });
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart empty!");
    setIsProcessing(true);
    const totalAmount = cart.reduce((s, i) => s + (i.price * i.quantity), 0) + 1500;
    const handler = window.PaystackPop.setup({
      key: 'pk_live_21207f639d252b46e35e171dca6b075f79cba433',
      email: user ? `${user.phone}@mebuy.com` : 'guest@mebuy.com',
      amount: Math.round(totalAmount * 100),
      currency: 'NGN',
      callback: () => { setIsProcessing(false); setCart([]); alert("Payment Successful!"); },
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
      <header className="brand-header">
        <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 onClick={() => setView("grid")} className="logo-text" style={{ cursor: 'pointer' }}>MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((a, i) => a + i.quantity, 0)}</button>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-group left">
            <button className="nav-link-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button className="nav-link-item" onClick={() => setView("tracking")}>Tracking</button>
          </div>
          <div className="central-search-wrapper">
            <div className="search-pill">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} />
              <button className="orange-go-btn" onClick={() => setView("grid")}>GO</button>
            </div>
          </div>
          <div className="nav-group right">
            <button className="nav-link-item" onClick={() => setView("account")}>Account</button>
            {!user ? (
              <>
                <button className="nav-link-item auth-highlight" onClick={() => {setView("auth"); setAuthMode("register")}}>Join</button>
                <button className="nav-link-item" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button>
              </>
            ) : <span className="user-tag">👤 {user.phone}</span>}
          </div>
        </div>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((cat) => (
            <button key={cat} className={category === cat ? "active" : ""} onClick={() => { setCategory(cat); setView("grid"); setSelectedProduct(null); }}>{cat.toUpperCase()}</button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "auth" && (
          <div className="view-container auth-screen" style={{ padding: '20px' }}>
            <h1>{authMode === "login" ? "Login" : "Register"}</h1>
            <input placeholder="Phone Number" value={authData.phone} onChange={e => setAuthData(p => ({...p, phone: e.target.value}))} />
            {authMode === "register" && (
              <input placeholder="First Name" value={authData.first_name} onChange={e => setAuthData(p => ({...p, first_name: e.target.value}))} />
            )}
            <input type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData(p => ({...p, password: e.target.value}))} />
            <button className="orange-curved-btn" onClick={handleAuth}>{authMode === "login" ? "Login" : "Submit"}</button>
          </div>
        )}
        
        {view === "grid" && (
          selectedProduct ? (
            <div className="detail-screen" style={{ padding: '20px' }}>
              <button onClick={() => setSelectedProduct(null)}>← Back</button>
              <h1>{selectedProduct.name}</h1>
              <div className="product-gallery">
                <img src={getImageUrl(activeMainImage || selectedProduct.main_image_url)} style={{ width: '100%', maxWidth: '400px' }} />
              </div>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
            </div>
          )
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container" style={{ padding: '20px' }}>
          <h3>Your Cart</h3>
          <div className="cart-action-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="checkout-btn-curved" onClick={checkoutWithPaystack}>Checkout Now</button>
            <button className="clear-cart-btn-curved" onClick={() => setCart([])}>Clear Cart</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;