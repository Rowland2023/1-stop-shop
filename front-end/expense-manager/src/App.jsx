import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL = "https://back-end-wdk7.onrender.com"; 
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (product) => {
  const path = product.image_display || (product.additional_images?.[0]?.image) || product.image_path;
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  return `${CLOUDINARY_BASE}${path}`;
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
  const [activeImage, setActiveImage] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => { localStorage.setItem("shop_cart_data", JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
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
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.reduce((acc, item) => acc + item.quantity, 0)}</button>
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
            {!user ? <button className="nav-link-item" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button> : <span>{user.phone}</span>}
          </div>
        </div>
      </nav>

      {/* NO WRAPPER DIV HERE - DIRECT CHILDREN ONLY */}
      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
              {catId.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {/* Your View Logic */}
        {view === "grid" && selectedProduct && (
          <div className="view-container detail-screen">
             <button onClick={() => setSelectedProduct(null)}>← Back</button>
             <h1>{selectedProduct.name}</h1>
             <img src={getImageUrl(activeImage || selectedProduct)} alt={selectedProduct.name} />
             <button onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
          </div>
        )}
        {view === "grid" && !selectedProduct && (
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <img src={getImageUrl(p)} alt={p.name} />
                <h3>{p.name}</h3>
                <button onClick={() => addToCart(p)}>Add to Cart</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <h3>Your Cart</h3>
        {/* ... Cart contents ... */}
      </aside>
    </div>
  );
}

export default App;