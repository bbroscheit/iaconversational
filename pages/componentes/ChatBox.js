export default function ChatBox({ messages, isBotTyping }) {
  return (
    <div className="chatbox">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${msg.sender === 'Usuario' ? 'user' : 'bot'}`}
        >
          <strong>{msg.sender}:</strong> {msg.content}
        </div>
      ))}

      {isBotTyping && (
        <div className="message bot typing">
          El bot está escribiendo...
        </div>
      )}
    </div>
  );
}