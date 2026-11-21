import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import type { Listing } from '../../lib/database.types';
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  ArrowRight,
  ArrowLeft,
  Search,
  ClipboardList,
} from 'lucide-react';

export function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) ?? []);
        setLoading(false);
      });
  }, []);

  const propertyTypes = [
    ...new Set(listings.map(l => l.property_type).filter((t): t is string => !!t)),
  ];

  const filtered = listings.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      (l.property_type?.toLowerCase().includes(q) ?? false);
    const matchesType = !typeFilter || l.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm leading-none">B</span>
          </div>
          <span className="text-white text-sm font-medium hidden sm:block">Brokers OS</span>
        </div>
        <Link
          to="/intake"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Make an Enquiry
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Available Properties</h1>
          <p className="text-gray-400 text-sm">
            Browse our current listings — no account needed. See something you like? Enquire directly.
          </p>
        </div>

        {/* Search & Filter */}
        {!loading && listings.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            {propertyTypes.length > 1 && (
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 sm:w-56"
              >
                <option value="">All property types</option>
                {propertyTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="w-full h-48 bg-gray-800 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                  <div className="h-8 bg-gray-800 rounded animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty / no results */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 bg-gray-900 border border-gray-800 border-dashed rounded-xl">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">
              {listings.length === 0 ? 'No properties listed yet.' : 'No properties match your search.'}
            </p>
            <p className="text-gray-600 text-sm mb-5">
              {listings.length === 0
                ? 'Our team is updating the portfolio — check back soon.'
                : 'Try a different search or clear your filters.'}
            </p>
            {(search || typeFilter) && (
              <button
                onClick={() => { setSearch(''); setTypeFilter(''); }}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors mb-5 block mx-auto"
              >
                Clear filters
              </button>
            )}
            <Link
              to="/intake"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Submit an Enquiry <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Listings grid */}
        {!loading && filtered.length > 0 && (
          <>
            <p className="text-gray-500 text-sm mb-5">
              {filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} found
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(lst => (
                <div
                  key={lst.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors group flex flex-col"
                >
                  {lst.image_url ? (
                    <img
                      src={lst.image_url}
                      alt={lst.title}
                      className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
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
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
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
                    {lst.description && (
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed flex-1">
                        {lst.description}
                      </p>
                    )}
                    <Link
                      to="/intake"
                      className="mt-auto w-full flex items-center justify-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      Enquire About This <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center border-t border-gray-800 pt-10">
              <p className="text-gray-400 mb-4">Don't see exactly what you need?</p>
              <Link
                to="/intake"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Submit an Enquiry <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-gray-600 text-xs mt-3">
                Tell us what you need — we'll match you with the right property.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
