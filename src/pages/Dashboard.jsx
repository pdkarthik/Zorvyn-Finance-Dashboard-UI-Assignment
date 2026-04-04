import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSelector } from 'react-redux';
import { calculateTotals, groupByCategory, groupByMonth, formatCurrency } from '../utils/helpers';
import Card from '../components/common/Card';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import AiAdvisor from '../components/AiAdvisor';

const StatCard = ({ title, amount, type, icon, delay }) => {
  const colors = {
    balance: 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30',
    income: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    expense: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  };

  return (
    <Card className="p-5 sm:p-6" delay={delay}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(amount)}
          </h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-full ${colors[type]}`}>
          <SafeIcon icon={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const { transactions, isDarkMode } = useSelector(state => state.finance);

  const { income, expense, balance } = useMemo(() => calculateTotals(transactions), [transactions]);

  const lineChartData = useMemo(() => {
    const grouped = groupByMonth(transactions);
    const months = Object.keys(grouped).sort();
    return {
      months,
      income: months.map(m => grouped[m].income),
      expense: months.map(m => grouped[m].expense)
    };
  }, [transactions]);

  const pieChartData = useMemo(() => {
    const grouped = groupByCategory(transactions, 'expense');
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const commonChartOptions = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Inter, sans-serif' },
  };

  const lineOptions = {
    ...commonChartOptions,
    tooltip: { 
      trigger: 'axis',
      confine: true // Important for mobile so tooltip doesn't cut off
    },
    legend: { 
      data: ['Income', 'Expense'],
      textStyle: { color: isDarkMode ? '#e5e7eb' : '#374151' },
      bottom: 0
    },
    grid: { 
      left: '2%', 
      right: '8%', 
      bottom: '12%', 
      top: '10%',
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: lineChartData.months,
      axisLabel: { 
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        fontSize: 10,
        formatter: (value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`
      },
      splitLine: { lineStyle: { color: isDarkMode ? '#374151' : '#e5e7eb' } }
    },
    series: [
      {
        name: 'Income',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: lineChartData.income,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' }
            ]
          }
        }
      },
      {
        name: 'Expense',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: lineChartData.expense,
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
            ]
          }
        }
      }
    ]
  };

  const chartColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

  const pieOptions = {
    ...commonChartOptions,
    color: chartColors,
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: {c} ({d}%)',
      confine: true
    },
    legend: { show: false },
    series: [
      {
        name: 'Expenses',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDarkMode ? '#1f2937' : '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: false }
        },
        data: pieChartData
      }
    ]
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard title="Total Balance" amount={balance} type="balance" icon={FiIcons.FiDollarSign} delay={0.1} />
        <StatCard title="Total Income" amount={income} type="income" icon={FiIcons.FiTrendingUp} delay={0.2} />
        <StatCard title="Total Expenses" amount={expense} type="expense" icon={FiIcons.FiTrendingDown} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 xl:col-span-2" delay={0.4}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Flow Trend</h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ReactECharts 
              option={lineOptions} 
              style={{ height: '100%', width: '100%' }} 
              theme={isDarkMode ? 'dark' : 'light'} 
            />
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 flex flex-col" delay={0.5}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 w-full">Expenses by Category</h3>
          {pieChartData.length > 0 ? (
            <div className="flex flex-col md:flex-row xl:flex-col w-full items-center justify-between gap-6">
              <div className="h-[200px] w-full md:w-1/2 xl:w-full">
                <ReactECharts 
                  option={pieOptions} 
                  style={{ height: '100%', width: '100%' }} 
                  theme={isDarkMode ? 'dark' : 'light'} 
                />
              </div>
              <div className="space-y-3 w-full md:w-1/2 xl:w-full">
                {pieChartData.map((item, index) => {
                  const percentage = expense > 0 ? ((item.value / expense) * 100).toFixed(1) : 0;
                  const dotColor = chartColors[index % chartColors.length];
                  return (
                    <div key={item.name} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }}></span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(item.value)}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              No expense data available
            </div>
          )}
        </Card>
      </div>

      <div className="pt-2">
        <AiAdvisor />
      </div>
    </div>
  );
};

export default Dashboard;