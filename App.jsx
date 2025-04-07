import { useRef, useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [products, setProducts] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleVoiceInput = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      setLoading(true);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob);

      const res = await fetch("https://ai-shopping-assistant-4qhk.onrender.com/upload-audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.transcript) {
        setText(data.transcript);
        search(data.transcript);
      }
      setLoading(false);
    };

    recorder.start();
    setRecording(true);
    setTimeout(() => {
      recorder.stop();
      setRecording(false);
    }, 5000);
  };

  const search = async (query) => {
    setLoading(true);
    const res = await fetch("https://ai-shopping-assistant-4qhk.onrender.com/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo-section">
          <span className="logo">🛍️</span>
          <h1>Virtual Shopping Assistant</h1>
        </div>
        <p className="tagline">Discover exquisite products</p>
      </div>
      
      <div className="search-container">
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search for products..."
          />
          <button 
            className="search-button" 
            onClick={() => search(text)}
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : <span>🔍</span>}
          </button>
          <button 
            className={`voice-button ${recording ? 'recording' : ''}`} 
            onClick={handleVoiceInput}
            disabled={loading || recording}
          >
            {recording ? <span className="pulse">🎙️</span> : <span>🎙️</span>}
          </button>
        </div>
        {recording && <div className="recording-indicator">Listening...</div>}
      </div>

      {loading && 
        <div className="loading-container">
          <div className="loader"></div>
          <p>Searching for the perfect products...</p>
        </div>
      }

      {!loading && products.length > 0 && (
        <div className="results-heading">
          <h2>Found {products.length} beautiful items for you</h2>
        </div>
      )}

      <div className="products-grid">
        {products.map((p, i) => (
          <div className="product-card" key={i}>
            <div className="product-image-container">
              <img src={p.image} className="product-image" alt={p.title} />
              <div className="source-badge">{p.source}</div>
            </div>
            <div className="product-info">
              <h3 className="product-title">{p.title}</h3>
              <p className="product-price">{p.price}</p>

            </div>
          </div>
        ))}
      </div>
      
      {!loading && products.length === 0 && 
        <div className="empty-state">
          <div className="illustration">✨🔍✨</div>
          <h3>Start your favourite product search</h3>
          <p>Use voice commands or type to find beautiful products</p>
        </div>
      }
      
      <footer className="footer">
        <p> Shopping Assistant © 2025</p>
      </footer>
    </div>
  );
}
