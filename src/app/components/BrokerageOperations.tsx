import { useState, useEffect } from 'react';
import {
  Plus, Search, DollarSign, MapPin, Phone, Mail, Building2, X,
  Send, Home, ShieldCheck, TrendingUp, Banknote, Loader2,
  CheckCircle2, Star, StarOff, Trash2, Edit3, Tag, BedDouble, Bath,
  ClipboardList, Check, MoreVertical, Upload, FileText, AlertTriangle, Printer,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import type { Client, Deal, BrokerNote, IntakeRequest, Listing, DealStage, SalesTask, OfferLetter } from '../../lib/database.types';

// ── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { id: DealStage; name: string }[] = [
  { id: 'new', name: 'New' },
  { id: 'contacted', name: 'Contacted' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'sourcing', name: 'Sourcing' },
  { id: 'inspection', name: 'Inspection' },
  { id: 'negotiation', name: 'Negotiation' },
  { id: 'closed', name: 'Closed' },
];

const STAGE_COL: Record<string, string> = {
  new: 'bg-gray-100', contacted: 'bg-blue-100', qualified: 'bg-purple-100',
  sourcing: 'bg-orange-100', inspection: 'bg-yellow-100',
  negotiation: 'bg-green-100', closed: 'bg-emerald-100',
};
const STAGE_BADGE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700', contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700', sourcing: 'bg-orange-100 text-orange-700',
  inspection: 'bg-yellow-100 text-yellow-700', negotiation: 'bg-green-100 text-green-700',
  closed: 'bg-emerald-100 text-emerald-700',
};
const INTAKE_BADGE: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700', assigned: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-purple-100 text-purple-700', completed: 'bg-emerald-100 text-emerald-700',
};
const CLIENT_TYPE_COLOR: Record<string, string> = {
  buyer: 'bg-blue-100 text-blue-700',
  seller: 'bg-green-100 text-green-700',
  investor: 'bg-purple-100 text-purple-700',
};

const SOCIAL_LEADS = [
  { id: 'SL-001', platform: 'instagram', name: 'Chukwuemeka Obi',   property: 'Duplex — Lekki Phase 1',       interaction: 'DM inquiry via story ad',                  timestamp: '2 hours ago', status: 'new' },
  { id: 'SL-002', platform: 'tiktok',    name: 'Fatima Abubakar',   property: 'Studio Apartment — Abuja',     interaction: 'Clicked link in bio + filled form',        timestamp: '5 hours ago', status: 'new' },
  { id: 'SL-003', platform: 'instagram', name: 'Adewale Fashola',   property: '3-Bed Terrace — VGC',          interaction: 'Liked ad + sent DM',                       timestamp: '1 day ago',   status: 'contacted' },
  { id: 'SL-004', platform: 'tiktok',    name: 'Ngozi Eze',         property: 'Investment Land — Epe',        interaction: 'Completed lead gen form on TikTok',        timestamp: '2 days ago',  status: 'qualified' },
  { id: 'SL-005', platform: 'instagram', name: 'Bashir Mohammed',   property: 'Penthouse — Eko Atlantic',     interaction: 'Saved post + profile visit',               timestamp: '3 days ago',  status: 'new' },
];

