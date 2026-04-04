import { initialTransactions } from '../utils/mockData';

const STORAGE_KEY = 'finance_transactions_v1';

// Simulate realistic network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Randomly simulate server errors (5% chance)
const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error("Network Error: Failed to connect to server");
  }
};

const getStoredData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTransactions));
    return initialTransactions;
  }
  return JSON.parse(saved);
};

export const mockApi = {
  getTransactions: async (params = {}) => {
    await delay(1000);
    simulateError();
    
    let data = getStoredData();
    
    // Simulate server-side filtering if params are provided
    if (params.search) {
      const search = params.search.toLowerCase();
      data = data.filter(t => 
        t.description.toLowerCase().includes(search) || 
        t.category.toLowerCase().includes(search)
      );
    }
    
    if (params.type && params.type !== 'all') {
      data = data.filter(t => t.type === params.type);
    }

    return data;
  },
  
  saveTransaction: async (transaction) => {
    await delay(800);
    simulateError();
    
    const current = getStoredData();
    const newTx = { 
      ...transaction, 
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(transaction.amount),
      createdAt: new Date().toISOString()
    };
    
    const updated = [newTx, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newTx;
  },

  updateTransaction: async (updatedTx) => {
    await delay(800);
    simulateError();
    
    const current = getStoredData();
    const formattedTx = { 
      ...updatedTx, 
      amount: Number(updatedTx.amount), 
      updatedAt: new Date().toISOString() 
    };
    
    const updated = current.map(t => 
      t.id === updatedTx.id ? formattedTx : t
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return formattedTx;
  },

  deleteTransaction: async (id) => {
    await delay(600);
    simulateError();
    
    const current = getStoredData();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return id;
  }
};