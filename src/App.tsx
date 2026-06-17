import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CRM from './pages/CRM'
import Reports from './pages/Reports'
import Placeholder from './pages/Placeholder'

export function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/calendar" element={<Placeholder title="Calendar" />} />
          <Route path="/marketing" element={<Placeholder title="Marketing" />} />
          <Route path="/automations" element={<Placeholder title="Automations" />} />
          <Route path="/sites" element={<Placeholder title="Sites" />} />
          <Route path="/reputation" element={<Placeholder title="Reputation" />} />
          <Route path="/payments" element={<Placeholder title="Payments" />} />
          <Route path="/memberships" element={<Placeholder title="Memberships" />} />
          <Route path="/forms" element={<Placeholder title="Forms" />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
