import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = window.location.origin; 

// --- SUB-COMPONENT: PRODUCT CARD ---
function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  const displayImage = product.image_display || "/static/placeholder.png";

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)}>
        <img 
          src={displayImage} 
          alt={product.name} 
          className="zoom-effect" 
          onError={(e) => { e.target.src = "/static/placeholder.png"; }}
        />
      </div>
      <h3>{product.name}</h3>
      <p>₦{parseFloat(product.price).toLocaleString()}</p>
      
      <div className="qty-input-container">
        <input 
          type="number" 
          min="1" 
          value={tempQty} 
          onChange={(e) => setTempQty(parseInt(e.target.value) || 1)}
        />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>
          Add {tempQty > 1 ? `(${tempQty})` : ""}
        </button>
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
  const [activeImage, setActiveImage] = useState(null); 
  const [isSuccess, setIsSuccess] = useState(false);

  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState("login"); 
  const [authData, setAuthData] = useState({ phone: "", password: "" });
  const [discount, setDiscount] = useState(0);

  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
          const productData = Array.isArray(data) ? data : (data.results || []);
          setProducts(productData);
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

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

  const clearCart = () => { if (window.confirm("Empty cart?")) setCart([]); };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authData.phone,
          email: `${authData.phone}@lekki-market.com`,
          password: authData.password
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ id: data.user_id, phone: authData.phone });
        setView("grid");
      } else { alert(data.error || "Authentication failed"); }
    } catch (err) { alert("Connection failed."); }
  };

  const subTotalValue = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const totalDue = Math.max(0, subTotalValue - discount);
  const allFiltered = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayedProducts = allFiltered.slice(0, visibleCount);

  return (
    <div className="app-grid-wrapper">
      <header>
        <h1>1-Stop Shop</h1>
        <div className="header-adv-frame">
            <img src="/static/Shoping-ad.jpg" alt="Advertisement" className="adv-banner" />
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
          🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); }}>Home</button></li>
          <li className="nav-auth">
            {user ? (
              <div className="user-badge"><span>Hi, <strong>{user.phone}</strong></span></div>
            ) : (
              <button className="register-link" onClick={() => { setView("auth"); setAuthMode("login"); }}>Login / Register</button>
            )}
          </li>
        </ul>
      </nav>

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
        {view === "auth" ? (
          <div className="view-container auth-screen">
             <div className="auth-card">
               <h1>{authMode === "login" ? "Welcome Back" : "Create Account"}</h1>
               <form onSubmit={handleAuth} className="auth-form">
                  <input type="tel" placeholder="Phone Number" required value={authData.phone} onChange={(e) => setAuthData({...authData, phone: e.target.value})} />
                  <input type="password" placeholder="Password" required value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})} />
                  <button type="submit" className="auth-submit-btn">{authMode === "login" ? "Login" : "Register"}</button>
               </form>
               <p className="auth-toggle-text" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                 {authMode === "login" ? "New here? Register" : "Have an account? Login"}
               </p>
             </div>
          </div>
        ) : selectedProduct ? (
          <div className="view-container detail-screen">
            <button className="back-btn" onClick={() => { setSelectedProduct(null); setActiveImage(null); }}>← Back to Products</button>
            <div className="detail-layout">
              {/* Image Section */}
              <div className="image-gallery-container">
                <div className="main-image-frame">
                  <img src={activeImage || selectedProduct.image_display} alt={selectedProduct.name} />
                </div>
                <div className="thumbnail-row">
                  <img src={selectedProduct.image_display} alt="Main" className="thumb" onClick={() => setActiveImage(selectedProduct.image_display)} />
                  {selectedProduct.additional_images?.map((img, idx) => (
                    <img key={idx} src={img.image_url} alt="Extra" className="thumb" onClick={() => setActiveImage(img.image_url)} />
                  ))}
                </div>
              </div>
              {/* Text Section */}
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <h2 className="price-tag">₦{parseFloat(selectedProduct.price).toLocaleString()}</h2>
                <p className="description">{selectedProduct.description || "Premium quality item."}</p>
                <button className="add-btn large" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="product-list-wrapper">
            <div className="product-grid">
              {displayedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
              ))}
            </div>
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item-row">
                <strong>{item.name} (x{item.quantity})</strong>
                <button onClick={() => setCart(cart.filter((_, i) => i !== index))}>×</button>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p className="final-total">Total: ₦{totalDue.toLocaleString()}</p>
            <button className="vendor-btn paystack" onClick={() => alert("Checkout logic here")}>Pay Now</button>
            <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;