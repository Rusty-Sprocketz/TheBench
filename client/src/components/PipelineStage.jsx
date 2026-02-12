import './PipelineStage.css'

const STAGE_COLORS = {
  architect: 'var(--accent-blue, #3b82f6)',
  builder: '#22c55e',
  reviewer: '#f59e0b',
  tester: 'var(--accent-purple, #8b5cf6)',
  fixer: '#f97316',
  deployer: '#ef4444',
}

const STAGE_ICONS = {
  architect: 'Claude',
  builder: 'Claude',
  reviewer: 'GPT-4o',
  tester: 'Gemini',
  fixer: 'Claude',
  deployer: 'Vercel',
}

function getStageSummary(name, stage) {
  if (stage.status === 'running') {
    switch (name) {
      case 'architect': return 'Designing app spec... (~10s)'
      case 'builder': return 'Generating files... (~1-2 min)'
      case 'reviewer': return 'Reviewing code... (~15s)'
      case 'tester': return 'Running tests... (~15s)'
      case 'fixer': return 'Fixing failing tests... (~1-2 min)'
      case 'deployer': return 'Deploying to Vercel... (~30s)'
      default: return 'Working...'
    }
  }

  if (stage.status === 'complete' && stage.output) {
    switch (name) {
      case 'architect':
        return `"${stage.output.spec?.title || 'App designed'}"`;
      case 'builder':
        return `Generated ${stage.output.fileCount || '?'} files`;
      case 'reviewer': {
        const r = stage.output.review;
        return r ? `${r.overallVerdict?.toUpperCase()} — Score: ${r.score}/10` : 'Review complete';
      }
      case 'tester': {
        const t = stage.output.tests;
        return t ? `${t.passed}/${t.totalTests} tests passed` : 'Tests complete';
      }
      case 'fixer':
        if (stage.output.skipped) return 'All tests passed — no fixes needed';
        return `Fixed ${stage.output.fixedCount || '?'} files`;
      case 'deployer':
        return 'Live!';
      default:
        return 'Done';
    }
  }

  if (stage.status === 'error') {
    return stage.error || 'Failed';
  }

  return '';
}

function PipelineStage({ name, stage, onRetry }) {
  const color = STAGE_COLORS[name] || '#666'
  const provider = STAGE_ICONS[name] || ''
  const summary = getStageSummary(name, stage)

  const statusIcon = {
    pending: '○',
    running: '⟳',
    complete: '✓',
    error: '✗',
  }[stage.status]

  return (
    <div className={`pipeline-live-stage pipeline-live-stage--${stage.status}`}>
      <div className="pipeline-live-stage__dot" style={{ borderColor: color }} />

      <div className="pipeline-live-stage__content">
        <div className="pipeline-live-stage__header">
          <div className="pipeline-live-stage__title">
            <span className="pipeline-live-stage__label">{stage.label}</span>
            <span className="pipeline-live-stage__provider">{provider}</span>
          </div>
          <div className="pipeline-live-stage__status">
            <span className={`pipeline-live-stage__icon pipeline-live-stage__icon--${stage.status}`}>
              {statusIcon}
            </span>
            <span className="pipeline-live-stage__status-text">
              {stage.status === 'pending' && 'PENDING'}
              {stage.status === 'running' && 'RUNNING...'}
              {stage.status === 'complete' && (stage.duration === 'skipped' ? 'SKIPPED' : `COMPLETE ${stage.duration}`)}
              {stage.status === 'error' && `ERROR ${stage.duration || ''}`}
            </span>
          </div>
        </div>

        {summary && (
          <div className="pipeline-live-stage__summary">{summary}</div>
        )}

        {stage.status === 'error' && onRetry && (
          <button className="pipeline-live-stage__retry" onClick={() => onRetry(name)}>
            Retry Stage
          </button>
        )}

        {stage.status === 'complete' && name === 'architect' && stage.output?.spec && (
          <details className="pipeline-live-stage__details">
            <summary>View Spec</summary>
            <pre>{JSON.stringify(stage.output.spec, null, 2)}</pre>
          </details>
        )}

        {stage.status === 'complete' && name === 'reviewer' && stage.output?.review && (
          <details className="pipeline-live-stage__details">
            <summary>View Review ({stage.output.review.items?.length || 0} items)</summary>
            <div className="pipeline-live-stage__review-items">
              {stage.output.review.items?.map((item, i) => (
                <div key={i} className={`review-item review-item--${item.status}`}>
                  <span className="review-item__status">
                    {item.status === 'pass' ? '✓' : item.status === 'warning' ? '⚠' : '✗'}
                  </span>
                  <span className="review-item__file">{item.file}</span>
                  <span className="review-item__finding">{item.finding}</span>
                </div>
              ))}
            </div>
            {stage.output.review.summary && (
              <p className="pipeline-live-stage__note">{stage.output.review.summary}</p>
            )}
          </details>
        )}

        {stage.status === 'complete' && name === 'tester' && stage.output?.tests && (
          <details className="pipeline-live-stage__details">
            <summary>View Tests ({stage.output.tests.totalTests} total)</summary>
            <div className="pipeline-live-stage__test-items">
              {stage.output.tests.tests?.map((test, i) => (
                <div key={i} className={`test-item test-item--${test.status}`}>
                  <span className="test-item__status">
                    {test.status === 'pass' ? '✓' : '✗'}
                  </span>
                  <span className="test-item__name">{test.name}</span>
                  <span className="test-item__category">{test.category}</span>
                </div>
              ))}
            </div>
            {stage.output.tests.testerNotes && (
              <p className="pipeline-live-stage__note">{stage.output.tests.testerNotes}</p>
            )}
          </details>
        )}
      </div>
    </div>
  )
}

export default PipelineStage
