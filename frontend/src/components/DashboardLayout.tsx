import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar }    from './Sidebar';
import { Navbar }     from './Navbar';
import { Breadcrumbs } from './Breadcrumbs';

export function DashboardLayout() {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-soft-white">
      {/* Mobile backdrop — tap to close sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-midnight/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMobileToggle={() => setMobileOpen(o => !o)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
