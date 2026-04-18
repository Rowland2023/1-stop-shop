import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (input) => {
  let path = typeof input === 'string' ? input : (input?.image_path || input?.image_display || input?.image || "");
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http") || path.includes("cloudinary")) return path;
  const cleanPath = path.replace(/^media\//, "");
  return `${BASE_URL}/media/${cleanPath}`; 
};

function App() {
  // --- STATES ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("shop_cart_data");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/products/`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.results || []));
      } catch (err) { console.error("Fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  // --- HANDLERS ---
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      return exists ? prev.map(i => i.id === product.id ? {...i, quantity: i.quantity + qty} : i) : [...prev, {...product, quantity: qty}];
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "123", password: "123" }),
      });
      if (res.ok) { setUser({ phone: "User" }); setView("grid"); }
    } catch (err) { alert("Auth failed"); }
  };

  const filteredProducts = products.filter((p) => 
    p.category?.toLowerCase() === category.toLowerCase() && 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="brand-header">
        <div className="header-inner">
          <h1 onClick={() => setView("grid")} className="logo-text">MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((a, i) => a + i.quantity, 0)}</button>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
          <button onClick={() => setView("grid")}>Home</button>
          <button onClick={() => setView("tracking")}>Tracking</button>
          <input placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={() => setView("account")}>Account</button>
        </div>
      </nav>

      <div className="content-layout">
        <aside className="left-sidebar">
          {["food", "electronics", "office", "style&fashion"].map((cat) => (
            <button key={cat} onClick={() => { setCategory(cat); setView("grid"); }}>{cat.toUpperCase()}</button>
          ))}
        </aside>

        <main className="view-container">
          {loading ? (
            <div className="status-message">Loading content...</div>
          ) : (
            <>
              {view === "grid" && !selectedProduct && (
                <div className="product-grid">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="product-card">
                      <img src={getImageUrl(p)} onClick={() => setSelectedProduct(p)} alt={p.name} />
                      <h3>{p.name}</h3>
                      <button onClick={() => addToCart(p)}>Add to Cart</button>
                    </div>
                  ))}
                </div>
              )}
              {view === "grid" && selectedProduct && (
                <div className="detail-screen">
                  <button onClick={() => setSelectedProduct(null)}>← Back</button>
                  <h1>{selectedProduct.name}</h1>
                </div>
              )}
              {view === "tracking" && <div className="tracking-screen">...</div>}
              {view === "account" && <div className="account-screen">...</div>}
              {view === "auth" && <div className="auth-screen">...</div>}
            </>
          )}
        </main>
      </div>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <button onClick={() => setCart([])}>Clear Cart</button>
        </div>
      </aside>
    </div>
  );
}

export default App;