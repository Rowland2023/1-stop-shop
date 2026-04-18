import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (input) => {
  let path = typeof input === 'string' ? input : (input?.image_path || input?.image_display || input?.image || "");
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http") || path.includes("cloudinary")) return path;

  // IMPORTANT: Ensure your backend domain is defined in your .env file
  // If BASE_URL is empty, images will try to load from the React server (localhost:5173/static/...)
  const domain = BASE_URL || "http://127.0.0.1:8000"; 
  
  // Clean the path and construct the full URL
  const cleanPath = path.replace(/^media\//, "");
  return `${domain}/media/${cleanPath}`; 
};
function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  const displayImage = getImageUrl(product);

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
    } catch (err) { alert("Backend unreachable. Please check CORS settings."); }
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
      {/* 1. HEADER */}
      <header className="brand-header">
        <div className="header-inner">
          <h1 onClick={() => setView("grid")} className="logo-text">MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            🛒 <span className="cart-count">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      {/* 2. NAVIGATION (Tracking, Account, Auth live here) */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-group left">
            <button className="nav-link-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button className="nav-link-item" onClick={() => {setView("tracking"); setTrackingData(null)}}>Tracking</button>
          </div>

          <div className="central-search-wrapper">
            <div className="search-pill">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            ) : (
              <span className="user-tag">👤 {user.phone}</span>
            )}
          </div>
        </div>
      </nav>

      {/* 3. LEFT SIDEBAR (Categories only) */}
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

      {/* 4. MAIN (Content views only) */}
      <main>
        {/* ... Keep your existing view logic (tracking, account, auth, detail, grid) exactly as it is here ... */}
        {view === "tracking" && <div className="view-container">...</div>}
        {view === "account" && <div className="view-container">...</div>}
        {view === "auth" && <div className="view-container">...</div>}
        {view === "grid" && selectedProduct && <div className="view-container">...</div>}
        {view === "grid" && !selectedProduct && <div className="product-grid">...</div>}
      </main>

      {/* 5. RIGHT SIDEBAR (Cart) */}
      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        {/* ... Keep your existing cart logic here ... */}
      </aside>

      <footer></footer>
    </div>
  );
}
export default App;