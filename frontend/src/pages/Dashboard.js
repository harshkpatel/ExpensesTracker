import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import config from '../config';
import { expenseEventEmitter } from './Expenses';
import { CalendarIcon, TrendingUpIcon, CircleDollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Enhanced color palette
const chartColors = [
  'rgba(53, 162, 235, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(255, 99, 132, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 205, 86, 0.7)',
];

function Dashboard() {
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    categoryBreakdown: [],
    recentExpenses: [],
    monthlyTrend: [],
    weeklyTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Monthly budget - in a real app, this would come from user settings
  const [monthlyBudget, setMonthlyBudget] = useState(3000);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get analytics summary data with monthly view
      const response = await axios.get(`${config.apiUrl}${config.endpoints.analytics}?time_range=month`);
      console.log("API Response:", response.data);
      setSummary(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();

    // Listen for expense deletion events to refresh data
    const handleExpenseChange = () => {
      fetchData();
    };
    
    expenseEventEmitter.on('expenseDeleted', handleExpenseChange);
    
    return () => {
      expenseEventEmitter.removeListener('expenseDeleted', handleExpenseChange);
    };
  }, []);

  // Calculate spending stats for insights
  const calculateInsights = () => {
    if (!summary.monthlyTrend || summary.monthlyTrend.length < 2) {
      return {
        monthlyChange: 0,
        isIncrease: false,
        topCategory: 'No data',
        topCategoryAmount: 0,
        averageDailySpend: 0
      };
    }

    // Sort monthly trends chronologically
    const sortedMonthly = [...summary.monthlyTrend].sort((a, b) => 
      a.month ? a.month.localeCompare(b.month) : 0
    );
    
    // Get current and previous month data
    const currentMonth = sortedMonthly[sortedMonthly.length - 1];
    const previousMonth = sortedMonthly[sortedMonthly.length - 2];
    
    // Calculate month-over-month change
    const monthlyChange = previousMonth && previousMonth.total > 0 
      ? ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
      : 0;
    
    // Get top spending category
    const topCategory = summary.categoryBreakdown && summary.categoryBreakdown.length > 0
      ? summary.categoryBreakdown.sort((a, b) => b.total - a.total)[0]
      : { category: 'No data', total: 0 };
    
    // Calculate average daily spend (this month's total / 30)
    const averageDailySpend = currentMonth ? currentMonth.total / 30 : 0;
    
    return {
      monthlyChange,
      isIncrease: monthlyChange > 0,
      topCategory: topCategory.category,
      topCategoryAmount: topCategory.total,
      averageDailySpend
    };
  };

  const insights = calculateInsights();

  // Calculate current month's progress against budget
  const calculateBudgetProgress = () => {
    // Get current month's total expenses
    const currentMonthExpenses = summary.monthlyTrend && summary.monthlyTrend.length > 0
      ? summary.monthlyTrend[summary.monthlyTrend.length - 1].total
      : 0;
    
    // Calculate percentage of budget used
    const percentUsed = (currentMonthExpenses / monthlyBudget) * 100;
    
    // Determine status color
    let statusColor = 'bg-green-500'; // Under 60%
    if (percentUsed >= 90) {
      statusColor = 'bg-red-500'; // Over 90%
    } else if (percentUsed >= 75) {
      statusColor = 'bg-orange-400'; // 75-90%
    } else if (percentUsed >= 60) {
      statusColor = 'bg-yellow-400'; // 60-75%
    }
    
    return { 
      currentExpenses: currentMonthExpenses, 
      percentUsed,
      statusColor
    };
  };

  const budgetProgress = calculateBudgetProgress();

  // Prepare data for category donut chart
  const categoryChartData = {
    labels: summary.categoryBreakdown?.slice(0, 5).map(item => item.category) || [],
    datasets: [
      {
        data: summary.categoryBreakdown?.slice(0, 5).map(item => item.total) || [],
        backgroundColor: chartColors.slice(0, 5),
        borderColor: chartColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
        hoverOffset: 10
      },
    ],
  };

  // Format monthly trend data for the line chart
  const prepareMonthlyTrendData = () => {
    if (!summary.monthlyTrend || summary.monthlyTrend.length === 0) {
      return { labels: [], data: [] };
    }

    // Sort by month and get last 6 months
    const sortedData = [...summary.monthlyTrend]
      .sort((a, b) => a.month ? a.month.localeCompare(b.month) : 0)
      .slice(-6);
    
    // Format month labels (e.g., "Jan" instead of "2023-01")
    const labels = sortedData.map(item => {
      if (!item.month) return '';
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [_, month] = item.month.split('-');
      const monthIndex = parseInt(month) - 1;
      return monthNames[monthIndex] || month;
    });
    
    return {
      labels,
      data: sortedData.map(item => item.total)
    };
  };

  const monthlyTrendData = prepareMonthlyTrendData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expenses This Month */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ${budgetProgress.currentExpenses.toFixed(2)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">out of ${monthlyBudget.toFixed(2)} budget</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <CircleDollarSign className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          {/* Budget progress bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${budgetProgress.statusColor}`} 
                style={{ width: `${Math.min(budgetProgress.percentUsed, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {budgetProgress.percentUsed.toFixed(0)}% of monthly budget used
            </p>
          </div>
        </div>
        
        {/* Monthly Change */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Month-over-Month</p>
              <div className="flex items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {Math.abs(insights.monthlyChange).toFixed(1)}%
                </h3>
                {insights.monthlyChange !== 0 && (
                  insights.isIncrease ? (
                    <ArrowUpRight className="h-5 w-5 ml-2 text-red-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 ml-2 text-green-500" />
                  )
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {insights.isIncrease ? 'Increase' : 'Decrease'} from last month
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        
        {/* Top Spending Category */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Top Category</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {insights.topCategory}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                ${insights.topCategoryAmount.toFixed(2)} this month
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-full">
              <BarChart3 className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>
        
        {/* Daily Average */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Daily Average</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ${insights.averageDailySpend.toFixed(2)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Avg. spend per day</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-full">
              <CalendarIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Trend */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
          <div className="h-[250px]">
            {monthlyTrendData.labels.length > 0 ? (
              <Line
                data={{
                  labels: monthlyTrendData.labels,
                  datasets: [{
                    label: 'Monthly Expenses',
                    data: monthlyTrendData.data,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    tension: 0.2,
                    fill: true,
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: value => `$${value}`
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `$${context.parsed.y.toFixed(2)}`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No monthly trend data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
          <div className="h-[250px] flex items-center justify-center">
            {summary.categoryBreakdown?.length > 0 ? (
              <Doughnut
                data={categoryChartData}
                options={{
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(0);
                          return `$${value.toFixed(2)} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-gray-500">No category data available</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Expenses */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Expenses</h3>
          <a href="/expenses" className="text-sm text-blue-600 hover:underline">View all</a>
        </div>
        
        {summary.recentExpenses?.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {summary.recentExpenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {expense.category || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                      ${expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent expenses to display</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard; 