const SOCIAL_STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const emptyListing = {
  title: '', description: '', price_label: '', location: '',
  property_type: '', bedrooms: '', bathrooms: '', image_url: '',
  is_featured: false, status: 'active' as Listing['status'],
};
const emptyReq = {
  client_type: 'buyer', company: '', contact_name: '', contact_email: '',
  contact_phone: '', property_category: 'Residential', budget: '', location: '',
};
const emptyIntakeForm = {
  client_type: '' as 'buyer' | 'seller' | 'investor' | '',
  property_type: '', requirements: '', budget: '', location: '',
  contact_name: '', contact_email: '', contact_phone: '', company: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BrokerageOperations() {
  const { profile } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'intake' | 'clients' | 'listings' | 'social' | 'analytics'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [dealsByStage, setDealsByStage] = useState<Record<string, Deal[]>>({});
  const [intakes, setIntakes] = useState<IntakeRequest[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingIntakes, setLoadingIntakes] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);

  // Deal detail modal
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealNotes, setDealNotes] = useState<BrokerNote[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ title: '', property_type: '', location: '', budget_min: '', budget_max: '' });
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealNote, setDealNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [pipelineStageFilter, setPipelineStageFilter] = useState<DealStage | 'all'>('all');

  // Sales support
  const [dealSalesTasks, setDealSalesTasks] = useState<SalesTask[]>([]);
  const [showSalesRequest, setShowSalesRequest] = useState(false);
  const [salesRequestForm, setSalesRequestForm] = useState({ action: '', assigned_to_name: '', due_date: '' });
  const [savingSalesRequest, setSavingSalesRequest] = useState(false);

  // Offer letters
  const [dealLetters, setDealLetters] = useState<OfferLetter[]>([]);
  const [viewingLetter, setViewingLetter] = useState<{ letter: OfferLetter; deal: Deal; clientName: string } | null>(null);
  const [savingLetterStatus, setSavingLetterStatus] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState<string | null>(null);

  // Client profile panel
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDeals, setClientDeals] = useState<Deal[]>([]);
  const [clientNotes, setClientNotes] = useState<BrokerNote[]>([]);
  const [clientNote, setClientNote] = useState('');
  const [savingClientNote, setSavingClientNote] = useState(false);

  // New request modal
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [newReq, setNewReq] = useState({ ...emptyReq });
  const [submittingReq, setSubmittingReq] = useState(false);

  // Listing form modal
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [listingForm, setListingForm] = useState({ ...emptyListing });
  const [savingListing, setSavingListing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Log inquiry modal
  const [showLogInquiry, setShowLogInquiry] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ ...emptyIntakeForm });
  const [intakePropType, setIntakePropType] = useState('');
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeSuccess, setIntakeSuccess] = useState(false);

  // Intake queue
  const [intakeFilter, setIntakeFilter] = useState<'all' | 'new' | 'in-progress' | 'completed'>('all');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Social leads
  const [addedSocialLeadIds, setAddedSocialLeadIds] = useState<Set<string>>(new Set());
  const [addingSocialLeadId, setAddingSocialLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
    fetchClients();
    fetchIntakes();
    fetchListings();
  }, []);

  // ── Fetchers ─────────────────────────────────────────────────────────────

  async function fetchDeals() {
    setLoadingDeals(true);
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    const grouped: Record<string, Deal[]> = {};
    for (const d of data ?? []) {
      if (!grouped[d.stage]) grouped[d.stage] = [];
      grouped[d.stage].push(d);
    }
    setDealsByStage(grouped);
    setLoadingDeals(false);
  }

  async function fetchClients() {
    setLoadingClients(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoadingClients(false);
  }

  async function fetchIntakes() {
    setLoadingIntakes(true);
    const { data } = await supabase.from('intake_requests').select('*').order('created_at', { ascending: false });
    setIntakes((data as IntakeRequest[]) ?? []);
    setLoadingIntakes(false);
  }

  async function fetchListings() {
    setLoadingListings(true);
    const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
    setListings((data as Listing[]) ?? []);
    setLoadingListings(false);
  }

  // ── Social leads ──────────────────────────────────────────────────────────

  async function addSocialToPipeline(lead: typeof SOCIAL_LEADS[0]) {
    setAddingSocialLeadId(lead.id);
    const { data: client } = await supabase.from('clients').insert({
      name: lead.name,
      type: 'buyer' as const,
    }).select().single();
    if (client) {
      await supabase.from('deals').insert({
        client_id: client.id,
        title: `${lead.name} — ${lead.platform === 'instagram' ? 'Instagram' : 'TikTok'} Lead`,
        stage: 'new' as const,
        payment_status: 'pending' as const,
      });
      fetchClients();
      fetchDeals();
    }
    setAddedSocialLeadIds(prev => new Set([...prev, lead.id]));
    setAddingSocialLeadId(null);
  }

  // ── Deal handlers ─────────────────────────────────────────────────────────

  async function openDeal(deal: Deal) {
    setSelectedDeal(deal);
    setEditMode(false);
    setEditData({
      title: deal.title,
      property_type: deal.property_type ?? '',
      location: deal.location ?? '',
      budget_min: deal.budget_min ? String(deal.budget_min) : '',
      budget_max: deal.budget_max ? String(deal.budget_max) : '',
    });
    const { data } = await supabase
      .from('broker_notes').select('*').eq('deal_id', deal.id)
      .order('created_at', { ascending: false });
    setDealNotes(data ?? []);
    const { data: tasks } = await supabase
      .from('sales_tasks').select('*').eq('deal_id', deal.id)
      .order('created_at', { ascending: false });
    setDealSalesTasks((tasks as SalesTask[]) ?? []);
    const { data: letters } = await supabase
      .from('offer_letters').select('*').eq('deal_id', deal.id);
    setDealLetters((letters as OfferLetter[]) ?? []);
    setShowSalesRequest(false);
    setSalesRequestForm({ action: '', assigned_to_name: '', due_date: '' });
  }

  async function changeStage(stage: DealStage) {
    if (!selectedDeal) return;
    setChangingStage(true);
    await supabase.from('deals').update({ stage }).eq('id', selectedDeal.id);
    setSelectedDeal(d => d ? { ...d, stage } : null);
    setChangingStage(false);
    fetchDeals();
  }

  async function saveDealEdit() {
    if (!selectedDeal) return;
    setSavingDeal(true);
    const updates = {
      title: editData.title,
      property_type: editData.property_type || null,
      location: editData.location || null,
      budget_min: editData.budget_min ? Number(editData.budget_min) : null,
      budget_max: editData.budget_max ? Number(editData.budget_max) : null,
    };
    await supabase.from('deals').update(updates).eq('id', selectedDeal.id);
    setSelectedDeal(d => d ? { ...d, ...updates } : null);
    setSavingDeal(false);
    setEditMode(false);
    fetchDeals();
  }

  async function togglePayment(deal: Deal) {
    const status = deal.payment_status === 'paid' ? 'pending' : 'paid';
    await supabase.from('deals').update({ payment_status: status }).eq('id', deal.id);
    setSelectedDeal(d => d ? { ...d, payment_status: status } : null);
    fetchDeals();
  }

  async function addDealNote() {
    if (!dealNote.trim() || !selectedDeal) return;
    setSavingNote(true);
    const { data } = await supabase.from('broker_notes').insert({
      deal_id: selectedDeal.id,
      content: dealNote.trim(),
      author_name: profile?.full_name ?? 'Broker',
      stage_at_time: selectedDeal.stage,
    }).select().single();
    if (data) setDealNotes(p => [data, ...p]);
    setDealNote('');
    setSavingNote(false);
  }

  async function assignToSales() {
    if (!selectedDeal || !salesRequestForm.action.trim()) return;
    setSavingSalesRequest(true);
    const { data } = await supabase.from('sales_tasks').insert({
      deal_id: selectedDeal.id,
      subject: selectedDeal.title,
      action: salesRequestForm.action.trim(),
      assigned_to_name: salesRequestForm.assigned_to_name || undefined,
      due_date: salesRequestForm.due_date || undefined,
      status: 'pending',
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (data) {
      setDealSalesTasks(p => [data as SalesTask, ...p]);
      setSalesRequestForm({ action: '', assigned_to_name: '', due_date: '' });
      setShowSalesRequest(false);
    }
    setSavingSalesRequest(false);
  }

  // ── Offer letter handlers ─────────────────────────────────────────────────

  async function generateLetter(letterType: OfferLetter['letter_type'], partyType: OfferLetter['party_type']) {
    if (!selectedDeal) return;
    const existing = dealLetters.find(l => l.letter_type === letterType && l.party_type === partyType);
    if (existing) {
      openLetterView(existing, selectedDeal);
      return;
    }
    const key = `${letterType}-${partyType}`;
    setGeneratingLetter(key);
    const { data } = await supabase.from('offer_letters').insert({
      deal_id: selectedDeal.id,
      letter_type: letterType,
      party_type: partyType,
      status: 'draft',
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (data) {
      const letter = data as OfferLetter;
      setDealLetters(prev => [...prev, letter]);
      openLetterView(letter, selectedDeal);
    }
    setGeneratingLetter(null);
  }

  function openLetterView(letter: OfferLetter, deal: Deal) {
    const client = clients.find(c => c.id === deal.client_id);
    setViewingLetter({ letter, deal, clientName: client?.name ?? 'Client' });
  }

  async function updateLetterStatus(id: string, status: 'sent' | 'signed') {
    setSavingLetterStatus(true);
    const updates: Partial<OfferLetter> = { status };
    if (status === 'sent') (updates as Record<string, unknown>).sent_at = new Date().toISOString();
    if (status === 'signed') (updates as Record<string, unknown>).signed_at = new Date().toISOString();
    await supabase.from('offer_letters').update(updates).eq('id', id);
    setDealLetters(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    setViewingLetter(v => v && v.letter.id === id ? { ...v, letter: { ...v.letter, ...updates } } : v);
    setSavingLetterStatus(false);
  }

  // ── Client handlers ───────────────────────────────────────────────────────

  async function openClient(client: Client) {
    setSelectedClient(client);
    const { data: deals } = await supabase
      .from('deals').select('*').eq('client_id', client.id)
      .order('created_at', { ascending: false });
    setClientDeals(deals ?? []);
    if (deals && deals.length > 0) {
      const { data: notes } = await supabase
        .from('broker_notes').select('*')
        .in('deal_id', deals.map(d => d.id))
        .order('created_at', { ascending: false });
      setClientNotes(notes ?? []);
    } else {
      setClientNotes([]);
    }
  }

  async function addClientNote() {
    if (!clientNote.trim() || clientDeals.length === 0) return;
    setSavingClientNote(true);
    const { data } = await supabase.from('broker_notes').insert({
      deal_id: clientDeals[0].id,
      content: clientNote.trim(),
      author_name: profile?.full_name ?? 'Broker',
    }).select().single();
    if (data) setClientNotes(p => [data, ...p]);
    setClientNote('');
    setSavingClientNote(false);
  }

  // ── Intake handlers ───────────────────────────────────────────────────────

  async function convertIntake(intake: IntakeRequest) {
    setConvertingId(intake.id);
    const { data: client } = await supabase.from('clients').insert({
      name: intake.contact_name,
      email: intake.contact_email || undefined,
      phone: intake.contact_phone || undefined,
      company: intake.company || undefined,
      type: intake.client_type,
    }).select().single();
    if (client) {
      await supabase.from('deals').insert({
        client_id: client.id,
        title: `${intake.client_type.charAt(0).toUpperCase() + intake.client_type.slice(1)} – ${intake.property_type ?? 'General'}`,
        stage: 'new' as DealStage,
        property_type: intake.property_type || undefined,
        location: intake.location || undefined,
        payment_status: 'pending',
      });
    }
    await supabase.from('intake_requests').update({ status: 'in-progress' }).eq('id', intake.id);
    setConvertingId(null);
    fetchClients();
    fetchDeals();
    fetchIntakes();
  }

  async function updateIntakeStatus(id: string, status: IntakeRequest['status']) {
    await supabase.from('intake_requests').update({ status }).eq('id', id);
    setIntakes(p => p.map(i => i.id === id ? { ...i, status } : i));
  }

  // ── Listing handlers ──────────────────────────────────────────────────────

  function openListingForm(listing?: Listing) {
    setEditingListing(listing ?? null);
    setListingForm(listing ? {
      title: listing.title,
      description: listing.description ?? '',
      price_label: listing.price_label ?? '',
      location: listing.location,
      property_type: listing.property_type ?? '',
      bedrooms: listing.bedrooms ? String(listing.bedrooms) : '',
      bathrooms: listing.bathrooms ? String(listing.bathrooms) : '',
      image_url: listing.image_url ?? '',
      is_featured: listing.is_featured,
      status: listing.status,
    } : { ...emptyListing });
    setShowListingForm(true);
  }

  async function saveListing(e: React.FormEvent) {
    e.preventDefault();
    if (!listingForm.title || !listingForm.location) return;
    setSavingListing(true);
    const payload = {
      title: listingForm.title,
      description: listingForm.description || undefined,
      price_label: listingForm.price_label || undefined,
      location: listingForm.location,
      property_type: listingForm.property_type || undefined,
      bedrooms: listingForm.bedrooms ? Number(listingForm.bedrooms) : undefined,
      bathrooms: listingForm.bathrooms ? Number(listingForm.bathrooms) : undefined,
      image_url: listingForm.image_url || undefined,
      is_featured: listingForm.is_featured,
      status: listingForm.status,
    };
    if (editingListing) {
      await supabase.from('listings').update(payload).eq('id', editingListing.id);
    } else {
      await supabase.from('listings').insert(payload);
    }
    setSavingListing(false);
    setShowListingForm(false);
    fetchListings();
  }

  async function deleteListing(id: string) {
    setDeletingId(id);
    await supabase.from('listings').delete().eq('id', id);
    setListings(p => p.filter(l => l.id !== id));
    setDeletingId(null);
  }

  async function toggleFeatured(listing: Listing) {
    const val = !listing.is_featured;
    await supabase.from('listings').update({ is_featured: val }).eq('id', listing.id);
    setListings(p => p.map(l => l.id === listing.id ? { ...l, is_featured: val } : l));
  }

  async function toggleListingStatus(listing: Listing) {
    const status = listing.status === 'active' ? 'sold' : 'active';
    await supabase.from('listings').update({ status }).eq('id', listing.id);
    setListings(p => p.map(l => l.id === listing.id ? { ...l, status } : l));
  }

  async function uploadListingImage(file: File) {
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      setListingForm(f => ({ ...f, image_url: data.publicUrl }));
    }
    setUploadingImage(false);
  }

  // ── New request handler ───────────────────────────────────────────────────

  async function createRequest() {
    if (!requestType || !newReq.contact_name) return;
    setSubmittingReq(true);
    const { data: client } = await supabase.from('clients').insert({
      name: newReq.company || newReq.contact_name,
      email: newReq.contact_email || undefined,
      phone: newReq.contact_phone || undefined,
      type: newReq.client_type as 'buyer' | 'seller' | 'investor',
    }).select().single();
    if (client) {
      await supabase.from('deals').insert({
        client_id: client.id,
        title: `${requestType} – ${newReq.property_category}`,
        stage: 'new' as DealStage,
        property_type: newReq.property_category || undefined,
        location: newReq.location || undefined,
        payment_status: 'pending',
      });
    }
    setSubmittingReq(false);
    setShowNewRequest(false);
    setRequestType('');
    setNewReq({ ...emptyReq });
    fetchClients();
    fetchDeals();
  }

  // ── Log inquiry handler ───────────────────────────────────────────────────

  async function submitLogInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!intakeForm.client_type || !intakeForm.contact_name) return;
    setSubmittingIntake(true);
    await supabase.from('intake_requests').insert({
      client_type: intakeForm.client_type as 'buyer' | 'seller' | 'investor',
      property_type: intakePropType || undefined,
      requirements: intakeForm.requirements || undefined,
      budget: intakeForm.budget || undefined,
      location: intakeForm.location || undefined,
      contact_name: intakeForm.contact_name,
      contact_email: intakeForm.contact_email || undefined,
      contact_phone: intakeForm.contact_phone || undefined,
      company: intakeForm.company || undefined,
    });
    setIntakeSuccess(true);
    fetchIntakes();
    setTimeout(() => {
      setIntakeSuccess(false);
      setIntakeForm({ ...emptyIntakeForm });
      setIntakePropType('');
      setShowLogInquiry(false);
    }, 2000);
    setSubmittingIntake(false);
  }

  // ── Letter template ───────────────────────────────────────────────────────

  function renderLetterBody(letter: OfferLetter, deal: Deal, clientName: string) {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const ref = `765-${deal.id.slice(0, 8).toUpperCase()}`;
    const budgetStr = deal.budget_min || deal.budget_max
      ? [
          deal.budget_min ? `₦${(deal.budget_min / 1_000_000).toFixed(1)}M` : '',
          deal.budget_max ? `₦${(deal.budget_max / 1_000_000).toFixed(1)}M` : '',
        ].filter(Boolean).join(' – ')
      : 'To be agreed';
    const partyLabel = letter.party_type === 'buyer' ? 'Buyer / Purchaser' : 'Seller / Vendor';
    const actionLabel = letter.party_type === 'buyer' ? 'purchase' : 'sale';

    if (letter.letter_type === 'commission_agreement') {
      return (
        <div className="space-y-5 text-sm text-neutral-800 leading-relaxed font-serif">
          <div className="text-center pb-5 border-b-2 border-neutral-800">
            <h2 className="text-2xl font-bold uppercase tracking-widest font-sans">765 Realty</h2>
            <p className="text-xs text-neutral-500 mt-1 font-sans">Professional Real Estate Services</p>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider font-sans">Commission Agreement & Authority to Act</h3>
          </div>
          <div className="flex justify-between text-xs text-neutral-500 font-sans">
            <span>Date: {today}</span>
            <span>Ref: {ref}</span>
          </div>
          <p>To: <strong>{clientName}</strong> ({partyLabel})</p>
          <p>
            This Agreement is entered into between <strong>765 Realty</strong> ("the Agent") and{' '}
            <strong>{clientName}</strong> ("the Principal") in respect of the transaction described below.
          </p>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-1.5 text-xs font-sans border border-neutral-200">
            <p><span className="font-semibold w-32 inline-block">Transaction:</span>{deal.title}</p>
            {deal.location && <p><span className="font-semibold w-32 inline-block">Location:</span>{deal.location}</p>}
            {deal.property_type && <p><span className="font-semibold w-32 inline-block">Property Type:</span>{deal.property_type}</p>}
            <p><span className="font-semibold w-32 inline-block">Agreed Value:</span>{budgetStr}</p>
            <p><span className="font-semibold w-32 inline-block">Party Type:</span>{partyLabel}</p>
          </div>
          <p className="font-bold uppercase text-xs tracking-wide font-sans">Terms and Conditions</p>
          <ol className="list-decimal pl-5 space-y-2 text-xs font-sans">
            <li><strong>Mandate:</strong> The Principal hereby grants 765 Realty the exclusive authority to act as Agent in facilitating the {actionLabel} of the above-referenced property.</li>
            <li><strong>Commission:</strong> The Principal agrees to pay 765 Realty a professional service commission of <strong>5% (five percent)</strong> of the final agreed transaction value upon successful completion of the transaction.</li>
            <li><strong>Scope of Services:</strong> This commission covers all professional services rendered including property sourcing/marketing, client negotiations, due diligence coordination, and transaction management.</li>
            <li><strong>Payment Terms:</strong> Commission shall be remitted to 765 Realty on or before the date of signing of the final Agreement of Sale / Deed of Assignment / Transfer of Title.</li>
            <li><strong>Exclusivity:</strong> The Principal agrees not to engage any other agent for this specific transaction while this agreement remains in effect.</li>
            <li><strong>Validity:</strong> This agreement remains valid until the transaction is completed or either party provides 30 days' written notice of termination.</li>
          </ol>
          <p className="text-xs text-neutral-600 italic font-sans">
            By signing below, I confirm that I have read, understood, and agree to the terms set out in this Commission Agreement.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase text-neutral-500 font-sans">Principal / Client</p>
              <div className="space-y-2 text-xs font-sans">
                <p>Name: __________________________</p>
                <div className="border-b border-neutral-400 mt-6 mb-1" />
                <p>Signature</p>
                <p>Date: ___________________________</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase text-neutral-500 font-sans">For 765 Realty</p>
              <div className="space-y-2 text-xs font-sans">
                <p>Name: __________________________</p>
                <div className="border-b border-neutral-400 mt-6 mb-1" />
                <p>Authorised Signature</p>
                <p>Date: ___________________________</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-neutral-400 pt-4 border-t border-neutral-200 font-sans">
            765 Realty · Professional Real Estate Services · operations@765realty.com
          </p>
        </div>
      );
    }

    // Settlement Instruction
    return (
      <div className="space-y-5 text-sm text-neutral-800 leading-relaxed font-serif">
        <div className="text-center pb-5 border-b-2 border-neutral-800">
          <h2 className="text-2xl font-bold uppercase tracking-widest font-sans">765 Realty</h2>
          <p className="text-xs text-neutral-500 mt-1 font-sans">Professional Real Estate Services</p>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider font-sans">Settlement & Payment Instruction</h3>
        </div>
        <div className="flex justify-between text-xs text-neutral-500 font-sans">
          <span>Date: {today}</span>
          <span>Ref: {ref}</span>
        </div>
        <p>To: <strong>{clientName}</strong> ({partyLabel})</p>
        <p>
          This letter serves as formal settlement instruction in connection with the real estate transaction described below.
          Please read carefully and acknowledge by signing where indicated.
        </p>
        <div className="bg-neutral-50 rounded-lg p-4 space-y-1.5 text-xs font-sans border border-neutral-200">
          <p><span className="font-semibold w-40 inline-block">Transaction:</span>{deal.title}</p>
          {deal.location && <p><span className="font-semibold w-40 inline-block">Location:</span>{deal.location}</p>}
          <p><span className="font-semibold w-40 inline-block">Transaction Value:</span>{budgetStr}</p>
          <p><span className="font-semibold w-40 inline-block">Professional Fee (5%):</span>To be confirmed in writing</p>
        </div>
        <p className="font-bold uppercase text-xs tracking-wide font-sans">Commission Payment Details</p>
        <div className="bg-blue-50 rounded-lg p-4 space-y-1.5 text-xs border border-blue-200 font-sans">
          <p className="font-semibold text-blue-900 mb-2">Remit to:</p>
          <p><span className="font-semibold w-36 inline-block">Account Name:</span>765 Realty Limited</p>
          <p><span className="font-semibold w-36 inline-block">Bank:</span>{companySettings?.bank_name ?? <span className="text-red-500 italic">Not set — configure in Company Settings</span>}</p>
          <p><span className="font-semibold w-36 inline-block">Account Number:</span>{companySettings?.bank_account_number ?? <span className="text-red-500 italic">Not set</span>}</p>
          <p><span className="font-semibold w-36 inline-block">Sort Code:</span>{companySettings?.bank_sort_code ?? <span className="text-red-500 italic">Not set</span>}</p>
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-xs font-sans">
          <li>Transfer the commission amount to the account details above.</li>
          <li>Upon transfer, send proof of payment to: <strong>operations@765realty.com</strong></li>
          <li>This instruction must be completed within <strong>48 hours</strong> of deal closure confirmation.</li>
          <li>Title transfer and all further facilitation by 765 Realty will only proceed upon confirmation of cleared funds.</li>
        </ol>
        <p className="text-xs text-neutral-600 italic font-sans">
          By signing below, I acknowledge receipt of this settlement instruction and confirm my commitment to remit the professional fee as outlined above.
        </p>
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase text-neutral-500 font-sans">Client / Principal</p>
            <div className="space-y-2 text-xs font-sans">
              <p>Name: __________________________</p>
              <div className="border-b border-neutral-400 mt-6 mb-1" />
              <p>Signature</p>
              <p>Date: ___________________________</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase text-neutral-500 font-sans">For 765 Realty</p>
            <div className="space-y-2 text-xs font-sans">
              <p>Name: __________________________</p>
              <div className="border-b border-neutral-400 mt-6 mb-1" />
              <p>Authorised Signature</p>
              <p>Date: ___________________________</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-neutral-400 pt-4 border-t border-neutral-200 font-sans">
          765 Realty · Professional Real Estate Services · operations@765realty.com
        </p>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const allDeals = Object.values(dealsByStage).flat();
  const pipelineDeals = allDeals
    .filter(d => pipelineStageFilter === 'all' || d.stage === pipelineStageFilter)
    .filter(d => !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  const newIntakeCount = intakes.filter(i => i.status === 'new').length;

  const filteredClients = clients.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );
  const filteredIntakes = intakes.filter(i => {
    const matchStatus = intakeFilter === 'all' || i.status === intakeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      i.contact_name.toLowerCase().includes(q) ||
      (i.location?.toLowerCase().includes(q) ?? false) ||
      (i.property_type?.toLowerCase().includes(q) ?? false);
    return matchStatus && matchSearch;
  });
  const filteredListings = listings.filter(l =>
    !searchQuery ||
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Brokerage Operations</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage deals from enquiry to closing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogInquiry(true)}
            className="px-4 py-2 border border-neutral-200 bg-white rounded-lg hover:bg-neutral-50 text-sm flex items-center gap-2 transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Log Inquiry
          </button>
          <button
            onClick={() => setShowNewRequest(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-6 overflow-x-auto">
          {([
            { id: 'pipeline', label: 'Pipeline Board' },
            { id: 'intake', label: 'Intake Queue', badge: newIntakeCount > 0 ? newIntakeCount : null },
            { id: 'clients', label: 'Client Accounts' },
            { id: 'listings', label: 'Listings' },
            { id: 'social', label: 'Social Leads' },
            { id: 'analytics', label: 'Analytics' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      {activeTab !== 'analytics' && activeTab !== 'social' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'pipeline' ? 'Search deals...' :
              activeTab === 'intake' ? 'Search inquiries by name or location...' :
              activeTab === 'clients' ? 'Search clients...' : 'Search listings...'
            }
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* ── Pipeline Board ────────────────────────────────────────────────── */}
      {activeTab === 'pipeline' && (
        loadingDeals ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stage filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setPipelineStageFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pipelineStageFilter === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                All ({allDeals.length})
              </button>
              {PIPELINE_STAGES.map(stage => {
                const count = dealsByStage[stage.id]?.length ?? 0;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setPipelineStageFilter(stage.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pipelineStageFilter === stage.id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {stage.name}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Deals table */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              {pipelineDeals.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-neutral-400">No deals found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px]">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Deal</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Client</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stage</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Budget</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {pipelineDeals.map(deal => {
                        const client = clients.find(c => c.id === deal.client_id);
                        return (
                          <tr
                            key={deal.id}
                            onClick={() => openDeal(deal)}
                            className="hover:bg-neutral-50 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-neutral-900">{deal.title}</p>
                              {deal.property_type && (
                                <p className="text-xs text-neutral-400 mt-0.5">{deal.property_type}</p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {client ? (
                                <div>
                                  <p className="text-sm text-neutral-900">{client.name}</p>
                                  {client.type && (
                                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium capitalize ${CLIENT_TYPE_COLOR[client.type] ?? 'bg-gray-100 text-gray-700'}`}>
                                      {client.type}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STAGE_BADGE[deal.stage]}`}>
                                {deal.stage}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-neutral-700">
                              {deal.budget_min || deal.budget_max ? (
                                <>
                                  {deal.budget_min ? `₦${(deal.budget_min / 1e6).toFixed(1)}M` : ''}
                                  {deal.budget_min && deal.budget_max ? ' – ' : ''}
                                  {deal.budget_max ? `₦${(deal.budget_max / 1e6).toFixed(1)}M` : ''}
                                </>
                              ) : <span className="text-neutral-400">—</span>}
                            </td>
                            <td className="px-5 py-4 text-sm text-neutral-500">
                              {deal.location ?? <span className="text-neutral-400">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${
                                deal.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {deal.payment_status === 'paid' ? 'Fee paid' : 'Fee pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Intake Queue ──────────────────────────────────────────────────── */}
      {activeTab === 'intake' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['all', 'new', 'in-progress', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setIntakeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  intakeFilter === f
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {f === 'all' ? 'All' : f.replace('-', ' ')}
                {f === 'new' && newIntakeCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1">{newIntakeCount}</span>
                )}
              </button>
            ))}
          </div>

          {loadingIntakes ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredIntakes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-xl">
              <ClipboardList className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-400">No inquiries found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIntakes.map(intake => (
                <div key={intake.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${CLIENT_TYPE_COLOR[intake.client_type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {initials(intake.contact_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <p className="font-semibold text-neutral-900 text-sm">{intake.contact_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTAKE_BADGE[intake.status]}`}>
                            {intake.status.replace('-', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CLIENT_TYPE_COLOR[intake.client_type] ?? 'bg-gray-100 text-gray-700'}`}>
                            {intake.client_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                          {intake.property_type && <span>{intake.property_type}</span>}
                          {intake.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{intake.location}
                            </span>
                          )}
                          {intake.budget && (
                            <span className="flex items-center gap-0.5">
                              <Tag className="w-3 h-3" />{intake.budget}
                            </span>
                          )}
                          {intake.contact_phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3" />{intake.contact_phone}
                            </span>
                          )}
                        </div>
                        {intake.requirements && (
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{intake.requirements}</p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(intake.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {intake.status === 'new' && (
                        <button
                          onClick={() => convertIntake(intake)}
                          disabled={convertingId === intake.id}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {convertingId === intake.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />}
                          Convert to Deal
                        </button>
                      )}
                      {intake.status === 'in-progress' && (
                        <button
                          onClick={() => updateIntakeStatus(intake.id, 'completed')}
                          className="px-3 py-1.5 border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Client Accounts ───────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          {loadingClients ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-xl">
              <Building2 className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-400">No clients yet. Add one using "New Request".</p>
            </div>
          ) : filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => openClient(client)}
              className="bg-white border border-neutral-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${CLIENT_TYPE_COLOR[client.type ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                  {initials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-neutral-900">{client.name}</p>
                    {client.type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CLIENT_TYPE_COLOR[client.type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {client.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                    {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                  </div>
                </div>
                <p className="text-xs text-neutral-400 flex-shrink-0">
                  {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Listings ─────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">{listings.length} listing{listings.length !== 1 ? 's' : ''} total</p>
            <button
              onClick={() => openListingForm()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Listing
            </button>
          </div>

          {loadingListings ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-xl">
              <Building2 className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-400">No listings yet.</p>
              <button onClick={() => openListingForm()} className="mt-3 text-sm text-blue-600 hover:underline">
                Add your first listing
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map(listing => (
                <div key={listing.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-neutral-100 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-neutral-900 text-sm leading-snug">{listing.title}</p>
                      {listing.price_label && (
                        <span className="text-emerald-600 font-bold text-sm whitespace-nowrap">{listing.price_label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {listing.location}
                      {listing.property_type && <span>· {listing.property_type}</span>}
                    </div>
                    {(listing.bedrooms || listing.bathrooms) && (
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                        {listing.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{listing.bedrooms} bed</span>}
                        {listing.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{listing.bathrooms} bath</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                      {/* Status toggle */}
                      <button
                        onClick={() => toggleListingStatus(listing)}
                        className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                          listing.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {listing.status === 'active' ? 'Active' : 'Sold'}
                      </button>
                      {/* Featured toggle */}
                      <button
                        onClick={() => toggleFeatured(listing)}
                        title={listing.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        className={`p-1.5 rounded-md transition-colors ${listing.is_featured ? 'text-amber-500 bg-amber-50' : 'text-neutral-300 hover:text-amber-400 hover:bg-amber-50'}`}
                      >
                        {listing.is_featured ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1" />
                      {/* Edit */}
                      <button
                        onClick={() => openListingForm(listing)}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        disabled={deletingId === listing.id}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {deletingId === listing.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Analytics ─────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Clients', value: clients.length },
              { label: 'Total Deals', value: allDeals.length },
              { label: 'Closed Deals', value: dealsByStage['closed']?.length ?? 0 },
              { label: 'Fees Pending', value: allDeals.filter(d => d.payment_status === 'pending').length },
            ].map(card => (
              <div key={card.label} className="bg-white border border-neutral-200 rounded-xl p-5">
                <p className="text-sm text-neutral-500 mb-2">{card.label}</p>
                <p className="text-3xl font-semibold text-neutral-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Pipeline funnel */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Pipeline Breakdown</h3>
            <div className="space-y-3">
              {PIPELINE_STAGES.map(stage => {
                const count = dealsByStage[stage.id]?.length ?? 0;
                const max = Math.max(...PIPELINE_STAGES.map(s => dealsByStage[s.id]?.length ?? 0), 1);
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-600 w-28 flex-shrink-0">{stage.name}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${STAGE_COL[stage.id].replace('bg-', 'bg-').replace('-100', '-400')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intake summary */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Inquiry Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['new', 'in-progress', 'completed'] as const).map(s => (
                <div key={s} className={`rounded-lg p-4 ${INTAKE_BADGE[s].split(' ')[0].replace('text', 'bg').replace('-700', '-50')}`}>
                  <p className={`text-xs font-medium capitalize ${INTAKE_BADGE[s].split(' ')[1]}`}>{s.replace('-', ' ')}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-1">
                    {intakes.filter(i => i.status === s).length}
                  </p>
                </div>
              ))}
              <div className="rounded-lg p-4 bg-neutral-50">
                <p className="text-xs font-medium text-neutral-500">Total Enquiries</p>
                <p className="text-2xl font-semibold text-neutral-900 mt-1">{intakes.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Social Leads ──────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <p className="text-sm text-pink-800">
              <span className="font-medium">Simulation mode.</span> These are mock leads from Instagram and TikTok campaigns. Click <span className="font-medium">Add to Pipeline</span> to create a client record and open a deal at stage <em>New</em>.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Platform</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Property Interest</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Interaction</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {SOCIAL_LEADS.map(lead => {
                    const isAdded = addedSocialLeadIds.has(lead.id);
                    const isAdding = addingSocialLeadId === lead.id;
                    return (
                      <tr key={lead.id} className={`transition-colors ${isAdded ? 'bg-green-50/40' : 'hover:bg-neutral-50'}`}>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            lead.platform === 'instagram' ? 'bg-pink-100 text-pink-700' : 'bg-neutral-900 text-white'
                          }`}>
                            {lead.platform === 'instagram' ? 'Instagram' : 'TikTok'}
                          </span>
                          <p className="text-xs text-neutral-400 mt-1">{lead.timestamp}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-neutral-700">{lead.property}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-neutral-500">{lead.interaction}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${SOCIAL_STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isAdded ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-lg font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Added
                              </span>
                              <button
                                onClick={() => setActiveTab('pipeline')}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                View pipeline ↗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addSocialToPipeline(lead)}
                              disabled={isAdding}
                              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-60"
                            >
                              {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
                              Add to Pipeline
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <input
                    value={editData.title}
                    onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                    className="text-lg font-semibold text-neutral-900 w-full border-b border-blue-500 focus:outline-none pb-0.5"
                  />
                ) : (
                  <h2 className="text-lg font-semibold text-neutral-900 truncate">{selectedDeal.title}</h2>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${STAGE_BADGE[selectedDeal.stage]}`}>
                  {selectedDeal.stage}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editMode ? (
                  <>
                    <button
                      onClick={saveDealEdit}
                      disabled={savingDeal}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingDeal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button onClick={() => setEditMode(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Edit deal"
                  >
                    <Edit3 className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
                <button onClick={() => setSelectedDeal(null)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stage selector */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Move Stage</p>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => changeStage(s.id)}
                      disabled={changingStage}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        selectedDeal.stage === s.id
                          ? `${STAGE_BADGE[s.id]} border border-current`
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {changingStage && selectedDeal.stage !== s.id ? s.name : s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal details */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Deal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {editMode ? (
                    <>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Property Type</label>
                        <input value={editData.property_type} onChange={e => setEditData(d => ({ ...d, property_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Location</label>
                        <input value={editData.location} onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Budget Min (₦)</label>
                        <input type="number" value={editData.budget_min} onChange={e => setEditData(d => ({ ...d, budget_min: e.target.value }))}
                          placeholder="e.g. 30000000"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Budget Max (₦)</label>
                        <input type="number" value={editData.budget_max} onChange={e => setEditData(d => ({ ...d, budget_max: e.target.value }))}
                          placeholder="e.g. 50000000"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </>
                  ) : (
                    <>
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
                      {(selectedDeal.budget_min || selectedDeal.budget_max) && (
                        <div className="p-3 bg-neutral-50 rounded-lg col-span-2">
                          <p className="text-xs text-neutral-500">Budget</p>
                          <p className="text-sm font-medium text-neutral-900 mt-0.5">
                            {selectedDeal.budget_min ? `₦${(selectedDeal.budget_min / 1e6).toFixed(1)}M` : ''}
                            {selectedDeal.budget_min && selectedDeal.budget_max ? ' – ' : ''}
                            {selectedDeal.budget_max ? `₦${(selectedDeal.budget_max / 1e6).toFixed(1)}M` : ''}
                          </p>
                        </div>
                      )}
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <p className="text-xs text-neutral-500">Opened</p>
                        <p className="text-sm font-medium text-neutral-900 mt-0.5">
                          {new Date(selectedDeal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Offer Letters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Offer Letters</p>
                  {(selectedDeal.stage === 'negotiation' || selectedDeal.stage === 'closed') && (
                    <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Action required at this stage
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {([
                    { type: 'commission_agreement' as const, label: 'Commission Agreement', hint: 'negotiation' },
                    { type: 'settlement_instruction' as const, label: 'Settlement Instruction', hint: 'closed' },
                  ]).map(({ type, label, hint }) => (
                    <div key={type}>
                      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {label}
                        {selectedDeal.stage === hint && (
                          <span className="text-amber-600 font-medium ml-1">— recommended now</span>
                        )}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['buyer', 'seller'] as const).map(party => {
                          const letter = dealLetters.find(l => l.letter_type === type && l.party_type === party);
                          const key = `${type}-${party}`;
                          const isGen = generatingLetter === key;
                          return (
                            <button
                              key={party}
                              onClick={() => generateLetter(type, party)}
                              disabled={isGen}
                              className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm disabled:opacity-50 ${
                                !letter
                                  ? 'border-dashed border-neutral-300 bg-neutral-50 hover:border-blue-400 hover:bg-blue-50/60'
                                  : letter.status === 'signed'
                                  ? 'border-emerald-200 bg-emerald-50'
                                  : letter.status === 'sent'
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-neutral-200 bg-white hover:border-blue-300'
                              }`}
                            >
                              <p className="text-xs font-semibold text-neutral-700 capitalize">{party} Side</p>
                              {isGen ? (
                                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />Generating…
                                </p>
                              ) : !letter ? (
                                <p className="text-xs text-blue-600 mt-1">+ Generate letter</p>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {letter.status === 'signed' ? (
                                    <><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Signed</span></>
                                  ) : letter.status === 'sent' ? (
                                    <><Send className="w-3 h-3 text-blue-600" /><span className="text-xs text-blue-700 font-medium">Sent to client</span></>
                                  ) : (
                                    <><FileText className="w-3 h-3 text-neutral-400" /><span className="text-xs text-neutral-600">Draft</span></>
                                  )}
                                  <span className="text-xs text-neutral-400 ml-auto">View →</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Service Fee</p>
                  <p className={`text-xs mt-0.5 ${selectedDeal.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedDeal.payment_status === 'paid' ? 'Payment received' : 'Awaiting payment'}
                  </p>
                </div>
                <button
                  onClick={() => togglePayment(selectedDeal)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDeal.payment_status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {selectedDeal.payment_status === 'paid' ? '✓ Paid — Mark Pending' : 'Mark as Paid'}
                </button>
              </div>

              {/* Sales Support */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Sales Support</p>
                  <button
                    onClick={() => setShowSalesRequest(!showSalesRequest)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Assign Task
                  </button>
                </div>

                {dealSalesTasks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {dealSalesTasks.map(task => (
                      <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-blue-900">{task.action}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-blue-600">
                          {task.assigned_to_name && <span>→ {task.assigned_to_name}</span>}
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dealSalesTasks.length === 0 && !showSalesRequest && (
                  <p className="text-sm text-neutral-400 italic mb-1">No sales tasks yet.</p>
                )}

                {showSalesRequest && (
                  <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200 mb-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">What needs to be done? *</label>
                      <input
                        value={salesRequestForm.action}
                        onChange={e => setSalesRequestForm(f => ({ ...f, action: e.target.value }))}
                        placeholder="e.g. Call client to re-engage, Send property brochure..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Assign to</label>
                        <input
                          value={salesRequestForm.assigned_to_name}
                          onChange={e => setSalesRequestForm(f => ({ ...f, assigned_to_name: e.target.value }))}
                          placeholder="Sales team member"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Due date</label>
                        <input
                          type="date"
                          value={salesRequestForm.due_date}
                          onChange={e => setSalesRequestForm(f => ({ ...f, due_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSalesRequest(false)}
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={assignToSales}
                        disabled={savingSalesRequest || !salesRequestForm.action.trim()}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingSalesRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Assign Task
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Broker Notes ({dealNotes.length})
                </p>
                {dealNotes.length === 0 && (
                  <p className="text-sm text-neutral-400 italic mb-3">No notes yet.</p>
                )}
                {dealNotes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {dealNotes.map(note => (
                      <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-900">{note.content}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-amber-600">{note.author_name} · {new Date(note.created_at).toLocaleDateString()}</p>
                          {note.stage_at_time && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_BADGE[note.stage_at_time]}`}>
                              {note.stage_at_time}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dealNote}
                    onChange={e => setDealNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDealNote()}
                    placeholder="Add a note..."
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addDealNote}
                    disabled={savingNote || !dealNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter View Modal */}
      {viewingLetter && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50 rounded-t-2xl flex-shrink-0">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {viewingLetter.letter.letter_type === 'commission_agreement'
                    ? 'Commission Agreement'
                    : 'Settlement Instruction'}{' '}
                  <span className="capitalize text-neutral-500 font-normal">— {viewingLetter.letter.party_type} side</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {viewingLetter.letter.status === 'signed' ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" />Signed
                    </span>
                  ) : viewingLetter.letter.status === 'sent' ? (
                    <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                      <Send className="w-3 h-3" />Sent to client
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-full font-medium">
                      <FileText className="w-3 h-3" />Draft
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setViewingLetter(null)}
                  className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letter document body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white" id="letter-print-area">
              {renderLetterBody(viewingLetter.letter, viewingLetter.deal, viewingLetter.clientName)}
            </div>

            {/* Action bar */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl flex-shrink-0">
              {viewingLetter.letter.status === 'draft' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-600">Share this letter with the client, then mark when sent.</p>
                  </div>
                  <button
                    onClick={() => updateLetterStatus(viewingLetter.letter.id, 'sent')}
                    disabled={savingLetterStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {savingLetterStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Mark as Sent
                  </button>
                </div>
              )}
              {viewingLetter.letter.status === 'sent' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-600">Once the client has physically signed, confirm here.</p>
                  </div>
                  <button
                    onClick={() => updateLetterStatus(viewingLetter.letter.id, 'signed')}
                    disabled={savingLetterStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {savingLetterStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Confirm Signed
                  </button>
                </div>
              )}
              {viewingLetter.letter.status === 'signed' && (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Signed and confirmed</span>
                  {viewingLetter.letter.signed_at && (
                    <span className="text-neutral-500 text-xs">
                      · {new Date(viewingLetter.letter.signed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Panel */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-2xl">
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold ${CLIENT_TYPE_COLOR[selectedClient.type ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                  {initials(selectedClient.name)}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Contact Details</p>
                <div className="space-y-2">
                  {selectedClient.company && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Company</p>
                        <p className="text-sm font-medium">{selectedClient.company}</p>
                      </div>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Phone</p>
                        <p className="text-sm font-medium">{selectedClient.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Email</p>
                        <p className="text-sm font-medium">{selectedClient.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Deal History ({clientDeals.length})
                </p>
                {clientDeals.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic">No deals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clientDeals.map(deal => (
                      <div key={deal.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div>
                          <p className="text-sm font-semibold">{deal.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{new Date(deal.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STAGE_BADGE[deal.stage]}`}>
                          {deal.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Notes</p>
                {clientNotes.length === 0 && <p className="text-sm text-neutral-400 italic mb-3">No notes yet.</p>}
                {clientNotes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {clientNotes.map(note => (
                      <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-900">{note.content}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-amber-600">{note.author_name} · {new Date(note.created_at).toLocaleDateString()}</p>
                          {note.stage_at_time && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_BADGE[note.stage_at_time]}`}>
                              {note.stage_at_time}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {clientDeals.length > 0 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clientNote}
                      onChange={e => setClientNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addClientNote()}
                      placeholder="Add a note..."
                      className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addClientNote}
                      disabled={savingClientNote || !clientNote.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {savingClientNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Listing Modal */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingListing ? 'Edit Listing' : 'Add New Listing'}
              </h2>
              <button onClick={() => setShowListingForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveListing} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title *</label>
                <input
                  value={listingForm.title}
                  onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="e.g. 4-Bedroom Duplex, Lekki Phase 1"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Location *</label>
                  <input
                    value={listingForm.location}
                    onChange={e => setListingForm(f => ({ ...f, location: e.target.value }))}
                    required
                    placeholder="Lekki Phase 1, Lagos"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Price / Label</label>
                  <input
                    value={listingForm.price_label}
                    onChange={e => setListingForm(f => ({ ...f, price_label: e.target.value }))}
                    placeholder="e.g. ₦75M or Contact us"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Property Type</label>
                  <select
                    value={listingForm.property_type}
                    onChange={e => setListingForm(f => ({ ...f, property_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    {['Residential', 'Commercial', 'Land', 'Industrial', 'Mixed-Use'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                  <select
                    value={listingForm.status}
                    onChange={e => setListingForm(f => ({ ...f, status: e.target.value as Listing['status'] }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={listingForm.bedrooms}
                    onChange={e => setListingForm(f => ({ ...f, bedrooms: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={listingForm.bathrooms}
                    onChange={e => setListingForm(f => ({ ...f, bathrooms: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Property Image</label>
                {listingForm.image_url && (
                  <div className="relative mb-2">
                    <img
                      src={listingForm.image_url}
                      alt="Preview"
                      className="w-full h-36 object-cover rounded-lg border border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setListingForm(f => ({ ...f, image_url: '' }))}
                      className="absolute top-1.5 right-1.5 p-1 bg-white rounded-full shadow border border-neutral-200 hover:bg-neutral-50"
                    >
                      <X className="w-3 h-3 text-neutral-500" />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors w-full">
                  {uploadingImage
                    ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    : <Upload className="w-4 h-4" />
                  }
                  <span>{uploadingImage ? 'Uploading…' : listingForm.image_url ? 'Replace image' : 'Upload image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadListingImage(f); }}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={listingForm.description}
                  onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the property..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={listingForm.is_featured}
                  onChange={e => setListingForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <label htmlFor="featured" className="text-sm text-neutral-700">
                  Feature this listing (shows on home page + client dashboard)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListingForm(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingListing || !listingForm.title || !listingForm.location}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingListing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingListing ? 'Save Changes' : 'Add Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-neutral-900">New Brokerage Request</h2>
              <button onClick={() => setShowNewRequest(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Request Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Purchase', 'Sale', 'Lease'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRequestType(t)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        requestType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Client Type</label>
                  <select value={newReq.client_type} onChange={e => setNewReq(r => ({ ...r, client_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="investor">Investor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Contact Name *</label>
                  <input value={newReq.contact_name} onChange={e => setNewReq(r => ({ ...r, contact_name: e.target.value }))}
                    placeholder="Full name" required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                  <input type="email" value={newReq.contact_email} onChange={e => setNewReq(r => ({ ...r, contact_email: e.target.value }))}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone</label>
                  <input type="tel" value={newReq.contact_phone} onChange={e => setNewReq(r => ({ ...r, contact_phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Property Category</label>
                  <select value={newReq.property_category} onChange={e => setNewReq(r => ({ ...r, property_category: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['Residential', 'Commercial', 'Land', 'Industrial', 'Mixed-Use'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Location</label>
                  <input value={newReq.location} onChange={e => setNewReq(r => ({ ...r, location: e.target.value }))}
                    placeholder="City, area or estate"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-200 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowNewRequest(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={createRequest}
                disabled={submittingReq || !requestType || !newReq.contact_name}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingReq && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Inquiry Modal */}
      {showLogInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Log Walk-In Inquiry</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Fill this on behalf of a walk-in or call-in client</p>
              </div>
              <button onClick={() => setShowLogInquiry(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {intakeSuccess ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-neutral-900">Inquiry Logged</p>
                <p className="text-sm text-neutral-500 mt-1">It will appear in the Intake Queue.</p>
              </div>
            ) : (
              <form onSubmit={submitLogInquiry} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Client Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'buyer', label: 'Buyer', icon: Home },
                      { id: 'seller', label: 'Seller', icon: TrendingUp },
                      { id: 'investor', label: 'Investor', icon: Banknote },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setIntakeForm(f => ({ ...f, client_type: id as 'buyer' | 'seller' | 'investor' }))}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          intakeForm.client_type === id ? 'border-blue-600 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${intakeForm.client_type === id ? 'text-blue-600' : 'text-neutral-400'}`} />
                        <p className={`text-xs font-semibold ${intakeForm.client_type === id ? 'text-blue-900' : 'text-neutral-700'}`}>{label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Property Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Residential', 'Commercial', 'Land', 'Industrial', 'Mixed-Use'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setIntakePropType(t)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          intakePropType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name *</label>
                    <input value={intakeForm.contact_name} onChange={e => setIntakeForm(f => ({ ...f, contact_name: e.target.value }))}
                      required placeholder="Client full name"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone</label>
                    <input type="tel" value={intakeForm.contact_phone} onChange={e => setIntakeForm(f => ({ ...f, contact_phone: e.target.value }))}
                      placeholder="+234 800 000 0000"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Budget</label>
                    <input value={intakeForm.budget} onChange={e => setIntakeForm(f => ({ ...f, budget: e.target.value }))}
                      placeholder="e.g. ₦30M – ₦50M"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Location</label>
                    <input value={intakeForm.location} onChange={e => setIntakeForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Preferred area"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Requirements</label>
                  <textarea rows={3} value={intakeForm.requirements} onChange={e => setIntakeForm(f => ({ ...f, requirements: e.target.value }))}
                    placeholder="What does the client need?"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">This inquiry will appear in the Intake Queue where you can review and convert it to an active deal.</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowLogInquiry(false)}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIntake || !intakeForm.client_type || !intakeForm.contact_name}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingIntake && <Loader2 className="w-4 h-4 animate-spin" />}
                    Log Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
