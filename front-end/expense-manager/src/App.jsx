import React, { useEffect, useState } from "react";
import "./App.css";

// --- CONFIGURATION ---
// Using the full public URL avoids "Name Not Resolved" errors in the browser.
const API_BASE_URL = "https://back-end-wdk7.onrender.com";

function ProductCard({ product, onAddToCart, onSelect }) {
  const [tempQty, setTempQty] = useState(1);
  const displayImage = product.image_display || "/static/placeholder.png";

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
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null); 
  const PAGE_SIZE = 9; 
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 

  useEffect(() => {
    localStorage.setItem("shop_cart_data", JSON.stringify(cart));
  }, [cart]);

  // FIXED: Fetching with full API_BASE_URL and trailing slash
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
          const productData = Array.isArray(data) ? data : (data.results || []);
          setProducts(productData);
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    // Logic for login/register here using API_BASE_URL
  };

  const subTotalValue = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="app-grid-wrapper">
      <header>
        <h1>1-Stop Shop</h1>
        <button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>
          🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <main>
        {selectedProduct ? (
          <div><button onClick={() => setSelectedProduct(null)}>Back</button><h1>{selectedProduct.name}</h1></div>
        ) : (
          <div className="product-grid">
            {products.filter(p => p.category === category).slice(0, visibleCount).map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} onSelect={setSelectedProduct} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;