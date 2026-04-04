import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchTransactions, 
  addTransaction, 
  editTransaction, 
  removeTransaction,
  setFilters,
  setGroupBy,
  resetFilters
} from '../store/actions';
import { formatCurrency, formatDate } from '../utils/helpers';
import { categories } from '../utils/mockData';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/common/LoadingScreen';

const TransactionForm = ({ onSubmit, onCancel, initialData, isProcessing }) => {
  const [formData, setFormData] = useState(initialData || {
    type: 'expense',
    amount: '',
    category: categories.expense[0],
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {['expense', 'income'].map(type => (
            <button
              key={type}
              type="button"
              disabled={isProcessing}
              onClick={() => setFormData({ ...formData, type, category: categories[type][0] })}
              className={`py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${
                formData.type === type 
                  ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
          <input
            type="number" required min="0.01" step="0.01"
            disabled={isProcessing}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date" required
            disabled={isProcessing}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
        <select
          disabled={isProcessing}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
        >
          {categories[formData.type].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <input
          type="text"
          disabled={isProcessing}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
          placeholder="e.g. Weekly Groceries"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? (
            <SafeIcon icon={FiIcons.FiLoader} className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {initialData ? 'Update' : 'Add'} Transaction
        </Button>
      </div>
    </form>
  );
};

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, loading, isProcessing, role, filters, groupBy } = useSelector(state => state.finance);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const exportRef = useRef(null);

  // Removed redundant fetchTransactions to prevent navigation data wiping since App.jsx handles it globally

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = (t.description || '').toLowerCase().includes(searchLower) || 
                            t.category.toLowerCase().includes(searchLower);
      const matchesType = filters.type === 'all' || t.type === filters.type;
      
      const date = new Date(t.date);
      const matchesDate = (!filters.dateRange.start || date >= new Date(filters.dateRange.start)) &&
                          (!filters.dateRange.end || date <= new Date(filters.dateRange.end));
      
      const matchesAmount = (!filters.amountRange.min || t.amount >= Number(filters.amountRange.min)) &&
                            (!filters.amountRange.max || t.amount <= Number(filters.amountRange.max));

      return matchesSearch && matchesType && matchesDate && matchesAmount;
    });
  }, [transactions, filters]);

  const groupedData = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', items: filteredTransactions }];
    
    const groups = filteredTransactions.reduce((acc, curr) => {
      const key = groupBy === 'category' ? curr.category : curr.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});

    return Object.entries(groups).map(([key, items]) => ({ key, items }));
  }, [filteredTransactions, groupBy]);

  const handleSave = async (data) => {
    if (editingTx) {
      await dispatch(editTransaction({ ...data, id: editingTx.id }));
    } else {
      await dispatch(addTransaction(data));
    }
    setIsModalOpen(false);
    setEditingTx(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your financial activity</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative" ref={exportRef}>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="w-full sm:w-auto"
            >
              <SafeIcon icon={FiIcons.FiDownload} className="w-4 h-4 mr-2" />
              Export
              <SafeIcon icon={FiIcons.FiChevronDown} className={`ml-2 w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <AnimatePresence>
              {isExportOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden"
                >
                  <button 
                    onClick={() => { exportToCSV(filteredTransactions); setIsExportOpen(false); }} 
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 flex items-center"
                  >
                    <SafeIcon icon={FiIcons.FiFileText} className="mr-2 w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button 
                    onClick={() => { exportToJSON(filteredTransactions); setIsExportOpen(false); }} 
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                  >
                    <SafeIcon icon={FiIcons.FiCode} className="mr-2 w-3.5 h-3.5" />
                    JSON
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {role === 'admin' && (
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-initial">
              <SafeIcon icon={FiIcons.FiPlus} className="w-4 h-4 mr-2" />
              Add
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 sm:p-6 overflow-visible min-h-[400px] relative">
        {/* Basic Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.type}
              onChange={(e) => dispatch(setFilters({ type: e.target.value }))}
              className="flex-1 lg:flex-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            <Button 
              variant={showAdvanced ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex-1 lg:flex-none"
            >
              <SafeIcon icon={FiIcons.FiFilter} className="w-4 h-4 mr-1" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && !isModalOpen && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <SafeIcon icon={FiIcons.FiLoader} className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 dark:border-gray-800 pt-4 mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date Range</label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={filters.dateRange.start}
                      onChange={(e) => dispatch(setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } }))}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                    />
                    <input 
                      type="date" 
                      value={filters.dateRange.end}
                      onChange={(e) => dispatch(setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } }))}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount ($)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" placeholder="Min"
                      value={filters.amountRange.min}
                      onChange={(e) => dispatch(setFilters({ amountRange: { ...filters.amountRange, min: e.target.value } }))}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" 
                    />
                    <input 
                      type="number" placeholder="Max"
                      value={filters.amountRange.max}
                      onChange={(e) => dispatch(setFilters({ amountRange: { ...filters.amountRange, max: e.target.value } }))}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grouping</label>
                  <div className="flex gap-2">
                    {['none', 'category', 'date'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => dispatch(setGroupBy(mode))}
                        className={`flex-1 py-1.5 text-xs font-medium rounded border capitalize transition-all ${
                          groupBy === mode 
                            ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => dispatch(resetFilters())}
                  className="text-[10px] text-red-500 hover:text-red-600 font-black uppercase tracking-widest"
                >
                  Reset All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Content */}
        {loading ? (
          <div className="py-20">
            <LoadingScreen />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center">
            <SafeIcon icon={FiIcons.FiInbox} className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2 sm:px-4 font-bold">Details</th>
                  <th className="pb-3 px-2 sm:px-4 font-bold text-left">Amount</th>
                  {role === 'admin' && <th className="pb-3 px-2 sm:px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) => (
                  <React.Fragment key={group.key}>
                    {groupBy !== 'none' && (
                      <tr className="bg-gray-50 dark:bg-gray-800/30">
                        <td colSpan={role === 'admin' ? 3 : 2} className="py-2 px-2 sm:px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {group.key}
                        </td>
                      </tr>
                    )}
                    {group.items.map((t) => (
                      <motion.tr 
                        key={t.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <div className="flex items-center">
                            <div className={`p-1.5 sm:p-2 rounded-lg mr-3 flex-shrink-0 ${
                              t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                            }`}>
                              <SafeIcon icon={t.type === 'income' ? FiIcons.FiArrowDownLeft : FiIcons.FiArrowUpRight} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-0.5 break-words">
                                {t.description || t.category}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500 leading-snug break-words">
                                <span>{formatDate(t.date)}</span>
                                <span className="inline-block w-0.5 h-0.5 bg-gray-300 rounded-full align-middle mx-1.5"></span>
                                <span>{t.category}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`py-3 px-2 sm:px-4 text-sm font-bold text-left whitespace-nowrap ${
                          t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        {role === 'admin' && (
                          <td className="py-3 px-2 sm:px-4 text-right">
                            <div className="flex justify-end items-center space-x-1 transition-opacity">
                              <button 
                                onClick={() => { setEditingTx(t); setIsModalOpen(true); }} 
                                disabled={isProcessing}
                                className="p-1.5 rounded-md hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 text-gray-400 transition-colors"
                                title="Edit"
                              >
                                <SafeIcon icon={FiIcons.FiEdit2} className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this transaction?")) {
                                    dispatch(removeTransaction(t.id));
                                  }
                                }} 
                                disabled={isProcessing}
                                className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 text-gray-400 transition-colors"
                                title="Delete"
                              >
                                <SafeIcon icon={FiIcons.FiTrash2} className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { if(!isProcessing) { setIsModalOpen(false); setEditingTx(null); } }} 
        title={editingTx ? "Edit Transaction" : "New Transaction"}
      >
        <TransactionForm 
          onSubmit={handleSave} 
          onCancel={() => { setIsModalOpen(false); setEditingTx(null); }} 
          initialData={editingTx}
          isProcessing={isProcessing}
        />
      </Modal>
    </div>
  );
};

export default Transactions;