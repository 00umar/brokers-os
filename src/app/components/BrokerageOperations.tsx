import { useState, useEffect } from 'react';
import {
  Plus, Filter, Search, MoreVertical, User, DollarSign, MapPin,
  Calendar, AlertCircle, Phone, Mail, Building2, X, Upload, Send,
  Home, Link2, ShieldCheck, TrendingUp, Banknote, Loader2, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Client, Deal, BrokerNote } from '../../lib/database.types';

const TYPE_COLORS: Record<string, string> = {
  buyer: 'bg-blue-100 text-blue-600',
  seller: 'bg-green-100 text-green-600',
  investor: 'bg-purple-100 text-purple-600',
};
function clientColor(type?: string | null) {
  return TYPE_COLORS[type?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-600';
}
function clientInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-gray-100', contacted: 'bg-blue-100', qualified: 'bg-purple-100',
  sourcing: 'bg-orange-100', inspection: 'bg-yellow-100', negotiation: 'bg-green-100', closed: 'bg-emerald-100',
};
const STAGE_BADGE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700', contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700', sourcing: 'bg-orange-100 text-orange-700',
  inspection: 'bg-yellow-100 text-yellow-700', negotiation: 'bg-green-100 text-green-700',
  closed: 'bg-emerald-100 text-emerald-700',
};

const PIPELINE_STAGES = [
  { id: 'new', name: 'New' },
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'sourcing', name: 'Sourcing' },
  { id: 'inspection', name: 'Inspection' },
  { id: 'negotiation', name: 'Negotiation' },
  { id: 'closed', name: 'Closed' },
];

const emptyIntake = {
  client_type: '' as 'buyer' | 'seller' | 'investor' | '',
  property_type: '', requirements: '', budget: '',
  location: '', contact_name: '', contact_email: '', contact_phone: '', company: '',
};

