import React, { useState, useEffect } from 'react';
import { Project, AppView, ProjectField, ProjectItem, Employee, LeaveRequest, JobPosting, Account, Invoice, Bill, PurchaseRequest, StockItem } from './types';
import { suggestWorkflowStages } from './services/geminiService';
import { ProjectDetail } from './components/ProjectDetail';
import { HRMGlobalView } from './components/HRMGlobalView';
import { AccountingView } from './components/AccountingView';
import { InventoryView } from './components/InventoryView';
import { FactoryIcon, PlusIcon, SparklesIcon, ArrowLeftIcon, TableIcon, ListIcon, ChartIcon, UsersIcon, BankIcon, BoxIcon } from './components/Icons';

// --- Industry Templates ---
const INDUSTRY_TEMPLATES: Record<string, ProjectField[]> = {
  "Electrical - Cable Laying": [
    { name: "Cable ID", type: "text" },
    { name: "From/To", type: "text" },
    { name: "Length (m)", type: "number" },
    { name: "Route Clearance", type: "date" },
    { name: "Tray Install", type: "date" },
    { name: "Cable Pulling", type: "date" },
    { name: "Dressing", type: "date" },
    { name: "Termination", type: "date" },
    { name: "Testing", type: "date" }
  ],
  "Construction - Civil": [
    { name: "Structure ID", type: "text" },
    { name: "Location", type: "select", options: ["Zone A", "Zone B", "Zone C"] },
    { name: "Excavation", type: "date" },
    { name: "Formwork", type: "date" },
    { name: "Reinforcement", type: "date" },
    { name: "Pouring", type: "date" },
    { name: "Curing Done", type: "date" }
  ],
  "Software Development": [
    { name: "Task ID", type: "text" },
    { name: "Feature", type: "text" },
    { name: "Story Points", type: "number" },
    { name: "Priority", type: "select", options: ["High", "Medium", "Low"] },
    { name: "Design Review", type: "date" },
    { name: "Dev Complete", type: "date" },
    { name: "QA Verified", type: "date" },
    { name: "Deployed", type: "date" }
  ],
  "Manufacturing": [
    { name: "Batch ID", type: "text" },
    { name: "Product Type", type: "select", options: ["Type X", "Type Y"] },
    { name: "Quantity", type: "number" },
    { name: "Material Prep", type: "date" },
    { name: "Assembly", type: "date" },
    { name: "Quality Check", type: "date" },
    { name: "Packaging", type: "date" },
    { name: "Dispatched", type: "date" }
  ],
  "Logistics": [
    { name: "Tracking #", type: "text" },
    { name: "Destination", type: "text" },
    { name: "Weight (kg)", type: "number" },
    { name: "Received", type: "date" },
    { name: "Sorted", type: "date" },
    { name: "Packed", type: "date" },
    { name: "Shipped", type: "date" },
    { name: "Delivered", type: "date" }
  ],
  "Marketing Campaign": [
    { name: "Campaign Item", type: "text" },
    { name: "Channel", type: "select", options: ["Social", "Email", "Web", "Print"] },
    { name: "Budget", type: "number" },
    { name: "Drafting", type: "date" },
    { name: "Review", type: "date" },
    { name: "Published", type: "date" },
    { name: "Analytics Review", type: "date" }
  ]
};

