import { useState, useEffect } from "react";
import ChatBox from "@/pages/componentes/ChatBox";
import MessageInput from "@/pages/componentes/MessageInput";

export default function Home() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/characters")
      .then((res) => res.json())
      .then(setCharacters);
  }, []);

  // useEffect(() => {
  //   fetch('/api/messages')
  //     .then((res) => res.json())
  //     .then(setMessages);
  // }, []);

  useEffect(() => {
  if (!selectedCharacter?.id) return;

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?characterId=${selectedCharacter.id}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    }
  };

  fetchMessages();
}, [selectedCharacter]);

  const handleSendMessage = async (input) => {
    if (!input.trim() || !selectedCharacter) return;

    // Agregamos mensaje del usuario a la lista localmente - inicio de prueba
    const userMessage = {
      id: Date.now(),
      sender: "Usuario",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsBotTyping(true);

    // fin de prueba

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "Usuario",
          content: input,
          characterId: selectedCharacter.id,
        }),
      });

      // const res = await fetch("/api/messages-gemini", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     sender: "Usuario",
      //     content: input,
      //     characterId: selectedCharacter.id,
      //   }),
      // });

      const newMessages = await res.json();

      const formattedMessages = Array.isArray(newMessages)
        ? newMessages.slice(1)
        : [];
      setMessages((prev) => [...prev, ...formattedMessages]);
      //setMessages((prev) => [...prev, ...(Array.isArray(newMessages) ? newMessages : [newMessages])]);
      //setInput('');
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleCreateCharacter = async () => {
    const name = prompt("Nombre del nuevo personaje:");
    if (!name || !name.trim()) return;

    const personalityInput = prompt(
      "Describe la personalidad (separada por comas):"
    );
    
    const personality = personalityInput
      ? personalityInput
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, personality }),
      });

      console.log("Código de respuesta:", res.status);

      if (!res.ok) throw new Error("Error al crear personaje");

      const newCharacter = await res.json();
      setCharacters((prev) => [...prev, newCharacter]);
      setSelectedCharacter(newCharacter);
    } catch (error) {
      
      console.error("Error al crear personaje:", error.messages);
      alert(`No se pudo crear el personaje: ${name} ${personality}`);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Panel lateral de personajes */}
      <aside className="w-1/4 bg-gray-100 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Personajes</h2>
        {characters.map((char) => (
          <div
            key={char.id}
            className={`p-2 cursor-pointer rounded ${
              selectedCharacter?.id === char.id
                ? "bg-blue-200"
                : "hover:bg-gray-200"
            }`}
            onClick={() => setSelectedCharacter(char)}
          >
            {char.name}
          </div>
        ))}

        <button
          onClick={handleCreateCharacter}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          + Nuevo personaje
        </button>
      </aside>
      {selectedCharacter && (
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={() => setShowInfo((prev) => !prev)}>
            {showInfo ? "Ocultar info importante" : "Ver info importante"}
          </button>
          {showInfo && (
            <pre
              style={{
                background: "#f4f4f4",
                padding: "1rem",
                marginTop: "0.5rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedCharacter.informacionImportante ||
                "No hay información guardada aún."}
            </pre>
          )}
        </div>
      )}
      {/* Área del chat */}
      <main className="flex-1 flex flex-col p-4">
        {selectedCharacter ? (
          <>
            <h1 className="text-2xl font-bold mb-4">
              {selectedCharacter.name}
            </h1>

            <div className="flex-1 overflow-y-auto mb-4">
              <ChatBox messages={messages} isBotTyping={isBotTyping} />
            </div>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <p className="text-center text-gray-500 mt-10">
            Seleccioná un personaje para empezar a chatear.
          </p>
        )}
      </main>
    </div>
  );
}
