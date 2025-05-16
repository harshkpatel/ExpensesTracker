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
    monthlyTrends: [],
    weeklyTrends: [],
    optimizationSuggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.apiUrl}${config.endpoints.analytics}?time_range=${timeRange}`);
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
  const monthlyData = analyticsData.monthlyTrends || [];
  const weeklyData = analyticsData.weeklyTrends || [];
  const categoryData = analyticsData.categoryBreakdown || [];

  // Sort trend data chronologically using sortKey
  const sortedMonthlyData = [...monthlyData].sort((a, b) => a.sortKey - b.sortKey);
  const sortedWeeklyData = [...weeklyData].sort((a, b) => a.sortKey - b.sortKey);

  // Determine which trend data to show based on time range
  const trendData = timeRange === 'week' ? sortedWeeklyData : sortedMonthlyData;
  const trendLabel = timeRange === 'week' ? 'Weekly' : 'Monthly';

  return (
    <div className="container mx-auto p-4 max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
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
              <Line
                data={{
                  labels: trendData.map(item => timeRange === 'week' ? item.week : item.month),
                  datasets: [{
                    label: 'Expenses',
                    data: trendData.map(item => item.amount),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      display: true,
                    },
                    title: {
                      display: true,
                      text: `${trendLabel} Expenses Trend`
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Amount ($)'
                      },
                      suggestedMax: Math.max(...trendData.map(item => item.amount || 0)) * 1.1 || 1000,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
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
                height={300}
              />
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
        <h2 className="text-xl font-bold mb-4">Optimization Suggestions</h2>
        {analyticsData.optimizationSuggestions && analyticsData.optimizationSuggestions.length > 0 ? (
          <ul className="space-y-3">
            {analyticsData.optimizationSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No optimization suggestions available</p>
        )}
      </div>
    </div>
  );
}

export default Analytics; 