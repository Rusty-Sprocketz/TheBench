import './HowItWorks.css'

function HowItWorks() {
  return (
    <div className="how-it-works">
      <div className="hiw-header">
        <h1>How This Was Made</h1>
        <p className="hiw-intro">
          This app was built by directing multiple AI agents &mdash; not by writing code line by line.
          Below is a transparent breakdown of the architecture, the agents involved, the system prompts
          used, and the decisions I made as the orchestrator.
        </p>
      </div>

      {/* Architecture */}
      <section className="hiw-section">
        <h2>The Multi-Agent Architecture</h2>
        <div className="architecture-diagram">
          <div className="arch-node orchestrator">
            <div className="arch-label">Orchestrator</div>
            <div className="arch-detail">Me (Rusty) + Claude Code</div>
            <div className="arch-desc">Architecture decisions, prompt design, quality control, deployment</div>
          </div>
          <div className="arch-arrows">
            <div className="arch-arrow architect"></div>
            <div className="arch-arrow operator"></div>
            <div className="arch-arrow culture"></div>
          </div>
          <div className="arch-agents">
            <div className="arch-node agent architect">
              <div className="arch-label">The Architect</div>
              <div className="arch-detail mono">Claude Sonnet 4.5</div>
              <div className="arch-provider">Anthropic API</div>
            </div>
            <div className="arch-node agent operator">
              <div className="arch-label">The Operator</div>
              <div className="arch-detail mono">GPT-4o</div>
              <div className="arch-provider">OpenAI API</div>
            </div>
            <div className="arch-node agent culture">
              <div className="arch-label">The Culture Lead</div>
              <div className="arch-detail mono">Gemini 2.0 Flash</div>
              <div className="arch-provider">Google AI API</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="hiw-section">
        <h2>Tech Stack</h2>
        <div className="stack-grid">
          <div className="stack-item">
            <h4>Frontend</h4>
            <p>React + Vite, React Router, vanilla CSS</p>
          </div>
          <div className="stack-item">
            <h4>Backend</h4>
            <p>Node.js + Express, with routes per agent</p>
          </div>
          <div className="stack-item">
            <h4>AI Models</h4>
            <p>Anthropic SDK, OpenAI SDK, Google Generative AI SDK</p>
          </div>
          <div className="stack-item">
            <h4>Deployment</h4>
            <p>Vercel (frontend) + Railway/Render (backend)</p>
          </div>
        </div>
      </section>

      {/* System Prompts */}
      <section className="hiw-section">
        <h2>System Prompts</h2>
        <p className="section-note">
          Each agent has a carefully crafted system prompt that defines its personality,
          focus area, interview style, and verdict format. Full transparency &mdash; here they are.
        </p>

        <div className="prompt-card architect">
          <div className="prompt-header">
            <span className="prompt-dot"></span>
            <h3>The Architect &mdash; Claude Sonnet 4.5</h3>
          </div>
          <div className="prompt-content">
            <p><strong>Role:</strong> Senior technical interviewer</p>
            <p><strong>Focus:</strong> System architecture, cloud infrastructure, AI-agent workflow design, code quality judgment</p>
            <p><strong>Style:</strong> Sharp, precise, technical but fair. Asks one focused question at a time and follows up.</p>
            <p><strong>Why Claude:</strong> Best-in-class at reasoning through complex technical problems and assessing architectural thinking.</p>
          </div>
        </div>

        <div className="prompt-card operator">
          <div className="prompt-header">
            <span className="prompt-dot"></span>
            <h3>The Operator &mdash; GPT-4o</h3>
          </div>
          <div className="prompt-content">
            <p><strong>Role:</strong> Practical, operations-focused interviewer</p>
            <p><strong>Focus:</strong> Day-to-day AI agent workflow, shipping cadence, quality control, handling agent mistakes</p>
            <p><strong>Style:</strong> Direct, pragmatic, slightly informal with dry humour. Pushes for specifics.</p>
            <p><strong>Why GPT-4o:</strong> Strong at task-oriented, operational thinking and scenario-based assessment.</p>
          </div>
        </div>

        <div className="prompt-card culture">
          <div className="prompt-header">
            <span className="prompt-dot"></span>
            <h3>The Culture Lead &mdash; Gemini 2.0 Flash</h3>
          </div>
          <div className="prompt-content">
            <p><strong>Role:</strong> Values and vision interviewer</p>
            <p><strong>Focus:</strong> Startup alignment, passion for AI shift, communication clarity, team dynamics</p>
            <p><strong>Style:</strong> Warm but perceptive. Listens carefully, follows up on anything that sounds rehearsed.</p>
            <p><strong>Why Gemini Flash:</strong> Fast, conversational, and effective for lighter, values-focused dialogue.</p>
          </div>
        </div>
      </section>

      {/* Orchestration Decisions */}
      <section className="hiw-section">
        <h2>Orchestration Decisions</h2>
        <p className="section-note">
          The places where I overrode or redirected the agents matter as much as where I trusted them.
          Here are key decisions I made as the orchestrator:
        </p>

        <div className="decisions-list">
          <div className="decision">
            <div className="decision-number">1</div>
            <div>
              <h4>Model Selection Was Deliberate</h4>
              <p>
                I didn't just use Claude for everything. Each model was chosen for what it's best at:
                Claude for deep technical reasoning, GPT-4o for operational thinking, Gemini Flash for
                fast conversational flow. The job ad asks for multi-agent orchestration &mdash; that
                means genuinely different agents, not one model wearing different hats.
              </p>
            </div>
          </div>
          <div className="decision">
            <div className="decision-number">2</div>
            <div>
              <h4>Sequential Flow, Not Parallel</h4>
              <p>
                I chose to run agents sequentially rather than in parallel. Why? Because each interview
                round is a conversation that deserves full attention. Parallel agents would have created
                a confusing UX. The orchestrator's job is to know when parallel execution helps and when
                it doesn't.
              </p>
            </div>
          </div>
          <div className="decision">
            <div className="decision-number">3</div>
            <div>
              <h4>Verdict Format Was Constrained</h4>
              <p>
                Each agent is instructed to produce a structured verdict with specific ratings. Without
                this constraint, agents would give vague, meandering conclusions. Constraining output
                format is one of the most important parts of agent direction &mdash; it's the difference
                between useful output and noise.
              </p>
            </div>
          </div>
          <div className="decision">
            <div className="decision-number">4</div>
            <div>
              <h4>Build Tool: Claude Code in Terminal</h4>
              <p>
                The entire app was scaffolded and built using Claude Code (Anthropic's CLI agent)
                running in the terminal. I directed the architecture, reviewed every component,
                and made correction decisions throughout. The AI wrote the code; I made the calls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Note */}
      <section className="hiw-section personal-note">
        <h2>Why This Role, Why Now</h2>
        <div className="note-card">
          <p>
            The shift to AI-directed development isn't theoretical for me &mdash; it's how I built
            this app. I didn't write this code line by line. I architected the system, chose the
            models, wrote the prompts, directed the agents, and made judgment calls when they got
            things wrong.
          </p>
          <p>
            That's exactly what this role requires. And I've spent 10 years working with Ross and
            Michael &mdash; I know how they build things. I know the pace, the standards, and the
            ambition. I want to be part of what they build next, because I believe the way we build
            software is genuinely changing, and being at the ground level of that shift with people
            I trust is where I want to be.
          </p>
          <p className="note-cta">
            Let's talk. &mdash; Rusty
          </p>
        </div>
      </section>
    </div>
  )
}

export default HowItWorks
