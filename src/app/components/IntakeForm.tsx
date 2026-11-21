import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Listing } from '../../lib/database.types';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  ChevronRight,
  UserCircle,
} from 'lucide-react';

type Step = 1 | 2 | 3;

const clientTypes = [
  { value: 'buyer', label: 'I want to Buy', desc: 'Looking for a property to purchase' },
  { value: 'seller', label: 'I want to Sell', desc: 'I have a property I want to sell' },
  { value: 'investor', label: 'I want to Invest', desc: 'Seeking investment & development opportunities' },
];

const propertyTypes = [
  'Residential (Apartment/Flat)',
  'Residential (Detached House)',
  'Commercial Office',
  'Commercial Retail',
  'Land / Plot',
  'Industrial / Warehouse',
  'Mixed-Use Development',
  'Short-Let / Vacation',
];

export function IntakeForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);

  const [form, setForm] = useState({
    client_type: '',
    property_type: '',
    requirements: '',
    budget: '',
    location: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company: '',
  });

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'active')
      .limit(3)
      .then(({ data }) => {
        setListings((data as Listing[]) ?? []);
        setListingsLoaded(true);
      });
  }, []);

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const basePayload = {
      client_type: form.client_type as 'buyer' | 'seller' | 'investor',
      property_type: form.property_type || null,
      requirements: form.requirements || null,
      budget: form.budget || null,
      location: form.location || null,
      contact_name: form.contact_name,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      company: form.company || null,
    };

    // Include user_id if logged in as a client (links inquiry to their account)
    const payload = user?.id ? { ...basePayload, user_id: user.id } : basePayload;

    let { error: submitError } = await supabase.from('intake_requests').insert(payload);

    if (submitError && user?.id) {
      // user_id column may not exist yet — retry without it
      const result = await supabase.from('intake_requests').insert(basePayload);
      submitError = result.error;
    }

    setLoading(false);
    if (submitError) {
      setError('Something went wrong submitting your request. Please try again or contact us directly.');
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Request Received</h2>
          <p className="text-gray-400 mb-2 leading-relaxed">
            Thank you, <span className="text-white">{form.contact_name}</span>. Your intake request has been submitted
            to our team.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            One of our advisors will reach out within 24 hours on your preferred contact.
          </p>

          {user ? (
            <div className="space-y-3">
              <Link
                to="/client/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors"
              >
                View in Your Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mb-5">
                <UserCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-300 text-sm font-medium mb-1">Create a free account</p>
                <p className="text-gray-400 text-xs">
                  Track the status of this inquiry, get updates from your advisor, and see matched listings — all in one place.
                </p>
              </div>
              <Link
                to="/client/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Create Account to Track This <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">B</span>
            </div>
            <span className="text-white text-sm font-medium">Brokers OS</span>
          </div>
          {!user && (
            <Link
              to="/client/login"
              className="hidden sm:inline-flex items-center gap-1.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserCircle className="w-3.5 h-3.5" /> Client Login
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-14">
          {/* Form — left / main */}
          <div className="lg:col-span-3">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-10">
              {([1, 2, 3] as Step[]).map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step === n
                        ? 'bg-blue-600 text-white'
                        : step > n
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-sm ${step === n ? 'text-white' : 'text-gray-600'}`}>
                    {n === 1 ? 'Your Needs' : n === 2 ? 'Property Details' : 'Contact Info'}
                  </span>
                  {n < 3 && (
                    <div className={`flex-1 h-px w-8 ${step > n ? 'bg-emerald-600' : 'bg-gray-800'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">What can we help you with?</h1>
                <p className="text-gray-400 mb-8">Select what best describes your situation.</p>
                <div className="space-y-3 mb-8">
                  {clientTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => set('client_type', t.value)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        form.client_type === t.value
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                          form.client_type === t.value ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                        }`}
                      />
                      <div>
                        <div className="font-medium text-white">{t.label}</div>
                        <div className="text-sm text-gray-400">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  disabled={!form.client_type}
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Tell us about the property</h1>
                <p className="text-gray-400 mb-8">The more detail you share, the better we can match you.</p>
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Property Type</label>
                    <select
                      value={form.property_type}
                      onChange={e => set('property_type', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select a type...</option>
                      {propertyTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Location / Area of Interest</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      placeholder="e.g. Lekki Phase 1, Abuja, Port Harcourt…"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Budget Range</label>
                    <input
                      type="text"
                      value={form.budget}
                      onChange={e => set('budget', e.target.value)}
                      placeholder="e.g. ₦50M – ₦120M"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Requirements & Notes</label>
                    <textarea
                      value={form.requirements}
                      onChange={e => set('requirements', e.target.value)}
                      placeholder="Any specific needs — number of bedrooms, timeline, special conditions, etc."
                      rows={4}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">How do we reach you?</h1>
                <p className="text-gray-400 mb-8">We'll use this to connect you with the right advisor.</p>
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={e => set('contact_name', e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={form.contact_phone}
                      onChange={e => set('contact_phone', e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={form.contact_email}
                      onChange={e => set('contact_email', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Company / Organisation{' '}
                      <span className="text-gray-600">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => set('company', e.target.value)}
                      placeholder="Your company name, if applicable"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={!form.contact_name || loading}
                    onClick={handleSubmit}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
                <p className="text-gray-600 text-xs text-center mt-4">
                  Your information is kept private and never shared with third parties.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar — hot listings */}
          <div className="lg:col-span-2 mt-12 lg:mt-0">
            <div className="sticky top-8">
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  Hot Listings
                </span>
                <p className="text-gray-500 text-xs mt-2">Properties currently available</p>
              </div>

              {!listingsLoaded ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="w-full h-32 bg-gray-800 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-8 text-center">
                  <Building2 className="w-7 h-7 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">Featured listings coming soon.</p>
                  <Link
                    to="/listings"
                    className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                  >
                    Browse all properties →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map(lst => (
                    <div
                      key={lst.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/20 transition-colors group"
                    >
                      {lst.image_url ? (
                        <img
                          src={lst.image_url}
                          alt={lst.title}
                          className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-800 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-gray-600" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-medium text-white text-xs leading-snug">{lst.title}</h4>
                          {lst.price_label && (
                            <span className="text-emerald-400 font-bold text-xs whitespace-nowrap">
                              {lst.price_label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {lst.location}
                        </div>
                        {(lst.bedrooms || lst.bathrooms) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {lst.bedrooms && (
                              <span className="flex items-center gap-0.5">
                                <BedDouble className="w-3 h-3" /> {lst.bedrooms}
                              </span>
                            )}
                            {lst.bathrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="w-3 h-3" /> {lst.bathrooms}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-gray-600 text-xs text-center">
                    Interested in one of these?{' '}
                    <button
                      onClick={() => set('client_type', 'buyer')}
                      className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    >
                      Select "I want to Buy"
                    </button>{' '}
                    and mention it in requirements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
