import MessageBubble from '@/pages/componentes/MessageBubble'
import MessageInput from '@/pages/componentes/MessageInput'

export default function ChatWindow() {
  const messages = [
    { id: 1, sender: 'user', text: 'Hola, IA' },
    { id: 2, sender: 'bot', text: 'Hola, ¿en qué te puedo ayudar?' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
      </div>
      <MessageInput />
    </div>
  )
}