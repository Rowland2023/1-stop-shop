import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
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
        <button className="add-btn-orange" onClick={() => onAddToCart(product, tempQty)}>Add</button>
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
  const [headerAd, setHeaderAd] = useState(null); // Dynamic Ad State

  // --- UI & VIEW STATES ---
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- 1. PERSISTENCE & FETCHING ---
  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  // Fetch Products and Ads
  useEffect(() => {
    // Fetch Products
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Product fetch error:", err));

    // Fetch Ads
    fetch(`${BASE_URL}/api/ads/`)
      .then((res) => res.json())
      .then((data) => { if (data && data.length > 0) setHeaderAd(data[0]); })
      .catch((err) => console.error("Ad Fetch Error:", err));
  }, []);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/`)
        .then((res) => res.json())
        .then((data) => setUserOrders(Array.isArray(data) ? data : (data.results || [])))
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view, user]);

  // --- 2. HANDLERS ---
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
    const totalAmount = cart.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0) + 1500;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
      amount: Math.round(totalAmount * 100),
      currency: 'NGN',
      callback: (res) => { setIsProcessing(false); setCart([]); alert("Payment Success!"); },
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
      {/* HEADER SECTION - Brand, Dynamic Ad, and Cart Toggle */}
      <header className="brand-header">
        <div className="logo-area">
          <h1 onClick={() => setView("grid")} style={{cursor:'pointer'}}>1-Stop Shop</h1>
        </div>
        
        <div className="ad-area">
          {headerAd ? (
            <a href={headerAd.link_url} target="_blank" rel="noopener noreferrer">
              <img src={headerAd.image_url} alt="Promo" className="dynamic-header-ad" />
            </a>
          ) : (
            <img src="/static/Shoping-ad.jpg" alt="Default Ad" className="dynamic-header-ad" />
          )}
        </div>

        <div className="cart-status-area">
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            🛒 CART ({cart.reduce((acc, item) => acc + item.quantity, 0)})
          </button>
        </div>
      </header>

      {/* NAVIGATION - Bold Search & Orange End */}
      <nav className="unified-nav-row">
        <div className="nav-group-left">
          <button onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
          <button onClick={() => setView("tracking")}>Tracking</button>
        </div>

        <div className="search-box-bold">
          <input type="text" placeholder="SEARCH PRODUCTS..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} />
          <button className="search-orange-btn">GO</button>
        </div>

        <div className="nav-group-right">
          <button onClick={() => setView("account")}>Account</button>
          {user ? <span>👤 {user.phone}</span> : <button onClick={() => setView("auth")}>Login</button>}
        </div>
      </nav>

      <div className="layout-body-grid">
        {/* LEFT SIDEBAR */}
        <aside className="left-sidebar">
          <h3>CATEGORIES</h3>
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "cat-link active" : "cat-link"} onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
              {catId.toUpperCase()}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="center-content">
          {view === "grid" && selectedProduct ? (
            <div className="review-container-fixed">
              <button className="back-btn" onClick={() => {setSelectedProduct(null); setActiveImage(null)}}>← BACK</button>
              <div className="review-split">
                <div className="review-imgs">
                  <img className="main-review-img" src={getImageUrl(activeImage || selectedProduct.image_display || selectedProduct.additional_images?.[0]?.image)} alt="product" />
                  <div className="review-thumbs">
                    {selectedProduct.additional_images?.map((img, i) => (
                      <img key={i} src={getImageUrl(img.image)} onClick={() => setActiveImage(img.image)} className={activeImage === img.image ? "t-active" : ""} />
                    ))}
                  </div>
                </div>
                <div className="review-info">
                  <h2>{selectedProduct.name}</h2>
                  <h3 className="orange-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</h3>
                  <p>{selectedProduct.description}</p>
                  <button className="orange-curved-btn" onClick={() => addToCart(selectedProduct)}>ADD TO CART</button>
                </div>
              </div>
            </div>
          ) : view === "grid" ? (
            <div className="product-grid-main">
              {filteredProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
            </div>
          ) : view === "tracking" ? (
             <div className="view-container">
                <h2>Track Order</h2>
                <input className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} placeholder="Order ID" />
                <button className="orange-curved-btn" onClick={handleTrackOrder}>Track</button>
             </div>
          ) : null}
        </main>

        {/* RIGHT SIDEBAR (CART) */}
        <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
          <h3>YOUR CART</h3>
          <div className="cart-list">
            {cart.map((item, i) => (
              <div key={i} className="cart-item-mini">
                <span>{item.name} (x{item.quantity})</span>
                <strong>₦{(item.price * item.quantity).toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <div className="cart-totals">
            <p>Total: <strong>₦{(cart.reduce((s, i) => s + (i.price * i.quantity), 0) + (cart.length > 0 ? 1500 : 0)).toLocaleString()}</strong></p>
            <button className="clear-btn-curved" onClick={() => setCart([])}>Clear Cart</button>
            <button className="checkout-btn-curved" onClick={checkoutWithPaystack} disabled={isProcessing}>
              {isProcessing ? "WAIT..." : "CHECKOUT NOW"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;