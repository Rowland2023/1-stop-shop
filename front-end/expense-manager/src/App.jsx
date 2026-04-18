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
  const domain = BASE_URL || "http://127.0.0.1:8000"; 
  const cleanPath = path.replace(/^media\//, "");
  return `${domain}/media/${cleanPath}`; 
};

function App() {
  // --- STATES ---
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
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData] = useState({ phone: "", password: "" });
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include" 
    })
    .then((res) => res.json())
    .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
    .catch((err) => console.error("Fetch error:", err));
  }, []);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view, user]);

  // --- HANDLERS ---
  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) return prevCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      return [...prevCart, { ...product, quantity: qty }];
    });
  };

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Enter an Order ID");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${trackInput}/`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setTrackingData(data); else alert("Order not found.");
    } catch (err) { alert("Connection failed."); }
  };

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="brand-header">
        <div className="header-inner">
          <h1 onClick={() => setView("grid")} className="logo-text">MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((a, i) => a + i.quantity, 0)}</button>
        </div>
      </header>

      <div className="content-layout">
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

        <main>
          {view === "grid" ? (
            selectedProduct ? (
              <div className="view-container detail-screen">
                <button onClick={() => setSelectedProduct(null)}>← Back</button>
                <h1>{selectedProduct.name}</h1>
                <img src={getImageUrl(selectedProduct)} alt={selectedProduct.name} style={{ maxWidth: '400px' }} />
                <p>₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                <button onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="product-card">
                    <img src={getImageUrl(p)} alt={p.name} onClick={() => setSelectedProduct(p)} />
                    <h3>{p.name}</h3>
                    <button onClick={() => addToCart(p)}>Add to Cart</button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="view-container">
               {/* Place other views (tracking, account, auth) here as needed */}
               <p>Select a section to view.</p>
            </div>
          )}
        </main>
      </div>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <h3>Your Cart</h3>
        {/* ... Cart rendering logic ... */}
      </aside>
    </div>
  );
}

export default App;