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
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    totalExpenses: 0,
    categoryBreakdown: [],
    weeklyTrends: [],
    monthlyTrend: [],
    optimizationSuggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.apiUrl}${config.endpoints.analytics}?time_range=${timeRange}`);
      
      // Add weeklyTrends if it doesn't exist in the API response
      if (!response.data.weeklyTrends) {
        console.log('Adding mock weekly data');
        // Create mock weekly data based on monthly data
        const mockWeeklyData = [];
        if (response.data.monthlyTrend) {
          const now = new Date();
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date();
            weekStart.setDate(now.getDate() - (i * 7) - 6);
            const weekEnd = new Date();
            weekEnd.setDate(now.getDate() - (i * 7));
            
            mockWeeklyData.push({
              week: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
              amount: response.data.monthlyTrend[0]?.total / 4 || 0,
              sortKey: 4 - i
            });
          }
        }
        response.data.weeklyTrends = mockWeeklyData;
      }
      
      setAnalyticsData(response.data);
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
  const categoryData = analyticsData.categoryBreakdown || [];
  
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
        <p className="text-3xl font-bold text-blue-600">${analyticsData.totalExpenses.toFixed(2)}</p>
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
                <WeeklyChart data={sortedWeeklyData} />
              ) : timeRange === 'month' ? (
                <MonthlyChart data={sortedMonthlyData} />
              ) : (
                <Line
                  data={{
                    labels: limitedMonthlyData.map(item => {
                      if (!item.month) return '';
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
              )}
            </div>
          ) : (
            <p className="text-gray-500">No {trendLabel.toLowerCase()} data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm h-[350px]">
          <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
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
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
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
            <p className="text-gray-500">No category data available</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Expense Trends & Insights</h2>
        
        {categoryData.length > 0 && monthlyData.length > 0 ? (
          <div className="space-y-6">
            {/* Top Categories Analysis */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Categories</h3>
              <div className="space-y-2">
                {[...categoryData]
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`h-3 w-3 rounded-full mr-2`} style={{backgroundColor: chartColors[index]}}></span>
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <span className="text-gray-700">${category.total.toFixed(2)}</span>
                    </div>
                  ))
                }
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {[...categoryData].sort((a, b) => b.total - a.total)[0].category} is your highest spending category, accounting for 
                {` ${Math.round(([...categoryData].sort((a, b) => b.total - a.total)[0].total / analyticsData.totalExpenses) * 100)}%`} of your total expenses.
              </p>
            </div>
            
            {/* Month-over-Month Analysis */}
            {monthlyData.length > 1 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Month-over-Month Trends</h3>
                {(() => {
                  // Check if data has the expected format
                  if (!monthlyData[0].hasOwnProperty('month') || !monthlyData[0].hasOwnProperty('total')) {
                    return <p>Unable to display trends due to data format issues</p>;
                  }
                  
                  const sortedMonths = [...monthlyData].sort((a, b) => {
                    if (!a.month || !b.month) {
                      return 0;
                    }
                    return a.month.localeCompare(b.month);
                  });
                  const monthCount = sortedMonths.length;
                  
                  if (monthCount < 2) return <p>Not enough data for trend analysis</p>;
                  
                  try {
                    const lastMonth = sortedMonths[monthCount - 1];
                    const previousMonth = sortedMonths[monthCount - 2];
                    const percentChange = ((lastMonth.total - previousMonth.total) / previousMonth.total) * 100;
                    const isIncrease = percentChange > 0;
                    
                    return (
                      <>
                        <p className="mb-2">
                          Your spending 
                          <span className={`font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                            {` ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% `}
                          </span>
                          compared to the previous month.
                        </p>
                        
                        {monthCount >= 3 && (() => {
                          try {
                            const threeMonthAvg = sortedMonths.slice(-3).reduce((sum, m) => sum + m.total, 0) / 3;
                            const vsAverage = ((lastMonth.total - threeMonthAvg) / threeMonthAvg) * 100;
                            return (
                              <p className="text-sm text-gray-600">
                                This is {Math.abs(vsAverage).toFixed(1)}% {vsAverage > 0 ? 'above' : 'below'} your 3-month average.
                              </p>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </>
                    );
                  } catch (e) {
                    return <p>Unable to calculate trends due to data issues</p>;
                  }
                })()}
              </div>
            )}
            
            {/* Spending Pattern Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Spending Patterns</h3>
              <ul className="list-disc list-inside space-y-1">
                {monthlyData.length > 0 && (() => {
                  try {
                    // Check if data has expected structure
                    if (!monthlyData[0].hasOwnProperty('month') || !monthlyData[0].hasOwnProperty('total')) {
                      return null;
                    }
                    
                    const highestMonth = [...monthlyData].sort((a, b) => b.total - a.total)[0];
                    let displayDate = "recent month";
                    
                    try {
                      const [year, month] = highestMonth.month.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      displayDate = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    } catch (e) {
                      // Fallback to default
                    }
                    
                    return (
                      <li className="text-gray-700">
                        Your highest spending month was {displayDate}.
                      </li>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
                
                {categoryData.length > 1 && (() => {
                  try {
                    const sortedCategories = [...categoryData].sort((a, b) => b.total - a.total);
                    const topTwoTotal = sortedCategories.slice(0, 2).reduce((sum, c) => sum + c.total, 0);
                    const percentage = Math.round((topTwoTotal / analyticsData.totalExpenses) * 100);
                    
                    return (
                      <li className="text-gray-700">
                        Your top 2 categories ({sortedCategories.slice(0, 2).map(c => c.category).join(' and ')}) 
                        account for {percentage}% of your spending.
                      </li>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
                
                <li className="text-gray-700">
                  {categoryData.length < 3 ? 
                    "Try adding more expenses to get more detailed spending insights." :
                    `You have expenses across ${categoryData.length} different categories.`
                  }
                </li>
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