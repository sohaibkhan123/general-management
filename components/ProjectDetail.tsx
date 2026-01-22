import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectItem, ProjectField, DashboardWidget, Employee } from '../types';
import { analyzeProjectProgress } from '../services/geminiService';
import { ProjectChat } from './ProjectChat';
import { 
  ChartIcon, SparklesIcon, TrashIcon, TableIcon, EditIcon, PlusIcon, 
  FactoryIcon, CalendarIcon, ChatBubbleIcon, ArrowUpIcon, ArrowDownIcon,
  UsersIcon, BriefcaseIcon
} from './Icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

// Dnd Kit Imports
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent, 
  useSensor, 
  useSensors, 
  PointerSensor 
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectDetailProps {
  project: Project;
  employees: Employee[];
  onBack: () => void;
  onUpdate: (updatedProject: Project) => void;
}

type ProcessedWidget = 
  | (DashboardWidget & { 
      type: 'comparison';
      comparisonStats: { countA: number; countB: number; sumA: number; sumB: number; metric?: string; };
    })
  | (DashboardWidget & {
      type: 'card' | 'chart';
      count: number;
      stats: Record<string, number>;
      chartData: any[];
      totalItemCount: number;
      projectSums: Record<string, number>;
    });

// --- Sortable Widget Wrapper Component ---
interface SortableWidgetItemProps {
  id: string;
  children: React.ReactNode;
  disabled: boolean;
}

