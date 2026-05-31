import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  FolderKanban,
  Users,
  Search,
  Bell,
  Menu,
  ChevronLeft,
  Smartphone,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function RootLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const allNavItems = [
    { name: 'Dashboard', to: '/app', icon: LayoutDashboard },
    { name: 'Brokerage Operations', to: '/app/brokerage', icon: Building2 },
    { name: 'Sales & Marketing', to: '/app/sales', icon: TrendingUp },
    { name: 'Project Management', to: '/app/projects', icon: FolderKanban },
    { name: 'Workforce KPI', to: '/app/workforce', icon: Users },
    { name: 'Field Operations', to: '/app/field', icon: Smartphone },
  ];

  const navigation = profile?.role === 'field_worker'
    ? allNavItems.filter(item => item.to === '/app/field')
    : allNavItems;

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200
          transition-all duration-300 ease-in-out
          md:relative md:z-auto md:translate-x-0
          w-64
          ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 flex-shrink-0">
          {!sidebarCollapsed && (
            <Link to="/" onClick={closeMobile} className="flex items-center gap-2 hover:opacity-75 transition-opacity min-w-0">
              <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <span className="font-semibold text-neutral-900 truncate">765 Operations</span>
            </Link>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="md:hidden p-1.5 hover:bg-neutral-100 rounded-md transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </NavLink>
          ))}
          {profile?.role === 'admin' && (
            <NavLink
              to="/app/settings"
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`
              }
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 truncate">{profile?.full_name ?? '...'}</div>
                  <div className="text-xs text-neutral-500 truncate capitalize">{profile?.role?.replace('_', ' ') ?? ''}</div>
                </div>
                <button onClick={signOut} className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4 text-neutral-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:px-6 gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>

          {/* Search — hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search projects, clients, tasks..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* App name on mobile */}
          <span className="md:hidden text-sm font-semibold text-neutral-900 truncate flex-1">765 Operations</span>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
