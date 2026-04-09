function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`chat-message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className="chat-message-bubble">
        {message.text}
      </div>
    </div>
  );
}

export default ChatMessage;
