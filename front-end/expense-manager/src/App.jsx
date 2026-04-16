import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
// Corrected to allow database paths to append naturally
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

const getImageUrl = (path) => {
  if (!path) return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  return `${CLOUDINARY_BASE}${path}`;
};

// --- SUB-COMPONENT: PRODUCT CARD ---
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
      <p>₦{parseFloat(product.price).toLocaleString()}</p>
      
      <div className="qty-input-container" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input 
          type="number" min="1" value={tempQty} 
          onChange={(e) => setTempQty(parseInt(e.target.value) || 1)}
          style={{ width: '50px', padding: '5px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)} style={{ flex: 1 }}>
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
  const [trackingData, setTrackingData] = useState(null);
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, searchTerm]);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          let ordersArray = Array.isArray(data) ? data : (data.results || []);
          setUserOrders(ordersArray.sort((a, b) => b.id - a.id));
        })
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [view, user]);

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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    } catch (err) { alert("Backend connection failed."); }
  };

  const verifyPaymentOnBackend = async (reference, djangoOrderId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, order_id: djangoOrderId }),
      });
      if (response.ok) {
        setIsSuccess(true);
        setCart([]);
        localStorage.removeItem("shop_cart_data");
        window.open(`${BASE_URL}/api/invoices/generate?order_id=${djangoOrderId}`, "_blank");
      }
    } catch (err) { console.error("Verification error", err); }
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    try {
      const response = await fetch(`${BASE_URL}/api/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: parseInt(item.id), quantity: item.quantity })),
          total: totalDue.toFixed(2),
          userId: user ? user.id : "guest_001",
        }),
      });
      const orderData = await response.json();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, 
        email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
        amount: Math.round(totalDue * 100), 
        currency: 'NGN',
        onClose: () => setIsProcessing(false),
        callback: (res) => {
          setIsProcessing(false);
          verifyPaymentOnBackend(res.reference, orderData.id);
        }
      });
      handler.openIframe();
    } catch (err) {
      alert("Checkout failed.");
      setIsProcessing(false);
    }
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
        <div className="header-top">
          <h1>Mebuy</h1>
          <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
            🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
          </button>
        </div>
        <div className="header-adv-frame">
          <img src="/static/Shoping-ad.jpg" alt="Advertisement" className="adv-banner" />
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
          <ul className="nav-links">
            <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); setIsSuccess(false); setActiveImage(null); }}>Home</button></li>
            <li><button className="nav-btn-link" onClick={() => { setView("tracking"); setTrackingData(null); }}>Track Order</button></li>
          </ul>

          <div className="nav-search-center">
            <input 
              type="text" 
              className="bold-search-input"
              placeholder="SEARCH PRODUCTS..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <ul className="nav-links">
            <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
            <li className="nav-auth">
              {user ? (
                <div className="user-badge"><span className="user-welcome">Hi, <strong>{user.phone}</strong></span></div>
              ) : (
                <button className="register-link" onClick={() => { setView("auth"); setAuthMode("register"); }}>Register / Login</button>
              )}
            </li>
          </ul>
        </div>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} 
              onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); setActiveImage(null); }}>
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
                  <button type="submit" className="auth-submit-btn orange-theme">{authMode === "login" ? "Login" : "Register"}</button>
               </form>
               <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                 {authMode === "login" ? "New here? Create account" : "Have an account? Login"}
               </p>
             </div>
          </div>
        ) : view === "account" ? (
          <div className="view-container account-screen">
            <h1>Order History</h1>
            <div className="order-history">
              {userOrders.length > 0 ? userOrders.map((order) => (
                <div key={order.id} className="history-item">
                  <strong>Order #{order.id}</strong>
                  <span>₦{parseFloat(order.total_price || 0).toLocaleString()}</span>
                  <button className="pdf-btn" onClick={() => window.open(`${BASE_URL}/api/invoices/generate?order_id=${order.id}`, "_blank")}>PDF</button>
                </div>
              )) : <p>No orders yet.</p>}
            </div>
          </div>
        ) : selectedProduct ? (
          <div className="view-container detail-screen">
            <button className="back-btn" onClick={() => { setSelectedProduct(null); setActiveImage(null); }}>← Back</button>
            <div className="detail-layout">
              <div className="image-gallery">
                <img className="main-detail-img" src={getImageUrl(activeImage || selectedProduct.image_display || selectedProduct.additional_images?.[0]?.image)} alt={selectedProduct.name} />
                <div className="thumb-row">
                    {selectedProduct.additional_images?.map((imgObj, idx) => (
                        <img key={idx} src={getImageUrl(imgObj.image)} onClick={() => setActiveImage(imgObj.image)} className={activeImage === imgObj.image ? "thumb active" : "thumb"} />
                    ))}
                </div>
              </div>
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <h2 className="detail-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</h2>
                <p>{selectedProduct.description || "Quality item from our 1-Stop Shop."}</p>
                <button className="add-btn large orange-theme" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
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
            {visibleCount < allFiltered.length && (
              <div className="see-more-container">
                <button className="see-more-btn" onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>Load More</button>
              </div>
            )}
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item-row">
                <span>{item.name} (x{item.quantity})</span>
                <button className="remove-item" onClick={() => setCart(cart.filter((_, i) => i !== index))}>×</button>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p className="total-amount">Total: ₦{totalDue.toLocaleString()}</p>
            <div className="cart-actions">
                <button className="clear-cart-btn" onClick={clearCart}>Empty Cart</button>
                <button className="checkout-btn orange-bold" disabled={isProcessing} onClick={checkoutWithPaystack}>
                    {isProcessing ? "Wait..." : "CHECKOUT NOW"}
                </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;