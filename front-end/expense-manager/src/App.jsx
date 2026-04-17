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
        <button className="add-btn" onClick={() => onAddToCart(product, tempQty)}>Add to Cart</button>
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  

  // VIEW STATES
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  // TRACKING & ACCOUNT STATES
  const [trackingData, setTrackingData] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [userOrders, setUserOrders] = useState([]); 
  
  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // --- 1. FETCH DATA ---

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/products/")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    if (view === "account") {
      setCurrentPage(1);
      fetch("http://127.0.0.1:8000/api/orders/")
        .then((res) => res.json())
        .then((data) => {
          let ordersArray = [];
          if (Array.isArray(data)) { ordersArray = data; } 
          else if (data.results) { ordersArray = data.results; } 
          else if (data.orders) { ordersArray = data.orders; }

          const myOrders = ordersArray.filter(order => 
            order.userId === "001" || order.user === 1 || order.user_id === 1 || !order.user || order.id === 57
          );
          setUserOrders(myOrders.sort((a, b) => b.id - a.id));
        })
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [view]);

  // --- 2. PAYMENT & CHECKOUT LOGIC ---

  const verifyPaymentOnBackend = async (reference, djangoOrderId) => {
    try {
      const response = await fetch("http://localhost:8001/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, order_id: djangoOrderId }),
      });
      
      if (response.ok) {
        setIsSuccess(true);
        setCart([]);
        setCartOpen(false);
        window.open(`http://localhost:8001/api/invoices/generate?order_id=${djangoOrderId}`, "_blank");
      }
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!window.PaystackPop) return alert("Paystack SDK not loaded. Check index.html.");
    
    setIsProcessing(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: parseInt(item.id), quantity: 1 })),
          total: totalDue.toFixed(2),
          userId: "001",
        }),
      });

      const orderData = await response.json();
      if (!response.ok) throw new Error("Server failed to create order");

      setOrderId(orderData.id);

      const handler = window.PaystackPop.setup({
        key: 'pk_live_21207f639d252b46e35e171dca6b075f79cba433', 
        email: 'innovator@lekki.com',
        amount: Math.round(totalDue * 100), 
        currency: 'NGN',
        // ADDED DESCRIPTION LABEL
        label: `Lagos Tech Hub - Order #${orderData.id}`,
        ref: 'LTH-' + orderData.id + '-' + Date.now(),
        metadata: {
          order_id: orderData.id
        },
        onClose: () => setIsProcessing(false),
        callback: (response) => {
          setIsProcessing(false);
          verifyPaymentOnBackend(response.reference, orderData.id);
        }
      });
      handler.openIframe();

    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // --- 3. FILTER & CART LOGIC ---

  const subTotalValue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const shippingFee = cart.length > 0 ? 1500 : 0;
  const totalDue = subTotalValue + shippingFee;

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = userOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(userOrders.length / ordersPerPage);

  // IMPROVED: Case-insensitive category filtering
  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => setCart([...cart, product]);
  
  const clearCart = () => {
    if (cart.length > 0 && window.confirm("Are you sure you want to empty your cart?")) {
      setCart([]);
    }
  };

  const handleTrackOrder = async () => {
    if (!trackInput) return alert("Please enter an Order ID");
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/orders/${trackInput}/`);
      const data = await response.json();
      if (response.ok) { setTrackingData(data); } 
      else { alert("Order not found."); setTrackingData(null); }
    } catch (err) { alert("Connection failed."); }
  };

  return (
    <div className="app-grid-wrapper">
      <header>
        <h1>MeBuy</h1>
        
        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>🛒 Cart ({cart.length})</button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); setIsSuccess(false); }}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => { setView("tracking"); setTrackingData(null); }}>Track Order</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
          <li className="nav-auth"><button className="register-link">Register</button></li>
        </ul>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {/* UPDATED: Clean lowercase keys with pretty labels */}
          {["food", "electronics", "office", "clothing", "sex-toys","rent-house","car-sales","kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} 
              onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
              {catId.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "tracking" ? (
          <div className="view-container tracking-screen">
            <h1>📦 Track Your Shipment</h1>
            <div className="track-search-box">
              <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
              <button className="track-btn-action" onClick={handleTrackOrder}>Check Status</button>
            </div>
            {trackingData && (
              <div className="tracking-timeline">
                <div className="step completed"><div className="bullet"></div><div className="info"><strong>Order Confirmed</strong><span>#{trackingData.id}</span></div></div>
                <div className="step active"><div className="bullet"></div><div className="info"><strong>Status: {trackingData.status}</strong></div></div>
                <div className="step"><div className="bullet"></div><div className="info"><strong>In Transit</strong></div></div>
              </div>
            )}
            <button className="back-btn" onClick={() => setView("grid")}>Back</button>
          </div>
        ) : view === "account" ? (
          <div className="view-container account-screen">
            <h1>Order History</h1>
            <div className="order-history">
              {currentOrders.map((order) => (
                <div key={order.id} className="history-item">
                  <div className="order-meta">
                    <strong>Order #{order.id}</strong>
                    <span>₦{parseFloat(order.total_price || order.total || 0).toLocaleString()}</span>
                  </div>
                  <button className="re-download-btn" onClick={() => window.open(`http://localhost:8001/api/invoices/generate?order_id=${order.id}`, "_blank")}>
                    Download PDF
                  </button>
                </div>
              ))}
              <nav className="unified-nav">
          <button className="nav-item" onClick={() => {setView("grid"); setSelectedProduct(null)}}>Home</button>
          <button className="nav-item" onClick={() => setView("tracking")}>Tracking</button>
          
          <div className="search-container-bold">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button className="search-end-orange">GO</button>
          </div>

          <button className="nav-item" onClick={() => setView("account")}>Account</button>
          {user ? <span className="user-text">Hi, {user.phone}</span> : <button className="nav-item" onClick={() => setView("auth")}>Login</button>}
      </nav>
              <div className="pagination-controls">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span>{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="view-container success-screen">
            <h2>✅ Payment Confirmed!</h2>
            <p>Order ID: #{orderId}</p>
            <button className="back-btn" onClick={() => setIsSuccess(false)}>Continue Shopping</button>
          </div>
        ) : selectedProduct ? (
          <div className="view-container detail-screen">
            <button className="back-link" onClick={() => setSelectedProduct(null)}>← Back</button>
            <div className="detail-layout">
              <img src={`http://127.0.0.1:8000/static/${selectedProduct.image_path}`} alt={selectedProduct.name} />
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <p className="detail-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                <button className="add-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="img-frame" onClick={() => setSelectedProduct(p)}>
                  <img src={`http://127.0.0.1:8000/static/${p.image_path}`} alt={p.name} className="zoom-effect" />
                </div>
                <h3>{p.name}</h3>
                <p>₦{parseFloat(p.price).toLocaleString()}</p>
                <button className="add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <span>₦{parseFloat(item.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p>Total: <strong>₦{totalDue.toLocaleString()}</strong></p>
            <div className="payment-vendors">
              <button className="vendor-btn paystack" disabled={isProcessing} onClick={checkoutWithPaystack}>
                {isProcessing ? "Connecting..." : "Pay with Paystack"}
              </button>
              <button className="clear-cart-btn" onClick={clearCart} disabled={isProcessing || cart.length === 0}>
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

