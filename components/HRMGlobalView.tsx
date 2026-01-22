import React, { useState, useMemo } from 'react';
import { Employee, LeaveRequest, JobPosting, Candidate } from '../types';
import { 
  UsersIcon, PlusIcon, BriefcaseIcon, TrashIcon, 
  DollarSignIcon, ClockIcon, SearchIcon, CheckIcon, XIcon,
  CalendarIcon, FileTextIcon, FactoryIcon
} from './Icons';

interface HRMGlobalViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  jobs: JobPosting[];
  onAddEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateLeave: (id: string, status: 'Approved' | 'Rejected') => void;
  onAddJob: (job: JobPosting) => void;
}

export const HRMGlobalView: React.FC<HRMGlobalViewProps> = ({ 
  employees, leaves, jobs, onAddEmployee, onDeleteEmployee, onUpdateLeave, onAddJob 
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'leave' | 'payroll' | 'recruitment'>('directory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '', role: '', department: 'Field Ops', email: '', skills: [], status: 'Active', salary: 50000
  });
  const [newSkill, setNewSkill] = useState('');

  // Derived Data
  const departments = Array.from(new Set(employees.map(e => e.department)));
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const activeEmployees = employees.filter(e => e.status === 'Active');
  
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.name && newEmployee.role) {
      onAddEmployee({
        id: crypto.randomUUID(),
        name: newEmployee.name!,
        role: newEmployee.role!,
        department: newEmployee.department || 'General',
        email: newEmployee.email || '',
        skills: newEmployee.skills || [],
        status: (newEmployee.status as any) || 'Active',
        salary: Number(newEmployee.salary) || 50000,
        joinDate: new Date().toISOString().split('T')[0],
        avatar: newEmployee.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      });
      setIsModalOpen(false);
      setNewEmployee({ name: '', role: '', department: 'Field Ops', email: '', skills: [], status: 'Active', salary: 50000 });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && newEmployee.skills) {
      setNewEmployee({ ...newEmployee, skills: [...newEmployee.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'On Leave': return 'bg-amber-100 text-amber-700';
      case 'Terminated': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
          <div className="mb-8 pl-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <UsersIcon className="w-6 h-6 text-brand-600" />
                 HR Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">Workforce Administration</p>
          </div>

          <nav className="space-y-2 flex-1">
              <button 
                onClick={() => setActiveTab('directory')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'directory' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <BriefcaseIcon className="w-5 h-5" /> Directory & Profiles
              </button>
              <button 
                onClick={() => setActiveTab('leave')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leave' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <ClockIcon className="w-5 h-5" /> Time & Attendance
                  {pendingLeaves.length > 0 && <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingLeaves.length}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('payroll')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payroll' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <DollarSignIcon className="w-5 h-5" /> Payroll
              </button>
              <button 
                onClick={() => setActiveTab('recruitment')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recruitment' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <UsersIcon className="w-5 h-5" /> Recruitment
              </button>
          </nav>

          <div className="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">My Portal</h4>
              <button className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-2">
                   View My Profile &rarr;
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          
          {/* === DIRECTORY TAB === */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
                        <p className="text-slate-500">Manage {employees.length} active employee profiles.</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-all shadow-sm"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" /> Add Employee
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Employees</div>
                        <div className="text-2xl font-bold text-slate-900">{employees.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">Departments</div>
                         <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">On Leave</div>
                         <div className="text-2xl font-bold text-amber-600">{employees.filter(e => e.status === 'On Leave').length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">Monthly Payroll</div>
                         <div className="text-2xl font-bold text-green-600">${Math.round(totalPayroll / 12).toLocaleString()}</div>
                    </div>
                </div>

                {/* Search & Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Search by name, role, or department..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Role & Dept</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                                                  emp.department === 'Engineering' ? 'bg-indigo-500' : 
                                                  emp.department === 'Field Ops' ? 'bg-emerald-500' : 'bg-brand-500'
                                                }`}>
                                                    {emp.avatar}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                                    <div className="text-xs text-slate-500">ID: {emp.id.substring(0, 6)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{emp.role}</div>
                                            <div className="text-xs text-slate-500">{emp.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(emp.status)}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                              onClick={() => onDeleteEmployee(emp.id)}
                                              className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {/* === TIME & ATTENDANCE TAB === */}
          {activeTab === 'leave' && (
             <div className="space-y-6 animate-fade-in">
                 <h1 className="text-2xl font-bold text-slate-900">Time & Attendance</h1>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Leave Requests Panel */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <ClockIcon className="w-5 h-5 text-brand-600" />
                             Leave Requests
                         </h3>
                         <div className="space-y-4">
                             {leaves.length === 0 ? (
                                 <p className="text-slate-400 italic text-sm">No leave requests found.</p>
                             ) : (
                                 leaves.map(req => {
                                     const employee = employees.find(e => e.id === req.employeeId);
                                     return (
                                         <div key={req.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 flex flex-col gap-2">
                                             <div className="flex justify-between items-start">
                                                 <div className="flex items-center gap-2">
                                                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                         {employee?.avatar || '??'}
                                                     </div>
                                                     <div>
                                                         <div className="font-bold text-sm text-slate-800">{employee?.name || 'Unknown'}</div>
                                                         <div className="text-xs text-slate-500">{req.type} • {req.startDate} to {req.endDate}</div>
                                                     </div>
                                                 </div>
                                                 <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusColor(req.status)}`}>{req.status}</span>
                                             </div>
                                             <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 italic">"{req.reason}"</p>
                                             {req.status === 'Pending' && (
                                                 <div className="flex gap-2 mt-1 justify-end">
                                                     <button 
                                                        onClick={() => onUpdateLeave(req.id, 'Rejected')}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50"
                                                     >
                                                         <XIcon className="w-3 h-3" /> Reject
                                                     </button>
                                                     <button 
                                                        onClick={() => onUpdateLeave(req.id, 'Approved')}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-brand-600 text-white rounded hover:bg-brand-700 shadow-sm"
                                                     >
                                                         <CheckIcon className="w-3 h-3" /> Approve
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })
                             )}
                         </div>
                     </div>

                     {/* Today's Attendance Snapshot (Dummy) */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <UsersIcon className="w-5 h-5 text-emerald-600" />
                             Today's Attendance
                         </h3>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-emerald-50 p-4 rounded-lg text-center">
                                 <div className="text-2xl font-bold text-emerald-700">{Math.floor(activeEmployees.length * 0.9)}</div>
                                 <div className="text-xs text-emerald-600">Present</div>
                             </div>
                             <div className="bg-amber-50 p-4 rounded-lg text-center">
                                 <div className="text-2xl font-bold text-amber-700">{activeEmployees.length - Math.floor(activeEmployees.length * 0.9)}</div>
                                 <div className="text-xs text-amber-600">Absent / Late</div>
                             </div>
                         </div>
                         <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Recent Clock-ins</h4>
                         <div className="space-y-2">
                             {activeEmployees.slice(0, 5).map((e, i) => (
                                 <div key={e.id} className="flex justify-between text-sm items-center py-2 border-b border-slate-50 last:border-0">
                                     <span className="text-slate-700">{e.name}</span>
                                     <span className="font-mono text-xs text-slate-500">0{8 + (i % 2)}:{30 + i * 5} AM</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
          )}

          {/* === PAYROLL TAB === */}
          {activeTab === 'payroll' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                        Process Monthly Payroll
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                              <tr>
                                  <th className="px-6 py-4">Employee</th>
                                  <th className="px-6 py-4">Designation</th>
                                  <th className="px-6 py-4">Annual Salary</th>
                                  <th className="px-6 py-4">Monthly Gross</th>
                                  <th className="px-6 py-4 text-center">Status</th>
                                  <th className="px-6 py-4 text-right">Payslip</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {employees.map(emp => (
                                  <tr key={emp.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                                      <td className="px-6 py-4 text-slate-500">{emp.role}</td>
                                      <td className="px-6 py-4 text-slate-700">${emp.salary?.toLocaleString()}</td>
                                      <td className="px-6 py-4 font-mono text-slate-900">${Math.round((emp.salary || 0) / 12).toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center">
                                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Processed</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button className="text-brand-600 hover:text-brand-800 text-xs font-medium flex items-center gap-1 justify-end w-full">
                                              <FileTextIcon className="w-4 h-4" /> Download
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* === RECRUITMENT TAB === */}
          {activeTab === 'recruitment' && (
              <div className="space-y-6 animate-fade-in">
                  <h1 className="text-2xl font-bold text-slate-900">Recruitment Pipeline</h1>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {jobs.map(job => (
                          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-lg">{job.title}</h3>
                                      <p className="text-sm text-slate-500">{job.department}</p>
                                  </div>
                                  <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">{job.status}</span>
                              </div>
                              
                              <div className="flex-1 space-y-3 mb-4">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase">Candidates ({job.applicants.length})</h4>
                                  {job.applicants.slice(0, 3).map(c => (
                                      <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                          <span className="text-slate-700 truncate">{c.name}</span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                              c.stage === 'Hired' ? 'bg-green-100 text-green-700' :
                                              c.stage === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                          }`}>{c.stage}</span>
                                      </div>
                                  ))}
                                  {job.applicants.length > 3 && (
                                      <div className="text-xs text-center text-slate-400">+{job.applicants.length - 3} more</div>
                                  )}
                              </div>

                              <button className="w-full mt-auto py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                                  Manage Applicants
                              </button>
                          </div>
                      ))}
                      
                      {/* Add Job Card */}
                      <button className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors min-h-[250px]">
                          <PlusIcon className="w-12 h-12 mb-2" />
                          <span className="font-bold">Post New Job</span>
                      </button>
                  </div>
              </div>
          )}

      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
                  <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                          <input 
                              required
                              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                              value={newEmployee.name}
                              onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Role / Title</label>
                              <input 
                                  required
                                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                  value={newEmployee.role}
                                  onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                              <select 
                                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 bg-white"
                                  value={newEmployee.department}
                                  onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}
                              >
                                  <option value="Engineering">Engineering</option>
                                  <option value="Field Ops">Field Ops</option>
                                  <option value="Management">Management</option>
                                  <option value="HR">HR</option>
                                  <option value="Sales">Sales</option>
                              </select>
                          </div>
                      </div>
                      <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Annual Salary ($)</label>
                           <input 
                              type="number"
                              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                              value={newEmployee.salary}
                              onChange={e => setNewEmployee({...newEmployee, salary: parseFloat(e.target.value)})}
                           />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Skills</label>
                          <div className="flex gap-2 mb-2">
                              <input 
                                  className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500 text-sm"
                                  value={newSkill}
                                  onChange={e => setNewSkill(e.target.value)}
                                  placeholder="Add skill..."
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              />
                              <button type="button" onClick={addSkill} className="bg-slate-100 px-3 rounded text-slate-600 hover:bg-slate-200">+</button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                              {newEmployee.skills?.map(s => (
                                  <span key={s} className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs border border-brand-100">{s}</span>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 shadow-sm">Save Employee</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};