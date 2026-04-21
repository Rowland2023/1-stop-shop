import React, { useEffect, useState } from "react";
import "./App.css";

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
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("shop_cart_data");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMainImage, setActiveMainImage] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ phone: "", password: "", first_name: "", last_name: "" });
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- LOGIC ---
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
      } else { alert(data.message || "Auth failed"); }
    } catch (err) { alert("Backend error."); }
  };

  useEffect(() => {
    if (selectedProduct) {
      setActiveMainImage(selectedProduct.main_image_url || selectedProduct.additional_images?.[0]?.image);
    }
  }, [selectedProduct]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch(console.error);
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart(prev => [...prev, { ...product, quantity: qty }]);
  };

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="brand-header">
        <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 onClick={() => {setView("grid"); setSelectedProduct(null)}} style={{ cursor: 'pointer' }}>MeBuy</h1>
          <button onClick={() => setCartOpen(!cartOpen)}>🛒 {cart.length}</button>
        </div>
      </header>

      <nav className="main-nav">
        <button onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
        <button onClick={() => setView("tracking")}>Tracking</button>
        <button onClick={() => setView("account")}>Account</button>
        {!user ? <button onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button> : <span>{user.phone}</span>}
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        {["food", "electronics", "office"].map(cat => <button key={cat} onClick={() => {setCategory(cat); setView("grid")}}>{cat.toUpperCase()}</button>)}
      </aside>

      <main>
        {view === "auth" && (
          <div className="view-container auth-screen" style={{ padding: '20px' }}>
            <h1>{authMode === "login" ? "Login" : "Register"}</h1>
            {authMode === "register" && (
              <>
                <input placeholder="First Name" onChange={e => setAuthData({...authData, first_name: e.target.value})} />
                <input placeholder="Last Name" onChange={e => setAuthData({...authData, last_name: e.target.value})} />
              </>
            )}
            <input placeholder="Phone" onChange={e => setAuthData({...authData, phone: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, password: e.target.value})} />
            <button onClick={handleAuth}>Submit</button>
          </div>
        )}

        {view === "grid" && (
          <>
            {selectedProduct ? (
              <div className="detail-screen" style={{ padding: '20px' }}>
                <button onClick={() => setSelectedProduct(null)}>← Back</button>
                <h1>{selectedProduct.name}</h1>
                <div className="product-detail-flex" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  <div className="product-gallery" style={{ flex: '1', minWidth: '300px' }}>
                    <img src={getImageUrl(activeMainImage)} style={{ width: '100%', maxWidth: '400px' }} />
                  </div>
                  <div className="product-description" style={{ flex: '1', minWidth: '300px' }}>
                    <h3>Product Details</h3>
                    <p>{selectedProduct.description}</p>
                    <button className="add-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default App;