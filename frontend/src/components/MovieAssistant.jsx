import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useMovieContext } from "../context/MovieContext";
import { getMovieDetails } from "../services/tmdb";
import ChatMessage from "./ChatMessage";
import "../css/MovieAssistant.css";

const API_BASE = "http://localhost:5000/api";

function MovieAssistant({ genres = [], onApplyFilters, autoFocus = false }) {
  const { token, isLoggedIn } = useAuth();
  const { favorites } = useMovieContext();
  const [watchlist, setWatchlist] = useState([]);

  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("movieAssistantChat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const [populatedFavorites, setPopulatedFavorites] = useState([]);
  const [populatedWatchlist, setPopulatedWatchlist] = useState([]);

  const chatAreaRef = useRef(null);

  // Fetch watchlist context if logged in
  useEffect(() => {
    if (!isLoggedIn || !token) {
      setWatchlist([]);
      return;
    }
    let cancelled = false;
    axios
      .get(`${API_BASE}/watchlist`, { headers: { Authorization: token } })
      .then((res) => {
        if (!cancelled) setWatchlist(res.data || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn, token]);

  useEffect(() => {
    let cancelled = false;
    async function fetchFavTitles() {
        if (!favorites.length) return setPopulatedFavorites([]);
        try {
            const results = await Promise.all(favorites.slice(0, 15).map(f => getMovieDetails(f.movieId)));
            if (!cancelled) setPopulatedFavorites(results.map(r => r.title));
        } catch { /* silent */ }
    }
    fetchFavTitles();
    return () => { cancelled = true; };
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;
    async function fetchWatchTitles() {
        if (!watchlist.length) return setPopulatedWatchlist([]);
        try {
            const results = await Promise.all(watchlist.slice(0, 15).map(w => getMovieDetails(w.movieId)));
            if (!cancelled) setPopulatedWatchlist(results.map(r => r.title));
        } catch { /* silent */ }
    }
    fetchWatchTitles();
    return () => { cancelled = true; };
  }, [watchlist]);

  // Auto-scroll chat and persist to session storage
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
    sessionStorage.setItem("movieAssistantChat", JSON.stringify(messages));
  }, [messages, isExpanded, isLoading]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Need a slight delay to ensure CSS transition allows it to be focusable
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [autoFocus, isExpanded]);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!isExpanded) setIsExpanded(true);

    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to UI
    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const headers = token ? { Authorization: token } : {};
      
      const payload = {
        message: userMessage,
        conversationHistory: messages,
        userFavorites: populatedFavorites,
        userWatchlist: populatedWatchlist
      };

      const res = await axios.post(`${API_BASE}/movie-assistant`, payload, { headers });
      
      const rawData = res.data;
      const filterInstructions = rawData.filters || {};
      const assistantReply = rawData.reply || "Here is what I found for you!";
      
      // Update the Explore page filters
      if (onApplyFilters) {
        onApplyFilters(filterInstructions);
      }

      setMessages([...updatedMessages, { role: "assistant", text: assistantReply }]);

    } catch (err) {
      setMessages([...updatedMessages, { 
        role: "assistant", 
        text: "Error communicating with AI Assistant. Ensure Gemini API key is configured." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`movie-assistant-container ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="ma-header" onClick={toggleExpand}>
        <span>AI Movie Assistant</span>
        <button className="ma-expand-toggle" aria-label="Toggle assistant">
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      <div className="ma-chat-area" ref={chatAreaRef}>
        {messages.length === 0 && (
          <p style={{ opacity: 0.6, fontSize: "0.85rem", textAlign: "center", marginTop: "1rem" }}>
            Try asking: "Best sci-fi movies", "funny 90s movies", or "something like my favorites"
          </p>
        )}
        
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        
        {isLoading && (
          <div className="chat-message-row assistant-row">
            <div className="chat-message-bubble ma-loading-indicator">
              <span className="ma-dot"></span>
              <span className="ma-dot"></span>
              <span className="ma-dot"></span>
            </div>
          </div>
        )}
      </div>

      <form className="ma-input-area" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="ma-input"
          placeholder="Ask the movie assistant..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="ma-send-btn" disabled={isLoading || !inputValue.trim()}>
          →
        </button>
      </form>
    </div>
  );
}

export default MovieAssistant;
