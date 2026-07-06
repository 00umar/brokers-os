import { Link } from 'react-router';
import {
  Building2,
  TrendingUp,
  FolderKanban,
  Users,
  Smartphone,
  UserCog,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Globe,
} from 'lucide-react';

const modules = [
  {
    icon: Building2,
    title: 'Brokerage Pipeline',
    description: '7-stage deal pipeline from intake to close. Track every client, property, and offer letter in one board.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Sales & Marketing',
    description: 'Capture and track leads, follow-ups, and partnership activity. Know exactly where each deal stands.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Run construction and renovation projects with phases, tasks, and evidence upload from the field.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: BarChart3,
    title: 'Workforce KPI',
    description: 'Monitor team performance, approve weekly reports, and track output across every role.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Smartphone,
    title: 'Field Operations',
    description: 'Mobile-first view for site workers. Upload evidence, submit reports, and flag blockers on the go.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: UserCog,
    title: 'Team Management',
    description: 'Invite staff, assign roles, and control which modules each manager can access.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
];

const steps = [
  { number: '01', title: 'Create your workspace', body: 'Sign up in under a minute. Your company gets its own isolated workspace from day one.' },
  { number: '02', title: 'Invite your team', body: 'Send invites to brokers, managers, and field workers. Each person sees only what their role needs.' },
  { number: '03', title: 'Start managing', body: 'Log deals, run projects, submit field reports — everything in one place, no spreadsheets needed.' },
];

const forWho = [
  'Real estate brokerages managing multiple deals at once',
  'Property development firms with active construction sites',
  'Agencies with field teams submitting reports or evidence',
  'Sales-driven offices that need lead tracking and follow-up visibility',
  'Managers who need one dashboard instead of ten WhatsApp groups',
];

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-white text-base">BrokerOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-400 text-xs font-medium">Built for real estate teams</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
          The operating system for<br className="hidden md:block" />
          <span className="text-blue-400"> modern brokerages</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          One platform for your deals, projects, field teams, and performance. Stop managing your business across WhatsApp groups and spreadsheets.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Start your free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Sign in to your workspace
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-4">30-day free trial · No credit card required</p>
      </section>

      {/* Modules */}
      <section className="bg-gray-900 border-t border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Everything your team needs</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Six fully integrated modules, each designed for how real estate teams actually work.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div key={m.title} className="bg-gray-800/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <h3 className="text-white font-semibold mb-2">{m.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Up and running in minutes</h2>
          <p className="text-gray-400 max-w-xl mx-auto">No long setup. No consultants. Your team is operational the same day.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="text-5xl font-bold text-blue-600/30 mb-4">{s.number}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-gray-900 border-t border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Built for teams who move fast</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                BrokerOS is designed for real estate agencies, brokerages, and property development firms that need structure — without the enterprise software price tag.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {forWho.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role breakdown */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">One system, every role</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Each person on your team sees exactly what they need — nothing more, nothing less.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { role: 'Admin', desc: 'Full access. Manage team, roles, and every module.' },
            { role: 'Manager', desc: 'Configurable access — you choose which modules they see.' },
            { role: 'Office Staff', desc: 'Brokerage, sales, and workforce modules only.' },
            { role: 'Field Worker', desc: 'Mobile-only view for tasks, reports, and evidence upload.' },
          ].map((r) => (
            <div key={r.role} className="bg-gray-900 border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium text-sm">{r.role}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <ClipboardList className="w-10 h-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to bring order to your operations?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Start your free 30-day trial today. No credit card. No commitment. Cancel any time.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Create your workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="text-gray-400 text-sm">BrokerOS © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Sign in</Link>
            <Link to="/signup" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Start free trial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
