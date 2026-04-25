import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

// Helper function updated for safety
// Improved helper to handle both Cloudinary strings and full URLs
const getImageUrl = (input) => {
  if (!input) return "/static/placeholder.png";
  
  // If it's the object structure from your serializer
  const path = (typeof input === 'object' && input !== null) ? input.image : input;
  
  if (typeof path !== 'string') return "/static/placeholder.png";
  if (path.startsWith("http")) return path;
  
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${CLOUDINARY_BASE}${cleanPath}`;
};

function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  
  // Safe Image Logic: Check main_image_url OR grab the first from gallery
  const gallery = product.additional_images || [];
  const primaryImg = product.main_image_url || (gallery.length > 0 ? gallery[0].image : null);
  const displayImage = getImageUrl(primaryImg);

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)} style={{ cursor: 'pointer' }}>
        <img 
          src={displayImage} 
          alt={product.name} 
          className="zoom-effect" 
          onError={(e) => { e.target.src = "/static/placeholder.png"; }} 
        />
      </div>
      <h3>{product.name}</h3>
      <p className="price-text">₦{parseFloat(product.price || 0).toLocaleString()}</p>
      <div className="qty-row">
        <input type="number" min="1" value={tempQty} onChange={(e) => setTempQty(parseInt(e.target.value) || 1)} />
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>Add to Cart</button>
      </div>
    </div>
  );
}

// ... rest of your App component remains the same
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

  // --- VIEW & UI STATES ---
  const [view, setView] = useState("grid"); // 'grid', 'tracking', 'account', 'auth'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMainImage, setActiveMainImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- AUTH & USER STATES ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [authData, setAuthData] = useState({ phone: "", password: "", first_name: "" });
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // --- TRACKING & HISTORY STATES ---
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // --- API: AUTHENTICATION ---
  function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
  const handleAuth = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  const endpoint = authMode === "login" ? "/api/login/" : "/api/register/";

  // Construct payload explicitly
  const payload = {
    first_name: authData.first_name,
    phone: authData.phone,
    password: authData.password
  };

  console.log("Sending Payload:", JSON.stringify(payload)); // Check browser console

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") 
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    
    const data = await res.json();
    if (res.ok) {
    // Since the API returns the user fields directly, we use 'data'
    setUser(data); 
    
    // Use the first_name from the root of 'data'
    const name = data.first_name || "there";
    
    //setWelcomeMessage(`Hi, ${name}! Welcome back.`);
    //setTimeout(() => setWelcomeMessage(""), 5000);
    
    setView("grid");
    } else {
      console.error("Backend Error:", data);
      alert(data.error || "Authentication failed");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("Connection error. Check your network or server status.");
  }finally {
    setIsSubmitting(false); // <--- Add this
  }
};
  // --- 1. PERSISTENCE & DATA FETCHING ---
  // Add this to your main App component or a global auth provider
const [csrfReady, setCsrfReady] = useState(false);

useEffect(() => {
  const seedCSRF = async () => {
    await fetch(`${BASE_URL}/api/get-csrf-token/`);
    setCsrfReady(true);
  };
  seedCSRF();
}, []);
  // Update activeMainImage whenever selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setActiveMainImage(selectedProduct.main_image_url || selectedProduct.additional_images?.[0]?.image);
    }
  }, [selectedProduct]);

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
  fetch(`${BASE_URL}/api/products/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Required to send cookies (session/CSRF) to the backend
    credentials: "include" 
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      const productData = Array.isArray(data) ? data : (data.results || []);
      setProducts(productData);
    })
    .catch((err) => console.error("Fetch error:", err));
}, []);

  useEffect(() => {
    if (view === "account" && user) {
      fetch(`${BASE_URL}/api/orders/`)
        .then((res) => res.json())
        .then((data) => {
          const ordersArray = Array.isArray(data) ? data : (data.results || []);
          setUserOrders(ordersArray);
        })
        .catch((err) => console.error("Order fetch error:", err));
    }
  }, [view, user]);

  // --- 2. LOGIC HANDLERS ---
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
    if (!trackInput) return alert("Enter an Order ID");
    try {
      const response = await fetch(`${BASE_URL}/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) setTrackingData(data);
      else alert("Order not found.");
    } catch (err) { alert("Connection failed."); }
  };

  const checkoutWithPaystack = async () => {
  if (cart.length === 0) return alert("Cart is empty!");

  setIsProcessing(true); // Start the loading state
  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // Use a promise-based approach to ensure we catch errors
  try {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user ? `${user.phone}@mebuy.com` : 'guest@mebuy.com',
      amount: Math.round(totalAmount * 100),
      currency: 'NGN',
      callback: (response) => {
        setIsProcessing(false);
        setCart([]);
        alert("Payment Successful! Reference: " + response.reference);
      },
      onClose: () => {
        setIsProcessing(false); // Reset when user closes modal
      }
    });
    
    handler.openIframe();
  } catch (error) {
    console.error("Paystack Error:", error);
    setIsProcessing(false); // Ensure we stop processing on error
    alert("Payment gateway failed to initialize. Please try again.");
  }
};
  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      {/* HEADER */}
      <header className="brand-header">
  <div className="header-inner" style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%',
    padding: '10px 20px' 
  }}>
    
    {/* 1. Logo */}
    <h1 onClick={() => setView("grid")} className="logo-text" style={{ cursor: 'pointer', margin: 0 }}>
      MeBuy
    </h1>

    {/* 2. User Greeting + Cart */}
    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      
      {/* Dynamic User Greeting */}
      {user && (
        <span className="user-tag" style={{ 
    fontWeight: 'bold', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light semi-transparent bubble
    padding: '5px 12px',
    borderRadius: '20px',
    color: '#ffffff', // White text
    textShadow: '0px 1px 3px rgba(0,0,0,0.5)' // Subtle shadow for readability
  }}>
    Hi, {user.first_name}! 👤
  </span>
      )}

      {/* Cart Button */}
      <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
        🛒 {cart.reduce((acc, item) => acc + item.quantity, 0)} | 
        <span> ₦{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
      </button>
    </div>
  </div>

</header>
      {/* NAVIGATION */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-group left">
            <button className="nav-link-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
            <button className="nav-link-item" onClick={() => setView("tracking")}>Tracking</button>
          </div>
          <div className="central-search-wrapper">
            <div className="search-pill">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setView("grid");}} />
              <button className="orange-go-btn" onClick={() => setView("grid")}>GO</button>
            </div>
          </div>
          <div className="nav-group right">
            <button className="nav-link-item" onClick={() => setView("account")}>Account</button>
            {!user ? (
              <>
                <button className="nav-link-item auth-highlight" onClick={() => {setView("auth"); setAuthMode("register")}}>Join</button>
                <button className="nav-link-item" onClick={() => {setView("auth"); setAuthMode("login")}}>Login</button>
              </>
            ) : <span className="user-tag">👤 {user.phone}</span>}
          </div>
        </div>
      </nav>

      {/* SIDEBARS & MAIN - Ensure these are direct children of app-grid-wrapper */}
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
  {/* AUTH VIEW */}
{view === "auth" && (
  <div className="view-container auth-screen" style={{ padding: '20px' }}>
    <h1>{authMode === "login" ? "Login" : "Register"}</h1>
    
    <input 
      placeholder="Phone Number" 
      value={authData.phone} 
      onChange={e => setAuthData({...authData, phone: e.target.value})} 
    />
    
    {authMode === "register" && (
      <input 
        placeholder="First Name" 
        value={authData.first_name} 
        onChange={e => setAuthData({...authData, first_name: e.target.value})} 
      />
    )}
    
    <input 
      type="password" 
      placeholder="Password" 
      value={authData.password} 
      onChange={e => setAuthData({...authData, password: e.target.value})} 
    />
    
    {/* REPLACE YOUR OLD BUTTON WITH THIS ONE: */}
    <button 
      className="orange-curved-btn" 
      disabled={!csrfReady} 
      onClick={handleAuth}
    >
      {csrfReady ? (authMode === "login" ? "Login" : "Submit") : "Connecting..."}
    </button>
  </div>
)}
  {/* TRACKING VIEW */}
  {view === "tracking" && (
    <div className="view-container tracking-screen">
      <h1>📦 Track Your Shipment</h1>
      <input type="text" placeholder="Order ID" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
      <button className="track-btn-action" onClick={handleTrackOrder}>Check Status</button>
      {trackingData && <div className="tracking-timeline">Status: {trackingData.status}</div>}
    </div>
  )}

  {/* ACCOUNT VIEW */}
  {view === "account" && (
    <div className="view-container account-screen">
      <h1>Order History</h1>
      {userOrders.map(o => <div key={o.id}>{o.id} - ₦{o.total_price}</div>)}
    </div>
  )}

  {/* PRODUCT GRID & DETAIL VIEW (Only rendered when view is 'grid') */}
  {view === "grid" && (
    <>
      {selectedProduct ? (
        <div className="detail-screen" style={{ padding: '20px' }}>
          <button onClick={() => setSelectedProduct(null)}>← Back to Products</button>
          <h1>{selectedProduct.name}</h1>
          <div className="product-gallery">
            <img 
              src={getImageUrl(activeMainImage)} 
              style={{ width: '100%', maxWidth: '400px', objectFit: 'contain' }} 
            />
            <div className="thumb-strip" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {selectedProduct.additional_images?.map((imgObj, idx) => (
                <img 
                  key={idx} 
                  src={getImageUrl(imgObj.image)} 
                  onClick={() => setActiveMainImage(imgObj.image)}
                  style={{ width: '80px', height: '80px', cursor: 'pointer', objectFit: 'cover', border: activeMainImage === imgObj.image ? '2px solid orange' : 'none' }}
                />
              ))}
            </div>
          </div>
          <div className="product-description">
            <h3>Product Details</h3>
            <p>{selectedProduct.description || "No description provided by the merchant."}</p>
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
          ))}
        </div>
      )}
    </>
  )}
</main>

      {/* RIGHT SIDEBAR - Updated with Orange Curved Buttons */}
      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container" style={{ padding: '20px' }}>
          <h3>Your Cart</h3>
          <div className="cart-items-list" style={{ marginBottom: '20px' }}>
            {cart.map((item, index) => (
              <div key={index} className="cart-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>{item.name} (x{item.quantity})</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="total-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <p>Subtotal: ₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</p>
            <p><strong>Total: ₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</strong></p>


            {/* The Buttons requested */}
            <div className="cart-action-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button className="checkout-btn-curved" disabled={isProcessing} onClick={checkoutWithPaystack}>
                {isProcessing ? "Processing..." : "Checkout Now"}
              </button>
              <button className="clear-cart-btn-curved" onClick={() => setCart([])}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
export default App;
