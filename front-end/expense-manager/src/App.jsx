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
      
      <div className="qty-input-container" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input 
          type="number" 
          min="1" 
          value={tempQty} 
          onChange={(e) => setTempQty(parseInt(e.target.value) || 1)}
          style={{ width: '50px', textAlign: 'center' }}
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

  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
          const productData = Array.isArray(data) ? data : (data.results || []);
          setProducts(productData);
      })
      .catch((err) => console.error("Fetch Error:", err));
  }, []);

  // --- HELPERS ---
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

  const clearCart = () => { if (window.confirm("Empty your cart?")) setCart([]); };

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
      } else { alert(data.error || "Failed"); }
    } catch (err) { alert("Connection Error"); }
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    // Paystack Logic...
    const handler = window.PaystackPop.setup({
      key: 'pk_live_YOUR_KEY', 
      email: user ? `${user.phone}@lekki-market.com` : 'guest@lekki.com',
      amount: Math.round(totalDue * 100), 
      currency: 'NGN',
      callback: () => {
        setIsProcessing(false);
        setIsSuccess(true);
        setCart([]);
      },
      onClose: () => setIsProcessing(false)
    });
    handler.openIframe();
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
          <img src="/static/Shoping-ad.jpg" alt="Ad" style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
          🛒 ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button onClick={() => { setView("grid"); setSelectedProduct(null); }}>Home</button></li>
          <li className="nav-auth">
            {user ? <span>Hi, {user.phone}</span> : <button onClick={() => setView("auth")}>Login/Register</button>}
          </li>
        </ul>
      </nav>

      <div className="layout-body" style={{ display: 'flex' }}>
        <aside className="left-sidebar" style={{ width: '200px' }}>
          <h3>Categories</h3>
          <nav className="side-nav">
            {["food", "electronics", "office", "style&fashion", "sex-toys", "rent-house", "car-sales", "kitchen-items"].map((cat) => (
              <button key={cat} className={category === cat ? "active" : ""} onClick={() => { setCategory(cat); setView("grid"); setSelectedProduct(null); }}>
                {cat.toUpperCase()}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: '20px' }}>
          {view === "auth" ? (
            <div className="auth-screen">
               <h2>{authMode === "login" ? "Login" : "Register"}</h2>
               <form onSubmit={handleAuth}>
                  <input type="tel" placeholder="Phone" required onChange={(e) => setAuthData({...authData, phone: e.target.value})} />
                  <input type="password" placeholder="Password" required onChange={(e) => setAuthData({...authData, password: e.target.value})} />
                  <button type="submit">{authMode === "login" ? "Login" : "Register"}</button>
               </form>
               <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} style={{ cursor: 'pointer', color: 'blue' }}>
                 {authMode === "login" ? "Need an account? Register" : "Have an account? Login"}
               </p>
            </div>
          ) : selectedProduct ? (
            <div className="detail-screen">
              <button onClick={() => { setSelectedProduct(null); setActiveImage(null); }}>← Back</button>
              <div className="detail-layout" style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                <div className="image-section" style={{ flex: 1 }}>
                  <div className="main-viewport" style={{ height: '400px', border: '1px solid #ddd', overflow: 'hidden' }}>
                    <img 
                       src={activeImage || selectedProduct.image_display} 
                       alt="Selected" 
                       style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                  <div className="thumb-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <img 
                       src={selectedProduct.image_display} 
                       alt="main-thumb" 
                       onClick={() => setActiveImage(selectedProduct.image_display)}
                       style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #ccc' }}
                    />
                    {/* FIXED: Check for additional_images and use .image_url property */}
                    {selectedProduct.additional_images?.map((img, i) => (
                      <img 
                        key={i} 
                        src={img.image_url} 
                        alt="extra" 
                        onClick={() => setActiveImage(img.image_url)}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #ccc' }}
                      />
                    ))}
                  </div>
                </div>
                <div className="info-section" style={{ flex: 1 }}>
                  <h1>{selectedProduct.name}</h1>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                  <p>{selectedProduct.description}</p>
                  <button className="add-btn" onClick={() => addToCart(selectedProduct)} style={{ padding: '15px 30px' }}>Add to Cart</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {displayedProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />)}
            </div>
          )}
        </main>

        <aside className={`right-sidebar ${cartOpen ? "open" : ""}`} style={{ width: cartOpen ? '300px' : '0', overflow: 'hidden', transition: '0.3s' }}>
          <div style={{ padding: '20px' }}>
            <h3>Your Cart</h3>
            {cart.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                {item.name} (x{item.quantity}) - ₦{(item.price * item.quantity).toLocaleString()}
              </div>
            ))}
            <div className="cart-footer" style={{ marginTop: '20px' }}>
              <p>Total: <strong>₦{totalDue.toLocaleString()}</strong></p>
              <button onClick={checkoutWithPaystack} style={{ width: '100%', padding: '10px', background: 'green', color: 'white' }}>Checkout</button>
              <button onClick={clearCart} style={{ width: '100%', marginTop: '10px' }}>Clear Cart</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;