// --- Data Generation Helpers ---
const generateHyundaiProject = (): Project => {
  const items: ProjectItem[] = [];
  const itemCount = 200;
  
  // Stages
  const stages = ['Cutting', 'Fitup', 'Welding', 'Finishing'];
  
  // Date helpers
  const today = new Date();
  const getRandomDate = (minDaysAgo: number, maxDaysAgo: number) => {
    const days = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // Generate 200 items
  for (let i = 1; i <= itemCount; i++) {
    const id = `H-SUP-${String(i).padStart(3, '0')}`;
    const weight = Math.floor(Math.random() * (35 - 15 + 1)) + 15; // Random weight 15-35kg
    
    // Determine progress state to hit ~30% completion (Finishing done)
    let progressLevel = 0; // 0=None, 1=Cut, 2=Fit, 3=Weld, 4=Finish
    if (i <= 60) progressLevel = 4; // 60 Completed
    else if (i <= 100) progressLevel = 3; // +40 Welded
    else if (i <= 140) progressLevel = 2; // +40 Fitup
    else if (i <= 180) progressLevel = 1; // +40 Cutting
    else progressLevel = 0; // 20 Pending

    const item: ProjectItem = {
      id: crypto.randomUUID(),
      'Mark No': id,
      'Description': i % 2 === 0 ? 'Main Support Beam' : 'Secondary Bracket',
      'Weight (kg)': weight,
    };

    // Assign dates based on progress level
    if (progressLevel >= 1) item['Cutting'] = getRandomDate(30, 60);
    if (progressLevel >= 2) item['Fitup'] = getRandomDate(15, 30);
    if (progressLevel >= 3) item['Welding'] = getRandomDate(7, 15);
    if (progressLevel >= 4) item['Finishing'] = getRandomDate(0, 7); 

    items.push(item);
  }

  return {
    id: 'hyundai-demo-1',
    name: 'Hyundai Structure Works',
    industry: 'Steel Fabrication',
    description: 'Fabrication of 200 steel supports for Phase 1 expansion.',
    created_at: new Date().toISOString(),
    fields: [
      { name: 'Mark No', type: 'text' },
      { name: 'Description', type: 'text' },
      { name: 'Weight (kg)', type: 'number' },
      { name: 'Cutting', type: 'date' },
      { name: 'Fitup', type: 'date' },
      { name: 'Welding', type: 'date' },
      { name: 'Finishing', type: 'date' }
    ],
    items: items,
    targets: {
      'Weight (kg)': 5000
    },
    widgets: [
      {
        id: 'card-1',
        title: 'Cutting Complete',
        type: 'card',
        filterField: 'Cutting',
        metricFields: ['Weight (kg)']
      },
      {
        id: 'card-2',
        title: 'Fitup Complete',
        type: 'card',
        filterField: 'Fitup',
        metricFields: ['Weight (kg)']
      },
      {
        id: 'card-3',
        title: 'Welding Complete',
        type: 'card',
        filterField: 'Welding',
        metricFields: ['Weight (kg)']
      },
      {
        id: 'comp-1',
        title: 'Cut vs Fitup Weight Balance',
        type: 'comparison',
        compareFieldA: 'Cutting',
        compareFieldB: 'Fitup',
        metricFields: ['Weight (kg)']
      },
      {
        id: 'chart-1',
        title: 'Daily Welding Output',
        type: 'chart',
        chartType: 'bar',
        filterField: 'Welding',
        metricFields: []
      },
      {
        id: 'chart-2',
        title: 'Welding vs Target',
        type: 'chart',
        chartType: 'progress', 
        filterField: 'Welding',
        metricFields: ['Weight (kg)']
      },
      {
        id: 'chart-3',
        title: 'Welding Trend (Cumulative)',
        type: 'chart',
        chartType: 'area', // This will show timeline accumulation
        filterField: 'Welding',
        metricFields: ['Weight (kg)']
      }
    ]
  };
};

const generateDummyEmployees = (): Employee[] => [
    { id: 'e1', name: 'John Smith', role: 'Project Manager', department: 'Management', email: 'john@trackflow.ai', skills: ['Agile', 'Leadership'], status: 'Active', salary: 120000, joinDate: '2021-03-15', avatar: 'JS' },
    { id: 'e2', name: 'Sarah Connor', role: 'Senior Welder', department: 'Field Ops', email: 'sarah@trackflow.ai', skills: ['MIG', 'TIG', 'Safety'], status: 'Active', salary: 85000, joinDate: '2022-01-10', avatar: 'SC' },
    { id: 'e3', name: 'Mike Ross', role: 'Site Engineer', department: 'Engineering', email: 'mike@trackflow.ai', skills: ['CAD', 'Surveying'], status: 'Active', salary: 95000, joinDate: '2023-05-20', avatar: 'MR' },
    { id: 'e4', name: 'Donna Paulsen', role: 'HR Specialist', department: 'HR', email: 'donna@trackflow.ai', skills: ['Recruiting', 'Compliance'], status: 'Active', salary: 75000, joinDate: '2020-11-01', avatar: 'DP' },
    { id: 'e5', name: 'Louis Litt', role: 'Quality Inspector', department: 'Field Ops', email: 'louis@trackflow.ai', skills: ['ISO 9001', 'Inspection'], status: 'On Leave', salary: 78000, joinDate: '2019-08-14', avatar: 'LL' },
    { id: 'e6', name: 'Harvey Specter', role: 'Operations Director', department: 'Management', email: 'harvey@trackflow.ai', skills: ['Strategy', 'Negotiation'], status: 'Active', salary: 180000, joinDate: '2018-02-28', avatar: 'HS' },
    { id: 'e7', name: 'Rachel Zane', role: 'Junior Engineer', department: 'Engineering', email: 'rachel@trackflow.ai', skills: ['Documentation', 'Research'], status: 'Active', salary: 65000, joinDate: '2023-09-01', avatar: 'RZ' },
];

const generateDummyLeaves = (): LeaveRequest[] => [
    { id: 'l1', employeeId: 'e2', type: 'Vacation', startDate: '2024-06-10', endDate: '2024-06-15', status: 'Pending', reason: 'Family trip' },
    { id: 'l2', employeeId: 'e5', type: 'Sick', startDate: '2024-05-01', endDate: '2024-05-30', status: 'Approved', reason: 'Surgery recovery' }
];

const generateDummyJobs = (): JobPosting[] => [
    { 
      id: 'j1', title: 'Senior Site Supervisor', department: 'Field Ops', status: 'Open',
      applicants: [
          { id: 'c1', name: 'Alex Murphy', email: 'alex@email.com', stage: 'Interview' },
          { id: 'c2', name: 'Peter Parker', email: 'peter@email.com', stage: 'Applied' }
      ]
    },
    { 
      id: 'j2', title: 'Safety Officer', department: 'HR', status: 'Open',
      applicants: [
          { id: 'c3', name: 'Bruce Banner', email: 'bruce@email.com', stage: 'Offer' }
      ]
    }
];

const generateDummyAccounts = (): Account[] => [
    { id: 'a1', code: '1000', name: 'Business Checking', type: 'Asset', category: 'Cash & Bank', balance: 145000 },
    { id: 'a2', code: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets', balance: 35000 },
    { id: 'a3', code: '1500', name: 'Equipment', type: 'Asset', category: 'Fixed Assets', balance: 250000 },
    { id: 'a4', code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities', balance: 12000 },
    { id: 'a5', code: '3000', name: 'Retained Earnings', type: 'Equity', category: 'Equity', balance: 200000 },
    { id: 'a6', code: '4000', name: 'Sales Revenue', type: 'Revenue', category: 'Income', balance: 500000 },
    { id: 'a7', code: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'COGS', balance: 180000 },
    { id: 'a8', code: '6000', name: 'Payroll Expense', type: 'Expense', category: 'Operating Expense', balance: 150000 },
];

const generateDummyInvoices = (): Invoice[] => [
    { id: 'i1', number: 'INV-1001', customerName: 'Apex Construction', date: '2024-05-10', dueDate: '2024-06-10', amount: 15000, status: 'Overdue' },
    { id: 'i2', number: 'INV-1002', customerName: 'BuildRight Inc', date: '2024-06-05', dueDate: '2024-07-05', amount: 8500, status: 'Sent' },
    { id: 'i3', number: 'INV-1003', customerName: 'City Planners', date: '2024-06-12', dueDate: '2024-07-12', amount: 12000, status: 'Sent' },
    { id: 'i4', number: 'INV-1004', customerName: 'Metro Transit', date: '2024-04-20', dueDate: '2024-05-20', amount: 22000, status: 'Paid' },
];

const generateDummyBills = (): Bill[] => [
    { id: 'b1', number: 'BILL-501', vendorName: 'Steel Supply Co', date: '2024-06-01', dueDate: '2024-06-30', category: 'Cost of Goods Sold', amount: 4500, status: 'Received' },
    { id: 'b2', number: 'BILL-502', vendorName: 'Office Depot', date: '2024-06-10', dueDate: '2024-07-10', category: 'Office Expense', amount: 350, status: 'Received' },
    { id: 'b3', number: 'BILL-498', vendorName: 'Power Grid Corp', date: '2024-05-15', dueDate: '2024-06-15', category: 'Utilities', amount: 1200, status: 'Overdue' },
];

const generateDummyPRs = (projectId: string): PurchaseRequest[] => [
  {
    id: 'pr1', number: 'PR-1001', title: 'Raw Materials - Phase 1', projectId, requestDate: '2024-06-01', status: 'Partial', isBilled: false,
    items: [
      { id: 'item1', name: 'Steel Plates (10mm)', qtyOrdered: 10, qtyDelivered: 3, unitPrice: 120 },
      { id: 'item2', name: 'Aluminium Coils', qtyOrdered: 5, qtyDelivered: 5, unitPrice: 300 }
    ]
  },
  {
    id: 'pr2', number: 'PR-1002', title: 'Safety Equipment', projectId, requestDate: '2024-06-15', status: 'Pending', isBilled: false,
    items: [
      { id: 'item3', name: 'Helmets (Yellow)', qtyOrdered: 50, qtyDelivered: 0, unitPrice: 0 },
      { id: 'item4', name: 'Safety Gloves', qtyOrdered: 100, qtyDelivered: 0, unitPrice: 0 }
    ]
  }
];

const generateDummyStock = (): StockItem[] => [
    { id: 's1', name: 'Steel Plates (10mm)', sku: 'STL-10MM', category: 'Raw Materials', quantity: 15, unit: 'pcs', minLevel: 20, location: 'Warehouse A', lastUpdated: '2024-06-05' },
    { id: 's2', name: 'Aluminium Coils', sku: 'ALU-COIL', category: 'Raw Materials', quantity: 8, unit: 'rolls', minLevel: 5, location: 'Warehouse B', lastUpdated: '2024-06-10' },
    { id: 's3', name: 'Welding Rods', sku: 'WELD-ROD-X', category: 'Consumables', quantity: 200, unit: 'box', minLevel: 50, location: 'Shelf C1', lastUpdated: '2024-05-20' },
];

const DUMMY_PROJECT = generateHyundaiProject();

// Define the state type for creating a project to use in props
interface NewProjectState {
  name: string;
  industry: string;
  description: string;
  fields: ProjectField[];
  targets: Record<string, number>;
  isGeneratingFields: boolean;
}

interface DashboardProps {
  projects: Project[];
  onNavigate: (view: AppView) => void;
  onSelectProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onNavigate, onSelectProject }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Track progress across all your projects</p>
        </div>
        <button 
          onClick={() => onNavigate(AppView.CREATE_PROJECT)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-all shadow-sm shadow-brand-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <FactoryIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
          <p className="text-slate-500 mb-6">Create your first project to start tracking workflow progress.</p>
          <button 
            onClick={() => onNavigate(AppView.CREATE_PROJECT)}
            className="text-brand-600 font-medium hover:text-brand-800"
          >
            Create Project &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => {
            const itemCount = p.items ? p.items.length : 0;
            // Get last date field as a proxy for "Completion"
            const dateFields = p.fields.filter(f => f.type === 'date');
            const lastDateField = dateFields.length > 0 ? dateFields[dateFields.length - 1] : null;

            const completedCount = lastDateField 
                ? p.items.filter(i => i[lastDateField.name]).length 
                : 0;
            
            const percent = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0;

            return (
              <div 
                key={p.id} 
                onClick={() => onSelectProject(p.id)}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                    <FactoryIcon className="w-6 h-6" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${percent >= 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {percent >= 100 ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-4 truncate">{p.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Industry</span>
                    <span className="font-medium text-slate-800">{p.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tracked Items</span>
                    <span className="font-medium text-slate-800">{itemCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Est. Progress</span>
                    <span className="font-medium text-slate-800">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-brand-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, percent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
);

interface CreateProjectViewProps {
  newProject: NewProjectState;
  setNewProject: React.Dispatch<React.SetStateAction<NewProjectState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onGenerateFields: () => void;
}

const CreateProjectView: React.FC<CreateProjectViewProps> = ({ 
  newProject, 
  setNewProject, 
  onSubmit, 
  onCancel, 
  onGenerateFields 
}) => {
    
    const applyTemplate = (templateName: string) => {
      if (templateName && INDUSTRY_TEMPLATES[templateName]) {
        setNewProject({
          ...newProject,
          industry: templateName.split(' - ')[0],
          fields: [...INDUSTRY_TEMPLATES[templateName]] // Clone
        });
      }
    };

    const addField = () => {
        setNewProject({
            ...newProject, 
            fields: [...newProject.fields, { name: '', type: 'text' }]
        });
    };

    const updateField = (idx: number, key: keyof ProjectField, value: any) => {
        const updated = [...newProject.fields];
        // @ts-ignore
        updated[idx][key] = value;
        
        // Clear options if type changes from select
        if (key === 'type' && value !== 'select') {
          updated[idx].options = undefined;
        }

        setNewProject({...newProject, fields: updated});
    };
    
    const updateFieldOptions = (idx: number, optionsStr: string) => {
        const updated = [...newProject.fields];
        updated[idx].options = optionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setNewProject({...newProject, fields: updated});
    };
    
    const removeField = (idx: number) => {
        const updated = newProject.fields.filter((_, i) => i !== idx);
        setNewProject({...newProject, fields: updated});
    };

    const updateTarget = (fieldName: string, value: string) => {
        setNewProject({
            ...newProject,
            targets: {
                ...newProject.targets,
                [fieldName]: parseFloat(value) || 0
            }
        });
    };

    // Calculate which fields are number fields
    const numberFields = newProject.fields.filter(f => f.type === 'number');

    return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <button onClick={onCancel} className="text-slate-500 mb-6 flex items-center hover:text-slate-900">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Cancel
        </button>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
                <p className="text-slate-500">Start from a template or define your own custom workflow.</p>
            </div>
            <form onSubmit={onSubmit} className="p-8 space-y-8">
                
                {/* 0. Template Selector */}
                <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 mb-6">
                  <label className="block text-sm font-bold text-brand-800 mb-2">⚡ Quick Start: Choose a Workflow Template</label>
                  <select 
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full p-2 border border-brand-200 rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white text-slate-700"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Industry Workflow --</option>
                    {Object.keys(INDUSTRY_TEMPLATES).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>

                {/* 1. Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                        <input 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            placeholder="e.g. Substation Alpha"
                            value={newProject.name}
                            onChange={e => setNewProject({...newProject, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Industry / Type</label>
                        <input 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            placeholder="e.g. Construction"
                            value={newProject.industry}
                            onChange={e => setNewProject({...newProject, industry: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        required 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        rows={2}
                        placeholder="Briefly describe the work..."
                        value={newProject.description}
                        onChange={e => setNewProject({...newProject, description: e.target.value})}
                    />
                </div>

                {/* 2. Data Fields Definition */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                                <TableIcon className="w-5 h-5 mr-2 text-slate-500" />
                                Workflow & Data Structure
                            </h3>
                            <p className="text-sm text-slate-500">Define what you want to track (Statuses, Dates, Quantities).</p>
                        </div>
                         <button 
                            type="button"
                            onClick={onGenerateFields}
                            disabled={newProject.isGeneratingFields}
                            className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors flex items-center border border-purple-200"
                        >
                            {newProject.isGeneratingFields ? (
                                <span className="animate-pulse">Thinking...</span>
                            ) : (
                                <>
                                    <SparklesIcon className="w-4 h-4 mr-1.5" /> AI Suggest
                                </>
                            )}
                        </button>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {newProject.fields.map((field, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white p-2 rounded border border-slate-200">
                                <span className="text-slate-400 text-sm w-6 text-center hidden sm:block">{idx + 1}.</span>
                                
                                <input 
                                    placeholder="Column Name (e.g. Status, Weight, Date)"
                                    value={field.name}
                                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none"
                                    required
                                />
                                
                                <select 
                                    value={field.type}
                                    onChange={(e) => updateField(idx, 'type', e.target.value)}
                                    className={`w-full sm:w-32 p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none bg-slate-50 font-medium ${
                                      field.type === 'date' ? 'text-brand-600' : 
                                      field.type === 'select' ? 'text-purple-600' : 
                                      'text-slate-700'
                                    }`}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="select">Dropdown</option>
                                </select>
                                
                                {field.type === 'select' && (
                                  <input 
                                    placeholder="Options: A, B, C"
                                    value={field.options?.join(', ') || ''}
                                    onChange={(e) => updateFieldOptions(idx, e.target.value)}
                                    className="flex-1 p-2 border border-purple-200 bg-purple-50 rounded focus:ring-brand-500 focus:outline-none text-sm"
                                  />
                                )}

                                <button 
                                    type="button" 
                                    onClick={() => removeField(idx)}
                                    className="text-slate-400 hover:text-red-500 p-2 sm:ml-2"
                                    disabled={newProject.fields.length <= 1}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button"
                            onClick={addField}
                            className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center mt-2"
                        >
                            + Add Column
                        </button>
                    </div>
                </div>

                {/* 3. Targets / Scope Definition */}
                {numberFields.length > 0 && (
                    <div className="border-t border-slate-200 pt-6">
                         <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                                <ChartIcon className="w-5 h-5 mr-2 text-slate-500" />
                                Project Scope / Targets (Optional)
                            </h3>
                            <p className="text-sm text-slate-500">Set total quantities or budgets to track progress against (e.g. Total Weight = 5000kg).</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {numberFields.map((field) => (
                                <div key={field.name}>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Total Estimated {field.name}</label>
                                    <input 
                                        type="number"
                                        placeholder={`Total ${field.name} (optional)`}
                                        value={newProject.targets[field.name] || ''}
                                        onChange={(e) => updateTarget(field.name, e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        className="bg-brand-600 text-white px-8 py-3 rounded-lg hover:bg-brand-700 font-medium shadow-lg shadow-brand-200 transition-all transform hover:-translate-y-0.5"
                    >
                        Create Project
                    </button>
                </div>

            </form>
        </div>
    </div>
    );
};

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  
  // Accounting State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  // Inventory State
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    // Projects
    const savedProjects = localStorage.getItem('trackflow_projects_v5'); 
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
        setProjects([DUMMY_PROJECT]);
    }

    // Employees
    const savedEmployees = localStorage.getItem('trackflow_employees');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees(generateDummyEmployees());
    }

    // Leaves & Jobs (Mocking for now if not in localstorage)
    setLeaves(generateDummyLeaves());
    setJobs(generateDummyJobs());

    // Accounting Data
    const savedAccounts = localStorage.getItem('trackflow_accounts');
    if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
        setInvoices(JSON.parse(localStorage.getItem('trackflow_invoices') || '[]'));
        setBills(JSON.parse(localStorage.getItem('trackflow_bills') || '[]'));
    } else {
        setAccounts(generateDummyAccounts());
        setInvoices(generateDummyInvoices());
        setBills(generateDummyBills());
    }

    // Inventory Data
    const savedPRs = localStorage.getItem('trackflow_prs');
    if (savedPRs) {
      setPurchaseRequests(JSON.parse(savedPRs));
    } else {
      // Mock data for initial view if projects exist
      if (DUMMY_PROJECT) {
        setPurchaseRequests(generateDummyPRs(DUMMY_PROJECT.id));
      }
    }

    // Stock Data
    const savedStock = localStorage.getItem('trackflow_stock');
    if (savedStock) {
      setStock(JSON.parse(savedStock));
    } else {
      setStock(generateDummyStock());
    }

  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('trackflow_projects_v5', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('trackflow_employees', JSON.stringify(employees));
    }
  }, [employees]);

  useEffect(() => {
     if (accounts.length > 0) {
         localStorage.setItem('trackflow_accounts', JSON.stringify(accounts));
         localStorage.setItem('trackflow_invoices', JSON.stringify(invoices));
         localStorage.setItem('trackflow_bills', JSON.stringify(bills));
     }
  }, [accounts, invoices, bills]);

  useEffect(() => {
    if (purchaseRequests.length > 0) {
      localStorage.setItem('trackflow_prs', JSON.stringify(purchaseRequests));
    }
  }, [purchaseRequests]);

  useEffect(() => {
    if (stock.length > 0) {
      localStorage.setItem('trackflow_stock', JSON.stringify(stock));
    }
  }, [stock]);

  // Create Project State
  const [newProject, setNewProject] = useState<NewProjectState>({
    name: '',
    industry: '',
    description: '',
    fields: [
        { name: 'UID', type: 'text' }, 
        { name: 'Description', type: 'text' }, 
        { name: 'Weight', type: 'number' },
        { name: 'Cutting Date', type: 'date' },
        { name: 'Fitup Date', type: 'date' }
    ],
    targets: {},
    isGeneratingFields: false
  });

  const handleGenerateFields = async () => {
    if (!newProject.industry || !newProject.description) {
        alert("Please enter industry and description first.");
        return;
    }
    setNewProject(prev => ({ ...prev, isGeneratingFields: true }));
    const fields = await suggestWorkflowStages(newProject.industry, newProject.description);
    setNewProject(prev => ({ ...prev, fields, isGeneratingFields: false }));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.fields.length === 0) {
        alert("Please define at least one field.");
        return;
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      industry: newProject.industry,
      description: newProject.description,
      fields: newProject.fields,
      items: [],
      widgets: [], // Initialize empty widgets
      targets: newProject.targets,
      created_at: new Date().toISOString()
    };

    setProjects([...projects, project]);
    // Reset form
    setNewProject({
        name: '', industry: '', description: '', 
        fields: [{ name: 'UID', type: 'text' }, { name: 'Weight', type: 'number' }, { name: 'Date', type: 'date' }],
        targets: {},
        isGeneratingFields: false
    });
    setView(AppView.DASHBOARD);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Employee Handlers
  const handleAddEmployee = (emp: Employee) => {
      setEmployees([...employees, emp]);
  };
  const handleDeleteEmployee = (id: string) => {
      setEmployees(employees.filter(e => e.id !== id));
  };
  const handleUpdateLeave = (id: string, status: 'Approved' | 'Rejected') => {
      setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
  };
  const handleAddJob = (job: JobPosting) => {
      setJobs([...jobs, job]);
  };

  // Accounting Handlers
  const handleAddInvoice = (inv: Invoice) => {
      setInvoices([...invoices, inv]);
      // Update AR balance
      setAccounts(accounts.map(a => a.name === 'Accounts Receivable' ? { ...a, balance: a.balance + inv.amount } : a));
  };
  const handleAddBill = (bill: Bill) => {
      setBills([...bills, bill]);
      // Update AP balance
      setAccounts(accounts.map(a => a.name === 'Accounts Payable' ? { ...a, balance: a.balance + bill.amount } : a));
  };
  const handlePayInvoice = (id: string) => {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'Paid' } : i));
      // Reduce AR, Increase Cash (Simulated)
      setAccounts(accounts.map(a => {
          if (a.name === 'Accounts Receivable') return { ...a, balance: a.balance - inv.amount };
          if (a.name === 'Business Checking') return { ...a, balance: a.balance + inv.amount };
          return a;
      }));
  };
  const handlePayBill = (id: string) => {
      const bill = bills.find(b => b.id === id);
      if (!bill) return;
      setBills(bills.map(b => b.id === id ? { ...b, status: 'Paid' } : b));
      // Reduce AP, Reduce Cash (Simulated)
      setAccounts(accounts.map(a => {
          if (a.name === 'Accounts Payable') return { ...a, balance: a.balance - bill.amount };
          if (a.name === 'Business Checking') return { ...a, balance: a.balance - bill.amount };
          return a;
      }));
  };

  // Inventory Handlers
  const handleAddPR = (pr: PurchaseRequest) => {
    setPurchaseRequests([...purchaseRequests, pr]);
  };
  const handleUpdatePR = (updatedPR: PurchaseRequest) => {
    setPurchaseRequests(purchaseRequests.map(pr => pr.id === updatedPR.id ? updatedPR : pr));
  };

  const handleStockUpdate = (itemName: string, quantityDelta: number, isNewItem?: boolean, itemDetails?: Partial<StockItem>) => {
    if (isNewItem && itemDetails) {
        // Add new item
        setStock([...stock, itemDetails as StockItem]);
    } else {
        // Update existing
        const existing = stock.find(s => s.name === itemName);
        if (existing) {
            setStock(stock.map(s => s.name === itemName ? { ...s, quantity: s.quantity + quantityDelta, lastUpdated: new Date().toISOString().split('T')[0] } : s));
        } else if (quantityDelta > 0) {
            // Auto-create from PR if not exists
            const newItem: StockItem = {
                id: crypto.randomUUID(),
                name: itemName,
                sku: 'AUTO-' + Math.floor(Math.random()*1000),
                category: 'Auto-Added',
                quantity: quantityDelta,
                unit: 'units',
                minLevel: 0,
                location: 'Receiving',
                lastUpdated: new Date().toISOString().split('T')[0]
            };
            setStock([...stock, newItem]);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
                        <div className="bg-brand-600 p-1.5 rounded mr-2">
                             <FactoryIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">TrackFlow AI</span>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-6">
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => setView(AppView.DASHBOARD)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === AppView.DASHBOARD ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Projects
                            </button>
                            <button 
                                onClick={() => setView(AppView.HRM)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === AppView.HRM ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                HR Portal
                            </button>
                             <button 
                                onClick={() => setView(AppView.ACCOUNTING)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === AppView.ACCOUNTING ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Accounting
                            </button>
                            <button 
                                onClick={() => setView(AppView.INVENTORY)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === AppView.INVENTORY ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Inventory
                            </button>
                        </div>
                        
                        <div className="h-6 w-px bg-slate-200"></div>

                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm ring-1 ring-slate-100">
                            AD
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main>
            {view === AppView.DASHBOARD && (
                <Dashboard 
                    projects={projects} 
                    onNavigate={setView} 
                    onSelectProject={(id) => { setSelectedProjectId(id); setView(AppView.PROJECT_DETAIL); }} 
                />
            )}

            {view === AppView.HRM && (
                <HRMGlobalView 
                    employees={employees}
                    leaves={leaves}
                    jobs={jobs}
                    onAddEmployee={handleAddEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    onUpdateLeave={handleUpdateLeave}
                    onAddJob={handleAddJob}
                />
            )}
            
            {view === AppView.ACCOUNTING && (
                <AccountingView 
                    accounts={accounts}
                    invoices={invoices}
                    bills={bills}
                    onAddInvoice={handleAddInvoice}
                    onAddBill={handleAddBill}
                    onPayInvoice={handlePayInvoice}
                    onPayBill={handlePayBill}
                />
            )}

            {view === AppView.INVENTORY && (
              <InventoryView 
                projects={projects}
                purchaseRequests={purchaseRequests}
                stock={stock}
                onAddPR={handleAddPR}
                onUpdatePR={handleUpdatePR}
                onCreateBill={handleAddBill}
                onUpdateStock={handleStockUpdate}
              />
            )}
            
            {view === AppView.CREATE_PROJECT && (
                <CreateProjectView 
                    newProject={newProject}
                    setNewProject={setNewProject}
                    onSubmit={handleCreateProject}
                    onCancel={() => setView(AppView.DASHBOARD)}
                    onGenerateFields={handleGenerateFields}
                />
            )}

            {view === AppView.PROJECT_DETAIL && activeProject && (
                <ProjectDetail 
                    project={activeProject}
                    employees={employees}
                    onBack={() => setView(AppView.DASHBOARD)}
                    onUpdate={handleProjectUpdate}
                />
            )}
        </main>
    </div>
  );
}

export default App;