import styles from '@/styles/MessageBubble.module.css'

export default function MessageBubble({ sender, text }) {
  const isUser = sender === 'user'

  return (
    <div className={isUser ? styles.user : styles.bot}>
      <p>{text}</p>
    </div>
  )
}