import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIGURATION ---
// IMPORTANT: Ensure this points to your backend URL (e.g., https://your-api.onrender.com)
const API_BASE_URL = "https://your-backend-api.onrender.com"; 

/**
 * HELPER: Fixes broken image paths by prepending the backend URL
 * and handling placeholder fallbacks.
 */
const getFullUrl = (path) => {
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path; // Already a full URL
  // Ensures there is exactly one slash between base and path
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// --- SUB-COMPONENT: PRODUCT CARD ---
function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  // Fix the main product image path
  const displayImage = getFullUrl(product.image_display || product.main_image);

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)}>
        <img 
          src={displayImage} 
          alt={product.name} 
          className="zoom-effect" 
        />
      </div>
      <h3>{product.name}</h3>
      <p>₦{parseFloat(product.price || 0).toLocaleString()}</p>
      
      <div className="qty-input-container" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input 
          type="number" 
          min="1" 
          value={tempQty} 
          onChange={(e) => setTempQty(parseInt(e.target.value) || 1)}
          className="qty-spinner"
        />
        <button 
          className="add-btn" 
          onClick={() => onAddToCart(product, tempQty)}
          style={{ flex: 1 }}
        >
          Add {tempQty > 1 ? `(${tempQty})` : ""}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [headerAd, setHeaderAd] = useState(null); 
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
  const [giftCardCode, setGiftCardCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [trackingData, setTrackingData] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [userOrders, setUserOrders] = useState([]); 

  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  // Ad Fetching Fix
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ads/?location=header_main`)
      .then((res) => res.json())
      .then((data) => {
        const ads = Array.isArray(data) ? data : (data.results || []);
        if (ads.length > 0) setHeaderAd(ads[0]);
      })
      .catch((err) => console.error("Error fetching ads:", err));
  }, []);

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

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Please enter an Order ID");
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) setTrackingData(data);
      else alert("Order not found.");
    } catch (err) { alert("Connection failed."); }
  };

  const subTotalValue = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);
  const totalDue = Math.max(0, subTotalValue - discount);

  const allFiltered = products.filter((p) => 
    p.category?.toLowerCase() === category.toLowerCase() && 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProducts = allFiltered.slice(0, visibleCount);

  return (
    <div className="app-grid-wrapper">
      <header>
        <div className="logo-container">
          <img 
            src="/static/logo.png" 
            alt="Logo" 
            className="header-logo" 
            onClick={() => { setView("grid"); setSelectedProduct(null); setIsSuccess(false); }} 
            style={{ cursor: 'pointer', height: '120px', width: 'auto', display: 'block', borderRadius: '15px' }} 
          />
        </div>

        <div className="header-adv-frame">
          {headerAd ? (
            <a href={headerAd.link_url || "#"} target="_blank" rel="noopener noreferrer">
              <img 
                src={getFullUrl(headerAd.image || headerAd.image_url)} 
                alt={headerAd.title} 
                className="adv-banner" 
              />
            </a>
          ) : (
            <img src="/static/Shoping-ad.jpg" alt="Default Ad" className="adv-banner" />
          )}
        </div>

        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
          🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); setIsSuccess(false); }}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => { setView("tracking"); setTrackingData(null); }}>Track Order</button></li>
          <li className="nav-search-container">
            <div className="search-group">
              <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="nav-search-input" />
              <button className="nav-search-btn">Search</button>
            </div>
          </li>
          <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
          <li className="nav-auth">
            {user ? <span>Hi, {user.phone}</span> : <button className="register-link" onClick={() => setView("auth")}>Login</button>}
          </li>
        </ul>
      </nav>

      <main>
        {selectedProduct ? (
          <div className="view-container detail-screen">
            <button className="back-btn-nav" onClick={() => { setSelectedProduct(null); setActiveImage(null); }}>← Back</button>
            <div className="detail-layout">
              <div className="image-gallery-container">
                <div className="main-image-frame">
                  <img 
                    src={getFullUrl(activeImage || selectedProduct.image_display || selectedProduct.main_image)} 
                    alt={selectedProduct.name} 
                    className="review-image-main"
                  />
                </div>
                
                <div className="thumbnail-row">
                  {/* Primary Image Fix */}
                  <div className="thumb-item" onClick={() => setActiveImage(selectedProduct.image_display || selectedProduct.main_image)}>
                    <img src={getFullUrl(selectedProduct.image_display || selectedProduct.main_image)} alt="Main" />
                  </div>
                  {/* Review Images Fix (Looping through ProductImageInline results) */}
                  {selectedProduct.additional_images?.map((img, idx) => (
                    <div key={idx} className="thumb-item" onClick={() => setActiveImage(img.image)}>
                      <img src={getFullUrl(img.image)} alt={`Review ${idx}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <h2 className="price-text">₦{parseFloat(selectedProduct.price || 0).toLocaleString()}</h2>
                <p className="description-text">{selectedProduct.description}</p>
                <button className="add-btn-large" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;