const SortableWidgetItem: React.FC<SortableWidgetItemProps> = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 50 : 'auto',
    position: 'relative' as 'relative',
    touchAction: 'none' 
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, employees, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'analysis' | 'chat' | 'team'>('dashboard');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  
  // Dashboard Edit State
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [newWidget, setNewWidget] = useState<Partial<DashboardWidget>>({
      type: 'card',
      title: '',
      filterField: '',
      metricFields: []
  });

  // --- Drag Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before activation to allow clicking buttons
      },
    })
  );

  // --- Filter State ---
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | 'custom'>('7d');
  const [filterRefField, setFilterRefField] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // --- Field Definitions ---
  const dateFields = useMemo(() => project.fields.filter(f => f.type === 'date'), [project.fields]);
  const numberFields = useMemo(() => project.fields.filter(f => f.type === 'number'), [project.fields]);
  const selectFields = useMemo(() => project.fields.filter(f => f.type === 'select'), [project.fields]);
  const filterableFields = useMemo(() => [...dateFields, ...selectFields], [dateFields, selectFields]);

  // Set default filter field on load
  useEffect(() => {
      if (dateFields.length > 0 && !filterRefField) {
          setFilterRefField(dateFields[dateFields.length - 1].name);
      }
  }, [dateFields, filterRefField]);

  // --- Table/Data State ---
  const [items, setItems] = useState<ProjectItem[]>(project.items);
  const [newItem, setNewItem] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    project.fields.forEach(f => initial[f.name] = '');
    return initial;
  });

  // Ensure widgets array exists
  const widgets = project.widgets || [];

  // --- Widget Calculation Logic ---
  const widgetData = useMemo((): ProcessedWidget[] => {
      const totalItemCount = items.length;
      const projectSums: Record<string, number> = {};
      numberFields.forEach(nf => {
          projectSums[nf.name] = items.reduce((sum, item) => sum + (parseFloat(item[nf.name]) || 0), 0);
      });

      let filteredItems = items;
      
      if (filterRefField && timeRange !== 'all') {
          const now = new Date();
          now.setHours(23, 59, 59, 999);
          
          let startDate: Date | null = null;
          let endDate: Date | null = now;

          if (timeRange === '7d') {
              startDate = new Date();
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
          } else if (timeRange === '30d') {
              startDate = new Date();
              startDate.setDate(now.getDate() - 30);
              startDate.setHours(0, 0, 0, 0);
          } else if (timeRange === 'custom' && customStart && customEnd) {
              startDate = new Date(customStart);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(customEnd);
              endDate.setHours(23, 59, 59, 999);
          }

          if (startDate && endDate) {
              filteredItems = items.filter(item => {
                  const val = item[filterRefField];
                  if (!val) return false;
                  const d = new Date(val);
                  return d >= startDate! && d <= endDate!;
              });
          }
      }

      return widgets.map(widget => {
          if (widget.type === 'comparison') {
             const fieldA = widget.compareFieldA || '';
             const fieldB = widget.compareFieldB || '';
             const metric = widget.metricFields?.[0];

             const itemsA = filteredItems.filter(i => i[fieldA]);
             const itemsB = filteredItems.filter(i => i[fieldB]);

             const countA = itemsA.length;
             const countB = itemsB.length;
             
             let sumA = 0;
             let sumB = 0;
             if (metric) {
                 sumA = itemsA.reduce((acc, i) => acc + (parseFloat(i[metric]) || 0), 0);
                 sumB = itemsB.reduce((acc, i) => acc + (parseFloat(i[metric]) || 0), 0);
             }

             return {
                 ...widget,
                 comparisonStats: { countA, countB, sumA, sumB, metric }
             } as ProcessedWidget;
          }

          const relevantItems = filteredItems.filter(item => {
             if (!widget.filterField) return true;
             const val = item[widget.filterField];
             if (!val) return false;
             if (widget.filterValue && val !== widget.filterValue) return false;
             return true;
          });

          const stats: Record<string, number> = {};
          if (widget.metricFields) {
             widget.metricFields.forEach(metric => {
                 stats[metric] = relevantItems.reduce((sum, item) => sum + (parseFloat(item[metric]) || 0), 0);
             });
          }

          let chartData: any[] = [];
          if (widget.type === 'chart') {
             if (widget.chartType === 'progress') {
                 const primaryMetric = widget.metricFields?.[0];
                 let completed = 0;
                 let total = 0;

                 if (primaryMetric) {
                     completed = stats[primaryMetric];
                     total = project.targets?.[primaryMetric] || projectSums[primaryMetric];
                     if (total === 0) total = 1;
                 } else {
                     completed = relevantItems.length;
                     total = totalItemCount || 1;
                 }

                 chartData = [
                     { name: 'Actual', value: completed },
                     { name: 'Remaining', value: Math.max(0, total - completed) }
                 ];

             } else if (widget.chartType === 'area') {
                 const dates: Record<string, number> = {};
                 if (widget.filterField) {
                    const sortedItems = [...relevantItems].sort((a,b) => (a[widget.filterField!] > b[widget.filterField!] ? 1 : -1));
                    let runningTotal = 0;
                    
                    sortedItems.forEach(item => {
                        const d = item[widget.filterField!];
                        if(d) {
                            const val = widget.metricFields && widget.metricFields[0] ? (parseFloat(item[widget.metricFields[0]]) || 0) : 1;
                            runningTotal += val;
                            dates[d] = runningTotal;
                        }
                    });
                 }
                 
                 chartData = Object.keys(dates).map(d => ({
                     name: d,
                     value: dates[d]
                 }));
                 
                 if (chartData.length === 0) chartData = [{name: 'Start', value: 0}];

             } else {
                 const groups: Record<string, number> = {};
                 relevantItems.forEach(item => {
                     const key = (widget.filterField && item[widget.filterField]) || 'Unknown';
                     groups[key] = (groups[key] || 0) + 1;
                 });
                 chartData = Object.keys(groups).sort().map(key => ({
                     name: key,
                     value: groups[key]
                 }));
             }
          }

          return { 
              ...widget, 
              count: relevantItems.length, 
              stats, 
              chartData,
              totalItemCount,
              projectSums
          } as ProcessedWidget;
      });
  }, [items, widgets, numberFields, project.targets, filterRefField, timeRange, customStart, customEnd]);

  // --- Handlers: Data Entry ---
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem[project.fields[0].name]) return; 

    const item: ProjectItem = {
      id: crypto.randomUUID(),
      ...newItem
    };

    const updatedItems = [...items, item];
    setItems(updatedItems);
    onUpdate({ ...project, items: updatedItems });

    const reset: Record<string, any> = {};
    project.fields.forEach(f => reset[f.name] = '');
    setNewItem(reset);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(i => i.id !== id);
    setItems(updatedItems);
    onUpdate({ ...project, items: updatedItems });
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
    onUpdate({ ...project, items: updatedItems });
  };

  // --- Handlers: Dashboard Editing ---
  const handleAddWidget = () => {
      if (!newWidget.title || (!newWidget.filterField && newWidget.type !== 'comparison')) return;
      if (newWidget.type === 'comparison' && (!newWidget.compareFieldA || !newWidget.compareFieldB)) return;
      
      const widget: DashboardWidget = {
          id: crypto.randomUUID(),
          type: newWidget.type || 'card',
          title: newWidget.title,
          filterField: newWidget.filterField,
          filterValue: newWidget.filterValue,
          metricFields: newWidget.metricFields,
          chartType: newWidget.chartType,
          compareFieldA: newWidget.compareFieldA,
          compareFieldB: newWidget.compareFieldB
      };

      const updatedWidgets = [...widgets, widget];
      onUpdate({ ...project, widgets: updatedWidgets });
      setNewWidget({ type: 'card', title: '', filterField: '', metricFields: [] });
  };

  const handleDeleteWidget = (id: string) => {
      const updatedWidgets = widgets.filter(w => w.id !== id);
      onUpdate({ ...project, widgets: updatedWidgets });
  };

  const handleDragWidgetEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
             const newWidgets = arrayMove(widgets, oldIndex, newIndex);
             onUpdate({ ...project, widgets: newWidgets });
        }
    }
  };

  const toggleMetricInNewWidget = (metric: string) => {
      const current = newWidget.metricFields || [];
      if (current.includes(metric)) {
          setNewWidget({ ...newWidget, metricFields: current.filter(m => m !== metric) });
      } else {
          if (newWidget.type === 'comparison') {
              setNewWidget({ ...newWidget, metricFields: [metric] });
          } else {
              setNewWidget({ ...newWidget, metricFields: [...current, metric] });
          }
      }
  };

  // --- Handlers: Analysis ---
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeProjectProgress(project);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // --- Handlers: Structure Editing ---
  const handleAddField = () => {
    onUpdate({
        ...project,
        fields: [...project.fields, { name: `New Field ${project.fields.length + 1}`, type: 'text' }]
    });
  };

  const handleUpdateField = (idx: number, key: keyof ProjectField, val: any) => {
    const newFields = [...project.fields];
    // @ts-ignore
    newFields[idx][key] = val;
    onUpdate({ ...project, fields: newFields });
  };
  
  const handleUpdateFieldOptions = (idx: number, optionsStr: string) => {
      const newFields = [...project.fields];
      newFields[idx].options = optionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      onUpdate({ ...project, fields: newFields });
  };

  const handleDeleteField = (idx: number) => {
    const newFields = project.fields.filter((_, i) => i !== idx);
    onUpdate({ ...project, fields: newFields });
  };

  const handleMoveField = (idx: number, direction: 'up' | 'down') => {
      const newFields = [...project.fields];
      if (direction === 'up' && idx > 0) {
          [newFields[idx], newFields[idx - 1]] = [newFields[idx - 1], newFields[idx]];
      } else if (direction === 'down' && idx < newFields.length - 1) {
          [newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]];
      }
      onUpdate({ ...project, fields: newFields });
  };

  // --- Handlers: Team ---
  const handleAssignEmployee = (employeeId: string) => {
    if (!project.team?.includes(employeeId)) {
      onUpdate({ ...project, team: [...(project.team || []), employeeId] });
    }
  };

  const handleRemoveEmployee = (employeeId: string) => {
    onUpdate({ ...project, team: (project.team || []).filter(id => id !== employeeId) });
  };

  const projectTeam = useMemo(() => {
    return employees.filter(e => project.team?.includes(e.id));
  }, [project.team, employees]);

  const availableEmployees = useMemo(() => {
    return employees.filter(e => !project.team?.includes(e.id));
  }, [project.team, employees]);

  // --- Colors for Charts ---
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const PROGRESS_COLORS = ['#10b981', '#e2e8f0']; // Green for done, Slate for remaining

  // --- Render ---

  if (isEditingStructure) {
      return (
          <div className="max-w-4xl mx-auto px-4 py-8 bg-white shadow-lg rounded-xl my-8 border border-slate-200 animate-fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Edit Project Structure</h2>
                  <button onClick={() => setIsEditingStructure(false)} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900">Done</button>
              </div>
              <div className="space-y-4">
                  {project.fields.map((field, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex flex-col gap-1 items-center justify-center mr-2">
                             <button 
                                onClick={() => handleMoveField(idx, 'up')}
                                disabled={idx === 0}
                                className="text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400"
                             >
                                 <ArrowUpIcon className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => handleMoveField(idx, 'down')}
                                disabled={idx === project.fields.length - 1}
                                className="text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400"
                             >
                                 <ArrowDownIcon className="w-4 h-4" />
                             </button>
                          </div>
                          
                          <span className="text-slate-400 font-mono text-sm w-6">{idx + 1}</span>
                          <input 
                              value={field.name} 
                              onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                              className="flex-1 p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none"
                              placeholder="Field Name"
                          />
                          <select 
                              value={field.type}
                              onChange={(e) => handleUpdateField(idx, 'type', e.target.value as any)}
                              className="w-full sm:w-32 p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none bg-white"
                          >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Dropdown</option>
                          </select>
                          
                          {field.type === 'select' && (
                             <input 
                                placeholder="Options (comma sep)"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => handleUpdateFieldOptions(idx, e.target.value)}
                                className="flex-1 p-2 border border-purple-200 bg-purple-50 rounded focus:ring-brand-500 focus:outline-none text-sm"
                             />
                          )}
                          
                          <button onClick={() => handleDeleteField(idx)} className="text-slate-400 hover:text-red-500 p-2">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  ))}
                  <button onClick={handleAddField} className="flex items-center text-brand-600 font-medium hover:text-brand-800 mt-2">
                      <PlusIcon className="w-5 h-5 mr-2" /> Add Field
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={onBack} className="text-slate-500 hover:text-slate-700 flex items-center mb-2 text-sm font-medium transition-colors">
            <span className="mr-1">←</span> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-500">{project.industry} • {project.items.length} Work Units</p>
        </div>
        <div className="flex gap-2">
            {activeTab === 'dashboard' && (
                <button 
                    onClick={() => setIsEditingDashboard(!isEditingDashboard)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium border ${isEditingDashboard ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                    <EditIcon className="w-4 h-4" /> {isEditingDashboard ? 'Done Editing' : 'Customize Dashboard'}
                </button>
            )}
            <button 
                onClick={() => setIsEditingStructure(true)}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            >
                <EditIcon className="w-4 h-4" /> Edit Structure
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ChartIcon className="w-4 h-4 mr-2" /> Custom Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex items-center pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'data' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <TableIcon className="w-4 h-4 mr-2" /> Data Entry
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`flex items-center pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'team' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <UsersIcon className="w-4 h-4 mr-2" /> Project Team
        </button>
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analysis' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <SparklesIcon className="w-4 h-4 mr-2" /> AI Insights
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex items-center pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ChatBubbleIcon className="w-4 h-4 mr-2" /> AI Chat
        </button>
      </div>

      <div className="min-h-[500px]">
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
              
              {/* DATE FILTER BAR */}
              {dateFields.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarIcon className="w-5 h-5 text-brand-500" />
                          <span className="font-semibold">Filter Charts by Date:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                           <select 
                                value={filterRefField}
                                onChange={(e) => setFilterRefField(e.target.value)}
                                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 bg-slate-50"
                           >
                               {dateFields.map(f => (
                                   <option key={f.name} value={f.name}>{f.name}</option>
                               ))}
                           </select>

                           <div className="flex bg-slate-100 rounded-lg p-1">
                               {['all', '7d', '30d', 'custom'].map((range) => (
                                   <button
                                       key={range}
                                       onClick={() => setTimeRange(range as any)}
                                       className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                           timeRange === range 
                                           ? 'bg-white text-brand-700 shadow-sm' 
                                           : 'text-slate-500 hover:text-slate-700'
                                       }`}
                                   >
                                       {range === 'all' ? 'All Time' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Custom'}
                                   </button>
                               ))}
                           </div>

                           {timeRange === 'custom' && (
                               <div className="flex items-center gap-2">
                                   <input 
                                      type="date" 
                                      value={customStart}
                                      onChange={(e) => setCustomStart(e.target.value)}
                                      className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-brand-500"
                                   />
                                   <span className="text-slate-400">-</span>
                                   <input 
                                      type="date" 
                                      value={customEnd}
                                      onChange={(e) => setCustomEnd(e.target.value)}
                                      className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-brand-500"
                                   />
                               </div>
                           )}
                      </div>
                  </div>
              )}

              {/* Dashboard Builder */}
              {isEditingDashboard && (
                  <div className="bg-slate-50 border-2 border-dashed border-brand-300 p-6 rounded-xl mb-8 animate-fade-in">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <PlusIcon className="w-5 h-5 mr-2 text-brand-600" />
                          Add New Widget
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">1. Label / Title</label>
                              <input 
                                  placeholder="e.g. Cutting Progress" 
                                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                  value={newWidget.title}
                                  onChange={e => setNewWidget({...newWidget, title: e.target.value})}
                              />
                          </div>
                          
                          <div className="md:col-span-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">2. Widget Type</label>
                              <select 
                                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                  value={newWidget.type}
                                  onChange={e => setNewWidget({...newWidget, type: e.target.value as any})}
                              >
                                  <option value="card">Summary Card</option>
                                  <option value="chart">Chart</option>
                                  <option value="comparison">Comparison Card</option>
                              </select>
                          </div>

                          {newWidget.type === 'comparison' ? (
                              <div className="md:col-span-2 grid grid-cols-2 gap-2">
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">3. Stage A (Base)</label>
                                     <select 
                                         className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                         value={newWidget.compareFieldA || ''}
                                         onChange={e => setNewWidget({...newWidget, compareFieldA: e.target.value })}
                                     >
                                         <option value="">-- Select --</option>
                                         {dateFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Stage B (Target)</label>
                                     <select 
                                         className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                         value={newWidget.compareFieldB || ''}
                                         onChange={e => setNewWidget({...newWidget, compareFieldB: e.target.value })}
                                     >
                                         <option value="">-- Select --</option>
                                         {dateFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                     </select>
                                  </div>
                              </div>
                          ) : (
                              <>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">3. Track Field</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                        value={newWidget.filterField}
                                        onChange={e => {
                                            const fieldName = e.target.value;
                                            const field = project.fields.find(f => f.name === fieldName);
                                            const defaultVal = field?.type === 'select' && field.options ? field.options[0] : undefined;
                                            setNewWidget({...newWidget, filterField: fieldName, filterValue: defaultVal });
                                        }}
                                    >
                                        <option value="">-- Select Field --</option>
                                        {filterableFields.map(f => (
                                            <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {project.fields.find(f => f.name === newWidget.filterField)?.type === 'select' && (
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Value is Equal To</label>
                                        <select 
                                            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                            value={newWidget.filterValue}
                                            onChange={e => setNewWidget({...newWidget, filterValue: e.target.value})}
                                        >
                                            {project.fields.find(f => f.name === newWidget.filterField)?.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                              </>
                          )}
                      </div>

                      {(newWidget.type !== 'chart') && (newWidget.filterField || newWidget.type === 'comparison') && (
                          <div className="mt-4">
                              <label className="block text-xs font-bold text-slate-500 mb-2">
                                  {newWidget.type === 'comparison' ? '4. Metric to Compare (Optional)' : '4. Show Metrics (Optional)'}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                  {numberFields.map(nf => (
                                      <button 
                                        key={nf.name}
                                        onClick={() => toggleMetricInNewWidget(nf.name)}
                                        className={`px-3 py-1 rounded-full text-sm border ${
                                            (newWidget.metricFields || []).includes(nf.name) 
                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-medium' 
                                            : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-300'
                                        }`}
                                      >
                                          {nf.name}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {newWidget.type === 'chart' && (
                          <div className="mt-4">
                              <label className="block text-xs font-bold text-slate-500 mb-2">4. Chart Style</label>
                              <div className="flex gap-4 flex-wrap">
                                  {['bar', 'area', 'pie', 'progress'].map(t => (
                                      <label key={t} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded border border-slate-200">
                                          <input 
                                            type="radio" 
                                            name="chartType" 
                                            checked={newWidget.chartType === t || (!newWidget.chartType && t === 'bar')}
                                            onChange={() => setNewWidget({...newWidget, chartType: t as any})}
                                          />
                                          <span className="capitalize text-sm text-slate-700">{t === 'progress' ? 'Progress (Actual vs Total)' : `${t} Chart`}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="mt-6 flex justify-end">
                          <button 
                            onClick={handleAddWidget}
                            disabled={!newWidget.title || (!newWidget.filterField && newWidget.type !== 'comparison')}
                            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium shadow-sm"
                          >
                              Add Widget
                          </button>
                      </div>
                  </div>
              )}

              {/* Empty State */}
              {widgetData.length === 0 && !isEditingDashboard && (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                      <FactoryIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Your Dashboard is Empty</h3>
                      <p className="text-slate-500 mb-6 max-w-md mx-auto">Create custom cards to track specific workflows like "Cutting Progress", "Welding Done", or "Shipments".</p>
                      <button 
                        onClick={() => setIsEditingDashboard(true)}
                        className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all font-medium"
                      >
                          Start Customizing
                      </button>
                  </div>
              )}

              {/* Widgets Grid - Wrapped in DndContext */}
              <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragWidgetEnd}
              >
                  <SortableContext 
                      items={widgetData.map(w => w.id)} 
                      strategy={rectSortingStrategy}
                      disabled={!isEditingDashboard}
                  >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {widgetData.map((widget) => {
                              // Render Content
                              let content;
                              if (widget.type === 'comparison') {
                                  const { countA, countB, sumA, sumB, metric } = widget.comparisonStats;
                                  const balance = countA - countB;
                                  const sumBalance = sumA - sumB;
                                  content = (
                                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden relative group h-full">
                                        {isEditingDashboard && (
                                            <button 
                                                onClick={() => handleDeleteWidget(widget.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 z-10 opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-indigo-100 p-1.5 rounded text-indigo-700">
                                                    <ChartIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{widget.title}</h3>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{widget.compareFieldA} vs {widget.compareFieldB}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-center relative mt-2">
                                                <div className="absolute top-1/2 left-4 right-4 h-px bg-indigo-100 -z-10"></div>
                                                <div className="bg-white p-2 rounded border border-indigo-50 shadow-sm z-10 min-w-[60px]">
                                                    <div className="text-lg font-bold text-indigo-600">{countA}</div>
                                                    <div className="text-[10px] text-slate-400">Done</div>
                                                </div>
                                                <div className="bg-indigo-50 px-2 py-1 rounded text-xs font-bold text-indigo-700 border border-indigo-100 z-10">
                                                    {balance > 0 ? `+${balance}` : balance} Bal
                                                </div>
                                                <div className="bg-white p-2 rounded border border-indigo-50 shadow-sm z-10 min-w-[60px]">
                                                    <div className="text-lg font-bold text-emerald-600">{countB}</div>
                                                    <div className="text-[10px] text-slate-400">Done</div>
                                                </div>
                                            </div>
                                            {metric && (
                                                <div className="mt-4 pt-3 border-t border-indigo-50 flex justify-between text-xs text-slate-500">
                                                    <span>WT: <strong>{sumA.toLocaleString()}</strong></span>
                                                    <span className="text-indigo-400">Δ {sumBalance.toLocaleString()}</span>
                                                    <span><strong>{sumB.toLocaleString()}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                  );
                              } else {
                                  // Chart or Card
                                  content = (
                                    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all relative group h-full flex flex-col`}>
                                        {isEditingDashboard && (
                                            <button 
                                                onClick={() => handleDeleteWidget(widget.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 z-10 opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="p-5 h-full flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">{widget.title}</h3>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {widget.filterField} 
                                                        {widget.filterValue && <span className="bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-600 font-medium">{widget.filterValue}</span>}
                                                    </p>
                                                </div>
                                                <div className="bg-brand-50 text-brand-700 p-2 rounded-lg">
                                                    {widget.type === 'card' ? <TableIcon className="w-5 h-5" /> : <ChartIcon className="w-5 h-5" />}
                                                </div>
                                            </div>

                                            {widget.type === 'card' ? (
                                                <div className="flex-1">
                                                    <div className="mb-5">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-3xl font-extrabold text-slate-900">{widget.count.toLocaleString()}</span>
                                                            <span className="text-sm text-slate-500 font-medium">/ {widget.totalItemCount.toLocaleString()} Total</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-brand-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (widget.count / (widget.totalItemCount || 1)) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    {widget.metricFields && widget.metricFields.length > 0 && (
                                                        <div className="border-t border-slate-100 pt-4 space-y-4">
                                                            {widget.metricFields.map(metric => {
                                                                const val = widget.stats[metric];
                                                                const target = project.targets?.[metric];
                                                                const total = target || widget.projectSums[metric];
                                                                const pct = total > 0 ? (val / total) * 100 : 0;
                                                                return (
                                                                    <div key={metric}>
                                                                        <div className="flex justify-between text-sm mb-1.5">
                                                                            <span className="text-slate-600 font-semibold">{metric}</span>
                                                                            <span className="font-mono text-slate-700">
                                                                                <span className="font-bold text-emerald-700">{val.toLocaleString()}</span>
                                                                                <span className="text-slate-400 mx-1">/</span> {total.toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${pct > 100 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-64 w-full mt-auto">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        {widget.chartType === 'pie' || widget.chartType === 'progress' ? (
                                                            <PieChart>
                                                                <Pie data={widget.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={widget.chartType === 'progress' ? 60 : 0} outerRadius={80} paddingAngle={2}>
                                                                    {widget.chartData.map((_, index) => <Cell key={`cell-${index}`} fill={widget.chartType === 'progress' ? PROGRESS_COLORS[index % PROGRESS_COLORS.length] : COLORS[index % COLORS.length]} stroke="none" />)}
                                                                </Pie>
                                                                <RechartsTooltip />
                                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                                {widget.chartType === 'progress' && (
                                                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                                                        <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="#1f2937">{Math.round((widget.chartData[0].value / (widget.chartData[0].value + widget.chartData[1].value || 1)) * 100)}%</tspan>
                                                                        <tspan x="50%" dy="1.5em" fontSize="12" fill="#6b7280">Actual</tspan>
                                                                    </text>
                                                                )}
                                                            </PieChart>
                                                        ) : widget.chartType === 'area' ? (
                                                            <AreaChart data={widget.chartData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                                <RechartsTooltip />
                                                                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} strokeWidth={2} />
                                                            </AreaChart>
                                                        ) : (
                                                            <BarChart data={widget.chartData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                                                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                                            </BarChart>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                  );
                              }

                              // Wrap in Sortable Item
                              return (
                                  <SortableWidgetItem key={widget.id} id={widget.id} disabled={!isEditingDashboard}>
                                      {content}
                                  </SortableWidgetItem>
                              );
                          })}
                      </div>
                  </SortableContext>
              </DndContext>
          </div>
        )}

        {/* === DATA ENTRY TAB === */}
        {activeTab === 'data' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
             <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Add Work Unit / Item</h3>
                <form onSubmit={handleAddItem} className="flex flex-wrap gap-4 items-end">
                    {project.fields.map(field => (
                        <div key={field.name} className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">{field.name}</label>
                            {field.type === 'select' ? (
                                <select 
                                    value={newItem[field.name] || ''}
                                    onChange={e => setNewItem({...newItem, [field.name]: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-brand-500 focus:outline-none bg-white"
                                >
                                    <option value="">-- Select --</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input 
                                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                                    step="any"
                                    value={newItem[field.name] || ''}
                                    onChange={e => setNewItem({...newItem, [field.name]: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-brand-500 focus:outline-none"
                                    placeholder={field.name}
                                    required={field.name === project.fields[0].name}
                                />
                            )}
                        </div>
                    ))}
                    <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
                        Add Row
                    </button>
                </form>
             </div>

             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                             {project.fields.map(f => (
                                 <th key={f.name} className={`px-4 py-3 font-semibold ${f.type === 'date' ? 'text-brand-700 bg-brand-50/50' : 'text-slate-700'}`}>
                                    {f.name}
                                 </th>
                             ))}
                             <th className="px-4 py-3"></th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {items.length === 0 ? (
                             <tr><td colSpan={100} className="px-4 py-8 text-center text-slate-500">No items added yet.</td></tr>
                         ) : items.map(item => (
                             <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                 {project.fields.map(f => (
                                     <td key={f.name} className="px-4 py-1">
                                         {f.type === 'select' ? (
                                             <select 
                                                 value={item[f.name] || ''} 
                                                 onChange={e => handleItemChange(item.id, f.name, e.target.value)}
                                                 className="w-full bg-transparent border border-transparent hover:border-slate-300 rounded focus:ring-brand-500 focus:border-brand-500 p-1 text-slate-900"
                                             >
                                                 <option value="">-</option>
                                                 {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                             </select>
                                         ) : (
                                             <input 
                                                type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                                                step="any"
                                                value={item[f.name] || ''} 
                                                onChange={e => handleItemChange(item.id, f.name, e.target.value)}
                                                className={`w-full bg-transparent border border-transparent hover:border-slate-300 rounded focus:ring-brand-500 focus:border-brand-500 p-1 text-slate-900 ${f.type==='date' ? 'text-xs text-brand-700 font-medium' : ''}`}
                                             />
                                         )}
                                     </td>
                                 ))}
                                 <td className="px-4 py-1 text-right">
                                     <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-red-500 p-2">
                                         <TrashIcon className="w-4 h-4" />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* === TEAM TAB === */}
        {activeTab === 'team' && (
             <div className="max-w-5xl mx-auto animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {/* Assigned Team */}
                     <div className="md:col-span-2 space-y-4">
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                 <UsersIcon className="w-5 h-5 text-brand-600" />
                                 Project Team ({projectTeam.length})
                             </h3>
                             
                             {projectTeam.length === 0 ? (
                                 <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                     <p className="text-slate-500 mb-2">No employees assigned yet.</p>
                                     <p className="text-xs text-slate-400">Select employees from the list to assign them.</p>
                                 </div>
                             ) : (
                                 <div className="space-y-3">
                                     {projectTeam.map(emp => (
                                         <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors">
                                             <div className="flex items-center gap-3">
                                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                                                     emp.department === 'Engineering' ? 'bg-indigo-500' : 
                                                     emp.department === 'Field Ops' ? 'bg-emerald-500' : 'bg-brand-500'
                                                 }`}>
                                                     {emp.avatar || emp.name.substring(0,2)}
                                                 </div>
                                                 <div>
                                                     <h4 className="font-bold text-slate-800 text-sm">{emp.name}</h4>
                                                     <p className="text-xs text-slate-500">{emp.role} • {emp.department}</p>
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={() => handleRemoveEmployee(emp.id)}
                                                className="text-slate-400 hover:text-red-500 text-xs px-2 py-1"
                                             >
                                                 Remove
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     </div>

                     {/* Available Employees */}
                     <div className="md:col-span-1">
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                             <h3 className="font-bold text-slate-800 mb-3 text-sm">Assign From Workforce</h3>
                             <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                 {availableEmployees.length === 0 ? (
                                     <p className="text-xs text-slate-400 italic">No available employees to assign.</p>
                                 ) : (
                                     availableEmployees.map(emp => (
                                         <div key={emp.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 group">
                                             <div>
                                                 <p className="text-sm font-medium text-slate-700">{emp.name}</p>
                                                 <p className="text-[10px] text-slate-500">{emp.role}</p>
                                             </div>
                                             <button 
                                                onClick={() => handleAssignEmployee(emp.id)}
                                                className="text-brand-600 hover:bg-brand-50 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                                             >
                                                 <PlusIcon className="w-4 h-4" />
                                             </button>
                                         </div>
                                     ))
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        )}

        {/* === ANALYSIS TAB === */}
        {activeTab === 'analysis' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {!analysis ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <SparklesIcon className="w-12 h-12 text-brand-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Generate AI Progress Report</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Gemini will analyze your data columns, calculate velocity, and identify risks in your workflow.
                </p>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="bg-brand-600 text-white py-3 px-6 rounded-lg hover:bg-brand-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Analyzing Data...
                    </>
                  ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Generate Report
                    </>
                  )}
                </button>
              </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-6">
                             <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-brand-500" />
                                AI Analysis Report
                             </h3>
                             <button onClick={() => setAnalysis(null)} className="text-sm text-slate-500 hover:text-slate-800">Clear</button>
                        </div>
                        
                        <div className="prose prose-slate max-w-none">
                            <div className="mb-6">
                                <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Executive Summary</h4>
                                <p className="text-slate-800 leading-relaxed">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                                        ⚠️ Potential Risks
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                        {analysis.risks.map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                        💡 Recommendations
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                                        {analysis.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                                    </ul>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Completion Estimate</h4>
                                <p className="text-slate-800 font-medium">{analysis.estimatedCompletion}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* === AI CHAT TAB === */}
        {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto">
                <ProjectChat project={project} />
            </div>
        )}
      </div>
    </div>
  );
};