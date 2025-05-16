import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyChart = ({ data }) => {
  // Simple data validation and logging
  console.log("WeeklyChart received data:", data);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log("WeeklyChart: No valid data available");
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Sort the data by sortKey chronologically
  const sortedData = [...data].sort((a, b) => a.sortKey - b.sortKey);
  console.log("WeeklyChart sorted data:", sortedData);

  // Prepare chart data
  const chartData = {
    labels: sortedData.map(item => item.week),
    datasets: [
      {
        label: 'Weekly Expenses',
        data: sortedData.map(item => item.amount),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointRadius: 5,
        tension: 0.1
      }
    ],
  };

  // Chart options
  const options = {
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
        title: {
          display: true,
          text: 'Amount ($)'
        },
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
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default WeeklyChart; 