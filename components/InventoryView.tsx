import React, { useState } from 'react';
import { PurchaseRequest, PRItem, Project, Bill, StockItem } from '../types';
import { 
  BoxIcon, PlusIcon, TruckIcon, ClipboardListIcon, CheckIcon, 
  DollarSignIcon, SearchIcon, TrashIcon, WarehouseIcon, CubeIcon 
} from './Icons';

interface InventoryViewProps {
  projects: Project[];
  purchaseRequests: PurchaseRequest[];
  stock: StockItem[];
  onAddPR: (pr: PurchaseRequest) => void;
  onUpdatePR: (pr: PurchaseRequest) => void;
  onCreateBill: (bill: Bill) => void;
  onUpdateStock: (itemName: string, quantityDelta: number, isNewItem?: boolean, itemDetails?: Partial<StockItem>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  projects, purchaseRequests, stock, onAddPR, onUpdatePR, onCreateBill, onUpdateStock 
}) => {
  const [activeTab, setActiveTab] = useState<'purchasing' | 'stock'>('purchasing');
  
  // Purchasing State
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  
  // Create PR Form State
  const [newPR, setNewPR] = useState<{ projectId: string; title: string; items: Partial<PRItem>[] }>({
    projectId: '',
    title: '',
    items: [{ id: crypto.randomUUID(), name: '', qtyOrdered: 1 }]
  });

  // Stock Form State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockItem, setNewStockItem] = useState<Partial<StockItem>>({ name: '', quantity: 0, unit: 'pcs', category: 'General', sku: '', minLevel: 10 });

  // --- Handlers: Create PR ---
  const handleAddItemRow = () => {
    setNewPR({ 
      ...newPR, 
      items: [...newPR.items, { id: crypto.randomUUID(), name: '', qtyOrdered: 1 }] 
    });
  };

  const handleRemoveItemRow = (id: string) => {
    setNewPR({ ...newPR, items: newPR.items.filter(i => i.id !== id) });
  };

  const updateNewPRItem = (id: string, field: keyof PRItem, value: any) => {
    setNewPR({
      ...newPR,
      items: newPR.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    });
  };

  const handleSubmitPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPR.projectId || !newPR.title || newPR.items.length === 0) return;

    const pr: PurchaseRequest = {
      id: crypto.randomUUID(),
      number: `PR-${1000 + purchaseRequests.length + 1}`,
      title: newPR.title,
      projectId: newPR.projectId,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      items: newPR.items.map(i => ({
        id: i.id!,
        name: i.name || 'Unknown Item',
        qtyOrdered: Number(i.qtyOrdered) || 1,
        qtyDelivered: 0,
        unitPrice: 0
      })),
      isBilled: false
    };

    onAddPR(pr);
    setActiveView('list');
    setNewPR({ projectId: '', title: '', items: [{ id: crypto.randomUUID(), name: '', qtyOrdered: 1 }] });
  };

  // --- Handlers: Procurement (Detail View) ---
  const handleUpdateItem = (itemId: string, field: keyof PRItem, value: number) => {
    if (!selectedPR) return;
    
    // Check for stock update need
    const oldItem = selectedPR.items.find(i => i.id === itemId);
    
    const updatedItems = selectedPR.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    
    // Auto-update status
    const allDelivered = updatedItems.every(i => i.qtyDelivered >= i.qtyOrdered);
    const someDelivered = updatedItems.some(i => i.qtyDelivered > 0);
    const status = allDelivered ? 'Fulfilled' : someDelivered ? 'Partial' : 'Pending';

    onUpdatePR({ ...selectedPR, items: updatedItems, status });
    setSelectedPR({ ...selectedPR, items: updatedItems, status });

    // Handle Stock Update on Qty Change
    if (field === 'qtyDelivered' && oldItem) {
        const delta = value - oldItem.qtyDelivered;
        if (delta !== 0) {
            onUpdateStock(oldItem.name, delta, false);
        }
    }
  };

  const handleGenerateBill = () => {
    if (!selectedPR) return;
    
    const totalAmount = selectedPR.items.reduce((sum, item) => sum + (item.qtyDelivered * item.unitPrice), 0);
    
    if (totalAmount <= 0) {
      alert("Cannot create a bill with 0 amount. Ensure items are delivered and prices are set.");
      return;
    }

    const bill: Bill = {
      id: crypto.randomUUID(),
      number: `BILL-${selectedPR.number}`,
      vendorName: 'Various Suppliers', 
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Raw Materials',
      amount: totalAmount,
      status: 'Received',
      projectId: selectedPR.projectId,
      purchaseRequestId: selectedPR.id
    };

    onCreateBill(bill);
    onUpdatePR({ ...selectedPR, isBilled: true });
    setSelectedPR({ ...selectedPR, isBilled: true });
    alert("Bill created and sent to Accounts Payable.");
  };

  // --- Handlers: Stock ---
  const handleAddStock = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStockItem.name || !newStockItem.quantity) return;
      onUpdateStock(
          newStockItem.name, 
          Number(newStockItem.quantity), 
          true, 
          { ...newStockItem, id: crypto.randomUUID(), lastUpdated: new Date().toISOString().split('T')[0] }
      );
      setIsAddStockOpen(false);
      setNewStockItem({ name: '', quantity: 0, unit: 'pcs', category: 'General', sku: '', minLevel: 10 });
  };

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Project';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 flex-col">
      {/* Top Nav for Modules */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex gap-4">
          <button 
            onClick={() => setActiveTab('purchasing')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'purchasing' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
              <ClipboardListIcon className="w-4 h-4" /> Purchasing (PRs)
          </button>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'stock' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
              <WarehouseIcon className="w-4 h-4" /> Stock & Warehouse
          </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* === PURCHASING MODULE === */}
        {activeTab === 'purchasing' && (
            <>
                {/* Sidebar List */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <BoxIcon className="w-5 h-5 text-brand-600" /> Requests
                        </h2>
                        <button 
                        onClick={() => setActiveView('create')}
                        className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100"
                        >
                        <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
                        placeholder="Search PRs..."
                        />
                    </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                    {purchaseRequests.map(pr => (
                        <div 
                        key={pr.id}
                        onClick={() => { setSelectedPR(pr); setActiveView('detail'); }}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedPR?.id === pr.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''}`}
                        >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-900">{pr.number}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            pr.status === 'Fulfilled' ? 'bg-green-100 text-green-700' : 
                            pr.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-600'
                            }`}>{pr.status}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-800 mb-1 truncate">{pr.title}</div>
                        <div className="text-xs text-slate-500">{getProjectName(pr.projectId)}</div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    
                    {/* --- CREATE VIEW --- */}
                    {activeView === 'create' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900">Create Purchase Requisition</h2>
                        <p className="text-slate-500 text-sm">Request raw materials or equipment for a project.</p>
                        </div>
                        <form onSubmit={handleSubmitPR} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Project</label>
                            <select 
                                required
                                className="w-full p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none bg-white"
                                value={newPR.projectId}
                                onChange={e => setNewPR({ ...newPR, projectId: e.target.value })}
                            >
                                <option value="">-- Select Project --</option>
                                {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            </div>
                            <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">PR Title</label>
                            <input 
                                required
                                placeholder="e.g. Steel Plates for Section A"
                                className="w-full p-2 border border-slate-300 rounded focus:ring-brand-500 focus:outline-none"
                                value={newPR.title}
                                onChange={e => setNewPR({ ...newPR, title: e.target.value })}
                            />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Requested Items</label>
                            <div className="space-y-2">
                            {newPR.items.map((item, idx) => (
                                <div key={item.id} className="flex gap-2 items-center">
                                <span className="text-sm text-slate-400 w-6">{idx + 1}.</span>
                                <input 
                                    required
                                    placeholder="Item Name / Description"
                                    className="flex-1 p-2 border border-slate-300 rounded text-sm"
                                    value={item.name}
                                    onChange={e => updateNewPRItem(item.id!, 'name', e.target.value)}
                                />
                                <input 
                                    required
                                    type="number"
                                    placeholder="Qty"
                                    className="w-24 p-2 border border-slate-300 rounded text-sm"
                                    value={item.qtyOrdered}
                                    onChange={e => updateNewPRItem(item.id!, 'qtyOrdered', Number(e.target.value))}
                                />
                                {newPR.items.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveItemRow(item.id!)} className="text-red-400 hover:text-red-600">
                                    <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                                </div>
                            ))}
                            </div>
                            <button type="button" onClick={handleAddItemRow} className="mt-3 text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center">
                            <PlusIcon className="w-4 h-4 mr-1" /> Add Another Item
                            </button>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700">
                            Submit Request
                            </button>
                        </div>
                        </form>
                    </div>
                    )}

                    {/* --- DETAIL / PROCUREMENT VIEW --- */}
                    {activeView === 'detail' && selectedPR && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Header Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900">{selectedPR.title}</h1>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{selectedPR.number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                            <TruckIcon className="w-4 h-4" />
                            <span>Project: <strong>{getProjectName(selectedPR.projectId)}</strong></span>
                            <span>•</span>
                            <span>{selectedPR.requestDate}</span>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            {selectedPR.isBilled ? (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-bold border border-emerald-100">
                                <CheckIcon className="w-5 h-5" /> Billed to Accounting
                            </div>
                            ) : (
                            <button 
                                onClick={handleGenerateBill}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center shadow-lg shadow-slate-200"
                            >
                                <DollarSignIcon className="w-4 h-4 mr-2" /> Generate Bill & Charge Project
                            </button>
                            )}
                        </div>
                        </div>

                        {/* Procurement Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center">
                            <ClipboardListIcon className="w-5 h-5 mr-2" /> Procurement & Delivery Tracking
                            </h3>
                            <span className="text-xs text-slate-500 italic">Updating 'Delivered' automatically updates Stock.</span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4 w-1/3">Item Description</th>
                                <th className="px-6 py-4 text-center">Qty Ordered</th>
                                <th className="px-6 py-4 text-right bg-slate-50/50">Unit Price ($)</th>
                                <th className="px-6 py-4 text-center bg-brand-50/30">Qty Delivered</th>
                                <th className="px-6 py-4 text-center">Balance</th>
                                <th className="px-6 py-4 text-right">Total Value</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {selectedPR.items.map(item => {
                                const balance = item.qtyOrdered - item.qtyDelivered;
                                return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 text-center">{item.qtyOrdered}</td>
                                    <td className="px-6 py-4 text-right bg-slate-50/50">
                                    <input 
                                        type="number" 
                                        className="w-20 p-1 border border-slate-300 rounded text-right focus:border-brand-500 outline-none"
                                        value={item.unitPrice}
                                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                    </td>
                                    <td className="px-6 py-4 text-center bg-brand-50/30">
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            type="number"
                                            className={`w-16 p-1 border rounded text-center font-bold outline-none focus:ring-2 ${
                                                balance === 0 ? 'border-green-300 text-green-700 bg-green-50' : 'border-brand-300 text-brand-700'
                                            }`}
                                            value={item.qtyDelivered}
                                            max={item.qtyOrdered}
                                            onBlur={(e) => handleUpdateItem(item.id, 'qtyDelivered', parseFloat(e.target.value) || 0)}
                                            defaultValue={item.qtyDelivered}
                                        />
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                                        {balance}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                    ${(item.qtyDelivered * item.unitPrice).toLocaleString()}
                                    </td>
                                </tr>
                                );
                            })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-900">
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-right">Total Delivered Value:</td>
                                <td className="px-6 py-4 text-right text-emerald-700 text-lg">
                                ${selectedPR.items.reduce((acc, i) => acc + (i.qtyDelivered * i.unitPrice), 0).toLocaleString()}
                                </td>
                            </tr>
                            </tfoot>
                        </table>
                        </div>
                    </div>
                    )}

                    {/* Empty State for List View */}
                    {activeView === 'list' && !selectedPR && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                        <BoxIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Select a Purchase Request to view details</p>
                        <button onClick={() => setActiveView('create')} className="mt-4 text-brand-600 font-bold hover:underline">
                            or Create New Request
                        </button>
                        </div>
                    </div>
                    )}

                </div>
            </>
        )}

        {/* === STOCK MODULE === */}
        {activeTab === 'stock' && (
            <div className="w-full h-full overflow-y-auto p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <WarehouseIcon className="w-6 h-6 text-brand-600" />
                        Stock & Warehouse
                    </h1>
                    <button 
                        onClick={() => setIsAddStockOpen(true)}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Material
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">SKU / Code</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4 text-right">Quantity In Stock</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stock.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                        No items in stock. Create a Purchase Request or Add Material manually.
                                    </td>
                                </tr>
                            ) : (
                                stock.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                                            <CubeIcon className="w-4 h-4 text-slate-400" />
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono">{item.sku || '-'}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.location || 'Warehouse A'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-lg text-slate-800">
                                            {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.quantity <= item.minLevel ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Low Stock</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">In Stock</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Add Stock Modal */}
        {isAddStockOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
                    <h2 className="text-xl font-bold mb-4">Add Manual Stock</h2>
                    <form onSubmit={handleAddStock} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Item Name</label>
                            <input 
                                required
                                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                value={newStockItem.name}
                                onChange={e => setNewStockItem({...newStockItem, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                                <input 
                                    required
                                    type="number"
                                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                    value={newStockItem.quantity}
                                    onChange={e => setNewStockItem({...newStockItem, quantity: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                                <input 
                                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                    value={newStockItem.unit}
                                    onChange={e => setNewStockItem({...newStockItem, unit: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                            <input 
                                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                value={newStockItem.category}
                                onChange={e => setNewStockItem({...newStockItem, category: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setIsAddStockOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded font-bold">Add to Stock</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};