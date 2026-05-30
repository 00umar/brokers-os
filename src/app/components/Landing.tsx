import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import type { Listing } from '../../lib/database.types';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  HardHat,
  Users,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Star,
  Briefcase,
  AlertTriangle,
  BarChart2,
  Compass,
  ClipboardList,
  X,
  MessageCircle,
  BedDouble,
  Bath,
} from 'lucide-react';

const WA_NUMBER = '234XXXXXXXXXX'; // TODO: replace with actual WhatsApp business number

const services = [
  {
    icon: Briefcase,
    title: 'Real Estate Brokerage',
    description:
      "Licensed brokers who represent your interests — not the market's. We source, vet, and broker deals across residential, commercial, and industrial property.",
    color: 'bg-sky-500/10 text-sky-400',
  },
  {
    icon: Building2,
    title: 'Property Buying & Selling',
    description:
      'From residential homes to commercial spaces, we guide buyers and sellers through every step — valuation, negotiation, and closing — with full transparency.',
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: TrendingUp,
    title: 'Investment Advisory',
    description:
      'Grow your wealth through strategic real estate investments. We identify high-yield opportunities, assess risk, and manage your portfolio for maximum returns.',
    color: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    icon: HardHat,
    title: 'Property Development',
    description:
      'From land acquisition to turnkey delivery, our development team manages construction projects with precision — on time, on budget, and built to last.',
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    icon: Users,
    title: 'Property Management',
    description:
      "Let us handle the day-to-day. We manage tenants, maintenance, and operations so your investment keeps generating income without the stress.",
    color: 'bg-purple-500/10 text-purple-400',
  },
];

const reasons = [
  'Over a decade of active market presence across residential and commercial sectors',
  'Dedicated brokers assigned to every client — no hand-offs, no call centres',
  'Full-service approach: sourcing, legal, financing guidance, and handover under one roof',
  'Transparent pricing with no hidden fees at any stage',
  'Proven track record with buyers, sellers, and institutional investors',
  'In-house project management team for development and renovation projects',
];

const stats = [
  { value: '500+', label: 'Deals Closed' },
  { value: '₦12B+', label: 'Portfolio Value' },
  { value: '10+', label: 'Years Active' },
  { value: '98%', label: 'Client Satisfaction' },
];

const volatilityPoints = [
  {
    icon: TrendingDown,
    title: 'Rising Material Costs',
    body:
      'Global supply chain disruptions and a weakening naira have pushed cement, steel, and finishing material prices up 40–80% in recent years. Without expert procurement and scheduling, construction budgets spiral fast.',
  },
  {
    icon: BarChart2,
    title: 'Inflation & Currency Risk',
    body:
      "Nigeria's inflation environment means a budget agreed today may be 20–30% short by the time your slab is poured. We plan for this — locking costs where possible and advising on phased builds that protect your capital.",
  },
  {
    icon: AlertTriangle,
    title: 'Labour Market Volatility',
    body:
      "Skilled trade shortages and fluctuating site labour rates catch most developers off guard. Our field operations team manages workforce pipelines and contractor relationships built over years — so delays don't become disasters.",
  },
  {
    icon: Compass,
    title: 'Navigating It All',
    body:
      'The market is unpredictable. Our experience is not. We help you time decisions, structure contracts, and build contingencies that keep your project viable regardless of what the economy does next.',
  },
];

