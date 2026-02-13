import './HowItWorks.css'

function HowItWorks() {
  return (
    <div className="how-it-works">
      {/* Header — full width */}
      <div className="hiw-header">
        <h1>How This Was Made</h1>
        <p className="hiw-intro">
          This site has two features &mdash; both built entirely by directing AI agents,
          not by writing code line by line. Below is a transparent, side-by-side breakdown of each.
        </p>
      </div>

      {/* Column Headers */}
      <div className="hiw-column-headers">
        <div className="hiw-col-header hiw-col-header--interview">
          <span className="hiw-col-dot hiw-col-dot--blue"></span>
          <span>Multi-Agent Interview</span>
        </div>
        <div className="hiw-col-header hiw-col-header--pipeline">
          <span className="hiw-col-dot hiw-col-dot--purple"></span>
          <span>Agentic Pipeline Demo</span>
        </div>
      </div>

      {/* 1. Architecture */}
      <section className="hiw-section">
        <h2>1. Architecture</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <p>
              <strong>Orchestrator</strong> (Rusty + Claude Code) directs <strong>3 specialist agents</strong>:
              The Architect (Claude), The Operator (GPT-4o), and The Culture Lead (Gemini).
            </p>
            <p>
              Sequential conversation flow &mdash; each agent conducts its own interview round,
              one at a time. The candidate talks to each agent independently.
            </p>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <p>
              <strong>Automated 5-stage pipeline</strong> with <strong>5 AI roles</strong>:
              Architect + Builder + Fixer (Claude), Reviewer (GPT-4o), Tester (Gemini Flash).
            </p>
            <p>
              Each stage feeds its output to the next. From a single click, the pipeline designs,
              builds, reviews, tests, fixes, and deploys a real app to production.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Tech Stack */}
      <section className="hiw-section">
        <h2>2. Tech Stack</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <ul className="hiw-stack-list">
              <li><strong>Frontend:</strong> React + Vite, React Router, vanilla CSS</li>
              <li><strong>Backend:</strong> Vercel serverless functions (one per agent)</li>
              <li><strong>AI:</strong> Anthropic SDK, OpenAI SDK, Google Generative AI SDK</li>
              <li><strong>Deployment:</strong> Vercel</li>
            </ul>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <ul className="hiw-stack-list">
              <li><strong>Frontend:</strong> React hooks state machine, real-time stage updates</li>
              <li><strong>Backend:</strong> Single consolidated serverless function (<code>api/pipeline.js</code>) with action-based routing</li>
              <li><strong>AI:</strong> Same 3 SDKs, plus Vercel Deployment API for project creation, deployment &amp; aliasing</li>
              <li><strong>Deployment:</strong> Vercel (for TheBench) + Vercel API (creates ephemeral demo projects)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. System Prompts */}
      <section className="hiw-section">
        <h2>3. System Prompts</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--architect-color)' }}></span>
                <strong>The Architect &mdash; Claude Sonnet 4.5</strong>
              </div>
              <p><strong>Role:</strong> Senior technical interviewer</p>
              <p><strong>Focus:</strong> Enterprise-to-AI translation &mdash; system decomposition, quality gates, evaluating AI output</p>
              <p><strong>Style:</strong> Sharp, precise, technical but fair</p>
              <p><strong>Why Claude:</strong> Best-in-class at reasoning through complex technical problems</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--operator-color)' }}></span>
                <strong>The Operator &mdash; GPT-4o</strong>
              </div>
              <p><strong>Role:</strong> Practical, operations-focused interviewer</p>
              <p><strong>Focus:</strong> Delivery leadership &mdash; managing teams, timelines, shipping under pressure</p>
              <p><strong>Style:</strong> Direct, pragmatic, dry humour</p>
              <p><strong>Why GPT-4o:</strong> Strong at task-oriented, operational thinking</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--culture-color)' }}></span>
                <strong>The Culture Lead &mdash; Gemini 2.0 Flash</strong>
              </div>
              <p><strong>Role:</strong> Values and vision interviewer</p>
              <p><strong>Focus:</strong> Startup alignment, passion for AI shift, communication clarity</p>
              <p><strong>Style:</strong> Warm but perceptive, follows up on rehearsed answers</p>
              <p><strong>Why Gemini Flash:</strong> Fast, conversational, effective for values-focused dialogue</p>
            </div>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--architect-color)' }}></span>
                <strong>Architect &mdash; Claude</strong>
              </div>
              <p>Picks app type, variant, colour palette, and defines the full API contract. Every subsequent stage works from this spec.</p>
              <p><strong>Output:</strong> Structured JSON spec</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--architect-color)' }}></span>
                <strong>Builder &mdash; Claude</strong>
              </div>
              <p>Generates all files from the spec: frontend HTML/CSS/JS, backend serverless function, and a &ldquo;How I Was Built&rdquo; panel.</p>
              <p><strong>Output:</strong> Complete file set ready to deploy</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--operator-color)' }}></span>
                <strong>Reviewer &mdash; GPT-4o</strong>
              </div>
              <p>Reviews code against the Architect&rsquo;s spec. Flags implementation mismatches, security issues, and accessibility gaps.</p>
              <p><strong>Output:</strong> Issues list with severity ratings</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--culture-color)' }}></span>
                <strong>Tester &mdash; Gemini Flash</strong>
              </div>
              <p>Runs structural tests: DOM elements, API contract matching, error handling. Failures trigger the Fixer.</p>
              <p><strong>Output:</strong> Pass/fail test results</p>
            </div>
            <div className="hiw-prompt-card">
              <div className="hiw-prompt-header">
                <span className="hiw-prompt-dot" style={{ background: 'var(--architect-color)' }}></span>
                <strong>Fixer &mdash; Claude</strong>
              </div>
              <p>Receives failing tests and reviewer issues, patches the code before deployment.</p>
              <p><strong>Output:</strong> Corrected file set</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Orchestration Decisions */}
      <section className="hiw-section">
        <h2>4. Orchestration Decisions</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <div className="hiw-decision-list">
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--blue">1</div>
                <div>
                  <h4>Deliberate Model Selection</h4>
                  <p>Each model chosen for what it&rsquo;s best at &mdash; not one model wearing different hats.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--blue">2</div>
                <div>
                  <h4>Sequential Flow, Not Parallel</h4>
                  <p>Each interview round is a conversation that deserves full attention. Parallel agents would create confusing UX.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--blue">3</div>
                <div>
                  <h4>Constrained Verdict Format</h4>
                  <p>Without strict structure, agents gave meandering conclusions. Structured verdicts with specific ratings keep output useful.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--blue">4</div>
                <div>
                  <h4>Built with Claude Code in Terminal</h4>
                  <p>Entire app scaffolded and built using Claude Code. I directed the architecture; the AI wrote the code.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <div className="hiw-decision-list">
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--purple">1</div>
                <div>
                  <h4>Single Consolidated Function</h4>
                  <p>Vercel has a 12-function limit. Consolidated all pipeline routes into one dispatcher with action-based routing.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--purple">2</div>
                <div>
                  <h4>Test-Fix Loop Before Deploy</h4>
                  <p>Tester results feed back to a Fixer agent before deployment, catching issues before they go live.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--purple">3</div>
                <div>
                  <h4>Post-Deploy Smoke Test</h4>
                  <p>After deployment, a smoke test hits the live API endpoint to verify the app actually works.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--purple">4</div>
                <div>
                  <h4>Inline Build Log Injection</h4>
                  <p>Build log embedded as <code>window.__BUILD_LOG__</code> inline script &mdash; not a separate JSON file that would 404 on Vercel.</p>
                </div>
              </div>
              <div className="hiw-decision">
                <div className="hiw-decision-num hiw-decision-num--purple">5</div>
                <div>
                  <h4>Triple-Redundant Cleanup</h4>
                  <p>Ephemeral apps cleaned up via lazy check, countdown timer, and cron &mdash; no orphaned projects.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Where I Overrode the Agents */}
      <section className="hiw-section">
        <h2>5. Where I Overrode the Agents</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <div className="hiw-override-list">
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Agents Asked Coding Questions</h4>
                <p>Rewrote prompts to focus on system thinking and directing AI agents, not algorithms.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Inconsistent Question Count</h4>
                <p>Constrained each agent to exactly 3 questions for a consistent experience.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Vague Verdict Format</h4>
                <p>Enforced structured verdicts with specific ratings so the frontend could reliably display results.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Wrong Gemini Model ID</h4>
                <p>Claude Code referenced a deprecated model ID. Corrected to <code>gemini-2.0-flash</code>.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Agents Recited Background</h4>
                <p>Added explicit &ldquo;don&rsquo;t recite the candidate&rsquo;s history&rdquo; instructions to each prompt.</p>
              </div>
            </div>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <div className="hiw-override-list">
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>[object Object] in Build Logs</h4>
                <p>Builder produced <code>[object Object]</code> in build log panel. Added explicit formatting rules.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Broken Action Buttons</h4>
                <p>Deployed apps had broken buttons &mdash; field name mismatch between frontend and backend. Added rule #15 + smoke test.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Build Log 404 on Vercel</h4>
                <p>Builder fetched <code>build-log.json</code> (404 on Vercel). Switched to <code>window.__BUILD_LOG__</code> injection.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Hit Vercel 12-Function Limit</h4>
                <p>Consolidated all routes into a single dispatcher with action-based routing.</p>
              </div>
              <div className="hiw-override">
                <span className="hiw-override-label">Correction</span>
                <h4>Deployment Protection Blocked Access</h4>
                <p>Added PATCH call to disable Vercel deployment protection so demo apps are publicly accessible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hallucination Risk */}
      <section className="hiw-section">
        <h2>6. Hallucination Risk</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <div className="hiw-risk-list">
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--high">High</span>
                <h4>Verdict Accuracy</h4>
                <p>Articulate &ne; correct. A confident but shallow answer may score higher than a thoughtful but hesitant one.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--high">High</span>
                <h4>Background Interpretation</h4>
                <p>Agents can make wrong inferences about experience depth, especially across multiple domains.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--medium">Medium</span>
                <h4>Question Quality</h4>
                <p>Despite constraints, agents can produce repetitive or overlapping questions across rounds.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--low">Low</span>
                <h4>Infrastructure</h4>
                <p>Deterministic code, reviewed before deployment. Standard web-app concerns, not AI-specific.</p>
              </div>
            </div>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <div className="hiw-risk-list">
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--high">High</span>
                <h4>Code Generation Quality</h4>
                <p>Builder can produce broken apps. The test-fix loop catches some issues, but not all.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--high">High</span>
                <h4>Field Name Mismatches</h4>
                <p>Frontend and backend can disagree on field names, breaking the deployed app silently.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--medium">Medium</span>
                <h4>Tester False Positives/Negatives</h4>
                <p>May miss real bugs or flag non-issues, reducing confidence in test results.</p>
              </div>
              <div className="hiw-risk-item">
                <span className="hiw-risk-level hiw-risk--low">Low</span>
                <h4>Deployment Mechanics</h4>
                <p>API-driven and deterministic. Vercel handles the infrastructure reliably.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. What I'd Improve */}
      <section className="hiw-section">
        <h2>7. What I&rsquo;d Improve</h2>
        <div className="hiw-columns">
          <div className="hiw-col hiw-col--interview">
            <div className="hiw-improve-list">
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--blue">1</div>
                <div>
                  <h4>Cross-Agent Memory</h4>
                  <p>Pass context between rounds so later agents build on earlier answers.</p>
                </div>
              </div>
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--blue">2</div>
                <div>
                  <h4>Streaming Responses</h4>
                  <p>Show text as it&rsquo;s generated rather than waiting for the full response.</p>
                </div>
              </div>
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--blue">3</div>
                <div>
                  <h4>Prompt A/B Testing</h4>
                  <p>Automated evaluation of prompt variations to measure question quality.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hiw-col hiw-col--pipeline">
            <div className="hiw-improve-list">
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--purple">1</div>
                <div>
                  <h4>Multi-Iteration Fix Loops</h4>
                  <p>Currently one fix pass. Multiple iterations would catch more issues.</p>
                </div>
              </div>
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--purple">2</div>
                <div>
                  <h4>Streaming Stage Output</h4>
                  <p>Stream each stage&rsquo;s output to the frontend in real time.</p>
                </div>
              </div>
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--purple">3</div>
                <div>
                  <h4>Broader App Catalog</h4>
                  <p>More app types and variants for greater demo variety.</p>
                </div>
              </div>
              <div className="hiw-improve-item">
                <div className="hiw-improve-num hiw-improve-num--purple">4</div>
                <div>
                  <h4>Visual Diff of Fixer Changes</h4>
                  <p>Show exactly what the Fixer changed, so the user can see the before/after.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Note — full width, unchanged */}
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
