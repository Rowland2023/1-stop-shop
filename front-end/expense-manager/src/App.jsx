import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = window.location.origin; 

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

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/`)
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
      fetch(`${API_BASE_URL}/api/orders/?userId=${user.id}`)
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

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/`, {
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
        key: 'pk_live_YOUR_KEY', 
        email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
        amount: Math.round(totalDue * 100), 
        currency: 'NGN',
        callback: (res) => {
          setIsProcessing(false);
          setIsSuccess(true);
          setCart([]);
        }
      });
      handler.openIframe();
    } catch (err) { setIsProcessing(false); }
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
        <div className="header-adv-frame"><img src="/static/Shoping-ad.jpg" alt="Ad" /></div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
          🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button onClick={() => { setView("grid"); setSelectedProduct(null); }}>Home</button></li>
          <li><button onClick={() => setView("tracking")}>Track Order</button></li>
          <li><button onClick={() => setView("account")}>Account</button></li>
          <li className="nav-auth">
            {user ? <span>Hi, {user.phone}</span> : <button onClick={() => setView("auth")}>Login</button>}
          </li>
        </ul>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((cat) => (
            <button key={cat} className={category === cat ? "active" : ""} onClick={() => { setCategory(cat); setView("grid"); setSelectedProduct(null); }}>
              {cat.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "auth" ? (
          <div className="auth-screen">
             <form onSubmit={handleAuth}>
                <input type="tel" placeholder="Phone" value={authData.phone} onChange={(e) => setAuthData({...authData, phone: e.target.value})} />
                <input type="password" placeholder="Password" value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})} />
                <button type="submit">Submit</button>
             </form>
          </div>
        ) : selectedProduct ? (
          <div className="detail-screen">
            <button className="back-btn" onClick={() => { setSelectedProduct(null); setActiveImage(null); }}>← Back</button>
            <div className="detail-layout">
              {/* Image Section - Fixed size prevents layout shift */}
              <div className="detail-image-section">
                <div className="main-image-viewport">
                  <img src={activeImage || selectedProduct.image_display} alt={selectedProduct.name} />
                </div>
                <div className="thumbnail-grid">
                  <img src={selectedProduct.image_display} alt="Thumb" onClick={() => setActiveImage(selectedProduct.image_display)} />
                  {selectedProduct.additional_images?.map((img, i) => (
                    <img key={i} src={img.image_url} alt="Extra" onClick={() => setActiveImage(img.image_url)} />
                  ))}
                </div>
              </div>
              {/* Info Section */}
              <div className="detail-info-section">
                <h1>{selectedProduct.name}</h1>
                <p className="detail-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                <div className="description-box">
                    <h3>Description</h3>
                    <p>{selectedProduct.description || "No description available."}</p>
                </div>
                <button className="add-btn large" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          {cart.map((item, i) => (
            <div key={i} className="cart-row">
              <span>{item.name} x{item.quantity}</span>
              <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <div className="cart-footer">
            <p>Total: ₦{totalDue.toLocaleString()}</p>
            <button className="checkout-btn" onClick={checkoutWithPaystack}>Pay Now</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;