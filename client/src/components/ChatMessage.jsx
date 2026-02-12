import './ChatMessage.css'

function ChatMessage({ message, agentType }) {
  const isUser = message.role === 'user'
  const isVerdict = message.content.includes('[VERDICT]')

  const formatVerdict = (text) => {
    const verdictMatch = text.match(/\[VERDICT\]([\s\S]*?)\[\/VERDICT\]/)
    if (!verdictMatch) return text

    const before = text.slice(0, text.indexOf('[VERDICT]')).trim()
    const verdictContent = verdictMatch[1].trim()

    return (
      <>
        {before && <p>{before}</p>}
        <div className="verdict-block">
          <div className="verdict-header">Final Verdict</div>
          {verdictContent.split('\n').map((line, i) => {
            const [label, ...rest] = line.split(':')
            const value = rest.join(':').trim()
            if (!value) return <p key={i}>{line}</p>
            return (
              <div key={i} className="verdict-line">
                <span className="verdict-label">{label.trim()}:</span>
                <span className="verdict-value">{value}</span>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <div className={`chat-message ${isUser ? 'user' : 'agent'} ${agentType || ''}`}>
      {!isUser && (
        <div className="message-sender">
          {agentType === 'architect' && 'The Architect'}
          {agentType === 'operator' && 'The Operator'}
          {agentType === 'culture' && 'The Culture Lead'}
        </div>
      )}
      <div className={`message-bubble ${isVerdict ? 'has-verdict' : ''}`}>
        {isVerdict ? formatVerdict(message.content) : (
          message.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatMessage
