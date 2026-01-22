import React, { useState } from 'react';
import { Account, Invoice, Bill } from '../types';
import { 
  BankIcon, ReceiptIcon, FileTextIcon, TrendingUpIcon, 
  PlusIcon, CheckIcon, DollarSignIcon, CreditCardIcon, ArrowUpIcon, ArrowDownIcon
} from './Icons';

interface AccountingViewProps {
  accounts: Account[];
  invoices: Invoice[];
  bills: Bill[];
  onAddInvoice: (inv: Invoice) => void;
  onAddBill: (bill: Bill) => void;
  onPayInvoice: (id: string) => void;
  onPayBill: (id: string) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({ 
  accounts, invoices, bills, onAddInvoice, onAddBill, onPayInvoice, onPayBill 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gl' | 'ar' | 'ap' | 'reconcile' | 'reports'>('overview');
  
  // States for simple forms
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [newInv, setNewInv] = useState<Partial<Invoice>>({ customerName: '', amount: 0, date: new Date().toISOString().split('T')[0] });

  // Calculations
  const totalRevenue = invoices.filter(i => i.status !== 'Draft').reduce((s, i) => s + i.amount, 0);
  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const outstandingAR = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft').reduce((s, i) => s + i.amount, 0);
  const outstandingAP = bills.filter(b => b.status !== 'Paid').reduce((s, b) => s + b.amount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
      e.preventDefault();
      onAddInvoice({
          id: crypto.randomUUID(),
          number: `INV-${Math.floor(Math.random() * 10000)}`,
          customerName: newInv.customerName || 'Unknown',
          amount: Number(newInv.amount),
          date: newInv.date || new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Sent'
      });
      setIsInvModalOpen(false);
      setNewInv({ customerName: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
            <div className="mb-8 pl-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BankIcon className="w-6 h-6 text-emerald-600" />
                    Finance
                </h2>
                <p className="text-xs text-slate-500 mt-1">Accounting & Reporting</p>
            </div>
            <nav className="space-y-2 flex-1">
                <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <TrendingUpIcon className="w-5 h-5" /> Overview
                </button>
                <button onClick={() => setActiveTab('gl')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'gl' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <FileTextIcon className="w-5 h-5" /> General Ledger
                </button>
                <button onClick={() => setActiveTab('ar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ar' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ReceiptIcon className="w-5 h-5" /> Invoices (AR)
                </button>
                <button onClick={() => setActiveTab('ap')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ap' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <CreditCardIcon className="w-5 h-5" /> Bills (AP)
                </button>
                <button onClick={() => setActiveTab('reconcile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reconcile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <CheckIcon className="w-5 h-5" /> Reconciliation
                </button>
                <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <BankIcon className="w-5 h-5" /> Reports
                </button>
            </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
            
            {/* === OVERVIEW TAB === */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">Financial Dashboard</h1>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Net Income</div>
                            <div className="text-2xl font-bold text-slate-900">${netIncome.toLocaleString()}</div>
                            <div className="text-xs text-emerald-600 mt-1 flex items-center"><ArrowUpIcon className="w-3 h-3 mr-1" /> +12% vs last month</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Revenue</div>
                            <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Expenses</div>
                            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Cash on Hand</div>
                            <div className="text-2xl font-bold text-slate-900">${accounts.find(a => a.name === 'Business Checking')?.balance.toLocaleString() || '0'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ReceiptIcon className="w-5 h-5 text-emerald-600" /> Outstanding Receivables
                            </h3>
                            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-4">
                                <span className="text-emerald-800 font-medium">To Collect</span>
                                <span className="text-xl font-bold text-emerald-700">${outstandingAR.toLocaleString()}</span>
                            </div>
                            <div className="space-y-3">
                                {invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').slice(0, 3).map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <div>
                                            <div className="font-medium text-slate-800">{inv.customerName}</div>
                                            <div className="text-xs text-slate-500">Due: {inv.dueDate}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">${inv.amount.toLocaleString()}</div>
                                            <div className={`text-[10px] uppercase font-bold ${inv.status === 'Overdue' ? 'text-red-500' : 'text-slate-400'}`}>{inv.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5 text-red-500" /> Accounts Payable
                            </h3>
                            <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                                <span className="text-red-800 font-medium">To Pay</span>
                                <span className="text-xl font-bold text-red-700">${outstandingAP.toLocaleString()}</span>
                            </div>
                            <div className="space-y-3">
                                {bills.filter(b => b.status !== 'Paid').slice(0, 3).map(bill => (
                                    <div key={bill.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <div>
                                            <div className="font-medium text-slate-800">{bill.vendorName}</div>
                                            <div className="text-xs text-slate-500">Due: {bill.dueDate}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">${bill.amount.toLocaleString()}</div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400">{bill.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === GENERAL LEDGER === */}
            {activeTab === 'gl' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-900">General Ledger & Chart of Accounts</h1>
                        <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
                             Add Account
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Account Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accounts.map(acc => (
                                    <tr key={acc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-slate-500">{acc.code}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{acc.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                acc.type === 'Asset' ? 'bg-blue-50 text-blue-700' :
                                                acc.type === 'Liability' ? 'bg-amber-50 text-amber-700' :
                                                acc.type === 'Revenue' ? 'bg-emerald-50 text-emerald-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>{acc.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{acc.category}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">${acc.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === INVOICES (AR) === */}
            {activeTab === 'ar' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-900">Invoices (Accounts Receivable)</h1>
                        <button 
                            onClick={() => setIsInvModalOpen(true)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
                        >
                             <PlusIcon className="w-4 h-4 mr-2" /> Create Invoice
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Number</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-slate-500">{inv.number}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{inv.customerName}</td>
                                        <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                        <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">${inv.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                                inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>{inv.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {inv.status !== 'Paid' && (
                                                <button onClick={() => onPayInvoice(inv.id)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === BILLS (AP) === */}
            {activeTab === 'ap' && (
                <div className="animate-fade-in space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">Bills (Accounts Payable)</h1>
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Vendor</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{bill.vendorName}</td>
                                        <td className="px-6 py-4 text-slate-500">{bill.date}</td>
                                        <td className="px-6 py-4 text-slate-500">{bill.category}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">${bill.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                bill.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>{bill.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {bill.status !== 'Paid' && (
                                                <button onClick={() => onPayBill(bill.id)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === RECONCILIATION === */}
            {activeTab === 'reconcile' && (
                <div className="animate-fade-in space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">Bank Reconciliation</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Bank Feed */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <BankIcon className="w-5 h-5 text-slate-500" /> Bank Statement (Feed)
                            </h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center cursor-pointer hover:border-emerald-400">
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Check #402</div>
                                        <div className="text-xs text-slate-500">Jun 12, 2024</div>
                                    </div>
                                    <div className="font-mono text-slate-900">$450.00</div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center cursor-pointer hover:border-emerald-400">
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Deposit - Stripe</div>
                                        <div className="text-xs text-slate-500">Jun 14, 2024</div>
                                    </div>
                                    <div className="font-mono text-green-600">$1,200.00</div>
                                </div>
                            </div>
                        </div>

                        {/* Ledger */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileTextIcon className="w-5 h-5 text-emerald-500" /> Accounting Ledger
                            </h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Matches found: 1</div>
                                        <div className="text-xs text-emerald-700">Vendor Payment - Supply Co</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-slate-900">$450.00</span>
                                        <button className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">Match</button>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border border-dashed border-slate-300 rounded flex justify-center items-center h-[58px] text-slate-400 text-sm italic">
                                    No match found for $1,200.00
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === REPORTS === */}
            {activeTab === 'reports' && (
                <div className="animate-fade-in space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* P&L */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-lg font-bold text-slate-800">Profit & Loss</h3>
                                 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">YTD 2024</span>
                             </div>
                             
                             <div className="space-y-3">
                                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                     <span className="font-medium text-slate-700">Total Revenue</span>
                                     <span className="font-bold text-slate-900">${totalRevenue.toLocaleString()}</span>
                                 </div>
                                 <div className="pl-4 space-y-2 text-sm text-slate-600">
                                     <div className="flex justify-between">
                                         <span>Sales</span>
                                         <span>${(totalRevenue * 0.9).toLocaleString()}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span>Services</span>
                                         <span>${(totalRevenue * 0.1).toLocaleString()}</span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex justify-between items-center border-b border-slate-100 pb-2 pt-4">
                                     <span className="font-medium text-slate-700">Total Expenses</span>
                                     <span className="font-bold text-red-600">(${totalExpenses.toLocaleString()})</span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                                     <span className="font-bold text-lg text-slate-800">Net Income</span>
                                     <span className="font-bold text-lg text-emerald-600">${netIncome.toLocaleString()}</span>
                                 </div>
                             </div>
                        </div>

                        {/* Balance Sheet Summary */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-lg font-bold text-slate-800">Balance Sheet</h3>
                                 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">As of Today</span>
                             </div>

                             <div className="space-y-4">
                                 <div>
                                     <div className="text-xs font-bold text-slate-400 uppercase mb-2">Assets</div>
                                     <div className="space-y-2">
                                         {accounts.filter(a => a.type === 'Asset').map(a => (
                                             <div key={a.id} className="flex justify-between text-sm">
                                                 <span className="text-slate-600">{a.name}</span>
                                                 <span className="font-medium text-slate-900">${a.balance.toLocaleString()}</span>
                                             </div>
                                         ))}
                                         <div className="flex justify-between text-sm pt-2 border-t border-slate-100 font-bold">
                                             <span>Total Assets</span>
                                             <span>${accounts.filter(a => a.type === 'Asset').reduce((s,a) => s+a.balance, 0).toLocaleString()}</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div>
                                     <div className="text-xs font-bold text-slate-400 uppercase mb-2">Liabilities & Equity</div>
                                      <div className="space-y-2">
                                         {accounts.filter(a => a.type === 'Liability' || a.type === 'Equity').map(a => (
                                             <div key={a.id} className="flex justify-between text-sm">
                                                 <span className="text-slate-600">{a.name}</span>
                                                 <span className="font-medium text-slate-900">${a.balance.toLocaleString()}</span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {isInvModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name</label>
                                <input required className="w-full p-2 border border-slate-300 rounded" value={newInv.customerName} onChange={e => setNewInv({...newInv, customerName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Amount ($)</label>
                                <input required type="number" className="w-full p-2 border border-slate-300 rounded" value={newInv.amount} onChange={e => setNewInv({...newInv, amount: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                                <input required type="date" className="w-full p-2 border border-slate-300 rounded" value={newInv.date} onChange={e => setNewInv({...newInv, date: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsInvModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Create Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};