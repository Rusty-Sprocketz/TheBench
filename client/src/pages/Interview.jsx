import { useState, useRef, useEffect } from 'react'
import ChatMessage from '../components/ChatMessage'
import parseVerdict from '../utils/parseVerdict'
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
    model: 'Gemini 2.0 Flash (Google)',
    endpoint: '/api/culture',
    color: 'var(--culture-color)',
    description: 'Values, vision & team fit',
  },
]

const DEMO_CONVERSATIONS = {
  architect: [
    {
      role: 'assistant',
      content: "Hello. I'm The Architect. I assess technical depth and systems thinking. Let's get into it. You've spent years in the M365 and endpoint management space \u2014 designing SOE delivery tools, EUX monitoring solutions, and multi-stream workplace transformations. Now you're applying for a role that's fundamentally about directing AI agents to build software. Walk me through how you'd architect a development workflow where AI agents are doing the actual coding. What does the system look like?",
    },
    {
      role: 'user',
      content: "The way I see it, directing AI agents isn't that different from what I've been doing \u2014 designing systems where multiple components need to work together toward a defined outcome. When I built the self-service SOE delivery tool, I designed an architecture where automation handled the heavy lifting but humans maintained oversight at critical decision points. An AI agent workflow would follow the same principle: you define the architecture and quality gates, assign agents to specific tasks based on their strengths, and maintain a review layer. I'd structure it with a planning phase where I define the system architecture and break work into bounded tasks, an execution phase where agents handle implementation within those boundaries, and a quality phase with automated testing plus human review of architectural decisions.",
    },
    {
      role: 'assistant',
      content: "That's a reasonable framework. But here's where it gets interesting \u2014 the SOE tool had predictable inputs and outputs. AI agents hallucinate, make wrong assumptions, and sometimes produce code that looks correct but has subtle bugs. How would you architect quality control into an agent-driven pipeline where you can't fully trust the output?",
    },
    {
      role: 'user',
      content: "Good question. When I designed the EUX monitoring solution, we had the same challenge \u2014 signals from M365, ServiceNow, and Nexthink that could be noisy or misleading. The solution was layered validation: automated checks first, pattern detection second, and human judgment for edge cases. For AI agents, I'd apply the same thinking. Automated test suites catch obvious failures. Code review processes \u2014 potentially using a different AI model as a reviewer \u2014 catch structural issues. And I'd maintain architectural decision records so I can trace why something was built a certain way. The key insight from EUX monitoring is that you need to detect degradation early, not wait for failure. Same applies to agent output \u2014 you want continuous quality signals, not just end-of-sprint reviews.",
    },
    {
      role: 'assistant',
      content: "That layered validation approach shows strong architectural thinking. Last question \u2014 you've led multi-stream programs with 5-7 people. How does coordinating parallel AI agents differ from coordinating a human team?",
    },
    {
      role: 'user',
      content: "The biggest difference is that agents don't have context fatigue, but they also don't build institutional knowledge the way humans do. With a human team, I could say 'remember what we did on the Wesfarmers engagement' and they'd understand the pattern. Agents need that context explicitly every time. So I'd invest heavily in documentation-as-architecture \u2014 system context documents, decision logs, and shared conventions that get fed into every agent session. The coordination itself is actually simpler in some ways \u2014 agents don't have conflicting schedules or communication preferences. But the orchestration challenge is real: you need to manage dependencies between parallel workstreams, handle merge conflicts in shared codebases, and maintain a coherent system design when multiple agents are contributing. That's where the delivery leadership experience directly translates.",
    },
    {
      role: 'assistant',
      content: "[VERDICT]\nRating: Strong Hire\nTechnical Depth: 8/10\nArchitecture Thinking: 9/10\nAI Agent Readiness: 8/10\nSummary: Russell demonstrates sophisticated architectural thinking that translates directly from infrastructure to AI agent orchestration. His layered validation approach and emphasis on documentation-as-architecture show he understands the unique challenges of agent-directed development. The connection between EUX monitoring patterns and agent quality control is particularly insightful.\n[/VERDICT]",
    },
  ],
  operator: [
    {
      role: 'assistant',
      content: "Hey. I'm The Operator. I care about one thing \u2014 can you actually ship? So let's skip the theory. You're running three AI agents in parallel on different features of the product. Agent one has produced code that works but doesn't follow the established patterns. Agent two is stuck in a loop and burning tokens. Agent three finished early but the output doesn't integrate with what agent one built. What do you do? Walk me through the next 30 minutes.",
    },
    {
      role: 'user',
      content: "First priority is stop the bleeding \u2014 kill agent two's loop immediately. Burning tokens with no progress is waste, and the output so far is probably garbage anyway. I'd restart that task with a more constrained prompt and clearer boundaries. Next, I'd look at agent three's integration issue. If agent one's code doesn't follow patterns, that's probably the root cause of the integration failure. So I'd address agent one first \u2014 review what it produced, identify the pattern deviations, and decide whether to have it refactor or do a targeted manual fix. The key is: don't try to fix all three at once. Triage, prioritise, and sequence. This is exactly what I did leading multi-stream programs \u2014 when the SOE rollout hit issues across three workstreams simultaneously, the instinct is to context-switch constantly. The better approach is to stabilise one stream, then move to the next.",
    },
    {
      role: 'assistant',
      content: "Right. Now tell me about a real situation where something you were delivering went sideways and you had to recover. Not a theoretical scenario \u2014 what actually happened?",
    },
    {
      role: 'user',
      content: "The BNZ engagement in New Zealand. Fixed-price delivery, $400K NZD, team of 5-7 people. We hit problems early \u2014 onboarding delays, unclear requirements from the bank's side, difficulty accessing key stakeholders. On a fixed-price deal, delays eat directly into your margin. I had to make hard calls about what was essential versus nice-to-have, restructure the workstream priorities so we could show progress on the deliverables the bank cared most about, and build stronger relationships with the people who could unblock us. We delivered on time, and the feedback was 'this is exactly what we need' and 'really appreciate the work.' The lesson is that delivery under pressure isn't about working harder \u2014 it's about making better prioritisation decisions faster.",
    },
    {
      role: 'assistant',
      content: "Solid. One more \u2014 how do you maintain quality when you're moving fast? Specifically with AI-generated code where the temptation is to just ship whatever the agent produces.",
    },
    {
      role: 'user',
      content: "The same way I maintained quality on high-pressure deliverables \u2014 you build quality into the process, not bolt it on at the end. With AI agents, that means: clear acceptance criteria before the agent starts, automated tests that run immediately on output, and a defined 'definition of done' that includes code review. I also think there's a cadence thing \u2014 I wouldn't do week-long sprints with AI agents. The feedback loop should be much tighter. Generate, test, review, iterate \u2014 multiple times per day. The speed advantage of AI agents is wasted if you batch up reviews.",
    },
    {
      role: 'assistant',
      content: "[VERDICT]\nRating: Strong Hire\nOperational Readiness: 9/10\nShipping Mentality: 9/10\nAgent Management: 7/10\nSummary: Russell's instinct to triage and prioritise under pressure is exactly what this role needs. The BNZ example demonstrates real delivery leadership under difficult conditions. His quality-through-process approach translates well to AI agent management, though direct experience with AI coding agents would strengthen his readiness further.\n[/VERDICT]",
    },
  ],
  culture: [
    {
      role: 'assistant',
      content: "Hi there! I'm really glad to meet you. I'm here to get a sense of who you are beyond the technical skills. So let me start with something direct \u2014 you worked with Ross and Michael for nearly a decade. What makes you want to come back and do it again?",
    },
    {
      role: 'user',
      content: "Honestly, it's about trust and ambition. I know how Ross and Michael operate \u2014 they're direct, they set high standards, but they genuinely support the people around them. Michael wrote me a character reference that I still value, not because of what it says about me, but because it shows the kind of leader he is. And Ross built a sales engine at Olikka that was relentless but never toxic. When I heard they were starting something new, my first thought wasn't 'that sounds interesting' \u2014 it was 'I want in.' The AI shift in development is real, and being part of building something from the ground up with people I trust is exactly where I want to be.",
    },
    {
      role: 'assistant',
      content: "That's genuine and I appreciate it. Now here's the harder question \u2014 this role is about directing AI agents to write code. Your background is in workplace strategy and end-user experience, not software development. Why should they bet on you for this?",
    },
    {
      role: 'user',
      content: "Because the role isn't really about writing code \u2014 it's about directing systems to produce outcomes. That's what I've done for 10 years. I've designed solutions that automate complex processes, managed multi-stream technical programs, and most importantly, I understand how to bridge the gap between what technology can do and what people actually need. The self-service SOE tool I built wasn't impressive because of the code \u2014 it was impressive because I understood the end-user experience well enough to design something people would actually use. Directing AI agents is the same skill: you need to understand the desired outcome deeply enough to guide the tools effectively. And I've been using AI tools daily \u2014 Claude Code built this very app we're sitting in.",
    },
    {
      role: 'assistant',
      content: "I love that answer. Last one \u2014 what does this shift to AI-directed development mean to you personally? Not professionally \u2014 personally.",
    },
    {
      role: 'user',
      content: "It means the thing I've always valued most \u2014 understanding people and outcomes rather than just technology \u2014 is finally the most important skill. For years, the industry rewarded people who could write the most code the fastest. Now it rewards people who can think clearly about what needs to be built and why. That's always been my strength. It feels like the industry is catching up to the way I've always worked.",
    },
    {
      role: 'assistant',
      content: "[VERDICT]\nRating: Strong Hire\nCultural Alignment: 9/10\nPassion & Drive: 9/10\nCommunication: 10/10\nSummary: Russell's connection to the founders is genuine, not performative. His reframing of workplace experience expertise as directly relevant to AI agent direction is compelling and authentic. His communication style is clear, honest, and confident without arrogance \u2014 exactly what an early-stage startup needs.\n[/VERDICT]",
    },
  ],
}

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
  const [demoMode, setDemoMode] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const demoAbortRef = useRef(false)

  const currentAgent = AGENTS[currentAgentIndex]
  const currentMessages = conversations[currentAgent.id]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, loading])

  useEffect(() => {
    if (started && !loading && !demoMode) {
      inputRef.current?.focus()
    }
  }, [started, loading, currentAgentIndex, demoMode])

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

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const typeMessage = (agentId, content, charsPerTick = 3, tickMs = 15) => {
    return new Promise((resolve) => {
      // Add message with empty content
      setConversations(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], { role: 'assistant', content: '' }],
      }))

      let charIndex = 0
      const tick = () => {
        if (demoAbortRef.current) { resolve(); return }
        charIndex = Math.min(charIndex + charsPerTick, content.length)
        setConversations(prev => {
          const msgs = [...prev[agentId]]
          msgs[msgs.length - 1] = { role: 'assistant', content: content.slice(0, charIndex) }
          return { ...prev, [agentId]: msgs }
        })
        if (charIndex < content.length) {
          setTimeout(tick, tickMs)
        } else {
          resolve()
        }
      }
      tick()
    })
  }

  const startDemoMode = async () => {
    demoAbortRef.current = false
    setDemoMode(true)
    setStarted(true)
    setConversations({ architect: [], operator: [], culture: [] })
    setVerdicts({})
    setAllDone(false)

    const agentIds = ['architect', 'operator', 'culture']

    for (let agentIdx = 0; agentIdx < agentIds.length; agentIdx++) {
      if (demoAbortRef.current) return
      const agentId = agentIds[agentIdx]
      const demoMessages = DEMO_CONVERSATIONS[agentId]

      setCurrentAgentIndex(agentIdx)

      for (let i = 0; i < demoMessages.length; i++) {
        if (demoAbortRef.current) return
        const msg = demoMessages[i]

        if (msg.role === 'user') {
          // User messages appear instantly
          setConversations(prev => ({
            ...prev,
            [agentId]: [...prev[agentId], msg],
          }))
          await sleep(400)
        } else if (msg.role === 'assistant') {
          // Show typing indicator
          setLoading(true)
          await sleep(800)
          if (demoAbortRef.current) { setLoading(false); return }
          setLoading(false)

          // Typewrite the assistant message
          await typeMessage(agentId, msg.content)
          if (demoAbortRef.current) return

          // Check if this is a verdict message
          if (msg.content.includes('[VERDICT]')) {
            setVerdicts(prev => ({ ...prev, [agentId]: msg.content }))
            await sleep(1000)
          } else {
            await sleep(500)
          }
        }
      }

      // Pause between agents
      if (agentIdx < agentIds.length - 1) {
        await sleep(800)
      }
    }

    if (!demoAbortRef.current) {
      setAllDone(true)
    }
  }

  const exitDemoMode = () => {
    demoAbortRef.current = true
    setDemoMode(false)
    setStarted(false)
    setLoading(false)
    setCurrentAgentIndex(0)
    setConversations({ architect: [], operator: [], culture: [] })
    setVerdicts({})
    setAllDone(false)
    setInput('')
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
        <div className="start-buttons">
          <button className="btn btn-primary" onClick={startInterview}>
            Begin Interview
          </button>
          <button className="btn btn-secondary" onClick={startDemoMode}>
            View Demo Interview
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="interview">
      {/* Sticky top panels */}
      <div className="interview-top">
        {/* Demo mode banner */}
        {demoMode && (
          <div className="demo-banner">
            <span>Demo Mode — Showing a sample interview</span>
            <button className="btn btn-secondary demo-banner-btn" onClick={exitDemoMode}>
              Start Live Interview
            </button>
          </div>
        )}

        {/* Agent tabs */}
        <div className="agent-tabs">
          {AGENTS.map((agent, i) => (
            <button
              key={agent.id}
              className={`agent-tab ${agent.id} ${i === currentAgentIndex ? 'active' : ''} ${verdicts[agent.id] ? 'completed' : ''}`}
              onClick={() => {
                if (demoMode || conversations[agent.id].length > 0) {
                  setCurrentAgentIndex(i)
                }
              }}
              disabled={!demoMode && conversations[agent.id].length === 0}
            >
              <span className="tab-indicator"></span>
              <span className="tab-name">{agent.name}</span>
              {verdicts[agent.id] && (() => {
                const v = parseVerdict(verdicts[agent.id])
                if (!v) return <span className="tab-check">Done</span>
                const isHire = v.rating.toLowerCase().includes('hire') && !v.rating.toLowerCase().includes('no hire')
                return <span className={`tab-verdict ${isHire ? 'hire' : 'no-hire'}`}><span className="tab-verdict-rating">{v.rating} </span>{v.average}</span>
              })()}
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
      {!allDone && !verdicts[currentAgent.id] && !demoMode && (
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

      {/* Summary panel */}
      {allDone && (() => {
        const agentVerdicts = AGENTS.map(a => ({
          agent: a,
          verdict: parseVerdict(verdicts[a.id]),
        })).filter(v => v.verdict)

        if (agentVerdicts.length === 0) return null

        const allScores = agentVerdicts.flatMap(v => v.verdict.scores.map(s => s.value))
        const overallAverage = allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
          : null

        // Majority logic for overall rating
        const ratings = agentVerdicts.map(v => v.verdict.rating.toLowerCase())
        const hireCount = ratings.filter(r => r.includes('hire') && !r.includes('no hire')).length
        const overallRating = hireCount > agentVerdicts.length / 2 ? 'Strong Hire' : 'No Hire'
        const isOverallHire = overallRating === 'Strong Hire'

        return (
          <div className="interview-summary">
            <div className={`summary-overall ${isOverallHire ? 'hire' : 'no-hire'}`}>
              <h2>{overallRating}</h2>
              <span className="summary-overall-score">{overallAverage} / 10 average</span>
            </div>
            <div className="summary-agents">
              {agentVerdicts.map(({ agent, verdict }) => {
                const agentHire = verdict.rating.toLowerCase().includes('hire') && !verdict.rating.toLowerCase().includes('no hire')
                return (
                  <div key={agent.id} className={`summary-agent-card ${agent.id}`}>
                    <div className="summary-agent-header">
                      <span className="summary-agent-name">{agent.name}</span>
                      <span className={`summary-agent-rating ${agentHire ? 'hire' : 'no-hire'}`}>
                        {verdict.rating} {verdict.average}
                      </span>
                    </div>
                    <div className="summary-scores">
                      {verdict.scores.map(s => (
                        <div key={s.label} className="summary-score-row">
                          <span className="summary-score-label">{s.label}</span>
                          <div className="summary-score-bar-track">
                            <div
                              className={`summary-score-bar-fill ${agent.id}`}
                              style={{ width: `${s.value * 10}%` }}
                            />
                          </div>
                          <span className="summary-score-value">{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="summary-agent-text">{verdict.summary}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default Interview
