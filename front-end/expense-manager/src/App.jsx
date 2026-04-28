import React, { useEffect, useState } from "react";
import "./App.css";
import { usePaystackPayment } from 'react-paystack';

/* --- CONFIG --- */
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

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
        <img 
          src={displayImage} 
          alt={product.name} 
          className="zoom-effect" 
          onError={(e) => { e.target.src = "/static/placeholder.png"; }} 
        />
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
  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("shop_cart_data");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Added State
  
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMainImage, setActiveMainImage] = useState(null);
  const [csrfReady, setCsrfReady] = useState(false);
  
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ phone: "", password: "", first_name: "" });

  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user ? `${user.phone}@mebuy.com` : 'guest@mebuy.com',
    amount: Math.round(totalAmount * 100),
    publicKey: PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  useEffect(() => {
    const seedCSRF = async () => {
      await fetch(`${BASE_URL}/api/get-csrf-token/`);
      setCsrfReady(true);
    };
    seedCSRF();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setActiveMainImage(selectedProduct.main_image_url || selectedProduct.additional_images?.[0]?.image);
    }
  }, [selectedProduct]);

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/`)
        .then((res) => res.json())
        .then((data) => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view, user]);

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify(authData),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) { setUser(data); setView("grid"); }
      else { alert(data.error || "Authentication failed"); }
    } catch (err) { alert("Connection error."); }
  };

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === product.id);
      return item ? prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i) : [...prev, { ...product, quantity: qty }];
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

  const filteredProducts = products.filter((p) => p.category.toLowerCase() === category.toLowerCase() && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="app-grid-wrapper">
      <header className="brand-header">
        <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 20px', gap: '10px' }}>
          <h1 onClick={() => setView("grid")} className="logo-text" style={{ cursor: 'pointer', margin: 0 }}>MeBuy</h1>
          
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰ Menu</button>
          
          <div className="header-ad" style={{ flex: 1, height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <img src="/Shoping-ad.jpg" alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user && <span className="user-tag" style={{ fontWeight: 'bold', backgroundColor: '#ff6600', borderRadius: '20px', color: '#ffffff', fontSize: '0.9rem', padding: '5px 10px' }}>Hi, {user.first_name}! 👤</span>}
            <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((acc, item) => acc + item.quantity, 0)}</button>
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-group left"><button className="nav-link-item" onClick={() => setView("grid")}>Home</button><button className="nav-link-item" onClick={() => setView("tracking")}>Tracking</button></div>
          <div className="central-search-wrapper"><div className="search-pill"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><button className="orange-go-btn" onClick={() => setView("grid")}>GO</button></div></div>
          <div className="nav-group right"><button className="nav-link-item" onClick={() => setView("account")}>Account</button>{!user ? <><button className="nav-link-item auth-highlight" onClick={() => {setView("auth"); setAuthMode("register")}}>Join</button><button className="nav-link-item" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button></> : <span className="user-tag">👤 {user.phone}</span>}</div>
        </div>
      </nav>
      {/* MOBILE DROPDOWN (Pushes content down) */}
{mobileMenuOpen && (
  <div className="mobile-menu-dropdown">
    <h3>Categories</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
        <button key={catId} onClick={() => { setCategory(catId); setView("grid"); setMobileMenuOpen(false); }}>
          {catId.toUpperCase()}
        </button>
      ))}
    </div>
  </div>
)}
      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} onClick={() => { setCategory(catId); setView("grid"); }}>{catId.toUpperCase()}</button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "auth" && (
          <div className="view-container auth-screen" style={{ padding: '20px' }}>
            <h1>{authMode === "login" ? "Login" : "Register"}</h1>
            <input placeholder="Phone Number" value={authData.phone} onChange={e => setAuthData({...authData, phone: e.target.value})} />
            {authMode === "register" && <input placeholder="First Name" value={authData.first_name} onChange={e => setAuthData({...authData, first_name: e.target.value})} />}
            <input type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
            <button className="orange-curved-btn" disabled={!csrfReady} onClick={handleAuth}>{csrfReady ? (authMode === "login" ? "Login" : "Submit") : "Connecting..."}</button>
          </div>
        )}
        {view === "tracking" && (
          <div className="view-container tracking-screen">
            <h1>📦 Track Your Shipment</h1>
            <input type="text" placeholder="Order ID" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
            <button className="track-btn-action" onClick={handleTrackOrder}>Check Status</button>
            {trackingData && <div className="tracking-timeline">Status: {trackingData.status}</div>}
          </div>
        )}
        {view === "account" && (
          <div className="view-container account-screen">
            <h1>Order History</h1>
            {userOrders.map(o => <div key={o.id}>{o.id} - ₦{o.total_price}</div>)}
          </div>
        )}
        {view === "grid" && (
          <>
            {selectedProduct ? (
              <div className="detail-screen" style={{ padding: '20px' }}>
                <button onClick={() => setSelectedProduct(null)}>← Back</button>
                <h1>{selectedProduct.name}</h1>
                <img src={getImageUrl(activeMainImage)} style={{ width: '100%', maxWidth: '400px' }} />
              </div>
            ) : (
              <div className="product-grid">
                {paginatedProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
              </div>
            )}
          </>
        )}
      </main>
      {/* RIGHT SIDEBAR */}
      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
  <div className="cart-container" style={{ padding: '20px' }}>
    {/* This button is only visible on mobile via CSS */}
    <button className="close-cart-btn" onClick={() => setCartOpen(false)} style={{ marginBottom: '15px' }}>
      ✕ Close
    </button>
    
    <h3>Your Cart</h3>
    
    <div className="cart-items-list" style={{ marginBottom: '20px' }}>
      {cart.length === 0 ? <p>Your cart is empty.</p> : 
        cart.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>{item.name} (x{item.quantity})</span>
            <span>₦{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))
      }
    </div>

    {cart.length > 0 && (
      <div className="total-section" style={{ borderTop: '2px solid #ccc', paddingTop: '10px' }}>
        <p><strong>Total: ₦{totalAmount.toLocaleString()}</strong></p>
        <div className="cart-action-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button className="checkout-btn-curved" onClick={() => initializePayment({ onSuccess: (res) => alert("Success! " + res.reference), onClose: () => {} })}>
            Checkout Now
          </button>
          <button className="clear-cart-btn-curved" onClick={() => setCart([])}>Clear Cart</button>
        </div>
      </div>
    )}
  </div>
</aside>
    </div>
  );
}
export default App;