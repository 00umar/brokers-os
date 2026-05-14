import { BrowserRouter, Routes, Route } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { Dashboard } from './components/Dashboard';
import { BrokerageOperations } from './components/BrokerageOperations';
import { SalesMarketing } from './components/SalesMarketing';
import { ProjectManagement } from './components/ProjectManagement';
import { WorkforceKPI } from './components/WorkforceKPI';
import { FieldOperations } from './components/FieldOperations';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="brokerage" element={<BrokerageOperations />} />
          <Route path="sales" element={<SalesMarketing />} />
          <Route path="projects" element={<ProjectManagement />} />
          <Route path="workforce" element={<WorkforceKPI />} />
          <Route path="field" element={<FieldOperations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}