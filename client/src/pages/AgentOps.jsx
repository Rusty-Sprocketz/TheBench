import { Link } from 'react-router-dom'
import PipelineDemo from '../components/PipelineDemo'
import './AgentOps.css'

function AgentOps() {
  return (
    <div className="agentops">
      <div className="agentops-header">
        <h1>AgenticOps</h1>
        <p className="agentops-subtitle">How I Direct Agentic Pipelines to Ship Software</p>
      </div>

      {/* Live Pipeline Demo */}
      <PipelineDemo />

      {/* Pipeline */}
      <section className="agentops-section">
        <h2>The Agentic Pipeline Explained</h2>
        <p className="agentops-section-note">
          Every feature request flows through the same five-stage agentic pipeline. Each stage has a defined role,
          bounded output, and a human override point where I intervene when needed.
        </p>

        {/* Feature request */}
        <div className="feature-request">
          <div className="feature-request-label">Incoming Feature Request</div>
          <div className="feature-request-input">
            Add user authentication with OAuth and role-based access control<span className="cursor"></span>
          </div>
        </div>

        <div className="pipeline">
          <div className="pipeline-stage architect">
            <div className="pipeline-dot"></div>
            <div className="pipeline-card">
              <h3>Stage 1: Architect</h3>
              <p className="pipeline-role">
                Breaks the feature into components, defines boundaries, and produces a system design
                before any code is written.
              </p>
              <div className="pipeline-output">{`// Output: Component breakdown
{
  "components": ["AuthProvider", "OAuthCallback", "RoleGuard"],
  "api_routes": ["/auth/login", "/auth/callback", "/auth/me"],
  "database": ["users", "sessions", "roles"],
  "dependencies": ["next-auth", "jose"]
}`}</div>
              <div className="pipeline-override">
                <div className="pipeline-override-label">Human Override Point</div>
                I review the component breakdown for over-engineering. Agents love adding abstractions
                nobody asked for &mdash; I remove them here.
              </div>
            </div>
          </div>

          <div className="pipeline-stage builder">
            <div className="pipeline-dot"></div>
            <div className="pipeline-card">
              <h3>Stage 2: Builder</h3>
              <p className="pipeline-role">
                Writes code within the boundaries set by the Architect. Doesn&rsquo;t make design decisions
                &mdash; implements what was specified.
              </p>
              <div className="pipeline-output">{`// Output: Implementation files
src/auth/provider.ts    ✓ 48 lines
src/auth/callback.ts    ✓ 32 lines
src/middleware/guard.ts  ✓ 24 lines
src/db/migrations/001.sql ✓ 18 lines`}</div>
              <div className="pipeline-override">
                <div className="pipeline-override-label">Human Override Point</div>
                I check for security anti-patterns: hardcoded secrets, missing input validation,
                overly permissive CORS. Agents don&rsquo;t think about attack surfaces.
              </div>
            </div>
          </div>

          <div className="pipeline-stage reviewer">
            <div className="pipeline-dot"></div>
            <div className="pipeline-card">
              <h3>Stage 3: Reviewer</h3>
              <p className="pipeline-role">
                Critiques the Builder&rsquo;s output against the Architect&rsquo;s spec. Flags deviations,
                missing edge cases, and code quality issues.
              </p>
              <div className="pipeline-output">{`// Output: Review comments
⚠ callback.ts:14 — no CSRF state parameter in OAuth flow
⚠ guard.ts:8 — role check uses string comparison, not enum
✓ provider.ts — clean, matches spec
⚠ migration — missing index on sessions.user_id`}</div>
              <div className="pipeline-override">
                <div className="pipeline-override-label">Human Override Point</div>
                I triage review comments. Not every warning matters equally &mdash; I decide which
                fixes ship now vs. which become backlog items.
              </div>
            </div>
          </div>

          <div className="pipeline-stage tester">
            <div className="pipeline-dot"></div>
            <div className="pipeline-card">
              <h3>Stage 4: Tester</h3>
              <p className="pipeline-role">
                Generates test cases covering happy paths, edge cases, and failure modes.
                Tests what the code <em>should</em> do, not what it <em>does</em> do.
              </p>
              <div className="pipeline-output">{`// Output: Test suite
✓ auth.login — redirects to OAuth provider
✓ auth.callback — exchanges code for token
✓ auth.callback — rejects invalid state param
✓ guard — allows admin to /admin routes
✓ guard — blocks viewer from /admin routes
✗ guard — missing test for expired session`}</div>
              <div className="pipeline-override">
                <div className="pipeline-override-label">Human Override Point</div>
                I verify test coverage matches real risk. Agents write tests for what&rsquo;s easy to
                test, not what&rsquo;s important to test. I add the uncomfortable edge cases.
              </div>
            </div>
          </div>

          <div className="pipeline-stage deployer">
            <div className="pipeline-dot"></div>
            <div className="pipeline-card">
              <h3>Stage 5: Deployer</h3>
              <p className="pipeline-role">
                Packages the feature, updates configuration, and prepares the deployment.
                Handles environment variables, build steps, and rollback plans.
              </p>
              <div className="pipeline-output">{`// Output: Deployment checklist
☑ Environment vars: OAUTH_CLIENT_ID, OAUTH_SECRET
☑ Database migration: 001_auth_tables.sql
☑ Build: passing (0 errors, 0 warnings)
☑ Rollback: revert migration + remove env vars`}</div>
              <div className="pipeline-override">
                <div className="pipeline-override-label">Human Override Point</div>
                I make the final ship/no-ship call. No agent decides when production changes go live
                &mdash; that&rsquo;s always a human decision.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="agentops-section">
        <h2>Orchestration Principles</h2>
        <p className="agentops-section-note">
          These are the rules I follow when directing agents. They come from building real things,
          not from theory.
        </p>

        <div className="principles-grid">
          <div className="principle-card">
            <div className="principle-number">01</div>
            <h4>Agents Don&rsquo;t Decide Scope</h4>
            <p>
              The human defines what gets built and how big it is.
              Agents execute within boundaries, they don&rsquo;t set them.
            </p>
          </div>
          <div className="principle-card">
            <div className="principle-number">02</div>
            <h4>Constrain Output Format</h4>
            <p>
              Vague instructions produce vague results. Every agent gets a specific
              output format so I can reliably use what it produces.
            </p>
          </div>
          <div className="principle-card">
            <div className="principle-number">03</div>
            <h4>Review Before Trusting</h4>
            <p>
              Agent output is a draft, not a deliverable. Everything gets reviewed
              before it touches production &mdash; no exceptions.
            </p>
          </div>
          <div className="principle-card">
            <div className="principle-number">04</div>
            <h4>Sequential When It Matters</h4>
            <p>
              Parallel execution is faster, but some stages depend on others.
              The orchestrator&rsquo;s job is knowing which is which.
            </p>
          </div>
          <div className="principle-card">
            <div className="principle-number">05</div>
            <h4>Ship, Then Improve</h4>
            <p>
              Perfect is the enemy of shipped. Get the feature working, then
              iterate. Agents make iteration cheap.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="agentops-cta">
        <p>
          This isn&rsquo;t theoretical &mdash; hit &ldquo;Launch Pipeline&rdquo; above and watch
          five agents build a real app from scratch.
        </p>
        <p>
          <Link to="/how-it-works">See the full technical breakdown &rarr;</Link>
        </p>
      </div>
    </div>
  )
}

export default AgentOps
