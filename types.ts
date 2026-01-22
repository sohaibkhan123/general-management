export interface ProjectField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface ProjectItem {
  id: string;
  [key: string]: any; // Dynamic access
}

export interface DashboardWidget {
  id: string;
  type: 'card' | 'chart' | 'comparison';
  title: string;
  
  // Logic
  filterField?: string; // The field driving this widget (Optional for comparison)
  filterValue?: string; // For Select fields (e.g. "Zone A"), if undefined implies "Has Value"
  
  // For Cards/Comparison
  metricFields?: string[]; // Names of number fields to sum
  
  // For Charts
  chartType?: 'bar' | 'pie' | 'area' | 'progress';

  // For Comparison
  compareFieldA?: string; // The "Upstream" or "Base" stage (e.g., Cutting)
  compareFieldB?: string; // The "Downstream" or "Target" stage (e.g., Fitup)
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  skills: string[];
  status: 'Active' | 'On Leave' | 'Terminated';
  avatar?: string;
  salary: number; // Annual
  joinDate: string;
  managerId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'Vacation' | 'Sick' | 'Personal';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  status: 'Open' | 'Closed';
  applicants: Candidate[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  resumeUrl?: string;
}

// --- ACCOUNTING INTERFACES ---

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  category: string; // e.g. "Current Assets", "Operating Expense"
  balance: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
}

export interface Bill {
  id: string;
  number: string;
  vendorName: string;
  date: string;
  dueDate: string;
  category: string; // Expense Account Name
  amount: number;
  status: 'Received' | 'Paid' | 'Overdue';
  projectId?: string; // Linked to Project
  purchaseRequestId?: string; // Linked to Inventory PR
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string; // Linked to Account
  type: 'Debit' | 'Credit';
}

// --- INVENTORY / PROCUREMENT ---

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
  location: string;
  lastUpdated: string;
}

export interface PRItem {
  id: string;
  name: string; // e.g., "Steel Plates", "Coils"
  qtyOrdered: number;
  qtyDelivered: number;
  unitPrice: number;
}

export interface PurchaseRequest {
  id: string;
  number: string; // PR-001
  title: string;
  projectId: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Partial' | 'Fulfilled';
  items: PRItem[];
  isBilled: boolean; // True if sent to accounting
}

export interface Project {
  id: string;
  name: string;
  industry: string;
  description: string;
  
  // Schema definitions
  fields: ProjectField[]; 
  
  // Data
  items: ProjectItem[];
  
  // Custom Dashboard
  widgets?: DashboardWidget[];

  // Targets / Scope
  targets?: Record<string, number>;
  
  // HRM
  team?: string[]; // Array of Employee IDs
  
  created_at: string;
}

export interface AIAnalysisResult {
  summary: string;
  risks: string[];
  recommendations: string[];
  estimatedCompletion?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE_PROJECT = 'CREATE_PROJECT',
  PROJECT_DETAIL = 'PROJECT_DETAIL',
  HRM = 'HRM',
  ACCOUNTING = 'ACCOUNTING',
  INVENTORY = 'INVENTORY',
}