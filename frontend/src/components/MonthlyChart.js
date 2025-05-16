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

const MonthlyChart = ({ data }) => {
  // Simple data validation
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Sort the data by month chronologically
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  // Prepare chart data
  const chartData = {
    labels: sortedData.map(item => {
      const [year, month] = item.month.split('-');
      return `${month}/${year.slice(2)}`; // MM/YY format
    }),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: sortedData.map(item => item.total),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        pointBackgroundColor: 'rgb(53, 162, 235)',
        pointRadius: 5,
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
        ticks: {
          callback: value => `$${value}`
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

export default MonthlyChart; 