import { useState } from 'react'
import { usePipeline } from '../hooks/usePipeline'
import { checkUrl } from '../utils/pipelineApi'
import PipelineStage from './PipelineStage'
import DeployedApp from './DeployedApp'
import './PipelineDemo.css'

function PipelineDemo() {
  const {
    pipelineStatus,
    stages,
    targetUrl,
    deployedUrl,
    deployedAt,
    totalDuration,
    projectName,
    sourceFiles,
    visibleStages,
    launch,
    cancel,
    startOver,
    clear,
    retryStage,
  } = usePipeline()

  const [urlCheck, setUrlCheck] = useState(null) // null | 'checking' | { status, ok }

  async function handleCheckUrl() {
    if (!targetUrl) return
    setUrlCheck('checking')
    try {
      const result = await checkUrl(targetUrl)
      setUrlCheck(result)
    } catch {
      setUrlCheck({ status: 0, ok: false })
    }
  }

  return (
    <div className="pipeline-demo">
      <div className="pipeline-demo__header">
        <h2>Watch the Pipeline Build a Real App</h2>
        <p className="pipeline-demo__desc">
          Five AI agents will design, build, review, test, and deploy a real application.
          The app self-destructs after 1 hour.
        </p>
      </div>

      {/* Target URL preview (only when we have one before deploy) */}
      {targetUrl && pipelineStatus !== 'deployed' && (
        <div className="pipeline-demo__target">
          <span className="pipeline-demo__target-label">Target URL:</span>
          <span className="pipeline-demo__target-url">{targetUrl.replace('https://', '')}</span>
          {urlCheck === 'checking' && (
            <span className="pipeline-demo__target-status">Checking...</span>
          )}
          {urlCheck && urlCheck !== 'checking' && (
            <span className={`pipeline-demo__target-status ${urlCheck.ok ? 'pipeline-demo__target-status--live' : ''}`}>
              {urlCheck.ok ? `${urlCheck.status} OK` : '404 Not Found'}
            </span>
          )}
          {pipelineStatus === 'running' && urlCheck !== 'checking' && (
            <button className="pipeline-demo__check-btn" onClick={handleCheckUrl}>
              Check
            </button>
          )}
        </div>
      )}

      {/* Pipeline stages */}
      {pipelineStatus !== 'idle' && (
        <div className="pipeline-demo__stages">
          <div className="pipeline-demo__stages-line" />
          {visibleStages.map(name => (
            <PipelineStage
              key={name}
              name={name}
              stage={stages[name]}
              onRetry={pipelineStatus === 'error' ? retryStage : null}
            />
          ))}
        </div>
      )}

      {/* Deployed result */}
      {pipelineStatus === 'deployed' && deployedUrl && (
        <DeployedApp
          url={deployedUrl}
          deployedAt={deployedAt}
          totalDuration={totalDuration}
          projectName={projectName}
          sourceFiles={sourceFiles}
          onStartOver={startOver}
          onClear={clear}
        />
      )}

      {/* Controls */}
      <div className="pipeline-demo__controls">
        {pipelineStatus === 'idle' && (
          <button className="pipeline-demo__launch" onClick={launch}>
            Launch Pipeline
          </button>
        )}

        {pipelineStatus === 'running' && (
          <button className="pipeline-demo__cancel" onClick={cancel}>
            Cancel Pipeline
          </button>
        )}

        {pipelineStatus === 'error' && (
          <div className="pipeline-demo__error-controls">
            <button className="pipeline-demo__btn pipeline-demo__btn--secondary" onClick={startOver}>
              Start Over
            </button>
            <button className="pipeline-demo__btn pipeline-demo__btn--ghost" onClick={clear}>
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PipelineDemo
