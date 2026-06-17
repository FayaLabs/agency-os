import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Calendar, Megaphone, Zap, Globe,
  Star, CreditCard, Users2, FileText, BarChart3, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

const nav = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'CRM', to: '/crm', icon: Users },
  { label: 'Calendar', to: '/calendar', icon: Calendar },
  { label: 'Marketing', to: '/marketing', icon: Megaphone },
  { label: 'Automations', to: '/automations', icon: Zap },
  { label: 'Sites', to: '/sites', icon: Globe },
  { label: 'Reputation', to: '/reputation', icon: Star },
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Memberships', to: '/memberships', icon: Users2 },
  { label: 'Forms', to: '/forms', icon: FileText },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
]

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">A</div>
          <span className="font-semibold text-sidebar-foreground text-sm">Agency OS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">Agency OS v1.0</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-background shrink-0 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1 rounded-md hover:bg-muted transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-semibold text-foreground text-sm">Agency OS</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
