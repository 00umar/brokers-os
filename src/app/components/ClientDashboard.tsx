import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { IntakeRequest, Listing } from '../../lib/database.types';
import {
  Building2,
  MapPin,
  LogOut,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  BedDouble,
  Bath,
  Tag,
} from 'lucide-react';

const WA_NUMBER = '234XXXXXXXXXX'; // TODO: replace with actual WhatsApp business number

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  new: { label: 'Pending Review', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  assigned: { label: 'Assigned', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: CheckCircle2 },
};

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<IntakeRequest[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    const [{ data: inq }, { data: lst }] = await Promise.all([
      supabase
        .from('intake_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('listings')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .limit(4),
    ]);
    setInquiries((inq as IntakeRequest[]) ?? []);
    setListings((lst as Listing[]) ?? []);
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'C';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm leading-none">7</span>
          </div>
          <span className="font-semibold text-white text-sm hidden sm:block">765 Realty</span>
        </Link>
        <div className="flex items-center gap-4">
          {profile?.full_name && (
            <span className="text-gray-400 text-sm hidden sm:block">{profile.full_name}</span>
          )}
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {firstName}!</h1>
          <p className="text-gray-400 text-sm">Here's your 765 Realty client portal.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Inquiries */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white">My Inquiries</h2>
                <Link
                  to="/intake"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Inquiry
                </Link>
              </div>

              {inquiries.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-5">
                    You haven't submitted any inquiries yet.
                  </p>
                  <Link
                    to="/intake"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Submit Your First Inquiry <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.map(inq => {
                    const s = statusConfig[inq.status] ?? statusConfig.new;
                    const Icon = s.icon;
                    return (
                      <div
                        key={inq.id}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm capitalize">
                              {inq.client_type}
                              {inq.property_type ? ` — ${inq.property_type}` : ' — General Inquiry'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-2 mt-0.5">
                              {inq.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {inq.location}
                                </span>
                              )}
                              {inq.budget && (
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {inq.budget}
                                </span>
                              )}
                              <span>· {new Date(inq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${s.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Hot Listings */}
            {listings.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-white">Hot Listings</h2>
                  <span className="text-xs text-gray-500">Featured properties</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {listings.map(lst => (
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
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
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
                          Enquire About This <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact CTA */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
              <div>
                <h3 className="font-semibold text-white mb-1">Need to speak to someone?</h3>
                <p className="text-gray-400 text-sm">
                  Your advisor is available Monday – Saturday, 8am to 6pm.
                </p>
              </div>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hello, I'm a 765 Realty client and I need assistance.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
