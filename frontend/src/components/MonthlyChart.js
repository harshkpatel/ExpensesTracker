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

// Enhanced color palette
const chartColor = 'rgba(53, 162, 235, 0.7)';
const chartColorSolid = 'rgba(53, 162, 235, 1)';

const MonthlyChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for previous month</div>;
  }

  // Find the most recent month data
  const getMostRecentMonthData = () => {
    // Sort by month to get the most recent month
    return [...data].sort((a, b) => {
      if (a.month && b.month) {
        return b.month.localeCompare(a.month);
      }
      return 0;
    })[0] || null;
  };

  // Create weekly breakdown for the most recent month with actual values
  const generateWeeksForPreviousMonth = () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const year = previousMonth.getFullYear();
    const month = previousMonth.getMonth();
    
    // Get the last day of the previous month
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Create an array of weeks for the previous month
    const weeks = [];
    let weekStart = 1;
    
    // Generate 4-5 weeks for the month
    while (weekStart <= lastDay) {
      const weekEnd = Math.min(weekStart + 6, lastDay);
      
      // Calculate the week number (for chronological sorting)
      const weekNum = Math.ceil(weekStart / 7);
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${previousMonth.toLocaleString('default', { month: 'short' })} ${weekStart}-${weekEnd}`,
        amount: 0, // Default to zero for weeks with no expenses
        chronologicalKey: weekNum - 1, // 0-based index for sorting
        weekNum: weekNum
      });
      
      weekStart = weekEnd + 1;
    }
    
    // Sort chronologically (week 1 to week 4/5)
    return weeks.sort((a, b) => a.chronologicalKey - b.chronologicalKey);
  };
  
  const weeklyData = generateWeeksForPreviousMonth();
  
  // Get the monthly total to display in the title/tooltip
  const monthlyTotal = parseFloat(getMostRecentMonthData()?.total || 0).toFixed(2);

  // Prepare chart data
  const chartData = {
    labels: weeklyData.map(item => item.label),
    datasets: [{
      label: 'Weekly Expenses',
      data: weeklyData.map(item => item.amount),
      borderColor: chartColorSolid,
      backgroundColor: chartColor,
      pointBackgroundColor: chartColorSolid,
      pointRadius: 0,
      pointHoverRadius: 8,
      tension: 0.2,
      borderWidth: 3,
      fill: true
    }]
  };

  // Chart options
  const options = {
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
            return `$${parseFloat(context.parsed.y).toFixed(2)}`;
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
          padding: 5,
          callback: value => `$${value}`
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '600'
          },
          color: '#555',
          maxRotation: 30,
          minRotation: 30
        }
      }
    },
    layout: {
      padding: {
        left: 5,
        right: 15,
        top: 20,
        bottom: 15
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
  };

  return (
    <div className="h-[280px] w-full">
      <Line data={chartData} options={options} />
      {monthlyTotal > 0 && (
        <div className="text-sm text-gray-500 text-center pt-2">
          Monthly total: ${monthlyTotal}
        </div>
      )}
    </div>
  );
};

export default MonthlyChart; 