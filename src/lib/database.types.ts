export type UserRole = 'admin' | 'manager' | 'office_staff' | 'field_worker' | 'client'

export type DealStage = 'new' | 'contacted' | 'qualified' | 'sourcing' | 'inspection' | 'negotiation' | 'closed'

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'blocked'

export type ReportStatus = 'pending-review' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  email: string
  phone?: string
  department?: string
  status?: 'pending' | 'active' | 'suspended'
  allowed_modules?: string[] | null
  company_id?: string | null
  is_super_admin?: boolean
  created_at: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  type?: 'buyer' | 'seller' | 'investor'
  created_by?: string
  created_at: string
}

export interface Deal {
  id: string
  client_id: string
  title: string
  stage: DealStage
  property_type?: string
  budget_min?: number
  budget_max?: number
  location?: string
  assigned_broker?: string
  payment_status: 'pending' | 'paid'
  created_at: string
  updated_at: string
  clients?: Client
}

export interface BrokerNote {
  id: string
  deal_id: string
  content: string
  author_id?: string
  author_name?: string
  stage_at_time?: DealStage
  created_at: string
}

export interface IntakeRequest {
  id: string
  user_id?: string
  client_type: 'buyer' | 'seller' | 'investor'
  property_type?: string
  requirements?: string
  budget?: string
  location?: string
  contact_name: string
  contact_email?: string
  contact_phone?: string
  company?: string
  payment_status: 'pending' | 'paid'
  status: 'new' | 'assigned' | 'in-progress' | 'completed'
  assigned_to?: string
  created_at: string
}

export interface Listing {
  id: string
  title: string
  description?: string
  price?: number
  price_label?: string
  location: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  size_sqm?: number
  image_url?: string
  is_featured: boolean
  status: 'active' | 'sold' | 'pending'
  created_at: string
}

export interface Project {
  id: string
  name: string
  project_manager?: string
  pm_name?: string
  deadline?: string
  budget?: number
  type?: string
  status: 'active' | 'on-hold' | 'completed'
  created_at: string
}

export interface Phase {
  id: string
  project_id: string
  name: string
  order_index: number
  status: 'pending' | 'in-progress' | 'completed'
  start_date?: string
  end_date?: string
  created_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  phase_id: string
  project_id: string
  name: string
  status: TaskStatus
  assigned_to?: string
  assigned_to_name?: string
  assigned_by?: string
  assigned_at?: string
  blocked_by?: string
  notes?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  deliverables?: string
  created_at: string
  evidence?: TaskEvidence[]
}

export interface TaskEvidence {
  id: string
  task_id: string
  file_url: string
  file_name?: string
  file_type?: string
  uploaded_by?: string
  created_at: string
}

export interface TaskNote {
  id: string
  task_id: string
  worker_id?: string
  worker_name: string
  note_type: 'text' | 'whatsapp_log' | 'system'
  body: string
  created_at: string
}

export interface WeeklyReport {
  id: string
  worker_id?: string
  worker_name?: string
  week_start: string
  hours_worked?: number
  incident_notes?: string
  worker_response?: string
  status: ReportStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  items?: ReportTaskItem[]
}

export interface ReportTaskItem {
  id: string
  report_id: string
  task_name: string
  done: boolean
  evidence_urls?: string[]
  created_at: string
}

export interface OfferLetter {
  id: string
  deal_id: string
  letter_type: 'commission_agreement' | 'settlement_instruction'
  party_type: 'buyer' | 'seller'
  status: 'draft' | 'sent' | 'signed'
  signed_name?: string
  sent_at?: string
  signed_at?: string
  created_at: string
}

export interface WhatsAppConnection {
  id: string
  company_id: string
  phone_number_id: string
  display_phone_number: string | null
  waba_id: string | null
  connected_at: string
  last_message_at: string | null
  created_at: string
}

export interface WhatsAppLead {
  id: string
  company_id: string
  sender_phone: string
  sender_name: string | null
  message_text: string | null
  whatsapp_message_id: string | null
  client_id: string | null
  deal_id: string | null
  received_at: string | null
  created_at: string
}

export interface Lead {
  id: string
  name: string
  company?: string
  contact_name?: string
  lead_type?: string
  email?: string
  phone?: string
  source?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  assigned_to?: string
  notes?: string
  follow_up_date?: string
  created_at: string
}

export interface SalesTask {
  id: string
  deal_id?: string
  lead_id?: string
  subject: string
  action: string
  assigned_to_name?: string
  due_date?: string
  status: 'pending' | 'completed'
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at'>; Update: Partial<Client> }
      deals: { Row: Deal; Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Deal> }
      broker_notes: { Row: BrokerNote; Insert: Omit<BrokerNote, 'id' | 'created_at'>; Update: Partial<BrokerNote> }
      intake_requests: { Row: IntakeRequest; Insert: Omit<IntakeRequest, 'id' | 'created_at'>; Update: Partial<IntakeRequest> }
      listings: { Row: Listing; Insert: Omit<Listing, 'id' | 'created_at'>; Update: Partial<Listing> }
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at'>; Update: Partial<Project> }
      phases: { Row: Phase; Insert: Omit<Phase, 'id' | 'created_at'>; Update: Partial<Phase> }
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at'>; Update: Partial<Task> }
      task_evidence: { Row: TaskEvidence; Insert: Omit<TaskEvidence, 'id' | 'created_at'>; Update: Partial<TaskEvidence> }
      task_notes: { Row: TaskNote; Insert: Omit<TaskNote, 'id' | 'created_at'>; Update: Partial<TaskNote> }
      weekly_reports: { Row: WeeklyReport; Insert: Omit<WeeklyReport, 'id' | 'created_at'>; Update: Partial<WeeklyReport> }
      report_task_items: { Row: ReportTaskItem; Insert: Omit<ReportTaskItem, 'id' | 'created_at'>; Update: Partial<ReportTaskItem> }
      offer_letters: { Row: OfferLetter; Insert: Omit<OfferLetter, 'id' | 'created_at'>; Update: Partial<OfferLetter> }
      leads: { Row: Lead; Insert: Omit<Lead, 'id' | 'created_at'>; Update: Partial<Lead> }
      sales_tasks: { Row: SalesTask; Insert: Omit<SalesTask, 'id' | 'created_at'>; Update: Partial<SalesTask> }
      whatsapp_connections: { Row: WhatsAppConnection; Insert: Omit<WhatsAppConnection, 'id' | 'created_at'>; Update: Partial<WhatsAppConnection> }
      whatsapp_leads: { Row: WhatsAppLead; Insert: Omit<WhatsAppLead, 'id' | 'created_at'>; Update: Partial<WhatsAppLead> }
    }
  }
}
