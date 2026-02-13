import { useState, useCallback, useRef, useEffect } from 'react';
import * as api from '../utils/pipelineApi';

const STAGES = ['preflight', 'architect', 'builder', 'reviewer', 'tester', 'fixer', 'deployer'];

const STAGE_LABELS = {
  preflight: 'Preflight',
  architect: 'Architect',
  builder: 'Builder',
  reviewer: 'Reviewer',
  tester: 'Test Agent',
  fixer: 'Bug Fixer',
  deployer: 'Deploy',
};

const INITIAL_STAGE = () => ({
  status: 'pending', // pending | running | complete | error
  label: '',
  output: null,
  error: null,
  errorDetail: null,
  startTime: null,
  duration: null,
});

const STORAGE_KEY = 'bench-pipeline-state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Only restore deployed states (not mid-run states which can't resume)
    if (state.pipelineStatus === 'deployed') return state;
    return null;
  } catch {
    return null;
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function usePipeline() {
  const persisted = loadPersistedState();

  const [pipelineStatus, setPipelineStatus] = useState(persisted?.pipelineStatus || 'idle');
  // idle | running | deployed | error
  const [stages, setStages] = useState(() => {
    if (persisted?.stages) return persisted.stages;
    const s = {};
    for (const name of STAGES) {
      s[name] = { ...INITIAL_STAGE(), label: STAGE_LABELS[name] };
    }
    return s;
  });
  const [projectName, setProjectName] = useState(persisted?.projectName || null);
  const [targetUrl, setTargetUrl] = useState(persisted?.targetUrl || null);
  const [deployedUrl, setDeployedUrl] = useState(persisted?.deployedUrl || null);
  const [deployedAt, setDeployedAt] = useState(persisted?.deployedAt || null);
  const [projectId, setProjectId] = useState(persisted?.projectId || null);
  const [totalDuration, setTotalDuration] = useState(persisted?.totalDuration || null);
  const [sourceFiles, setSourceFiles] = useState(persisted?.sourceFiles || null);

  const cancelledRef = useRef(false);
  const pipelineDataRef = useRef({ spec: null, files: null });
  const projectNameRef = useRef(projectName);
  projectNameRef.current = projectName;

  // Persist deployed state
  useEffect(() => {
    if (pipelineStatus === 'deployed') {
      persistState({
        pipelineStatus, stages, projectName, targetUrl,
        deployedUrl, deployedAt, projectId, totalDuration, sourceFiles,
      });
    }
  }, [pipelineStatus, stages, projectName, targetUrl, deployedUrl, deployedAt, projectId, totalDuration, sourceFiles]);

  const updateStage = useCallback((name, updates) => {
    setStages(prev => ({
      ...prev,
      [name]: { ...prev[name], ...updates },
    }));
  }, []);

  const runStage = useCallback(async (name, fn) => {
    if (cancelledRef.current) throw new Error('Pipeline cancelled');
    const start = performance.now();
    updateStage(name, { status: 'running', startTime: Date.now(), error: null });

    try {
      const result = await fn();
      const duration = ((performance.now() - start) / 1000).toFixed(1);
      updateStage(name, { status: 'complete', output: result, duration: `${duration}s` });
      return result;
    } catch (err) {
      const duration = ((performance.now() - start) / 1000).toFixed(1);
      updateStage(name, {
        status: 'error',
        error: err.message || 'Unknown error',
        errorDetail: err.detail || null,
        duration: `${duration}s`,
      });
      throw err;
    }
  }, [updateStage]);

  const launch = useCallback(async () => {
    cancelledRef.current = false;
    const pipelineStart = performance.now();

    // Reset all stages
    const fresh = {};
    for (const name of STAGES) {
      fresh[name] = { ...INITIAL_STAGE(), label: STAGE_LABELS[name] };
    }
    setStages(fresh);
    setPipelineStatus('running');
    setDeployedUrl(null);
    setDeployedAt(null);
    setProjectId(null);
    setTotalDuration(null);
    setSourceFiles(null);
    pipelineDataRef.current = { spec: null, files: null };

    try {
      // Stage 0: Preflight
      const preflightResult = await runStage('preflight', () => api.preflight());
      setProjectName(preflightResult.projectName);
      setTargetUrl(preflightResult.targetUrl);

      // Stage 1: Architect
      const architectResult = await runStage('architect', () =>
        api.runArchitect(Math.random().toString(36).slice(2))
      );
      pipelineDataRef.current.spec = architectResult.spec;

      // Stage 2: Builder
      const builderResult = await runStage('builder', () =>
        api.runBuilder(architectResult.spec)
      );
      pipelineDataRef.current.files = builderResult.files;
      setSourceFiles(builderResult.files);

      // Stage 3: Reviewer
      const reviewerResult = await runStage('reviewer', () =>
        api.runReviewer(architectResult.spec, builderResult.files)
      );

      // Stage 4: Tester
      let testerResult = await runStage('tester', () =>
        api.runTester(architectResult.spec, builderResult.files)
      );

      // Stage 4.5: Fix loop — if tests fail, send back to Builder for fixes, then re-test
      let fixerResult = null;
      if (testerResult.tests && testerResult.tests.failed > 0) {
        fixerResult = await runStage('fixer', () =>
          api.runFixer(architectResult.spec, builderResult.files, testerResult.tests)
        );
        // Update files with fixed versions
        builderResult.files = fixerResult.files;
        pipelineDataRef.current.files = fixerResult.files;
        setSourceFiles(fixerResult.files);

        // Re-test with fixed files
        testerResult = await runStage('tester', () =>
          api.runTester(architectResult.spec, fixerResult.files)
        );
      } else {
        // Skip fixer — mark as not needed
        updateStage('fixer', { status: 'complete', output: { skipped: true, fixedCount: 0 }, duration: 'skipped' });
      }

      // Stage 5: Deploy (with smoke test → fixer → redeploy loop)
      let currentFiles = builderResult.files;
      let deployAttempts = 0;
      const maxDeployAttempts = 2; // deploy once, if smoke fails fix + redeploy once
      let deployResult;

      while (deployAttempts < maxDeployAttempts) {
        deployAttempts++;

        const buildLog = {
          architect: {
            spec: architectResult.spec,
            notes: architectResult.spec.architectNotes,
          },
          builder: {
            fileCount: builderResult.fileCount,
            notes: builderResult.builderNotes,
            fileNames: Object.keys(currentFiles),
          },
          reviewer: reviewerResult.review,
          tester: testerResult.tests,
          fixer: fixerResult ? { fixNotes: fixerResult.fixNotes, fixedCount: fixerResult.fixedCount } : { skipped: true },
          deployer: {
            projectName: preflightResult.projectName,
            deployedAt: new Date().toISOString(),
            pipelineDuration: `${((performance.now() - pipelineStart) / 1000).toFixed(1)}s`,
          },
          meta: {
            builtBy: 'The Bench — AI Agent Pipeline Demo',
            url: 'https://the-bench.vercel.app/agentops',
          },
        };

        deployResult = await runStage('deployer', () =>
          api.runDeployer(preflightResult.projectName, currentFiles, architectResult.spec, buildLog)
        );

        // Check smoke test — if it failed and we haven't retried yet, run fixer and redeploy
        if (deployResult.smokeTest?.status === 'fail' && deployAttempts < maxDeployAttempts) {
          // Run fixer with smoke test failure info
          fixerResult = await runStage('fixer', () =>
            api.runFixer(architectResult.spec, currentFiles, null, deployResult.smokeTest)
          );
          currentFiles = fixerResult.files;
          pipelineDataRef.current.files = fixerResult.files;
          setSourceFiles(fixerResult.files);

          // Clean up the broken deployment before redeploying
          try { await api.cleanup(preflightResult.projectName); } catch { /* ignore */ }

          // Reset deployer stage for the retry
          updateStage('deployer', { status: 'pending', output: null, error: null, duration: null });
          continue;
        }

        break; // smoke passed or we've exhausted retries
      }

      const total = ((performance.now() - pipelineStart) / 1000).toFixed(1);
      setDeployedUrl(deployResult.url);
      setDeployedAt(Date.now());
      setProjectId(deployResult.projectId);
      setTotalDuration(`${total}s`);
      setPipelineStatus('deployed');
    } catch (err) {
      if (cancelledRef.current) return;
      setPipelineStatus('error');
    }
  }, [runStage]);

  const cancel = useCallback(async () => {
    cancelledRef.current = true;
    // Tear down the project if it was already created during preflight
    const name = projectNameRef.current;
    if (name) {
      try {
        await api.cleanup(name);
      } catch {
        // ignore cleanup errors
      }
    }
    setPipelineStatus('idle');
  }, []);

  const startOver = useCallback(async () => {
    // Cleanup existing deployment if any
    const name = projectNameRef.current;
    if (name) {
      try {
        await api.cleanup(name);
      } catch {
        // ignore cleanup errors
      }
    }
    clearPersistedState();
    setProjectName(null);
    setTargetUrl(null);
    setDeployedUrl(null);
    setDeployedAt(null);
    setProjectId(null);
    setTotalDuration(null);
    setSourceFiles(null);
    setPipelineStatus('idle');

    // Relaunch
    setTimeout(() => launch(), 100);
  }, [launch]);

  const clear = useCallback(async () => {
    // Tear down the deployed app
    const name = projectNameRef.current;
    if (name) {
      try {
        await api.cleanup(name);
      } catch {
        // ignore cleanup errors
      }
    }
    clearPersistedState();
    setProjectName(null);
    setTargetUrl(null);
    setDeployedUrl(null);
    setDeployedAt(null);
    setProjectId(null);
    setTotalDuration(null);
    setSourceFiles(null);
    const fresh = {};
    for (const stageName of STAGES) {
      fresh[stageName] = { ...INITIAL_STAGE(), label: STAGE_LABELS[stageName] };
    }
    setStages(fresh);
    setPipelineStatus('idle');
  }, []);

  const retryStage = useCallback(async (stageName) => {
    if (!pipelineDataRef.current.spec) return;
    setPipelineStatus('running');

    const spec = pipelineDataRef.current.spec;
    const files = pipelineDataRef.current.files;

    try {
      let result;
      switch (stageName) {
        case 'architect':
          result = await runStage('architect', () => api.runArchitect(Math.random().toString(36).slice(2)));
          pipelineDataRef.current.spec = result.spec;
          break;
        case 'builder':
          result = await runStage('builder', () => api.runBuilder(spec));
          pipelineDataRef.current.files = result.files;
          setSourceFiles(result.files);
          break;
        case 'reviewer':
          await runStage('reviewer', () => api.runReviewer(spec, files));
          break;
        case 'tester':
          await runStage('tester', () => api.runTester(spec, files));
          break;
        case 'deployer':
          await runStage('deployer', () => api.runDeployer(projectName, files, spec, {}));
          break;
        default:
          break;
      }
      // Check if all stages are complete
      // This simplified retry just retries one stage — user can continue manually
      setPipelineStatus('error'); // Stay in error so user can proceed
    } catch {
      setPipelineStatus('error');
    }
  }, [runStage, projectName]);

  const cleanupDeployment = useCallback(async () => {
    if (projectName) {
      try {
        await api.cleanup(projectName);
      } catch {
        // ignore
      }
    }
    clear();
  }, [projectName, clear]);

  return {
    // State
    pipelineStatus,
    stages,
    projectName,
    targetUrl,
    deployedUrl,
    deployedAt,
    totalDuration,
    sourceFiles,
    // Computed
    visibleStages: STAGES.filter(s => s !== 'preflight'),
    // Actions
    launch,
    cancel,
    startOver,
    clear,
    retryStage,
    cleanupDeployment,
  };
}
