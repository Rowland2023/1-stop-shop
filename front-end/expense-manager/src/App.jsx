import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || "";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dscxqsew5/";
const PAYSTACK_PUBLIC_KEY = 'pk_live_21207f639d252b46e35e171dca6b075f79cba433';

// Helper function to handle { image: "..." } objects
const getImageUrl = (input) => {
  // If input is an object, get the 'image' property; otherwise treat as string
  let path = typeof input === 'object' && input !== null ? input.image : input;
  
  if (!path || path === "null" || path === "") return "/static/placeholder.png";
  if (path.startsWith("http")) return path;

  // Clean the path and construct the full URL
  const cleanPath = path.replace(/^\/+/, "");
  return `${CLOUDINARY_BASE}${cleanPath}`;
};

function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  
  // Use 'additional_images' array, fallback to empty array
  const imageList = product.additional_images || [];
  const initialImage = imageList.length > 0 ? imageList[0] : "";
  
  const [activeImg, setActiveImg] = useState(getImageUrl(initialImage));

  return (
    <div className="product-card">
      <div className="img-frame" onClick={() => onSelect(product)}>
        <img 
          src={activeImg} 
          alt={product.name} 
          className="zoom-effect" 
          onError={(e) => { e.target.src = "/static/placeholder.png"; }} 
        />
      </div>

      {/* Show thumbnails if more than 1 image exists */}
      {imageList.length > 1 && (
        <div className="thumb-strip" style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
          {imageList.map((imgObj, idx) => (
            <img 
              key={idx} 
              src={getImageUrl(imgObj)} 
              onClick={() => setActiveImg(getImageUrl(imgObj))}
              style={{ 
                width: '40px', 
                height: '40px', 
                cursor: 'pointer', 
                border: activeImg === getImageUrl(imgObj) ? '2px solid #ff8c00' : 'none' 
              }}
            />
          ))}
        </div>
      )}

      <h3>{product.name}</h3>
      <p className="price-text">₦{parseFloat(product.price || 0).toLocaleString()}</p>
      
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
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ phone: "", password: "" });
  const [trackInput, setTrackInput] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include" 
    })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.results || [])))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const filteredProducts = products.filter((p) => 
    p.category?.toLowerCase() === category.toLowerCase() && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-grid-wrapper">
      <header className="brand-header">
        <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 onClick={() => setView("grid")} className="logo-text" style={{ cursor: 'pointer' }}>MeBuy</h1>
          <button className="cart-toggle-btn" onClick={() => setCartOpen(!cartOpen)}>
            🛒 {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </button>
        </div>
      </header>

      <main>
        {view === "grid" && (
          selectedProduct ? (
            <div className="detail-screen">
              <button onClick={() => setSelectedProduct(null)}>← Back</button>
              <h1>{selectedProduct.name}</h1>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;