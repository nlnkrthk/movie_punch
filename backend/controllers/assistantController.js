const axios = require("axios");

const handleAssistantQuery = async (req, res) => {
  const { message, conversationHistory = [], userFavorites = [], userWatchlist = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const favoritesContext = userFavorites.slice(0, 15).join(", ");
    const watchlistContext = userWatchlist.slice(0, 15).join(", ");

    const systemPrompt = `You are a friendly, conversational movie filter assistant for a web application called Movie Punch.
Your job is to chat with the user naturally while simultaneously extracting their intent into structured database filters.

RULES:
1. ONLY return a valid JSON object. Do not include markdown code blocks like \`\`\`json or any other text before/after.
2. The JSON must exactly match this structure:
   {
     "reply": "Your conversational response to the user, acting like a friendly film buff. Discuss their favorites or what you're filtering.",
     "filters": {
       "person": "",
       "genres": [],
       "sort_by": "",
       "order": "",
       "search": ""
     }
   }
3. INTERLOCKING RULE: Whatever you promise in the "reply", you MUST execute in the "filters" object simultaneously. If you say "Here are some Action movies", you MUST put "Action" in the "genres" array.
4. "person": If the user explicitly asks for movies by a specific director, actor, or cast member (e.g. "Christopher Nolan" or "Tom Cruise"), put their name here. Leave it EMPTY "" otherwise.
5. "genres": Array of strings exactly matching these TMDB genre names: [Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Science Fiction, TV Movie, Thriller, War, Western]. Use "Science Fiction", not "Sci-Fi".
6. "search": ONLY output a search string here if the user asks for a specific movie title or cinematic universe (e.g. "Matrix", "Batman"). If they ask for "funny 90s movies" or "movies by Nolan", leave search EMPTY "" and use genres/person instead.
7. "sort_by": One of ["popularity", "vote_average", "vote_count", "release_date"] or an empty string "". Use "release_date" for "new"/"upcoming". Use "vote_average" for "best"/"top rated".
8. "order": "asc" or "desc" or an empty string "". Default to "desc".

USER CONTEXT:
User's Favorites: ${favoritesContext || "None"}
User's Watchlist: ${watchlistContext || "None"}`;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        // Do not pass the massive payload back, just text
        content: typeof msg.text === "string" ? msg.text : JSON.stringify(msg.text),
      });
    });

    messages.push({ role: "user", content: message });

    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    // Extracted API key to backend environment variables 
    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Accept": "application/json"
    };

    const payload = {
      "model": "meta/llama-4-maverick-17b-128e-instruct",
      "messages": messages,
      "max_tokens": 512,
      "temperature": 0.4, // Slightly higher for conversation
      "top_p": 1.00,
      "frequency_penalty": 0.00,
      "presence_penalty": 0.00,
      "stream": false
    };

    const response = await axios.post(invokeUrl, payload, { headers });
    
    const responseText = response.data.choices[0].message.content;

    try {
      let cleanText = responseText.trim();
      if (cleanText.startsWith("\`\`\`json")) {
          cleanText = cleanText.substring(7);
          cleanText = cleanText.substring(0, cleanText.lastIndexOf("\`\`\`"));
      } else if (cleanText.startsWith("\`\`\`")) {
          cleanText = cleanText.substring(3);
          cleanText = cleanText.substring(0, cleanText.lastIndexOf("\`\`\`"));
      }
      
      const jsonResponse = JSON.parse(cleanText);
      const f = jsonResponse.filters || {};
      const finalResponse = {
          reply: jsonResponse.reply || "There you go! Check out these movies.",
          filters: {
              person: typeof f.person === 'string' ? f.person : "",
              genres: Array.isArray(f.genres) ? f.genres : [],
              sort_by: typeof f.sort_by === 'string' ? f.sort_by : "",
              order: typeof f.order === 'string' ? f.order : "desc",
              search: typeof f.search === 'string' ? f.search : ""
          }
      };
      return res.json(finalResponse);
    } catch (parseError) {
      console.error("Failed to parse NVIDIA NIM output as JSON:", responseText);
      return res.json({
          reply: "I found some movies based on your interests!",
          filters: { person: "", genres: [], sort_by: "popularity", order: "desc", search: "" }
      });
    }

  } catch (error) {
    console.error("Error communicating with NVIDIA API:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response." });
  }
};

module.exports = {
  handleAssistantQuery,
};
