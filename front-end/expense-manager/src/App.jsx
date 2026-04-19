import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL = import.meta.env.VITE_API_URL || "";
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
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      return existing ? prev.map(i => i.id === product.id ? {...i, quantity: i.quantity + qty} : i) : [...prev, {...product, quantity: qty}];
    });
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    const total = cart.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0) + 1500;
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user ? `${user.phone}@mebuy.com` : 'guest@mebuy.com',
      amount: Math.round(total * 100),
      currency: 'NGN',
      callback: (res) => { setIsProcessing(false); setCart([]); alert("Success! Ref: " + res.reference); },
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
        <div className="header-inner">
          <h1 onClick={() => setView("grid")} className="logo-text">MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((a, i) => a + i.quantity, 0)}</button>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-group left">
            <button className="nav-link-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button className="nav-link-item" onClick={() => {setView("tracking"); setTrackingData(null)}}>Tracking</button>
          </div>
          <div className="central-search-wrapper">
            <div className="search-pill">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} />
              <button className="orange-go-btn" onClick={() => setView("grid")}>GO</button>
            </div>
          </div>
          <div className="nav-group right">
            <button className="nav-link-item" onClick={() => setView("account")}>Account</button>
          </div>
        </div>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office"].map((cat) => (
            <button key={cat} className={category === cat ? "active" : ""} onClick={() => { setCategory(cat); setView("grid"); }}>{cat.toUpperCase()}</button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "tracking" && (
          <div className="view-container">
            <h1>Track Shipment</h1>
            <input type="text" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
            <button onClick={handleTrackOrder}>Check</button>
          </div>
        )}

        {view === "grid" && (
          selectedProduct ? (
            <div className="detail-screen">
              <button onClick={() => setSelectedProduct(null)}>← Back</button>
              <h1>{selectedProduct.name}</h1>
              <button className="add-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="product-card">
                  <img src={getImageUrl(p)} alt={p.name} onClick={() => setSelectedProduct(p)} />
                  <h3>{p.name}</h3>
                  <button className="add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <h3>Your Cart</h3>
        {cart.map((item, idx) => (
          <div key={idx}>{item.name} x{item.quantity} - ₦{(item.price * item.quantity).toLocaleString()}</div>
        ))}
        <button className="orange-curved-btn" onClick={checkoutWithPaystack}>Checkout Now</button>
      </aside>
    </div>
  );
}

export default App;