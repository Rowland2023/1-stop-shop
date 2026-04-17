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
  const [userOrders, setUserOrders] = useState([]); 

  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

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
      const totalPrice = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, 
        email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
        amount: Math.round(totalPrice * 100), 
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
        <div className="logo-section" onClick={() => setView("grid")} style={{cursor:'pointer'}}>
          <h1>1-Stop Shop</h1>
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

      {/* SEARCH CENTERED NAV BAR */}
      <nav className="unified-nav">
          <button className="nav-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
          <button className="nav-item" onClick={() => setView("tracking")}>Tracking</button>
          
          <div className="search-container-bold">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              value={searchTerm} 
              onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} 
            />
            <button className="search-end-orange">GO</button>
          </div>

          <button className="nav-item" onClick={() => setView("account")}>Account</button>
          {user ? <span className="user-text">Hi, {user.phone}</span> : <button className="nav-item" onClick={() => setView("auth")}>Login</button>}
      </nav>

      <div className="main-layout">
        <aside className="left-sidebar">
          <h3>Categories</h3>
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map(cat => (
            <button key={cat} className={category === cat ? "cat-btn active" : "cat-btn"} onClick={() => {setCategory(cat); setView("grid"); setSelectedProduct(null);}}>{cat.toUpperCase()}</button>
          ))}
        </aside>

        <main className="content-area">
          {/* LOGIC FOR SWITCHING VIEWS WITHOUT BREAKING GRID */}
          {view === "tracking" ? (
            <div className="view-container">
              <h1>📦 Track Order</h1>
              <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
              <button className="orange-checkout-btn">Track</button>
            </div>
          ) : view === "account" ? (
            <div className="view-container">
              <h1>Account Settings</h1>
              <p>Welcome back, {user ? user.phone : "Guest"}</p>
            </div>
          ) : view === "auth" ? (
            <div className="view-container auth-box">
              <h2>{authMode === "login" ? "Login" : "Register"}</h2>
              <input type="text" placeholder="Phone" className="auth-input" />
              <input type="password" placeholder="Password" className="auth-input" />
              <button className="orange-checkout-btn" onClick={() => {setUser({phone: "Member"}); setView("grid")}}>Submit</button>
              <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>Toggle Login/Register</p>
            </div>
          ) : selectedProduct ? (
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
          )}
        </main>

        <aside className={`right-cart-sidebar ${cartOpen ? "open" : ""}`}>
           <h3>Your Cart</h3>
           <div className="cart-scroll">
              {cart.map((item, i) => (
                <div key={i} className="cart-row">
                  <div className="cart-item-info">
                    <span>{item.name} x{item.quantity}</span>
                    <strong>₦{(item.price * item.quantity).toLocaleString()}</strong>
                  </div>
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