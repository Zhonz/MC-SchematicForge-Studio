import { useState, useEffect } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { SceneViewport } from '@/components/SceneViewport'
import { WikiPanel } from '@/components/WikiPanel'
import { StructurePanel } from '@/components/StructurePanel'
import { AIBuildingPanel } from '@/components/AIBuildingPanel'
import { useAppStore } from '@/stores/appStore'
import { logger } from '@/services/loggerService'
import { performanceService } from '@/services/performanceService'

type PanelTab = 'blocks' | 'structures' | null

export function App() {
  const [leftTab, setLeftTab] = useState<PanelTab>('blocks')
  const [rightTab, setRightTab] = useState<'wiki' | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const { initialize, metrics, logs, errors } = useAppStore()

  useEffect(() => {
    initialize()
    logger.info('App component mounted')

    return () => {
      performanceService.stopMonitoring()
    }
  }, [initialize])

  return (
    <div className="app-container">
      <Toolbar
        leftTab={leftTab}
        rightTab={rightTab}
        onToggleLeft={setLeftTab}
        onToggleRight={setRightTab}
        onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
        onToggleDevTools={() => setShowDevTools(!showDevTools)}
        showAIPanel={showAIPanel}
        showDevTools={showDevTools}
      />
      
      <div className="workspace">
        <div className={`sidebar sidebar-left ${leftTab ? 'open' : 'collapsed'}`}>
          {leftTab === 'blocks' && (
            <BlockBrowser />
          )}
          
          {leftTab === 'structures' && (
            <StructurePanel />
          )}
        </div>
        
        <div className="viewport-container">
          <SceneViewport />
          
          {showDevTools && (
            <DevToolsOverlay 
              metrics={metrics} 
              logs={logs} 
              errors={errors}
              onClose={() => setShowDevTools(false)}
            />
          )}
        </div>
        
        <div className={`sidebar sidebar-right ${rightTab ? 'open' : 'collapsed'}`}>
          {rightTab === 'wiki' && (
            <WikiPanel />
          )}
        </div>
      </div>
      
      <StatusBar />
      
      {showAIPanel && (
        <AIBuildingPanel onClose={() => setShowAIPanel(false)} />
      )}
      
      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-elevation-0);
          overflow: hidden;
        }
        
        .workspace {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .sidebar {
          display: flex;
          flex-direction: column;
          background: var(--bg-elevation-1);
          transition: all var(--duration-normal) var(--ease-out);
          overflow: hidden;
        }
        
        .sidebar-left {
          width: 0;
          border-right: 1px solid var(--border-subtle);
        }
        
        .sidebar-left.open {
          width: var(--sidebar-width);
        }
        
        .sidebar-left.collapsed {
          width: 0;
        }
        
        .sidebar-right {
          width: 0;
          border-left: 1px solid var(--border-subtle);
        }
        
        .sidebar-right.open {
          width: var(--sidebar-width);
        }
        
        .sidebar-right.collapsed {
          width: 0;
        }
        
        .viewport-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: var(--bg-elevation-0);
        }
      `}</style>
    </div>
  )
}

function DevToolsOverlay({ 
  metrics, 
  logs, 
  errors, 
  onClose 
}: { 
  metrics: any, 
  logs: any[], 
  errors: any[], 
  onClose: () => void 
}) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'errors'>('metrics')

  return (
    <div className="dev-tools-overlay">
      <div className="dev-tools-header">
        <h3>Developer Tools</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="dev-tools-tabs">
        <button 
          className={activeTab === 'metrics' ? 'active' : ''}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs ({logs.length})
        </button>
        <button 
          className={activeTab === 'errors' ? 'active' : ''}
          onClick={() => setActiveTab('errors')}
        >
          Errors ({errors.length})
        </button>
      </div>
      
      <div className="dev-tools-content">
        {activeTab === 'metrics' && (
          <div className="metrics-panel">
            <div className="metric-item">
              <span className="metric-label">FPS:</span>
              <span className="metric-value">{metrics.fps}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Memory:</span>
              <span className="metric-value">{metrics.memoryUsage}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Render Time:</span>
              <span className="metric-value">{metrics.renderTime.toFixed(2)}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Block Count:</span>
              <span className="metric-value">{metrics.blockCount}</span>
            </div>
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="logs-panel">
            {logs.slice().reverse().map((log, i) => (
              <div key={i} className={`log-entry log-${log.level}`}>
                <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'errors' && (
          <div className="errors-panel">
            {errors.slice().reverse().map((error, i) => (
              <div key={i} className={`error-entry error-${error.severity}`}>
                <div className="error-header">
                  <span className="error-code">{error.code}</span>
                  <span className="error-severity">{error.severity}</span>
                </div>
                <div className="error-message">{error.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .dev-tools-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 300px;
          background: rgba(30, 30, 35, 0.98);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }
        
        .dev-tools-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-elevation-2);
        }
        
        .dev-tools-header h3 {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
        }
        
        .close-btn:hover {
          color: var(--text-primary);
        }
        
        .dev-tools-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          background: var(--bg-elevation-1);
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .dev-tools-tabs button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .dev-tools-tabs button:hover {
          background: var(--bg-elevation-2);
        }
        
        .dev-tools-tabs button.active {
          background: var(--accent-primary);
          color: white;
        }
        
        .dev-tools-content {
          flex: 1;
          overflow: auto;
          padding: 12px;
        }
        
        .metrics-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .metric-item {
          background: var(--bg-elevation-2);
          padding: 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .metric-label {
          color: var(--text-secondary);
          font-size: 12px;
        }
        
        .metric-value {
          color: var(--accent-primary);
          font-size: 18px;
          font-weight: bold;
        }
        
        .logs-panel, .errors-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .log-entry {
          padding: 8px 12px;
          background: var(--bg-elevation-2);
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
        }
        
        .log-debug { border-left: 3px solid #888; }
        .log-info { border-left: 3px solid #4a9eff; }
        .log-warn { border-left: 3px solid #ffa500; }
        .log-error, .log-fatal { border-left: 3px solid #ff4444; }
        
        .log-time {
          color: var(--text-muted);
          margin-right: 8px;
        }
        
        .log-message {
          color: var(--text-primary);
        }
        
        .error-entry {
          padding: 12px;
          background: var(--bg-elevation-2);
          border-radius: 4px;
          border-left: 3px solid #ff4444;
        }
        
        .error-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .error-code {
          color: var(--accent-primary);
          font-weight: bold;
          font-family: monospace;
        }
        
        .error-severity {
          padding: 2px 8px;
          background: var(--bg-elevation-3);
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
        }
        
        .error-message {
          color: var(--text-primary);
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
