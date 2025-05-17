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
      let periodTotal = 0;
      if (timeRange === 'week') {
        // Get weekly total from either daily data (most accurate) or weekly trends
        if (response.data.dailyData && response.data.dailyData.length > 0) {
          periodTotal = response.data.dailyData.reduce((sum, day) => sum + parseFloat(day.total || 0), 0);
        } else if (response.data.weeklyTrends && response.data.weeklyTrends.length > 0) {
          // Use the most recent week data
          const mostRecentWeek = [...response.data.weeklyTrends].sort((a, b) => b.sortKey - a.sortKey)[0];
          periodTotal = parseFloat(mostRecentWeek.amount || 0);
        }
      } else if (timeRange === 'month') {
        // Use the monthly total as provided
        periodTotal = parseFloat(response.data.totalExpenses || 0);
      } else {
        // Yearly total is the sum of all monthly data
        periodTotal = response.data.monthlyTrend && response.data.monthlyTrend.length > 0 
          ? response.data.monthlyTrend.reduce((sum, month) => sum + parseFloat(month.total || 0), 0)
          : 0;
      }
      
      // Round to 2 decimal places for consistency
      periodTotal = parseFloat(periodTotal.toFixed(2));
      
      // Now adjust category data to match the period total while maintaining proportions
      let categoryData = [...(response.data.categoryBreakdown || [])];
      
      // Sort by amount in descending order and keep only top categories
      if (categoryData.length > 0) {
        categoryData = categoryData
          .sort((a, b) => b.total - a.total)
          .slice(0, 8); // Limit to top 8 categories for cleaner display
      }
        
      setTimePeriodCategoryData(categoryData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
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

  // Determine which trend data to show based on time range
  const trendData = timeRange === 'week' ? sortedWeeklyData : limitedMonthlyData;
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
    <div className="container mx-auto p-4 max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="relative inline-block">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 border rounded appearance-none pr-8 bg-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {/* Total expenses summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-2">Total Expenses</h2>
        <p className="text-3xl font-bold text-blue-600">${periodTotalExpenses.toFixed(2)}</p>
        <p className="text-sm text-gray-500">
          {timeRange === 'week' ? 'Last 7 days' : timeRange === 'month' ? 'Last 30 days' : 'Last 365 days'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm h-[350px]">
          <h2 className="text-xl font-bold mb-4">{trendLabel} Trend</h2>
          {trendData.length > 0 ? (
            <div className="h-[280px] relative">
              {timeRange === 'week' ? (
                <WeeklyChart data={sortedWeeklyData} dailyExpenses={analyticsData.dailyData || []} />
              ) : timeRange === 'month' ? (
                <MonthlyChart data={sortedMonthlyData} />
              ) : (
                <div className="h-[280px] w-full">
                  <Line
                    data={{
                      labels: limitedMonthlyData.map(item => {
                        if (!item.month) return '';
                        // eslint-disable-next-line no-unused-vars
                        const [year, month] = item.month.split('-');
                        
                        // Convert month number to abbreviated month name
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthIndex = parseInt(month) - 1;
                        const monthName = monthNames[monthIndex] || month;
                        
                        // For yearly view, show just month names
                        // For monthly view, show abbreviated month with year
                        return timeRange === 'year' ? monthName : `${monthName}${year !== new Date().getFullYear().toString() ? ` '${year.slice(2)}` : ''}`;
                      }),
                      datasets: [{
                        label: `${trendLabel} Expenses`,
                        data: limitedMonthlyData.map(item => item.total),
                        borderColor: chartColors[0].replace("0.7", "1"),
                        backgroundColor: chartColors[0],
                        pointBackgroundColor: chartColors[0].replace("0.7", "1"),
                        pointRadius: 3,
                        pointHoverRadius: 8,
                        tension: 0.2,
                        borderWidth: 3,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          bodyFont: {
                            size: 14
                          },
                          titleFont: {
                            size: 14,
                            weight: 'bold'
                          },
                          intersect: false,
                          mode: 'index',
                          callbacks: {
                            label: function(context) {
                              return `$${context.parsed.y.toLocaleString()}`;
                            },
                            title: function(context) {
                              // Enhance the tooltip title with more readable date
                              if (timeRange === 'year') {
                                return context[0].label;
                              } else {
                                return context[0].label;
                              }
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          },
                          border: {
                            dash: [4, 4]
                          },
                          ticks: {
                            font: {
                              size: 12
                            },
                            callback: value => `$${value}`
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            font: {
                              size: timeRange === 'year' ? 13 : 12,
                              weight: '600'
                            },
                            maxRotation: timeRange === 'year' ? 0 : 30,
                            minRotation: timeRange === 'year' ? 0 : 30,
                            color: '#555',
                            autoSkip: false,
                            maxTicksLimit: timeRange === 'year' ? 12 : 6
                          }
                        }
                      },
                      layout: {
                        padding: {
                          left: 5,
                          right: 15,
                          top: 20,
                          bottom: timeRange === 'year' ? 10 : 15
                        }
                      },
                      interaction: {
                        mode: 'index',
                        intersect: false
                      },
                      hover: {
                        mode: 'index',
                        intersect: false
                      }
                    }}
                  />
                  {limitedMonthlyData.length > 0 && (
                    <div className="text-sm text-gray-500 text-center pt-2">
                      Yearly total: ${limitedMonthlyData.reduce((sum, item) => sum + parseFloat(item.total || 0), 0).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No {trendLabel.toLowerCase()} data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm h-[350px]">
          <h2 className="text-xl font-bold mb-4">{trendLabel} Category Breakdown</h2>
          {categoryData.length > 0 ? (
            <div className="h-[280px] relative">
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
          ) : (
            <p className="text-gray-500">No {trendLabel.toLowerCase()} category data available</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">{insights.title}</h2>
        
        {categoryData.length > 0 && trendData.length > 0 ? (
          <div className="space-y-6">
            {/* Top Categories Analysis */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Categories for {getPeriodDescription()}</h3>
              <div className="space-y-2">
                {insights.topCategories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className={`h-3 w-3 rounded-full mr-2`} style={{backgroundColor: chartColors[index]}}></span>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <span className="text-gray-700">${category.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {insights.topCategories.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {insights.topCategories[0].category} is your highest spending category in {getPeriodDescription()}, accounting for 
                  {` ${Math.round((insights.topCategories[0].total / periodTotalExpenses) * 100)}%`} of your total expenses.
                </p>
              )}
            </div>
            
            {/* Trend Analysis */}
            {insights.trendAnalysis && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{trendLabel} Trend Analysis</h3>
                <p className="mb-2">
                  Your spending 
                  <span className={`font-medium ${insights.trendAnalysis.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                    {` ${insights.trendAnalysis.isIncrease ? 'increased' : 'decreased'} by ${Math.abs(insights.trendAnalysis.percentChange).toFixed(1)}% `}
                  </span>
                  compared to {insights.trendAnalysis.comparison}.
                </p>
              </div>
            )}
            
            {/* Spending Pattern Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{trendLabel} Spending Patterns</h3>
              <ul className="list-disc list-inside space-y-1">
                {insights.patterns.map((pattern, index) => (
                  <li key={index} className="text-gray-700">{pattern}</li>
                ))}
                
                {insights.patterns.length === 0 && (
                  <li className="text-gray-700">
                    Add more expense data to see detailed spending patterns for {getPeriodDescription()}.
                  </li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Add more expense data to see trends and insights</p>
        )}
      </div>
    </div>
  );
}

export default Analytics;