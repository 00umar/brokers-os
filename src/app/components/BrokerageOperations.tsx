import { useState } from 'react';
import {
  Plus,
  Filter,
  Search,
  MoreVertical,
  User,
  DollarSign,
  MapPin,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  X,
  Upload,
  Send,
  Home,
  Link2,
  ShieldCheck,
  TrendingUp,
  Banknote,
} from 'lucide-react';

export function BrokerageOperations() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [requestType, setRequestType] = useState('');
  const [clientCategory, setClientCategory] = useState('');
  const [intakePropertyType, setIntakePropertyType] = useState('');

  const clients = [
    {
      id: 'CLT-001',
      name: 'Horizon Properties LLC',
      type: 'Investor',
      contact: 'Michael Chen',
      email: 'm.chen@horizon.com',
      phone: '+234 801 234 5678',
      since: '2024',
      status: 'Active',
      totalValue: '₦8.5M',
      activeDeals: 3,
      colorClass: 'bg-blue-100 text-blue-600',
      deals: [
        { id: 'BR-1028', type: 'Purchase', value: '$3.2M', stage: 'New', date: '2 hours ago' },
        { id: 'BR-1015', type: 'Lease', value: '$1.2M/yr', stage: 'Closed', date: '3 weeks ago' },
        { id: 'BR-1009', type: 'Purchase', value: '$4.1M', stage: 'Closed', date: '2 months ago' },
      ],
      lastActivity: '2 hours ago',
      notes: 'Long-term investor. Prefers commercial properties in high-growth zones. Always needs docs within 24hrs.',
    },
    {
      id: 'CLT-002',
      name: 'Cityscape Developers',
      type: 'Developer',
      contact: 'Sarah Johnson',
      email: 'sjohnson@cityscape.com',
      phone: '+234 802 345 6789',
      since: '2025',
      status: 'Active',
      totalValue: '₦4.2M',
      activeDeals: 2,
      colorClass: 'bg-green-100 text-green-600',
      deals: [
        { id: 'BR-1027', type: 'Sale', value: '$1.5M', stage: 'Contacted', date: '5 hours ago' },
        { id: 'BR-1021', type: 'Purchase', value: '$2.7M', stage: 'Negotiation', date: '1 week ago' },
      ],
      lastActivity: '5 hours ago',
      notes: 'Developer. Currently acquiring land in Lekki corridor. Decision maker is Sarah directly — no committee.',
    },
    {
      id: 'CLT-003',
      name: 'Atlas Real Estate',
      type: 'Corporate',
      contact: 'Robert Martinez',
      email: 'r.martinez@atlas.com',
      phone: '+234 803 456 7890',
      since: '2023',
      status: 'Active',
      totalValue: '₦12.3M',
      activeDeals: 1,
      colorClass: 'bg-purple-100 text-purple-600',
      deals: [
        { id: 'BR-1026', type: 'Lease', value: '$650K/yr', stage: 'Qualified', date: '1 day ago' },
        { id: 'BR-1018', type: 'Lease', value: '$580K/yr', stage: 'Closed', date: '6 months ago' },
        { id: 'BR-1010', type: 'Purchase', value: '$5.2M', stage: 'Closed', date: '1 year ago' },
      ],
      lastActivity: '1 day ago',
      notes: 'Repeat corporate client. CEO approves leases personally. Budget has been consistent at $600-700K/yr for office.',
    },
    {
      id: 'CLT-004',
      name: 'Beacon Capital Group',
      type: 'Investor',
      contact: 'Jennifer Lee',
      email: 'j.lee@beacon.com',
      phone: '+234 804 567 8901',
      since: '2025',
      status: 'Active',
      totalValue: '₦4.8M',
      activeDeals: 1,
      colorClass: 'bg-orange-100 text-orange-600',
      deals: [
        { id: 'BR-1025', type: 'Purchase', value: '$4.8M', stage: 'Sourcing', date: '2 days ago' },
      ],
      lastActivity: '2 days ago',
      notes: 'New client. High-value first deal. Service fee collected. 4 properties sourced — awaiting shortlist decision.',
    },
  ];

  const pipelineStages = [
    { id: 'new', name: 'New', count: 8, color: 'bg-gray-100' },
    { id: 'contacted', name: 'Contacted', count: 6, color: 'bg-blue-100' },
    { id: 'qualified', name: 'Qualified', count: 12, color: 'bg-purple-100' },
    { id: 'sourcing', name: 'Sourcing', count: 5, color: 'bg-orange-100' },
    { id: 'inspection', name: 'Inspection', count: 4, color: 'bg-yellow-100' },
    { id: 'negotiation', name: 'Negotiation', count: 3, color: 'bg-green-100' },
    { id: 'closed', name: 'Closed', count: 2, color: 'bg-emerald-100' },
  ];

  const deals = {
    new: [
      {
        id: 'BR-1028',
        client: 'Horizon Properties LLC',
        contact: 'Michael Chen',
        type: 'Purchase',
        category: 'Commercial',
        value: '$3.2M',
        priority: 'high',
        assignee: null,
        createdAt: '2 hours ago',
        location: 'Downtown District',
        requirements: '5,000 sqft office space',
      },
    ],
    contacted: [
      {
        id: 'BR-1027',
        client: 'Cityscape Developers',
        contact: 'Sarah Johnson',
        type: 'Sale',
        category: 'Residential',
        value: '$1.5M',
        priority: 'medium',
        assignee: 'Sarah Chen',
        createdAt: '5 hours ago',
        location: 'Riverside Area',
        lastContact: '3 hours ago',
      },
    ],
    qualified: [
      {
        id: 'BR-1026',
        client: 'Atlas Real Estate',
        contact: 'Robert Martinez',
        type: 'Lease',
        category: 'Commercial',
        value: '$650K/yr',
        priority: 'medium',
        assignee: 'Mike Johnson',
        createdAt: '1 day ago',
        location: 'Industrial Park',
        budget: '$600K-700K/yr',
      },
    ],
    sourcing: [
      {
        id: 'BR-1025',
        client: 'Beacon Capital Group',
        contact: 'Jennifer Lee',
        type: 'Purchase',
        category: 'Mixed-Use',
        value: '$4.8M',
        priority: 'high',
        assignee: 'Sarah Chen',
        createdAt: '2 days ago',
        location: 'City Center',
        matchesFound: 4,
      },
    ],
    inspection: [
      {
        id: 'BR-1024',
        client: 'Riverstone Capital',
        contact: 'David Park',
        type: 'Purchase',
        category: 'Commercial',
        value: '$2.4M',
        priority: 'high',
        assignee: 'Emily Davis',
        createdAt: '3 days ago',
        location: '245 Market Street',
        inspectionDate: 'May 5, 2026 10:00 AM',
      },
    ],
    negotiation: [
      {
        id: 'BR-1023',
        client: 'Metro Development',
        contact: 'Lisa Anderson',
        type: 'Sale',
        category: 'Residential',
        value: '$1.8M',
        priority: 'medium',
        assignee: 'Mike Johnson',
        createdAt: '4 days ago',
        location: 'Suburban Heights',
        offerAmount: '$1.75M',
      },
    ],
    closed: [
      {
        id: 'BR-1022',
        client: 'Sterling Group',
        contact: 'Tom Wilson',
        type: 'Lease',
        category: 'Commercial',
        value: '$890K/yr',
        priority: 'medium',
        assignee: 'Sarah Chen',
        createdAt: '1 week ago',
        location: 'Tech District',
        closedDate: 'Apr 28, 2026',
        commission: '$44,500',
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
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
              className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search deals, clients, properties..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Pipeline Board */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="w-80 flex-shrink-0">
                <div className={`${stage.color} rounded-lg p-3 mb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-neutral-900">{stage.name}</h3>
                      <span className="px-2 py-0.5 bg-white text-neutral-700 rounded-full text-xs font-medium">
                        {stage.count}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-white/50 rounded transition-colors">
                      <Plus className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {deals[stage.id]?.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">
                              {deal.id}
                            </span>
                            {deal.priority === 'high' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{deal.type} • {deal.category}</p>
                        </div>
                        <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>

                      <p className="text-sm font-medium text-neutral-900 mb-1">{deal.client}</p>
                      <p className="text-xs text-neutral-600 mb-3">{deal.contact}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{deal.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="font-medium">{deal.value}</span>
                        </div>
                        {deal.assignee && (
                          <div className="flex items-center gap-2 text-xs text-neutral-600">
                            <User className="w-3.5 h-3.5" />
                            <span>{deal.assignee}</span>
                          </div>
                        )}
                        {!deal.assignee && (
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Assign Broker
                          </button>
                        )}
                      </div>

                      {deal.inspectionDate && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <div className="flex items-center gap-2 text-xs text-neutral-900">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-medium">{deal.inspectionDate}</span>
                          </div>
                        </div>
                      )}

                      {deal.matchesFound && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                            <Home className="w-3.5 h-3.5" />
                            <span className="font-medium">{deal.matchesFound} Properties Matched</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Accounts */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-white rounded-xl border border-neutral-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${client.colorClass.split(' ')[0]}`}>
                    <Building2 className={`w-6 h-6 ${client.colorClass.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-neutral-900">{client.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {client.type}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{client.contact}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-6 flex-shrink-0 ml-4">
                  <div className="text-center">
                    <p className="text-xl font-semibold text-neutral-900">{client.activeDeals}</p>
                    <p className="text-xs text-neutral-500">Active Deals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-neutral-900">{client.totalValue}</p>
                    <p className="text-xs text-neutral-500">Total Value</p>
                  </div>
                  <div className="text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {client.status}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">Since {client.since}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 italic">{client.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Profile Panel */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-2xl">
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedClient.colorClass.split(' ')[0]}`}>
                  <Building2 className={`w-7 h-7 ${selectedClient.colorClass.split(' ')[1]}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{selectedClient.name}</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {selectedClient.type} · Client since {selectedClient.since}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-2">
                    {selectedClient.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* Contact details */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <User className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Contact Person</p>
                        <p className="text-sm font-medium text-neutral-900">{selectedClient.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Phone</p>
                        <p className="text-sm font-medium text-neutral-900">{selectedClient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Email</p>
                        <p className="text-sm font-medium text-neutral-900">{selectedClient.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal history */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Deal History ({selectedClient.deals.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedClient.deals.map((deal: any) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-neutral-900">{deal.id}</span>
                            <span className="text-xs text-neutral-500">{deal.type}</span>
                          </div>
                          <p className="text-xs text-neutral-500">{deal.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-neutral-900">{deal.value}</span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            deal.stage === 'Closed'
                              ? 'bg-green-100 text-green-700'
                              : deal.stage === 'New'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {deal.stage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Broker notes */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Broker Notes
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-900">{selectedClient.notes}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                New Request for Client
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Intake Form */}
      {activeTab === 'intake' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Banner */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Client-Facing Request Form</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  This is what your client fills. Share the link or show them this screen directly.
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Copy Link
            </button>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-xl font-semibold text-neutral-900">Submit a Property Request</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Tell us what you need and our broker will get back to you within 24 hours.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* I am a… */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-3">
                  I am a… *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'buyer', label: 'Buyer', desc: 'Looking to purchase', icon: Home },
                    { id: 'seller', label: 'Seller', desc: 'Want to sell a property', icon: TrendingUp },
                    { id: 'investor', label: 'Investor', desc: 'Seeking investment deals', icon: Banknote },
                  ].map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setClientCategory(id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                        clientCategory === id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 ${clientCategory === id ? 'text-blue-600' : 'text-neutral-400'}`}
                      />
                      <p
                        className={`text-sm font-semibold ${
                          clientCategory === id ? 'text-blue-900' : 'text-neutral-800'
                        }`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-neutral-500">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-3">
                  Property Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Residential', 'Commercial', 'Land', 'Industrial', 'Mixed-Use'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setIntakePropertyType(type)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        intakePropertyType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-2">
                  Describe what you need *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. I need a 4-bedroom house in Lekki Phase 1, close to the main road. Looking to move in within 3 months."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Budget Range *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦30M – ₦50M"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, estate, or area"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment notice */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Service fee applies.</span> A service charge is
                  required before your broker begins sourcing. You will be contacted with payment
                  details after submission.
                </p>
              </div>

              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Total Pipeline Value</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">$24.8M</p>
            <p className="text-sm text-green-600 mt-2">+18% from last month</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Avg. Deal Cycle</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">42 days</p>
            <p className="text-sm text-green-600 mt-2">-8% from last month</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Conversion Rate</p>
            <p className="text-3xl font-semibold text-neutral-900 mt-2">68%</p>
            <p className="text-sm text-green-600 mt-2">+5% from last month</p>
          </div>
        </div>
      )}

      {/* New Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">New Brokerage Request</h2>
              <button
                onClick={() => setShowRequestForm(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Type Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Request Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Purchase', 'Sale', 'Lease'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setRequestType(type)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        requestType === type
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="font-medium text-neutral-900">{type}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Client Type
                    </label>
                    <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Buyer</option>
                      <option>Seller</option>
                      <option>Investor</option>
                      <option>Developer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Horizon Properties LLC"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      placeholder="contact@company.com"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Property Requirements */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Property Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Property Category
                    </label>
                    <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Commercial</option>
                      <option>Residential</option>
                      <option>Industrial</option>
                      <option>Mixed-Use</option>
                      <option>Land</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., $2M - $3M"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Location Preference
                    </label>
                    <input
                      type="text"
                      placeholder="City, district, or area"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Size Requirements
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 5,000 sqft"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Additional Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe specific requirements, preferences, or constraints..."
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Assign to Broker
                </label>
                <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  <option>Sarah Chen</option>
                  <option>Mike Johnson</option>
                  <option>Emily Davis</option>
                  <option>Robert Lee</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">{selectedDeal.id}</h2>
                <p className="text-sm text-neutral-500 mt-1">{selectedDeal.client}</p>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Deal Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Contact Person</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedDeal.contact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Deal Value</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedDeal.value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedDeal.location}</p>
                  </div>
                </div>

                {/* Communication Timeline */}
                <div>
                  <h3 className="font-medium text-neutral-900 mb-4">Communication Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">Sarah Chen</span> called client
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">Mike Johnson</span> sent property options
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="font-medium text-neutral-900 mb-4">Comments & Notes</h3>
                  <div className="space-y-3 mb-4">
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                            SC
                          </div>
                          <span className="text-sm font-medium text-neutral-900">Sarah Chen</span>
                        </div>
                        <span className="text-xs text-neutral-500">1 hour ago</span>
                      </div>
                      <p className="text-sm text-neutral-700">
                        Client confirmed budget and timeline. Moving to sourcing phase.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="font-medium text-neutral-900 mb-4">Documents</h3>
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600 mb-1">Drop files here or click to upload</p>
                    <p className="text-xs text-neutral-500">PDF, DOC, XLS up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
