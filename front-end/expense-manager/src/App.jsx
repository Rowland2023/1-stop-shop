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
  const [authData, setAuthData] = useState({ phone: "", password: "" });
  
  // TRACKING & ACCOUNT STATES
  const [trackingData, setTrackingData] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [userOrders, setUserOrders] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

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

  // Fetch history when entering account view
  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
            const ordersArray = Array.isArray(data) ? data : (data.results || []);
            setUserOrders(ordersArray.sort((a, b) => b.id - a.id));
        });
    }
  }, [view, user]);

  // --- LOGIC HANDLERS ---
  const handleAuth = async () => {
    const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setView("grid");
      } else { alert(data.error || "Action failed"); }
    } catch (err) { alert("Server error"); }
  };

  const handleTrackOrder = async () => {
    if(!trackInput) return alert("Enter Order ID");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${trackInput}/`);
      const data = await res.json();
      if(res.ok) setTrackingData(data);
      else alert("Order not found");
    } catch (err) { alert("Network error"); }
  };

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
    // Paystack logic here...
    setIsProcessing(false);
  };

  const allFiltered = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = userOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(userOrders.length / ordersPerPage);

  return (
    <div className="app-grid-wrapper">
      <div className="top-ad-banner">
        <img src="/static/Shoping-ad.jpg" alt="Top Ad" />
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
            <button className="search-pill-btn" onClick={() => setView("grid")}>GO</button>
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
          <button className="nav-item" onClick={() => {setView("tracking"); setTrackingData(null)}}>Tracking</button>
          <button className="nav-item" onClick={() => setView("account")}>Account</button>
          {user ? (
            <span className="user-text">Hi, {user.phone}</span>
          ) : (
            <>
              <button className="nav-item" onClick={() => {setAuthMode("login"); setView("auth")}}>Login</button>
              <button className="nav-item join-btn" onClick={() => {setAuthMode("register"); setView("auth")}}>Join Now</button>
            </>
          )}
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
          {view === "auth" && (
            <div className="auth-form-box">
              <h2>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
              <input type="text" placeholder="Phone Number" className="bold-input" onChange={(e)=>setAuthData({...authData, phone: e.target.value})} />
              <input type="password" placeholder="Password" className="bold-input" onChange={(e)=>setAuthData({...authData, password: e.target.value})} />
              <button className="orange-checkout-btn" onClick={handleAuth}>
                {authMode === "login" ? "Login" : "Register"}
              </button>
              <p onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} style={{cursor:'pointer', marginTop:'15px'}}>
                {authMode === "login" ? "No account? Join here" : "Already a member? Login"}
              </p>
            </div>
          )}

          {view === "tracking" && (
            <div className="auth-form-box">
              <h2>📦 Track Shipment</h2>
              <input type="text" placeholder="Enter Order ID" className="bold-input" value={trackInput} onChange={(e)=>setTrackInput(e.target.value)} />
              <button className="orange-checkout-btn" onClick={handleTrackOrder}>Check Status</button>
              {trackingData && (
                 <div className="tracking-timeline">
                    <p><strong>Order Status:</strong> {trackingData.status}</p>
                    <p>Order ID: #{trackingData.id}</p>
                 </div>
              )}
            </div>
          )}

          {view === "account" && (
            <div className="auth-form-box">
              <h2>Order History</h2>
              {!user ? <p>Please Login to see history</p> : (
                <div className="history-list">
                  {currentOrders.map(o => (
                    <div key={o.id} className="history-item">
                       <span>#{o.id} - ₦{parseFloat(o.total_price || o.total || 0).toLocaleString()}</span>
                       <small>{o.status}</small>
                    </div>
                  ))}
                  <div className="pagination">
                     <button disabled={currentPage === 1} onClick={()=>setCurrentPage(p=>p-1)}>Prev</button>
                     <span>{currentPage}/{totalPages || 1}</span>
                     <button disabled={currentPage >= totalPages} onClick={()=>setCurrentPage(p=>p+1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "grid" && (
            selectedProduct ? (
              <div className="product-review-container">
                <button className="back-link" onClick={() => setSelectedProduct(null)}>← Back</button>
                <div className="review-flex">
                  <div className="review-images">
                    <img src={getImageUrl(selectedProduct.image_display || selectedProduct.additional_images?.[0]?.image)} alt="main" />
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
                {allFiltered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />) }
              </div>
            )
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
               <p>Total: ₦{cart.reduce((s, i)=> s + (i.price * i.quantity), 0).toLocaleString()}</p>
               <button className="clear-cart-btn-curved" onClick={() => setCart([])}>Clear</button>
               <button className="checkout-btn-curved" onClick={checkoutWithPaystack} disabled={isProcessing}>Pay Now</button>
            </div>
        </aside>
      </div>
    </div>
  );
}

export default App;