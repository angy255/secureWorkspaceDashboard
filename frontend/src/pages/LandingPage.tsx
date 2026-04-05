import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  BarChart2,
  ScrollText,
  Lock,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon:        ShieldCheck,
    title:       'Role-Based Access Control',
    description: 'Granular permission management across every level of your organization. Define roles, assign permissions, and enforce access boundaries consistently.',
  },
  {
    icon:        Users,
    title:       'User Management',
    description: 'Onboard, update, and offboard users efficiently. Full visibility into who has access to what, with search and filtering built in.',
  },
  {
    icon:        BarChart2,
    title:       'Real-Time Analytics',
    description: 'Track user growth, role distribution, and daily login activity through clean, interactive charts powered by live data.',
  },
  {
    icon:        ScrollText,
    title:       'Immutable Audit Trail',
    description: 'Every sensitive action is logged with actor, timestamp, and context. Meet compliance requirements and investigate incidents with confidence.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AA</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">AuthAxis</span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/50 px-4 py-2 rounded-lg transition-colors duration-150"
        >
          Sign in
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <div className="inline-flex items-center gap-2 bg-sage-500/15 text-sage-300 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-sage-500/30">
          <Lock size={11} />
          Secure by design
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight">
          Identity and access,{' '}
          <span className="text-sage-400">fully in your control</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-white/50 max-w-xl leading-relaxed">
          AuthAxis is a production-ready access control dashboard. Manage users, enforce roles,
          monitor analytics, and maintain a complete audit trail — all in one place.
        </p>

        <div className="mt-10">
          <Link
            to="/login"
            className="flex items-center gap-2 bg-sage-500 hover:bg-sage-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors duration-150 shadow-lg shadow-sage-500/20"
          >
            Get started
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 sm:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/30 mb-10">
            What's included
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-sage-500/20 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-sage-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-6 sm:px-12 py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-sage-500 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">AA</span>
          </div>
          <span className="text-white/40 text-xs">AuthAxis</span>
        </div>
        <p className="text-white/25 text-xs">
          &copy; {new Date().getFullYear()} AuthAxis. Built by Angelica Matos. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
