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
      <p className="price-tag">₦{parseFloat(product.price).toLocaleString()}</p>
      <div className="qty-input-row">
        <input type="number" min="1" value={tempQty} onChange={(e) => setTempQty(parseInt(e.target.value) || 1)} />
        <button className="add-btn-orange" onClick={() => onAddToCart(product, tempQty)}>Add</button>
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
  
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null); 
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const totalDue = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    // ... existing Paystack setup using PAYSTACK_PUBLIC_KEY ...
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
      amount: Math.round(totalDue * 100),
      currency: 'NGN',
      callback: () => { setIsProcessing(false); setCart([]); alert("Paid!"); }
    });
    handler.openIframe();
  };

  const filtered = products.filter(p => p.category.toLowerCase() === category.toLowerCase() && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="app-grid-wrapper">
      {/* HEADER: Logo Left, Ad Center, Cart Right */}
      <header className="main-header">
        <div className="logo-area"><h1>1-Stop Shop</h1></div>
        <div className="ad-area"><img src="/static/Shoping-ad.jpg" alt="Promo" /></div>
        <div className="cart-status-area">
            <span className="cart-icon-bold">🛒 {cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
        </div>
      </header>

      {/* NAV: Centered Bold Search with Orange End */}
      <nav className="unified-nav-row">
          <div className="nav-group-left">
            <button onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button onClick={() => setView("tracking")}>Tracking</button>
          </div>

          <div className="search-box-bold">
            <input type="text" placeholder="SEARCH PRODUCTS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button className="search-orange-btn">GO</button>
          </div>

          <div className="nav-group-right">
            <button onClick={() => setView("account")}>Account</button>
            {user ? <span>{user.phone}</span> : <button onClick={() => setView("auth")}>Login</button>}
          </div>
      </nav>

      {/* 3-COLUMN GRID DISPLAY */}
      <div className="layout-body-grid">
        {/* LEFT: Categories */}
        <aside className="left-sidebar">
          <h3>CATEGORIES</h3>
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map(cat => (
            <button key={cat} className={category === cat ? "cat-link active" : "cat-link"} onClick={() => setCategory(cat)}>{cat.toUpperCase()}</button>
          ))}
        </aside>

        {/* CENTER: Main Content (Grid or Review) */}
        <main className="center-content">
          {selectedProduct ? (
            <div className="review-container-fixed">
              <button className="back-btn" onClick={() => {setSelectedProduct(null); setActiveImage(null)}}>← BACK</button>
              <div className="review-split">
                <div className="review-imgs">
                  <img className="main-review-img" src={getImageUrl(activeImage || selectedProduct.image_display || selectedProduct.additional_images?.[0]?.image)} alt="product" />
                  <div className="review-thumbs">
                    {selectedProduct.additional_images?.map((img, i) => (
                      <img key={i} src={getImageUrl(img.image)} onClick={() => setActiveImage(img.image)} className={activeImage === img.image ? "t-active" : ""} alt="thumb" />
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
          ) : (
            <div className="product-grid-main">
              {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
            </div>
          )}
        </main>

        {/* RIGHT: Cart Display */}
        <aside className="right-sidebar">
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
            <p>Total: ₦{totalDue.toLocaleString()}</p>
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