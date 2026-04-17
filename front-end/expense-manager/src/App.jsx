import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = "https://back-end-wdk7.onrender.com"; 
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (path) => {
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  return `${CLOUDINARY_BASE}${path}`;
};

// --- SUB-COMPONENT: ProductCard ---
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
        <input 
          type="number" 
          min="1" 
          value={tempQty} 
          onChange={(e) => setTempQty(parseInt(e.target.value) || 1)} 
        />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>
          Add to Cart
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
  const [user, setUser] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
          setProducts(Array.isArray(data) ? data : (data.results || []));
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // --- 2. LOGIC VARIABLES (Crucial for Display) ---
  const allFiltered = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 3. HANDLERS ---
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
    // Paystack logic here...
    alert("Checkout functionality goes here.");
  };

  return (
    <div className="app-grid-wrapper">
      {/* Top Advertisement Space */}
      <div className="top-ad-banner">
        <img src="/static/Shoping-ad.jpg" alt="Special Offer" />
      </div>

      <header className="header-main">
        <div className="logo-section">
          <h1 onClick={() => setView("grid")} style={{cursor:'pointer'}}>1-Stop Shop</h1>
        </div>
        
        <div className="header-search-container">
          <div className="search-pill">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              value={searchTerm} 
              onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} 
            />
            <button className="search-pill-btn">GO</button>
          </div>
        </div>

        <div className="cart-section">
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            🛒 CART ({cart.reduce((acc, item) => acc + item.quantity, 0)})
          </button>
        </div>
      </header>

      <nav className="unified-nav">
          <button className="nav-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
          <button className="nav-item" onClick={() => setView("tracking")}>Tracking</button>
          <button className="nav-item" onClick={() => setView("account")}>Account</button>
          <button className="nav-item">Login</button>
      </nav>

      <div className="main-layout">
        <aside className="left-sidebar">
          <h3>Categories</h3>
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map(cat => (
            <button key={cat} className={category === cat ? "cat-btn active" : "cat-btn"} 
              onClick={() => {setCategory(cat); setView("grid"); setSelectedProduct(null);}}>
              {cat.toUpperCase()}
            </button>
          ))}
        </aside>

        <main className="content-area">
          {selectedProduct ? (
            <div className="product-review-container">
              <button className="back-link" onClick={() => setSelectedProduct(null)}>← Back</button>
              <div className="review-flex">
                <div className="review-images">
                  <img src={getImageUrl(selectedProduct.image_display)} alt="main" style={{maxWidth: '300px'}} />
                </div>
                <div className="review-details">
                  <h2>{selectedProduct.name}</h2>
                  <h3 className="orange-text">₦{parseFloat(selectedProduct.price).toLocaleString()}</h3>
                  <button className="orange-checkout-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="product-grid">
              {allFiltered.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
              ))}
            </div>
          )}
        </main>

        <aside className={`right-cart-sidebar ${cartOpen ? "open" : ""}`}>
            <h3>Your Cart</h3>
            <div className="cart-scroll">
               {cart.map((item, i) => (
                 <div key={i} className="cart-row">
                   <span>{item.name} x{item.quantity}</span>
                   <strong>₦{(item.price * item.quantity).toLocaleString()}</strong>
                 </div>
               ))}
            </div>
            <div className="cart-footer">
               <button className="clear-cart-btn-curved" onClick={() => setCart([])}>Clear</button>
               <button className="checkout-btn-curved" onClick={checkoutWithPaystack}>Checkout</button>
            </div>
        </aside>
      </div>
    </div>
  );
}

export default App;