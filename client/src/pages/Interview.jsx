import { useState, useRef, useEffect } from 'react'
import ChatMessage from '../components/ChatMessage'
import './Interview.css'

const AGENTS = [
  {
    id: 'architect',
    name: 'The Architect',
    model: 'Claude Sonnet 4.5 (Anthropic)',
    endpoint: '/api/architect',
    color: 'var(--architect-color)',
    description: 'Technical depth & system design',
  },
  {
    id: 'operator',
    name: 'The Operator',
    model: 'GPT-4o (OpenAI)',
    endpoint: '/api/operator',
    color: 'var(--operator-color)',
    description: 'Practical operations & shipping',
  },
  {
    id: 'culture',
    name: 'The Culture Lead',
    model: 'Gemini 1.5 Flash (Google)',
    endpoint: '/api/culture',
    color: 'var(--culture-color)',
    description: 'Values, vision & team fit',
  },
]

function Interview() {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0)
  const [conversations, setConversations] = useState({
    architect: [],
    operator: [],
    culture: [],
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [verdicts, setVerdicts] = useState({})
  const [allDone, setAllDone] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const currentAgent = AGENTS[currentAgentIndex]
  const currentMessages = conversations[currentAgent.id]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, loading])

  useEffect(() => {
    if (started && !loading) {
      inputRef.current?.focus()
    }
  }, [started, loading, currentAgentIndex])

  const startInterview = async () => {
    setStarted(true)
    setLoading(true)

    try {
      const response = await fetch(AGENTS[0].endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, I\'m ready for my interview.' }],
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.message) {
        throw new Error(data.detail || data.error || 'Agent unavailable')
      }

      setConversations(prev => ({
        ...prev,
        architect: [
          { role: 'user', content: 'Hello, I\'m ready for my interview.' },
          { role: 'assistant', content: data.message },
        ],
      }))
    } catch (err) {
      console.error('Failed to start interview:', err)
      setConversations(prev => ({
        ...prev,
        architect: [
          { role: 'user', content: 'Hello, I\'m ready for my interview.' },
          { role: 'assistant', content: `Connection error: ${err.message}. Please refresh and try again.` },
        ],
      }))
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    const agentId = currentAgent.id
    const updatedMessages = [
      ...conversations[agentId],
      { role: 'user', content: userMessage },
    ]

    setConversations(prev => ({
      ...prev,
      [agentId]: updatedMessages,
    }))

    try {
      const response = await fetch(currentAgent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.message) {
        throw new Error(data.detail || data.error || 'Agent unavailable')
      }

      const newMessages = [
        ...updatedMessages,
        { role: 'assistant', content: data.message },
      ]

      setConversations(prev => ({
        ...prev,
        [agentId]: newMessages,
      }))

      // Check if this agent gave a verdict
      if (data.hasVerdict) {
        setVerdicts(prev => ({ ...prev, [agentId]: data.message }))

        // Move to next agent or finish
        if (currentAgentIndex < AGENTS.length - 1) {
          const nextIndex = currentAgentIndex + 1
          const nextAgent = AGENTS[nextIndex]

          // Small delay, then kick off next agent
          setTimeout(async () => {
            setCurrentAgentIndex(nextIndex)

            try {
              const nextResponse = await fetch(nextAgent.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [
                    { role: 'user', content: 'Hello, I\'m ready for my interview.' },
                  ],
                }),
              })

              const nextData = await nextResponse.json()

              if (!nextResponse.ok || !nextData.message) {
                throw new Error(nextData.detail || nextData.error || 'Agent unavailable')
              }

              setConversations(prev => ({
                ...prev,
                [nextAgent.id]: [
                  { role: 'user', content: 'Hello, I\'m ready for my interview.' },
                  { role: 'assistant', content: nextData.message },
                ],
              }))
            } catch (err) {
              console.error('Failed to start next agent:', err)
            } finally {
              setLoading(false)
            }
          }, 1000)
          return
        } else {
          setAllDone(true)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setConversations(prev => ({
        ...prev,
        [agentId]: [
          ...updatedMessages,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ],
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!started) {
    return (
      <div className="interview-start">
        <h1>Ready for The Bench?</h1>
        <p>
          You'll be interviewed by three AI agents, each powered by a different model.
          They'll ask questions one at a time, then deliver their hiring verdict.
        </p>
        <div className="agent-lineup">
          {AGENTS.map((agent, i) => (
            <div key={agent.id} className={`lineup-item ${agent.id}`}>
              <span className="lineup-number">{i + 1}</span>
              <div>
                <strong>{agent.name}</strong>
                <span className="lineup-model">{agent.model}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={startInterview}>
          Begin Interview
        </button>
      </div>
    )
  }

  return (
    <div className="interview">
      {/* Agent tabs */}
      <div className="agent-tabs">
        {AGENTS.map((agent, i) => (
          <button
            key={agent.id}
            className={`agent-tab ${agent.id} ${i === currentAgentIndex ? 'active' : ''} ${verdicts[agent.id] ? 'completed' : ''}`}
            onClick={() => {
              if (conversations[agent.id].length > 0) {
                setCurrentAgentIndex(i)
              }
            }}
            disabled={conversations[agent.id].length === 0}
          >
            <span className="tab-indicator"></span>
            <span className="tab-name">{agent.name}</span>
            {verdicts[agent.id] && <span className="tab-check">Done</span>}
          </button>
        ))}
      </div>

      {/* Active agent info */}
      <div className={`agent-header ${currentAgent.id}`}>
        <div className="agent-dot"></div>
        <div>
          <div className="agent-header-name">{currentAgent.name}</div>
          <div className="agent-header-meta">
            <span className="mono">{currentAgent.model}</span>
            <span className="agent-header-desc">{currentAgent.description}</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {currentMessages.map((msg, i) => (
          <ChatMessage
            key={`${currentAgent.id}-${i}`}
            message={msg}
            agentType={msg.role === 'assistant' ? currentAgent.id : undefined}
          />
        ))}
        {loading && (
          <div className={`typing-indicator ${currentAgent.id}`}>
            <span></span><span></span><span></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {!allDone && !verdicts[currentAgent.id] && (
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            rows={2}
            disabled={loading}
          />
          <button
            className="btn btn-primary send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      )}

      {/* All done */}
      {allDone && (
        <div className="interview-complete">
          <h2>Interview Complete</h2>
          <p>All three agents have delivered their verdicts. Review each tab above to see the full conversations and results.</p>
        </div>
      )}
    </div>
  )
}

export default Interview
