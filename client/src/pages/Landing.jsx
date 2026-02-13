import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <p className="hero-tagline">You said don&rsquo;t send a CV. So I built this instead.</p>
        <div className="hero-badge">Multi-Agent AI Interview &amp; Pipeline Demo</div>
        <h1 className="hero-title">
          Welcome to <span className="highlight">The Bench</span>
        </h1>
        <p className="hero-bold-subtitle">
          Two ways to prove I can direct AI agents &mdash; interview me, or watch them build.
        </p>
        <Link to="/how-it-works" className="hero-link">
          How This Was Made &rarr;
        </Link>
      </section>

      <div className="features-columns">
        {/* Interview Column */}
        <div className="feature-col feature-col--interview">
          <div className="col-header">
            <span className="col-dot col-dot--blue"></span>
            <h2 className="col-title">Multi-Agent Interview</h2>
          </div>
          <p className="col-subtitle">
            Three AI agents. Three different models. One candidate.
            Each agent conducts its own interview round, then delivers a hiring verdict.
          </p>
          <Link to="/interview" className="btn btn-primary col-cta">
            Start the Interview
          </Link>

          <div className="col-section">
            <h3 className="col-section-title">The Interview Panel</h3>
            <div className="col-cards">
              <div className="agent-card architect">
                <div className="agent-indicator"></div>
                <div className="agent-model">Claude Sonnet 4.5 &middot; Anthropic</div>
                <h4>The Architect</h4>
                <p>
                  Assesses technical depth, system design thinking, and your ability
                  to direct AI agents to build real production systems.
                </p>
              </div>
              <div className="agent-card operator">
                <div className="agent-indicator"></div>
                <div className="agent-model">GPT-4o &middot; OpenAI</div>
                <h4>The Operator</h4>
                <p>
                  Tests your practical ability to run AI agents day-to-day &mdash;
                  shipping product, managing quality, and handling the real-world
                  messiness of AI-assisted development.
                </p>
              </div>
              <div className="agent-card culture">
                <div className="agent-indicator"></div>
                <div className="agent-model">Gemini 2.0 Flash &middot; Google</div>
                <h4>The Culture Lead</h4>
                <p>
                  Explores your alignment with a fast-moving startup, your genuine
                  passion for the AI shift, and whether you&rsquo;d thrive in a small,
                  intense, supportive team.
                </p>
              </div>
            </div>
          </div>

          <div className="col-section">
            <h3 className="col-section-title">The Candidate</h3>
            <div className="about-card">
              <div className="about-content">
                <p className="about-lead">
                  I&rsquo;m Rusty &mdash; and this app is my application.
                </p>
                <p>
                  I&rsquo;ve spent the last decade working alongside Ross and Pascoe &mdash;
                  first at Olikka, the boutique Melbourne systems integrator they took a
                  leap on me to join in 2014, and then at Accenture after the acquisition
                  in 2020. Across many engagements I led Workplace-Strategy and Transformation
                  programs specialising in M365, Modern Workplace, End-User Experience,
                  and Endpoint Management. Most recently at Arinco, I led the delivery
                  of a global Intune Endpoint Management solution for PEXA&rsquo;s 2,000 staff
                  and am currently leading a tenant migration and SCCM-Intune migration
                  (with Autopilot, MDM + MAM) at TAC.
                </p>
                <p>
                  My job has never been just the technology &mdash; it&rsquo;s understanding how
                  people actually work with it, then designing solutions that meet them
                  where they are. Self-service SOE platforms, EUX monitoring dashboards
                  with auto-healing, global device management &mdash; tools built around the
                  human, not the other way around. Ross and Pascoe know that it&rsquo;s people
                  that motivate me, not tech.
                </p>
                <p>
                  That background is exactly why AI-agent development makes sense as my
                  next step. <strong style={{ color: '#ffffff' }}>Directing an AI agent well requires the same instinct I&rsquo;ve
                  been sharpening for years: empathy for the end user, clarity about the
                  outcome, and the discipline to design a workflow instead of just
                  executing tasks.</strong> The bridge between &ldquo;designing better employee
                  experiences&rdquo; and &ldquo;directing AI agents to ship product&rdquo;
                  is shorter than it looks &mdash; both demand someone who thinks in systems,
                  communicates intent precisely, and cares about the quality of what gets
                  delivered.
                </p>
                <p>
                  This app wasn&rsquo;t written by me line by line. It was architected by me
                  and built by three different AI models working together &mdash; exactly
                  the workflow the role demands. Ross and Pascoe are building again,
                  and I want to be part of what comes next. Not out of nostalgia, but
                  because I&rsquo;ve seen first-hand what they&rsquo;re capable of, I trust how they
                  operate, and this time the tools are different. The app <em>is</em> the proof
                  &mdash; and I&rsquo;d love the chance to keep proving it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Column */}
        <div className="feature-col feature-col--pipeline">
          <div className="col-header">
            <span className="col-dot col-dot--purple"></span>
            <h2 className="col-title">Agentic Pipeline Demo</h2>
          </div>
          <p className="col-subtitle">
            Five AI agents. One click. A real web app designed, built, reviewed,
            tested, and deployed to production &mdash; in under two minutes.
          </p>
          <Link to="/agentops" className="btn btn-accent col-cta">
            Run the Pipeline
          </Link>

          <div className="col-section">
            <h3 className="col-section-title">The Agent Team</h3>
            <div className="col-cards">
              <div className="role-card role-card--architect">
                <div className="role-indicator"></div>
                <div className="role-label">Architect &middot; Claude</div>
                <p>Designs the app spec and API contract</p>
              </div>
              <div className="role-card role-card--builder">
                <div className="role-indicator"></div>
                <div className="role-label">Builder &middot; Claude</div>
                <p>Generates all files from the spec</p>
              </div>
              <div className="role-card role-card--reviewer">
                <div className="role-indicator"></div>
                <div className="role-label">Reviewer &middot; GPT-4o</div>
                <p>Checks code quality against the spec</p>
              </div>
              <div className="role-card role-card--tester">
                <div className="role-indicator"></div>
                <div className="role-label">Tester &middot; Gemini Flash</div>
                <p>Runs structural tests on the code</p>
              </div>
              <div className="role-card role-card--fixer">
                <div className="role-indicator"></div>
                <div className="role-label">Bug Fixer &middot; Claude</div>
                <p>Patches failing code before deployment</p>
              </div>
              <div className="role-card role-card--deployer">
                <div className="role-indicator"></div>
                <div className="role-label">Deployer &middot; Vercel API</div>
                <p>Ships to production + smoke test</p>
              </div>
            </div>
          </div>

          <div className="col-section">
            <h3 className="col-section-title">What Gets Built</h3>
            <div className="about-card">
              <div className="about-content">
                <p className="about-lead">
                  A real, live web app &mdash; from a single click.
                </p>
                <p>
                  From one click, the pipeline produces a real, publicly accessible web app.
                  Each app is unique &mdash; different type, variant, theme, and color palette
                  every run.
                </p>
                <p>
                  The deployed app includes a &ldquo;How I Was Built&rdquo; panel showing every
                  agent&rsquo;s real output &mdash; the spec, the code, the review, the test results,
                  and the deployment log.
                </p>
                <p>
                  Apps self-destruct after one hour &mdash; ephemeral by design. This isn&rsquo;t
                  a mock. The URL is live and anyone can visit it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