export function Landing() {
  const [showModal, setShowModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'active')
      .limit(3)
      .then(({ data }) => {
        setFeaturedListings((data as Listing[]) ?? []);
        setListingsLoading(false);
      });
  }, []);

  function openModal() {
    setContactName('');
    setContactPhone('');
    setContactMessage('');
    setShowModal(true);
  }

  function buildWhatsAppUrl() {
    const text = `Hi, my name is ${contactName}${contactPhone ? ` (${contactPhone})` : ''}.\n\n${contactMessage}`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">7</span>
            </div>
            <span className="font-semibold text-white text-base">765 Realty</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#services" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
              Services
            </a>
            <a href="#market" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
              Market Insight
            </a>
            <Link
              to="/listings"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block"
            >
              Browse Listings
            </Link>
            <Link
              to="/intake"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Make an Enquiry
            </Link>
            <Link
              to="/login"
              className="text-blue-400 text-sm font-medium hover:text-white transition-colors sm:bg-blue-600 sm:hover:bg-blue-500 sm:text-white sm:px-4 sm:py-2 sm:rounded-lg"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5" />
            Nigeria's Full-Service Real Estate Partner
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Real Estate Done{' '}
            <span className="text-blue-400">Right.</span>
            <br />
            From First Look to Final Keys.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Whether you're buying your first home, selling a commercial property, or building an investment portfolio —
            765 Realty is the partner that gets it done with honesty, speed, and expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Talk to an Advisor
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      {(listingsLoading || featuredListings.length > 0) && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Properties Available Now</h2>
                <p className="text-gray-400 text-sm">No account needed — browse, enquire, get matched.</p>
              </div>
              <Link
                to="/listings"
                className="hidden sm:flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {listingsLoading ? (
              <div className="grid sm:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="w-full h-44 bg-gray-800 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                      <div className="h-8 bg-gray-800 rounded animate-pulse mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-5">
                  {featuredListings.map(lst => (
                    <div
                      key={lst.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors group"
                    >
                      {lst.image_url ? (
                        <img
                          src={lst.image_url}
                          alt={lst.title}
                          className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-44 bg-gray-800 flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-semibold text-white text-sm leading-snug">{lst.title}</h3>
                          {lst.price_label && (
                            <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">
                              {lst.price_label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {lst.location}
                          {lst.property_type && <span>· {lst.property_type}</span>}
                        </div>
                        {(lst.bedrooms || lst.bathrooms) && (
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            {lst.bedrooms && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3" /> {lst.bedrooms} bed
                              </span>
                            )}
                            {lst.bathrooms && (
                              <span className="flex items-center gap-1">
                                <Bath className="w-3 h-3" /> {lst.bathrooms} bath
                              </span>
                            )}
                          </div>
                        )}
                        <Link
                          to="/intake"
                          className="w-full flex items-center justify-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          Enquire About This <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6 sm:hidden">
                  <Link to="/listings" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View all properties <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Services */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Do</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              A complete range of real estate services built around your goals — not ours.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Volatility Section */}
      <section id="market" className="py-24 px-6 bg-gray-900/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <AlertTriangle className="w-3.5 h-3.5" />
                Market Reality Check
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-snug">
                The Economy Is Shifting.<br />
                <span className="text-amber-400">Your Build Shouldn't Pay for It.</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-5">
                Construction in Nigeria today is one of the most financially exposed decisions you can make. Inflation,
                foreign exchange swings, and a volatile supply chain have turned what used to be straightforward projects
                into high-stakes financial exercises.
              </p>
              <p className="text-gray-400 leading-relaxed mb-5">
                We've watched clients lose hundreds of millions of naira on self-managed builds — not because of bad
                intentions, but because they didn't have the right team watching the market while they were busy running
                their lives.
              </p>
              <p className="text-gray-300 leading-relaxed font-medium">
                765 Realty exists precisely for this environment. We've been building in Nigeria through multiple economic
                cycles, and we know exactly how to structure a project so that volatility works for you — not against you.
              </p>
            </div>
            <div className="grid gap-5">
              {volatilityPoints.map((point) => (
                <div
                  key={point.title}
                  className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <point.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-sm">{point.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Clients Choose 765 Realty
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                We don't just close transactions — we build long-term relationships. Every client gets a dedicated team,
                honest advice, and the peace of mind that comes from working with professionals who've seen it all.
              </p>
              <Link
                to="/intake"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Start a conversation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="space-y-4">
              {reasons.map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-24 px-6 bg-gray-900/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who We Work With</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-12">
            Our services are tailored for every stage of the property journey.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Buyers',
                desc: 'Find the right property at the right price. We search, negotiate, and close on your behalf.',
                badge: 'Residential & Commercial',
              },
              {
                title: 'Sellers',
                desc: 'Get maximum value for your property with expert pricing, marketing, and deal management.',
                badge: 'Fast & Transparent',
              },
              {
                title: 'Investors',
                desc: 'Build a profitable portfolio with our market intelligence and end-to-end investment support.',
                badge: 'High-Yield Opportunities',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-7 hover:border-blue-500/30 transition-colors"
              >
                <div className="inline-block bg-blue-600/10 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
                  {item.badge}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Client CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 rounded-2xl p-10 md:p-14 text-center">
            <div className="w-14 h-14 bg-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-5">
              <ClipboardList className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Work With Us?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
              New clients start here. Fill out a short intake form so our team understands exactly what you need —
              we'll reach out within 24 hours to match you with the right advisor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/intake"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
              >
                Submit Client Intake Form <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
              >
                <MessageCircle className="w-4 h-4" /> Speak to Someone First
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-5">Takes less than 3 minutes · No commitment required</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make Your Move?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Talk to one of our advisors today. No pressure, no commitment — just honest guidance
            tailored to your situation.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-7 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Get in Touch <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-gray-900/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Get in Touch</h2>
            <p className="text-gray-400">We're here Monday – Saturday, 8am to 6pm.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: MapPin, label: 'Office', value: 'Lagos, Nigeria' },
              { icon: Phone, label: 'Phone', value: '+234 800 765 0000' },
              { icon: Mail, label: 'Email', value: 'hello@765realty.com' },
            ].map((c) => (
              <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">{c.label}</div>
                  <div className="text-sm text-white font-medium">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">7</span>
            </div>
            <span className="text-gray-400 text-sm">765 Realty © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/intake" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Make an Enquiry →
            </Link>
            <Link to="/client/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Client Portal →
            </Link>
            <Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Staff Portal →
            </Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Get in Touch</h3>
                <p className="text-xs text-gray-500 mt-0.5">We'll respond via WhatsApp within the hour.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Your Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Message <span className="text-red-400">*</span></label>
                <textarea
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Tell us what you're looking for or any questions you have..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowModal(false)}
                className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 rounded-lg transition-colors ${
                  !contactName || !contactMessage
                    ? 'bg-emerald-800 opacity-50 pointer-events-none'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <MessageCircle className="w-4 h-4" /> Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
