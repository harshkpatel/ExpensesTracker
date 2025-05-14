import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import config from '../config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    totalExpenses: 0,
    categoryBreakdown: [],
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
  const monthlyData = analyticsData.monthlyTrend || [];
  const categoryData = analyticsData.categoryBreakdown || [];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Monthly Trend</h2>
          {monthlyData.length > 0 ? (
            <Line
              data={{
                labels: monthlyData.map(item => item.month),
                datasets: [{
                  label: 'Expenses',
                  data: monthlyData.map(item => item.amount),
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Monthly Expenses Trend'
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500">No monthly data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
          {categoryData.length > 0 ? (
            <Pie
              data={{
                labels: categoryData.map(item => item.category),
                datasets: [{
                  data: categoryData.map(item => item.amount),
                  backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Expenses by Category'
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500">No category data available</p>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Optimization Suggestions</h2>
        {analyticsData.optimizationSuggestions && analyticsData.optimizationSuggestions.length > 0 ? (
          <ul className="list-disc pl-5">
            {analyticsData.optimizationSuggestions.map((suggestion, index) => (
              <li key={index} className="mb-2">{suggestion}</li>
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