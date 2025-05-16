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
import SimpleMonthlyChart from '../components/SimpleMonthlyChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import WeeklyChart from '../components/WeeklyChart';

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

// Array of colors for charts
const chartColors = [
  'rgb(255, 99, 132)',
  'rgb(54, 162, 235)',
  'rgb(255, 206, 86)',
  'rgb(75, 192, 192)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)',
  'rgb(201, 203, 207)',
  'rgb(255, 99, 71)',
  'rgb(46, 139, 87)',
  'rgb(106, 90, 205)',
  'rgb(255, 69, 0)',
  'rgb(60, 179, 113)'
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
  const [showAlternativeChart, setShowAlternativeChart] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.apiUrl}${config.endpoints.analytics}?time_range=${timeRange}`);
      console.log('Analytics data:', response.data);
      console.log('Weekly data:', response.data.weeklyTrends);
      console.log('Monthly data:', response.data.monthlyTrends);
      console.log('Monthly data old key:', response.data.monthlyTrend);
      console.log('Category data:', response.data.categoryBreakdown);
      
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

  console.log('Accessed monthlyData:', monthlyData);
  console.log('Accessed weeklyData:', weeklyData);
  console.log('Accessed categoryData:', categoryData);
  
  // Sort trend data chronologically using sortKey
  const sortedMonthlyData = [...monthlyData].sort((a, b) => a.month ? a.month.localeCompare(b.month) : 0);
  const sortedWeeklyData = [...weeklyData].sort((a, b) => a.sortKey - b.sortKey);

  // Determine which trend data to show based on time range
  const trendData = timeRange === 'week' ? sortedWeeklyData : sortedMonthlyData;
  const trendLabel = timeRange === 'week' ? 'Weekly' : 'Monthly';

  return (
    <div className="container mx-auto p-4 max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          
          {timeRange === 'month' && (
            <button 
              onClick={() => setShowAlternativeChart(!showAlternativeChart)} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showAlternativeChart ? 'Show Line Chart' : 'Show Simple Chart'}
            </button>
          )}
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
        <div className="bg-white p-4 rounded-lg shadow-sm h-[400px]">
          <h2 className="text-xl font-bold mb-4">{trendLabel} Trend</h2>
          {trendData.length > 0 ? (
            <div className="h-[300px] relative">
              {timeRange === 'month' ? (
                showAlternativeChart ? (
                  <SimpleMonthlyChart data={sortedMonthlyData} />
                ) : (
                  <Line
                    data={{
                      labels: sortedMonthlyData.map(item => {
                        try {
                          if (item.month) {
                            const [year, month] = item.month.split('-');
                            return `${month}/${year.slice(2)}`;
                          } else {
                            return 'Unknown';
                          }
                        } catch (e) {
                          console.error("Error formatting month label:", e, item);
                          return 'Unknown';
                        }
                      }),
                      datasets: [{
                        label: 'Monthly Expenses',
                        data: sortedMonthlyData.map(item => {
                          // Handle potential missing total property
                          if (item.total !== undefined) {
                            return item.total;
                          } else if (item.amount !== undefined) {
                            return item.amount;
                          } else {
                            console.error("Missing total/amount in item:", item);
                            return 0;
                          }
                        }),
                        borderColor: 'rgb(53, 162, 235)',
                        backgroundColor: 'rgba(53, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `$${context.parsed.y.toLocaleString()}`;
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
                        },
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }}
                  />
                )
              ) : (
                <WeeklyChart data={sortedWeeklyData} />
              )}
            </div>
          ) : (
            <p className="text-gray-500">No {trendLabel.toLowerCase()} data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm h-[400px]">
          <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
          {categoryData.length > 0 ? (
            <div className="h-[300px] relative">
              <Pie
                data={{
                  labels: categoryData.map(item => item.category),
                  datasets: [{
                    data: categoryData.map(item => item.total),
                    backgroundColor: chartColors.slice(0, categoryData.length),
                    borderWidth: 1
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
                        boxWidth: 12,
                        padding: 10
                      }
                    },
                    title: {
                      display: true,
                      text: 'Expenses by Category'
                    },
                    tooltip: {
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
                  }
                }}
                height={300}
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
                  console.log("Month-over-Month Analysis data:", monthlyData);
                  
                  // Check if data has the expected format
                  if (!monthlyData[0].hasOwnProperty('month') || !monthlyData[0].hasOwnProperty('total')) {
                    console.error("Monthly data missing required properties:", monthlyData[0]);
                    return <p>Unable to display trends due to data format issues</p>;
                  }
                  
                  const sortedMonths = [...monthlyData].sort((a, b) => {
                    if (!a.month || !b.month) {
                      console.log("Missing month property:", a, b);
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
                            console.error("Error calculating 3-month average:", e);
                            return null;
                          }
                        })()}
                      </>
                    );
                  } catch (e) {
                    console.error("Error in month-over-month calculations:", e);
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
                      console.error("Spending patterns: Monthly data missing required properties");
                      return null;
                    }
                    
                    const highestMonth = [...monthlyData].sort((a, b) => b.total - a.total)[0];
                    let displayDate = "recent month";
                    
                    try {
                      const [year, month] = highestMonth.month.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      displayDate = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    } catch (e) {
                      console.error("Error formatting date:", e);
                    }
                    
                    return (
                      <li className="text-gray-700">
                        Your highest spending month was {displayDate}.
                      </li>
                    );
                  } catch (e) {
                    console.error("Error in highest month calculation:", e);
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
                    console.error("Error in category calculation:", e);
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