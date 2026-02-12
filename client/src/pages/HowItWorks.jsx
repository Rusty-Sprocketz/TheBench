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
            <p>Vercel (frontend + serverless API functions)</p>
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
            <p><strong>Focus:</strong> Enterprise-to-AI translation &mdash; how architecture experience applies to directing AI agents. System decomposition, quality gates, evaluating AI output. Explicitly avoids deep coding or algorithm questions.</p>
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
            <p><strong>Focus:</strong> Delivery leadership &mdash; managing teams, timelines, and shipping under pressure. Quality through process, practical triage, and how enterprise delivery translates to running AI agents. Avoids IDE workflows and coding patterns.</p>
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

      {/* Where I Overrode the Agents */}
      <section className="hiw-section">
        <h2>Where I Overrode the Agents</h2>
        <p className="section-note">
          Directing agents isn&rsquo;t &ldquo;set and forget.&rdquo; These are the places I had to step in and correct course.
        </p>
        <div className="decisions-list">
          <div className="decision override-item">
            <div className="override-label">Correction</div>
            <div>
              <h4>Agents Asked Coding Questions</h4>
              <p>
                The Architect and Operator both defaulted to deep coding and algorithm questions &mdash;
                inappropriate for a non-coding candidate applying for an AI-agent orchestration role.
                Rewrote prompts to focus on system thinking, delivery leadership, and directing AI agents.
              </p>
            </div>
          </div>
          <div className="decision override-item">
            <div className="override-label">Correction</div>
            <div>
              <h4>Interview Length Was Inconsistent</h4>
              <p>
                Agents would ask anywhere from 3 to 4+ questions per round, making the experience uneven.
                Constrained each agent to exactly 3 questions for consistency and respect for the candidate&rsquo;s time.
              </p>
            </div>
          </div>
          <div className="decision override-item">
            <div className="override-label">Correction</div>
            <div>
              <h4>Verdict Format Was Vague</h4>
              <p>
                Without strict structure, agents gave meandering, unparseable conclusions. Enforced a specific
                verdict format with clear ratings so the frontend could reliably display results.
              </p>
            </div>
          </div>
          <div className="decision override-item">
            <div className="override-label">Correction</div>
            <div>
              <h4>Claude Code Used Wrong Gemini Model</h4>
              <p>
                Claude Code initially referenced a deprecated Gemini model ID. Caught the error in testing
                and corrected it to <code>gemini-2.0-flash</code> before deployment.
              </p>
            </div>
          </div>
          <div className="decision override-item">
            <div className="override-label">Correction</div>
            <div>
              <h4>Agents Recited Background Instead of Probing</h4>
              <p>
                Agents would spend their questions restating the candidate&rsquo;s background rather than
                actually testing depth. Added explicit &ldquo;don&rsquo;t recite the candidate&rsquo;s history&rdquo;
                instructions to each prompt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where Hallucination Risk Is High */}
      <section className="hiw-section">
        <h2>Where Hallucination Risk Is High</h2>
        <p className="section-note">
          Any honest AI project should identify where the models are most likely to produce unreliable output.
        </p>
        <div className="risk-grid">
          <div className="risk-card">
            <span className="risk-level high">High</span>
            <h4>Verdict Accuracy</h4>
            <p>
              Verdicts are subjective and heavily influenced by how articulately a candidate responds.
              A confident but shallow answer may score higher than a thoughtful but hesitant one.
            </p>
          </div>
          <div className="risk-card">
            <span className="risk-level high">High</span>
            <h4>Background Interpretation</h4>
            <p>
              Agents can make incorrect inferences about the depth of a candidate&rsquo;s experience,
              especially when the background spans multiple domains.
            </p>
          </div>
          <div className="risk-card">
            <span className="risk-level medium">Medium</span>
            <h4>Question Quality</h4>
            <p>
              Despite constraints, agents can produce repetitive or overlapping questions across rounds,
              particularly when prompts share similar context.
            </p>
          </div>
          <div className="risk-card">
            <span className="risk-level low">Low</span>
            <h4>Technical Infrastructure</h4>
            <p>
              The code itself is deterministic and was reviewed before deployment. Infrastructure risks
              are standard web-app concerns, not AI-specific.
            </p>
          </div>
        </div>
      </section>

      {/* What I'd Improve With More Time */}
      <section className="hiw-section">
        <h2>What I&rsquo;d Improve With More Time</h2>
        <div className="improvements-list">
          <div className="improvement-item">
            <div className="improvement-icon">1</div>
            <div>
              <h4>Cross-Agent Memory</h4>
              <p>Pass context between interview rounds so later agents can build on earlier answers instead of starting cold.</p>
            </div>
          </div>
          <div className="improvement-item">
            <div className="improvement-icon">2</div>
            <div>
              <h4>Streaming Responses</h4>
              <p>Show text as it&rsquo;s generated rather than waiting for the full response &mdash; dramatically better UX for long answers.</p>
            </div>
          </div>
          <div className="improvement-item">
            <div className="improvement-icon">3</div>
            <div>
              <h4>Prompt Evaluation Framework</h4>
              <p>Automated A/B testing of prompt variations to measure which phrasing produces the most useful interview questions.</p>
            </div>
          </div>
          <div className="improvement-item">
            <div className="improvement-icon">4</div>
            <div>
              <h4>Agent Observability Dashboard</h4>
              <p>Track token usage, response times, and error rates per agent &mdash; the kind of monitoring any production AI system needs.</p>
            </div>
          </div>
          <div className="improvement-item">
            <div className="improvement-icon">5</div>
            <div>
              <h4>Mobile-First Interview UX</h4>
              <p>Redesign the interview flow for mobile screens with better input handling and touch-friendly navigation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Note */}
      <section className="hiw-section personal-note">
        <h2>Why This Role, Why Now</h2>
        <div className="note-card">
          <p>
            The shift to AI-directed development isn&rsquo;t theoretical for me &mdash; it&rsquo;s how I built
            this app (and f1tenthspot.com). I didn&rsquo;t write this code line by line. I architected the system, chose the
            models, wrote the prompts, directed the agents, and made judgment calls when they got
            things wrong.
          </p>
          <p>
            That&rsquo;s exactly what this role requires. I&rsquo;ve spent 10 years working with Ross and
            Pascoe &mdash; I know how they do things. I know the pace, the standards, the
            ambition and the high-performance culture required. I want to be part of what they build next, because I believe the way we build
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