export function BrokerageOperations() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [requestType, setRequestType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Real data
  const [clients, setClients] = useState<Client[]>([]);
  const [dealsByStage, setDealsByStage] = useState<Record<string, Deal[]>>({});
  const [clientDeals, setClientDeals] = useState<Deal[]>([]);
  const [brokerNotes, setBrokerNotes] = useState<BrokerNote[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Intake form
  const [intakeForm, setIntakeForm] = useState(emptyIntake);
  const [intakePropertyType, setIntakePropertyType] = useState('');
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeSuccess, setIntakeSuccess] = useState(false);

  // New request form
  const [newReq, setNewReq] = useState({
    client_type: 'buyer', company: '', contact_name: '', contact_email: '',
    contact_phone: '', property_category: 'Commercial', budget: '', location: '',
    requirements: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => { fetchClients(); fetchDeals(); }, []);

  async function fetchClients() {
    setLoadingClients(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoadingClients(false);
  }

  async function fetchDeals() {
    setLoadingDeals(true);
    const { data } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    const grouped: Record<string, Deal[]> = {};
    for (const deal of data ?? []) {
      if (!grouped[deal.stage]) grouped[deal.stage] = [];
      grouped[deal.stage].push(deal);
    }
    setDealsByStage(grouped);
    setLoadingDeals(false);
  }

  async function handleSelectClient(client: Client) {
    setSelectedClient(client);
    const { data: deals } = await supabase
      .from('deals').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
    setClientDeals(deals ?? []);
    if (deals && deals.length > 0) {
      const { data: notes } = await supabase
        .from('broker_notes').select('*')
        .in('deal_id', deals.map(d => d.id))
        .order('created_at', { ascending: false });
      setBrokerNotes(notes ?? []);
    } else {
      setBrokerNotes([]);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || clientDeals.length === 0) return;
    setSubmittingNote(true);
    const { data } = await supabase.from('broker_notes').insert({
      deal_id: clientDeals[0].id,
      content: newNote.trim(),
      author_name: profile?.full_name ?? 'Broker',
    }).select().single();
    if (data) setBrokerNotes(prev => [data, ...prev]);
    setNewNote('');
    setSubmittingNote(false);
  }

  async function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intakeForm.client_type || !intakeForm.contact_name) return;
    setSubmittingIntake(true);
    await supabase.from('intake_requests').insert({
      client_type: intakeForm.client_type as 'buyer' | 'seller' | 'investor',
      property_type: intakePropertyType || undefined,
      requirements: intakeForm.requirements || undefined,
      budget: intakeForm.budget || undefined,
      location: intakeForm.location || undefined,
      contact_name: intakeForm.contact_name,
      contact_email: intakeForm.contact_email || undefined,
      contact_phone: intakeForm.contact_phone || undefined,
      company: intakeForm.company || undefined,
    });
    setIntakeSuccess(true);
    setSubmittingIntake(false);
    setTimeout(() => {
      setIntakeSuccess(false);
      setIntakeForm(emptyIntake);
      setIntakePropertyType('');
    }, 3000);
  }

  async function handleCreateRequest() {
    if (!requestType || !newReq.contact_name) return;
    setSubmittingRequest(true);
    const { data: newClient } = await supabase.from('clients').insert({
      name: newReq.company || newReq.contact_name,
      email: newReq.contact_email || undefined,
      phone: newReq.contact_phone || undefined,
      type: newReq.client_type as 'buyer' | 'seller' | 'investor',
    }).select().single();
    if (newClient) {
      await supabase.from('deals').insert({
        client_id: newClient.id,
        title: `${requestType} – ${newReq.property_category}`,
        stage: 'new',
        property_type: newReq.property_category || undefined,
        budget_min: undefined,
        location: newReq.location || undefined,
      });
    }
    setSubmittingRequest(false);
    setShowRequestForm(false);
    setRequestType('');
    setNewReq({ client_type: 'buyer', company: '', contact_name: '', contact_email: '', contact_phone: '', property_category: 'Commercial', budget: '', location: '', requirements: '' });
    fetchClients();
    fetchDeals();
  }

  const filteredClients = clients.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalDeals = Object.values(dealsByStage).flat().length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Brokerage Operations</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage client requests from intake to closing</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-6">
          {[
            { id: 'pipeline', label: 'Pipeline Board' },
            { id: 'clients', label: 'Client Accounts' },
            { id: 'intake', label: 'Client Intake Form' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search / Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search deals, clients, properties..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Pipeline Board */}
      {activeTab === 'pipeline' && (
        loadingDeals ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => {
                const stageDeals = dealsByStage[stage.id] ?? [];
                return (
                  <div key={stage.id} className="w-72 flex-shrink-0">
                    <div className={`${STAGE_COLORS[stage.id]} rounded-lg p-3 mb-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 text-sm">{stage.name}</h3>
                          <span className="px-2 py-0.5 bg-white text-neutral-700 rounded-full text-xs font-medium">
                            {stageDeals.length}
                          </span>
                        </div>
                        <button className="p-1 hover:bg-white/50 rounded transition-colors">
                          <Plus className="w-4 h-4 text-neutral-600" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {stageDeals.length === 0 ? (
                        <div className="bg-white rounded-lg border border-dashed border-neutral-200 p-6 text-center">
                          <p className="text-xs text-neutral-400">No deals</p>
                        </div>
                      ) : stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 leading-tight">{deal.title}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{deal.property_type}</p>
                            </div>
                            <button className="p-1 hover:bg-neutral-100 rounded transition-colors" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4 text-neutral-400" />
                            </button>
                          </div>

                          <div className="space-y-1.5 mt-3">
                            {deal.location && (
                              <div className="flex items-center gap-2 text-xs text-neutral-600">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{deal.location}</span>
                              </div>
                            )}
                            {(deal.budget_min || deal.budget_max) && (
                              <div className="flex items-center gap-2 text-xs text-neutral-600">
                                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                  {deal.budget_min ? `$${(deal.budget_min / 1e6).toFixed(1)}M` : ''}
                                  {deal.budget_min && deal.budget_max ? ' – ' : ''}
                                  {deal.budget_max ? `$${(deal.budget_max / 1e6).toFixed(1)}M` : ''}
                                </span>
                              </div>
                            )}
                            {deal.payment_status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                Fee pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Client Accounts */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {loadingClients ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No clients yet. Add one using "New Request".</p>
            </div>
          ) : filteredClients.map((client) => {
            const color = clientColor(client.type);
            const [bgColor, textColor] = color.split(' ');
            return (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="bg-white rounded-xl border border-neutral-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                    <span className={`text-sm font-bold ${textColor}`}>{clientInitials(client.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-neutral-900">{client.name}</h3>
                      {client.type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
                          {client.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Phone className="w-3 h-3" />{client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-neutral-500">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Profile Panel */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-2xl">
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${clientColor(selectedClient.type).split(' ')[0]}`}>
                  <span className={`text-lg font-bold ${clientColor(selectedClient.type).split(' ')[1]}`}>
                    {clientInitials(selectedClient.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{selectedClient.name}</h2>
                  <p className="text-sm text-neutral-500 mt-0.5 capitalize">{selectedClient.type ?? 'Client'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Contact */}
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Contact Details</h3>
                  <div className="grid gap-3">
                    {selectedClient.company && (
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="text-xs text-neutral-500">Company</p>
                          <p className="text-sm font-medium text-neutral-900">{selectedClient.company}</p>
                        </div>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="text-xs text-neutral-500">Phone</p>
                          <p className="text-sm font-medium text-neutral-900">{selectedClient.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="text-xs text-neutral-500">Email</p>
                          <p className="text-sm font-medium text-neutral-900">{selectedClient.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal history */}
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Deal History ({clientDeals.length})
                  </h3>
                  {clientDeals.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic">No deals yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {clientDeals.map((deal) => (
                        <div key={deal.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{deal.title}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {new Date(deal.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STAGE_BADGE[deal.stage] ?? 'bg-gray-100 text-gray-700'}`}>
                            {deal.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Broker notes */}
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Broker Notes</h3>
                  {brokerNotes.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic mb-3">No notes yet.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {brokerNotes.map((note) => (
                        <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-sm text-amber-900">{note.content}</p>
                          <p className="text-xs text-amber-600 mt-1">
                            {note.author_name} · {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {clientDeals.length > 0 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                        placeholder="Add a note..."
                        className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={submittingNote || !newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={() => { setSelectedClient(null); setShowRequestForm(true); }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                New Request for Client
              </button>
              <button onClick={() => setSelectedClient(null)} className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Intake Form */}
      {activeTab === 'intake' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Client-Facing Request Form</p>
                <p className="text-xs text-blue-700 mt-0.5">Share the link or show clients this screen directly.</p>
              </div>
            </div>
          </div>

          {intakeSuccess ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Request Submitted</h3>
              <p className="text-sm text-neutral-500">We'll be in touch within 24 hours with payment details.</p>
            </div>
          ) : (
            <form onSubmit={handleIntakeSubmit} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 bg-neutral-50">
                <h2 className="text-xl font-semibold text-neutral-900">Submit a Property Request</h2>
                <p className="text-sm text-neutral-500 mt-1">Tell us what you need and our broker will get back to you within 24 hours.</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Client type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-3">I am a… *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'buyer', label: 'Buyer', desc: 'Looking to purchase', icon: Home },
                      { id: 'seller', label: 'Seller', desc: 'Want to sell a property', icon: TrendingUp },
                      { id: 'investor', label: 'Investor', desc: 'Seeking investment deals', icon: Banknote },
                    ].map(({ id, label, desc, icon: Icon }) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setIntakeForm(f => ({ ...f, client_type: id as 'buyer' | 'seller' | 'investor' }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                          intakeForm.client_type === id ? 'border-blue-600 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <Icon className={`w-7 h-7 ${intakeForm.client_type === id ? 'text-blue-600' : 'text-neutral-400'}`} />
                        <p className={`text-sm font-semibold ${intakeForm.client_type === id ? 'text-blue-900' : 'text-neutral-800'}`}>{label}</p>
                        <p className="text-xs text-neutral-500">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-3">Property Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Residential', 'Commercial', 'Land', 'Industrial', 'Mixed-Use'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setIntakePropertyType(type)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          intakePropertyType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">Describe what you need *</label>
                  <textarea
                    rows={4}
                    value={intakeForm.requirements}
                    onChange={e => setIntakeForm(f => ({ ...f, requirements: e.target.value }))}
                    placeholder="e.g. I need a 4-bedroom house in Lekki Phase 1, close to the main road."
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Budget Range *</label>
                    <input type="text" value={intakeForm.budget} onChange={e => setIntakeForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. ₦30M – ₦50M" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Preferred Location</label>
                    <input type="text" value={intakeForm.location} onChange={e => setIntakeForm(f => ({ ...f, location: e.target.value }))} placeholder="City, estate, or area" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Full Name *</label>
                    <input type="text" value={intakeForm.contact_name} onChange={e => setIntakeForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Your full name" required className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Phone Number *</label>
                    <input type="tel" value={intakeForm.contact_phone} onChange={e => setIntakeForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+234 800 000 0000" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Email Address</label>
                    <input type="email" value={intakeForm.contact_email} onChange={e => setIntakeForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="you@example.com" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Service fee applies.</span> A service charge is required before your broker begins sourcing. You will be contacted with payment details after submission.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingIntake || !intakeForm.client_type || !intakeForm.contact_name}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingIntake && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Total Clients</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">{clients.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Active Deals</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">{totalDeals}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Closed Deals</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">{dealsByStage['closed']?.length ?? 0}</p>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">New Brokerage Request</h2>
              <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Request type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">Request Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Purchase', 'Sale', 'Lease'].map((type) => (
                    <button key={type} type="button" onClick={() => setRequestType(type)}
                      className={`p-4 rounded-lg border-2 transition-all text-sm font-medium ${requestType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client info */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Client Type</label>
                    <select value={newReq.client_type} onChange={e => setNewReq(r => ({ ...r, client_type: e.target.value }))} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="investor">Investor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Company Name</label>
                    <input type="text" value={newReq.company} onChange={e => setNewReq(r => ({ ...r, company: e.target.value }))} placeholder="e.g. Horizon Properties LLC" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Person *</label>
                    <input type="text" value={newReq.contact_name} onChange={e => setNewReq(r => ({ ...r, contact_name: e.target.value }))} placeholder="Full name" required className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                    <input type="email" value={newReq.contact_email} onChange={e => setNewReq(r => ({ ...r, contact_email: e.target.value }))} placeholder="contact@company.com" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                    <input type="tel" value={newReq.contact_phone} onChange={e => setNewReq(r => ({ ...r, contact_phone: e.target.value }))} placeholder="+234 800 000 0000" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Property requirements */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Property Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Property Category</label>
                    <select value={newReq.property_category} onChange={e => setNewReq(r => ({ ...r, property_category: e.target.value }))} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Commercial</option><option>Residential</option><option>Industrial</option><option>Mixed-Use</option><option>Land</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Budget Range</label>
                    <input type="text" value={newReq.budget} onChange={e => setNewReq(r => ({ ...r, budget: e.target.value }))} placeholder="e.g. $2M – $3M" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Location Preference</label>
                    <input type="text" value={newReq.location} onChange={e => setNewReq(r => ({ ...r, location: e.target.value }))} placeholder="City, district, or area" className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowRequestForm(false)} className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm">Cancel</button>
              <button
                onClick={handleCreateRequest}
                disabled={submittingRequest || !requestType || !newReq.contact_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submittingRequest && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">{selectedDeal.title}</h2>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-1 ${STAGE_BADGE[selectedDeal.stage]}`}>
                  {selectedDeal.stage}
                </span>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedDeal.property_type && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-500">Property Type</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">{selectedDeal.property_type}</p>
                  </div>
                )}
                {selectedDeal.location && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-500">Location</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">{selectedDeal.location}</p>
                  </div>
                )}
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500">Payment Status</p>
                  <p className={`text-sm font-medium mt-0.5 capitalize ${selectedDeal.payment_status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
                    {selectedDeal.payment_status}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500">Created</p>
                  <p className="text-sm font-medium text-neutral-900 mt-0.5">{new Date(selectedDeal.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 mb-1">Drop files here or click to upload</p>
                <p className="text-xs text-neutral-500">PDF, DOC, XLS up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
