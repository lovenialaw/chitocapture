import { useEffect } from 'react'
import ProcessMonitoringPage from './pages/ProcessMonitoringPage'
import DataSourcesPage from './pages/DataSourcesPage'
import ScenarioAnalysisPage from './pages/ScenarioAnalysisPage'
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage'
import CarbonFlowPage from './pages/CarbonFlowPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  const page = new URLSearchParams(window.location.search).get('page')
  useEffect(() => {
    const pageTitle = page === 'carbon-flow' ? 'Carbon Flow'
      : page === 'process-monitoring' ? 'Process Monitoring'
        : page === 'scenario-analysis' ? 'Scenario Analysis'
          : page === 'data-sources' ? 'Data & Sources'
            : page === 'reports' ? 'Reports' : 'Executive Dashboard'
    document.title = `ChitoCapture | ${pageTitle}`
  }, [page])
  if (page === 'data-sources') return <DataSourcesPage />
  if (page === 'scenario-analysis') return <ScenarioAnalysisPage />
  if (page === 'process-monitoring') return <ProcessMonitoringPage />
  if (page === 'carbon-flow') return <CarbonFlowPage />
  if (page === 'reports') return <ReportsPage />
  return <ExecutiveDashboardPage />
}

export default App
