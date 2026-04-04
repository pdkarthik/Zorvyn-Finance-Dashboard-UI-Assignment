import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { calculateTotals } from '../utils/helpers';
import Card from './common/Card';
import Button from './common/Button';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AiAdvisor = () => {
  const { transactions } = useSelector(state => state.finance);
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastGenTime, setLastGenTime] = useState(null);

  const generateAdvice = async () => {
    if (lastGenTime && Date.now() - lastGenTime < 30000) {
      setError('Please wait 30 seconds before requesting another analysis.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { balance, income, expense } = calculateTotals(transactions);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          balance,
          income,
          expense
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI advice');
      }

      setAdvice(data.advice);
      setLastGenTime(Date.now());
    } catch (err) {
      console.error(err);
      // Determine if it was a timeout/fetch failure (Vercel Cold Start)
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        setError('Server is waking up from sleep mode (Cold Start). Please click Try Again!');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 overflow-hidden relative group">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-all duration-1000 group-hover:scale-110"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
            <SafeIcon icon={FiIcons.FiCpu} className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Advisor</h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Get brutal, personalized financial feedback analyzed directly from your spending profile.
        </p>

        <AnimatePresence mode="wait">
          {!advice && !isLoading && !error && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button onClick={generateAdvice} className="w-full sm:w-auto px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 flex items-center justify-center">
                <SafeIcon icon={FiIcons.FiZap} className="w-4 h-4 mr-2" />
                Generate Instant Portfolio Analysis
              </Button>
            </motion.div>
          )}

          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center justify-center space-y-3"
            >
              <div className="relative">
                <SafeIcon icon={FiIcons.FiCpu} className="w-6 h-6 text-indigo-500 animate-pulse" />
                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-40 animate-pulse rounded-full"></div>
              </div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 animate-pulse">
                AI is analyzing your habits...
              </p>
            </motion.div>
          )}

          {advice && !isLoading && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50"
            >
              <div className="flex items-start space-x-3 mb-3">
                <SafeIcon icon={FiIcons.FiMessageSquare} className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium italic">
                  "{advice}"
                </p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={generateAdvice}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center"
                >
                  <SafeIcon icon={FiIcons.FiRefreshCw} className="w-3 h-3 mr-1" /> Re-Analyze
                </button>
              </div>
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50"
            >
              <div className="flex items-start space-x-3 mb-3">
                <SafeIcon icon={FiIcons.FiAlertCircle} className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
              <Button onClick={generateAdvice} variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 flex justify-center">
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default AiAdvisor;
