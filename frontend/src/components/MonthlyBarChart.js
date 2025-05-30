import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyBarChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Sort the data by month
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  // Chart data
  const chartData = {
    labels: sortedData.map(item => {
      const [year, month] = item.month.split('-');
      return `${month}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: sortedData.map(item => item.total),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

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
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MonthlyBarChart; 