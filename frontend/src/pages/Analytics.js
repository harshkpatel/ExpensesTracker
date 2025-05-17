import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import config from '../config';
import WeeklyChart from '../components/WeeklyChart';
import MonthlyChart from '../components/MonthlyChart';
import { expenseEventEmitter } from './Expenses';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define a better color palette
const chartColors = [
  'rgba(53, 162, 235, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(255, 99, 132, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 205, 86, 0.7)',
  'rgba(54, 162, 235, 0.7)',
  'rgba(201, 203, 207, 0.7)',
  'rgba(255, 145, 65, 0.7)',
];

function Analytics() {
  const [timeRange, setTimeRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState({
    totalExpenses: 0,
    categoryBreakdown: [],
    weeklyTrends: [],
    monthlyTrend: [],
    optimizationSuggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriodCategoryData, setTimePeriodCategoryData] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get analytics data for the selected time range
      const response = await axios.get(`${config.apiUrl}${config.endpoints.analytics}?time_range=${timeRange}`);
      
      // Use dailyData directly from API if available
      if (!response.data.dailyData && timeRange === 'week') {
        // Fetch daily data only if needed and not already included
        const allExpensesResponse = await axios.get(`${config.apiUrl}/expenses/?limit=10000`);
        const allExpenses = allExpensesResponse.data || [];
        
        // Process daily expenses for the weekly chart
        const now = new Date();
        const dailyData = [];
        
        // Calculate date range for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const currentDate = new Date();
          currentDate.setDate(now.getDate() - i);
          
          // Format as YYYY-MM-DD for comparison
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Find all expenses for this date
          const dayExpenses = allExpenses.filter(expense => 
            expense.date === dateString
          );
          
          // Calculate total for the day
          const dayTotal = dayExpenses.reduce((sum, expense) => 
            sum + parseFloat(expense.amount || 0), 0
          );
          
          dailyData.push({
            date: dateString,
            expenses: dayExpenses,
            total: dayTotal,
            // Add data needed for chart display
            dayOfWeek: currentDate.getDay(),
            day: currentDate.getDate(),
            month: currentDate.getMonth(),
            chronologicalKey: 6 - i // 0 is oldest, 6 is newest
          });
        }
        
        // Sort chronologically
        const sortedDailyData = [...dailyData].sort((a, b) => a.chronologicalKey - b.chronologicalKey);
        
        // Add daily data to the response
        response.data.dailyData = sortedDailyData;
      }
      
      setAnalyticsData(response.data);

      // Calculate proper time-period specific total expenses based on trends data
      let filteredCategoryData = [];
      
      if (timeRange === 'week') {
        // Get weekly total from either daily data (most accurate) or weekly trends
        if (response.data.dailyData && response.data.dailyData.length > 0) {
          // Create category breakdown from daily data
          const categoryTotals = {};
          
          // Process all expenses from daily data to generate time-specific categories
          response.data.dailyData.forEach(day => {
            if (day.expenses && day.expenses.length > 0) {
              day.expenses.forEach(expense => {
                if (!categoryTotals[expense.category]) {
                  categoryTotals[expense.category] = 0;
                }
                categoryTotals[expense.category] += parseFloat(expense.amount || 0);
              });
            }
          });
          
          // Convert to array format matching API response
          filteredCategoryData = Object.keys(categoryTotals).map(category => ({
            category: category,
            total: parseFloat(categoryTotals[category].toFixed(2))
          }));
        } else if (response.data.weeklyTrends && response.data.weeklyTrends.length > 0) {
          // If we don't have daily data but have the category breakdown, we use it as is
          // This is less accurate but better than nothing
          filteredCategoryData = [...(response.data.categoryBreakdown || [])];
        }
      } else if (timeRange === 'month') {
        // For monthly view, we use the API provided category breakdown
        filteredCategoryData = [...(response.data.categoryBreakdown || [])];
      } else {
        // For yearly view, we use the API provided category breakdown
        filteredCategoryData = [...(response.data.categoryBreakdown || [])];
      }
      
      // Sort by amount in descending order and keep only top categories
      if (filteredCategoryData.length > 0) {
        filteredCategoryData = filteredCategoryData
          .sort((a, b) => b.total - a.total)
          .slice(0, 8); // Limit to top 8 categories for cleaner display
      }
        
      setTimePeriodCategoryData(filteredCategoryData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
    
    // Add listener for expense deletion
    const handleExpenseDeleted = () => {
      // Refresh analytics data when an expense is deleted
      fetchAnalytics();
    };
    
    // Subscribe to expense events
    expenseEventEmitter.on('expenseDeleted', handleExpenseDeleted);
    
    // Cleanup subscription when component unmounts
    return () => {
      expenseEventEmitter.removeListener('expenseDeleted', handleExpenseDeleted);
    };
  }, [fetchAnalytics]);

  if (loading) {
    return <div className="text-center p-4">Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  // Ensure we have data before rendering charts
  const monthlyData = analyticsData.monthlyTrend || analyticsData.monthlyTrends || [];
  const weeklyData = analyticsData.weeklyTrends || [];
  
  // Get the relevant category data based on time period
  const categoryData = timePeriodCategoryData.length > 0 ? timePeriodCategoryData : [];
  
  // Calculate total expenses based on category data for this time period
  const periodTotalExpenses = parseFloat(categoryData.reduce((sum, cat) => sum + parseFloat(cat.total || 0), 0).toFixed(2));
  
  // Sort trend data chronologically using sortKey
  const sortedMonthlyData = [...monthlyData].sort((a, b) => a.month ? a.month.localeCompare(b.month) : 0);
  const sortedWeeklyData = [...weeklyData].sort((a, b) => a.sortKey - b.sortKey);

  // Limit monthly data to the last 6 data points for better visualization
  const limitedMonthlyData = timeRange === 'month' ? 
    sortedMonthlyData.slice(-6) : 
    (timeRange === 'year' ? sortedMonthlyData.slice(-12) : sortedMonthlyData);

  // Define trendLabel without relying on unused trendData variable
  const trendLabel = timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Yearly';
  
  // Get time-specific period description
  const getPeriodDescription = () => {
    switch (timeRange) {
      case 'week':
        return 'the last 7 days';
      case 'month':
        return 'the last 30 days';
      case 'year':
        return 'the last 12 months';
      default:
        return 'this period';
    }
  };
  
  // Generate insights based on the selected time range
  const getTimeSpecificInsights = () => {
    const insights = {
      title: '',
      topCategories: [],
      trendAnalysis: null,
      patterns: []
    };
    
    // Set title based on time range
    insights.title = `${trendLabel} Expense Insights`;
    
    // Get top categories for the selected time period
    if (categoryData.length > 0) {
      insights.topCategories = [...categoryData]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
    }
    
    // Generate trend analysis based on time range
    if (timeRange === 'week') {
      // For weekly, compare first half to second half of week
      if (sortedWeeklyData.length >= 2) {
        const firstHalf = sortedWeeklyData.slice(0, 3).reduce((sum, day) => sum + day.amount, 0);
        const secondHalf = sortedWeeklyData.slice(3).reduce((sum, day) => sum + day.amount, 0);
        const percentChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
        
        insights.trendAnalysis = {
          comparison: 'first half of the week',
          percentChange: percentChange,
          isIncrease: percentChange > 0
        };
      }
      
      // Add weekly-specific patterns
      insights.patterns.push('Weekend spending tends to be higher than weekday spending.');
      if (sortedWeeklyData.length > 0) {
        const highestDay = [...sortedWeeklyData].sort((a, b) => b.amount - a.amount)[0];
        insights.patterns.push(`Your highest spending day was ${highestDay.label}.`);
      }
    } else if (timeRange === 'month') {
      // For monthly, compare to previous month if available
      if (sortedMonthlyData.length >= 2) {
        const currentMonth = sortedMonthlyData[sortedMonthlyData.length - 1];
        const previousMonth = sortedMonthlyData[sortedMonthlyData.length - 2];
        
        if (previousMonth.total > 0) {
          const percentChange = ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100;
          
          insights.trendAnalysis = {
            comparison: 'the previous month',
            percentChange: percentChange,
            isIncrease: percentChange > 0
          };
        }
        
        // Add monthly pattern about weekly distribution
        insights.patterns.push('First and last weeks of the month typically show different spending patterns.');
      }
      
      // Add monthly-specific patterns
      if (sortedMonthlyData.length > 0) {
        const weeksInMonth = 4;
        insights.patterns.push(`You've spent an average of $${(periodTotalExpenses / weeksInMonth).toFixed(2)} per week this month.`);
      }
    } else {
      // For yearly, compare to previous year or quarters if available
      if (sortedMonthlyData.length >= 12) {
        const currentYear = sortedMonthlyData.slice(-12).reduce((sum, m) => sum + m.total, 0);
        const previousYear = sortedMonthlyData.slice(-24, -12).reduce((sum, m) => sum + m.total, 0);
        
        if (previousYear > 0) {
          const percentChange = ((currentYear - previousYear) / previousYear) * 100;
          
          insights.trendAnalysis = {
            comparison: 'the previous year',
            percentChange: percentChange,
            isIncrease: percentChange > 0
          };
        }
      }
      
      // Add yearly-specific patterns
      if (sortedMonthlyData.length > 0) {
        const highestMonth = [...sortedMonthlyData].sort((a, b) => b.total - a.total)[0];
        if (highestMonth.month) {
          // eslint-disable-next-line no-unused-vars
          const [yearStr, monthStr] = highestMonth.month.split('-');
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const monthName = monthNames[parseInt(monthStr) - 1];
          insights.patterns.push(`${monthName} was your highest spending month.`);
        }
        
        // Seasonal patterns
        insights.patterns.push('Your spending shows seasonal variations throughout the year.');
      }
    }
    
    // Category-specific insights for any time period
    if (insights.topCategories.length > 1) {
      const topCategory = insights.topCategories[0];
      const topTwoTotal = insights.topCategories.slice(0, 2).reduce((sum, c) => sum + c.total, 0);
      const percentage = Math.round((topTwoTotal / periodTotalExpenses) * 100);
      
      insights.patterns.push(`Your top 2 categories account for ${percentage}% of your spending in ${getPeriodDescription()}.`);
      insights.patterns.push(`${topCategory.category} is your highest expense category for ${trendLabel.toLowerCase()} spending.`);
    }
    
    return insights;
  };
  
  // Get time-specific insights
  const insights = getTimeSpecificInsights();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select 
          value={timeRange} 
          onChange={e => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-sm"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overview Card */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Total Spent:</span>
            <span className="text-xl font-bold">${periodTotalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Time Period:</span>
            <span className="text-gray-800 font-medium">{getPeriodDescription()}</span>
          </div>
        </div>
        
        {/* Category Breakdown */}
        <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          <div className="h-[280px] overflow-hidden">
            <Pie
              data={{
                labels: categoryData.map(item => item.category),
                datasets: [{
                  data: categoryData.map(item => item.total),
                  backgroundColor: chartColors.slice(0, categoryData.length),
                  borderColor: chartColors.map(color => color.replace('0.7', '1')),
                  borderWidth: 2,
                  hoverOffset: 15,
                  hoverBorderWidth: 3
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    display: true,
                    labels: {
                      usePointStyle: true,
                      boxWidth: 10,
                      padding: 15,
                      font: {
                        size: 12
                      }
                    }
                  },
                  title: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    bodyFont: {
                      size: 14
                    },
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = parseFloat(context.raw || 0);
                        const total = context.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                      }
                    }
                  }
                },
                cutout: '45%',
                radius: '90%'
              }}
              height={280}
            />
          </div>
        </div>
      </div>
      
      {/* Time-Based Analysis */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">{trendLabel} Spending</h2>
        
        <div className="h-[350px] overflow-hidden">
          {timeRange === 'week' ? (
            <WeeklyChart 
              data={analyticsData.weeklyTrends || []} 
              dailyExpenses={analyticsData.dailyData || []} 
            />
          ) : timeRange === 'month' ? (
            <MonthlyChart 
              data={analyticsData.monthlyTrend || []} 
              weeklyTrends={analyticsData.weeklyTrends || []} 
            />
          ) : (
            <div className="h-[300px] overflow-hidden">
              {limitedMonthlyData.length > 0 ? (
                <div className="relative h-full">
                  <Line 
                    data={{
                      labels: limitedMonthlyData.map(item => {
                        const date = new Date(`${item.month}-01`);
                        return date.toLocaleString('default', { month: 'short', year: '2-digit' });
                      }),
                      datasets: [{
                        label: 'Monthly Expenses',
                        data: limitedMonthlyData.map(item => item.total),
                        borderColor: chartColors[0].replace("0.7", "1"),
                        backgroundColor: chartColors[0],
                        pointBackgroundColor: chartColors[0].replace("0.7", "1"),
                        pointRadius: 0,
                        pointHoverRadius: 8,
                        tension: 0.2,
                        borderWidth: 3,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      resizeDelay: 100, // Add delay to prevent excessive redraws
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          animation: {
                            duration: 0
                          },
                          callbacks: {
                            label: function(context) {
                              return `$${parseFloat(context.parsed.y).toFixed(2)}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: value => `$${value}`
                          }
                        }
                      },
                      hover: {
                        mode: 'index',
                        intersect: false,
                        animationDuration: 0
                      },
                      animation: {
                        duration: 300 // Reduce animation duration
                      }
                    }}
                  />
                  <div className="text-sm text-gray-500 text-center pt-2">
                    Yearly total: ${limitedMonthlyData.reduce((sum, item) => sum + parseFloat(item.total || 0), 0).toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                  No monthly data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">{getTimeSpecificInsights().title}</h2>
        
        {categoryData.length > 0 ? (
          <div>
            {/* Top Categories */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Top Categories</h3>
              <ul className="space-y-3">
                {getTimeSpecificInsights().topCategories.map((cat, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" 
                          style={{backgroundColor: chartColors[idx % chartColors.length]}}></div>
                      <span>{cat.category}</span>
                    </div>
                    <div className="font-medium">${cat.total.toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Trend Analysis */}
            {getTimeSpecificInsights().trendAnalysis && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Trend Analysis</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {insights.topCategories[0].category} is your highest spending category, representing {((insights.topCategories[0].total / periodTotalExpenses) * 100).toFixed(0)}% of your expenses for {getPeriodDescription()}.
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Compared to {getTimeSpecificInsights().trendAnalysis.comparison}, your spending 
                  {getTimeSpecificInsights().trendAnalysis.isIncrease ? " increased" : " decreased"} by 
                  {Math.abs(getTimeSpecificInsights().trendAnalysis.percentChange).toFixed(1)}%.
                </p>
              </div>
            )}
            
            {/* Spending Patterns */}
            <div className="mb-2">
              <h3 className="text-md font-medium text-gray-700 mb-3">Spending Patterns</h3>
              <ul className="space-y-2">
                {getTimeSpecificInsights().patterns.map((pattern, idx) => (
                  <li key={idx} className="text-sm text-gray-600">• {pattern}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No insights available. Add more transactions to see spending insights.
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 text-center pb-4">
        Data is updated in real-time as you add or remove expenses.
      </div>
    </div>
  );
}

export default Analytics;