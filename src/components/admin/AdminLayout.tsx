import { ChevronRight, ClipboardList, LogOut, Menu, QrCode } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import { clearTokens } from '../../utils/auth';

const NAV = [
  { to: '/horizon-admin/submissions', label: 'Submissions', Icon: ClipboardList },
  { to: '/horizon-admin/campaigns', label: 'Campaigns', Icon: QrCode },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-r from-white/20 to-white/5 text-white border-l-[3px] border-white/80'
      : 'text-blue-100/70 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent'
  }`;

const LogoBand = () => (
  <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900">
    <img src="/LOGO-2-1.webp" alt="LOGICON" className="h-9 w-9 shrink-0 object-contain" />
    <span
      style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.18em' }}
      className="bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-base font-black text-transparent dark:from-blue-300 dark:to-blue-100"
    >
      LOGICON
    </span>
  </div>
);

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentNav = NAV.find((n) => location.pathname.startsWith(n.to));
  const pageTitle = currentNav?.label ?? 'Admin';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleLogout = () => {
    clearTokens();
    navigate('/horizon-admin/login', { replace: true });
  };

  const navContent = (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-blue-900 to-blue-800 dark:from-slate-900 dark:to-slate-800">
      <nav className="flex flex-col gap-1 p-4 pt-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-blue-300/50">
          Navigation
        </p>
        {NAV.map(({ Icon, ...n }) => (
          <NavLink key={n.to} to={n.to} className={linkClass} onClick={() => setDrawerOpen(false)}>
            <Icon className="h-4 w-4 shrink-0" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-blue-200/70 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col shadow-xl md:flex">
        <LogoBand />
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-56 flex-col shadow-2xl">
            <LogoBand />
            {navContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/LOGO-2-1.webp" alt="" className="h-7 w-7 object-contain" />
            <span
              style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.18em' }}
              className="bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-sm font-black text-transparent dark:from-blue-300 dark:to-blue-100"
            >
              LOGICON
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop header — same h-16 as LogoBand so they sit at the same level */}
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500">Horizon Admin</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-slate-400 dark:text-slate-500">{today}</span>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
