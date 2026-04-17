import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("food");
  const [cart, setCart] = useState([]);
  const [cartOpen, setOrderOpen] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);

  // VIEW STATES
  const [view, setView] = useState("grid"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderId, setOrderId] = useState("");

  // AUTH & REGISTRATION STATES
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regData, setRegData] = useState({ username: "", email: "", password: "" });

  // TRACKING & ACCOUNT STATES
  const [userOrders, setUserOrders] = useState([]); 
  const [trackInput, setTrackInput] = useState("");

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/products/")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    if (view === "account") {
      fetch("http://127.0.0.1:8000/api/orders/")
        .then((res) => res.json())
        .then((data) => {
          let ordersArray = Array.isArray(data) ? data : (data.results || []);
          const filtered = ordersArray.filter(o => o.userId === regData.username);
          setUserOrders(filtered.sort((a, b) => b.id - a.id));
        })
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [view, regData.username]);

  // --- 2. BACKEND HANDLERS ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      if (response.ok) {
        setIsLoggedIn(true);
        alert(`Welcome ${regData.username}! Your 10% End of Year Bonus is now active!`);
        setView("grid");
      } else {
        const error = await response.json();
        alert(error.error || "Registration failed.");
      }
    } catch (err) {
      alert("Cannot connect to Admin Backend.");
    } finally {
      setIsRegLoading(false);
    }
  };

  const checkoutWithPaystack = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");

    // 10% BONUS ALERT FOR GUESTS
    if (!isLoggedIn) {
        alert("Hello user, register for 10% Bonuses on Total Purchase and Gift Items!");
    }

    setIsProcessing(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: parseInt(item.id), quantity: 1 })),
          total: totalDue.toFixed(2),
          userId: isLoggedIn ? regData.username : "guest_001",
        }),
      });
      const orderData = await response.json();
      if (response.ok) {
        setOrderId(orderData.id);
        alert("Order placed successfully! Check 'Account' for history.");
        setCart([]); 
      }
    } catch (err) {
      alert("Checkout failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. UTILS & BONUS CALCULATIONS ---
  const subTotalValue = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  
  // Apply 10% discount if logged in
  const bonusDiscount = isLoggedIn ? (subTotalValue * 0.10) : 0;
  const deliveryFee = cart.length > 0 ? 1500 : 0;
  const totalDue = (subTotalValue - bonusDiscount) + deliveryFee;

  const filteredProducts = products.filter((p) => 
    p.category.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header>
        <h1>1-Stop Shop</h1>
        <div className="search-bar">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="cart-toggle" onClick={() => setOrderOpen(!cartOpen)}>🛒 Cart ({cart.length})</button>
      </header>

      <nav className="main-nav">
        <ul>
          <li><button className="nav-btn-link" onClick={() => { setView("grid"); setSelectedProduct(null); }}>Home</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("tracking")}>Track Order</button></li>
          <li><button className="nav-btn-link" onClick={() => setView("account")}>Account</button></li>
          <li className="nav-auth" style={{ marginLeft: 'auto' }}>
            <button className="register-link" onClick={() => setView("register")}>
              {isLoggedIn ? `Hi, ${regData.username}` : "Register"}
            </button>
          </li>
        </ul>
      </nav>

      <aside className="left-sidebar">
        <h3>Categories</h3>
        <nav className="side-nav">
          {["food", "electronics", "office", "clothing", "sex-toys","rent-house","car-sales","kitchen-items"].map((catId) => (
            <button key={catId} className={category === catId ? "active" : ""} 
              onClick={() => { setCategory(catId); setView("grid"); setSelectedProduct(null); }}>
              {catId.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {view === "register" ? (
          <div className="view-container">
            <h1>Join Lagos Tech Hub</h1>
            <p>Register now to claim your 10% End of Year Bonus!</p>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
              <input className="track-input" type="text" placeholder="Username" required onChange={e => setRegData({...regData, username: e.target.value})} />
              <input className="track-input" type="email" placeholder="Email" required onChange={e => setRegData({...regData, email: e.target.value})} />
              <input className="track-input" type="password" placeholder="Password" required onChange={e => setRegData({...regData, password: e.target.value})} />
              <button type="submit" className="add-btn" disabled={isRegLoading}>Confirm & Get Bonus</button>
              <button type="button" className="back-link" onClick={() => setView("grid")}>Cancel</button>
            </form>
          </div>
        ) : 
        
        view === "tracking" ? (
          <div className="view-container tracking-screen">
            <h1>📦 Track Your Shipment</h1>
            <div className="track-search-box">
              <input type="text" placeholder="Enter Order ID" className="track-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} />
              <button className="track-btn-action">Check Status</button>
            </div>
            <button className="back-btn" onClick={() => setView("grid")}>Back</button>
          </div>
        ) : 

        view === "account" ? (
          <div className="view-container">
            <h1>Your Order History</h1>
            {userOrders.length > 0 ? (
              <div className="order-history">
                {userOrders.map((order) => (
                  <div key={order.id} className="history-item" style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="order-meta">
                      <strong>Order #{order.id}</strong><br/>
                      <span>Total: ₦{parseFloat(order.total).toLocaleString()}</span>
                    </div>
                    <button className="re-download-btn">View Invoice</button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No orders found. Start shopping to see your history!</p>
            )}
            <button className="back-btn" style={{marginTop: '20px'}} onClick={() => setView("grid")}>Back to Shop</button>
          </div>
        ) :

        selectedProduct ? (
          <div className="view-container detail-screen">
            <button className="back-link" onClick={() => setSelectedProduct(null)}>← Back to Products</button>
            <div className="detail-layout">
              <img src={`http://127.0.0.1:8000/static/${selectedProduct.image_path}`} alt={selectedProduct.name} />
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <p className="detail-price">₦{parseFloat(selectedProduct.price).toLocaleString()}</p>
                <div className="bonanza-box" style={{ background: '#fff5f5', borderLeft: '4px solid #e74c3c', padding: '10px', margin: '15px 0' }}>
                   <p style={{ color: '#e74c3c', margin: 0, fontWeight: 'bold' }}>🎄 10% End of Year Bonus Available!</p>
                </div>
                <button className="add-btn" onClick={() => setCart([...cart, selectedProduct])}>Add to Cart</button>
              </div>
            </div>
          </div>
        ) : 

        (
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="img-frame" onClick={() => setSelectedProduct(p)}>
                  <img src={`http://127.0.0.1:8000/static/${p.image_path}`} alt={p.name} className="zoom-effect" />
                </div>
                <h3>{p.name}</h3>
                <p>₦{parseFloat(p.price).toLocaleString()}</p>
                <button className="add-btn" onClick={() => setCart([...cart, p])}>Add to Cart</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className={`right-sidebar ${cartOpen ? "open" : ""}`}>
        <div className="cart-container">
          <h3>Your Cart</h3>
          {cart.map((item, index) => (
            <div key={index} className="cart-item" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span>{item.name}</span>
              <span>₦{parseFloat(item.price).toLocaleString()}</span>
            </div>
          ))}
          
          <div className="total-section">
            {/* BONUS FEEDBACK AREA */}
            {isLoggedIn && cart.length > 0 && (
                <p style={{ color: '#27ae60', fontSize: '0.9rem', marginBottom: '10px' }}>
                    ✨ 10% Year-End Discount: -₦{bonusDiscount.toLocaleString()}
                </p>
            )}

            {!isLoggedIn && cart.length > 0 && (
              <div className="bonanza-alert" style={{ border: '1px dashed #f39c12', padding: '10px', marginBottom: '10px' }}>
                <small><strong>🎁 Bonus Hint:</strong> Register to save 10% on this order!</small>
                <button onClick={() => { setView("register"); setOrderOpen(false); }} className="nav-btn-link" style={{fontSize: '0.8rem', padding: 0}}>Claim Now</button>
              </div>
            )}
            
            <p>Total: <strong>₦{totalDue.toLocaleString()}</strong></p>
            
            {/* PAY BUTTON */}
            <button className="add-btn" style={{ backgroundColor: '#09a5db' }} onClick={checkoutWithPaystack}>
              {isProcessing ? "Processing..." : "Pay with Paystack"}
            </button>

            {/* CLEAR CART BUTTON */}
            {cart.length > 0 && (
              <button 
                className="clear-cart-action" 
                style={{ 
                    width: '100%', 
                    marginTop: '15px', 
                    color: '#95a5a6', 
                    fontSize: '0.8rem', 
                    textAlign: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }} 
                onClick={() => {
                    if(window.confirm("Clear all items from your cart?")) setCart([]);
                }}
              >
                🗑️ Clear Cart & Start Over
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;