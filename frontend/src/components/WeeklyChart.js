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

// Enhanced color scheme
const chartColor = 'rgba(75, 192, 192, 0.7)';
const chartColorSolid = 'rgba(75, 192, 192, 1)';

const WeeklyChart = ({ data, dailyExpenses = [] }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Process and prepare the data for the chart
  const processChartData = () => {    
    if (dailyExpenses.length === 0) {
      // Fallback: Generate empty day slots for the last 7 days
      return generateEmptyDailyData();
    }
    
    // Format the daily data for the chart
    const chartData = dailyExpenses.map(day => {
      const date = new Date(day.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return {
        date: date,
        label: `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`,
        amount: day.total, // Use the actual daily total
        expenses: day.expenses, // Store actual expense objects
        chronologicalKey: day.chronologicalKey
      };
    });
    
    // Sort chronologically (left to right = oldest to newest)
    return chartData.sort((a, b) => a.chronologicalKey - b.chronologicalKey);
  };
  
  // Fallback function to generate empty days
  const generateEmptyDailyData = () => {
    const dailyData = [];
    const today = new Date();
    
    // Create entries for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Format the date for display
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[date.getMonth()];
      
      // Get day name
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      
      // Create object with zero amount by default
      dailyData.push({
        date: date,
        label: `${dayName}, ${monthName} ${day}`,
        amount: 0, // Default to zero for days with no expenses
        chronologicalKey: 6 - i // 0 is oldest, 6 is newest
      });
    }
    
    return dailyData.sort((a, b) => a.chronologicalKey - b.chronologicalKey);
  };
  
  // Get data for the chart
  const dailyData = processChartData();
  
  // Calculate weekly total from daily totals for more accuracy
  const calculatedTotal = dailyData.reduce((sum, day) => sum + parseFloat(day.amount || 0), 0).toFixed(2);
  
  // Prepare data for the chart
  const chartData = {
    labels: dailyData.map(item => item.label),
    datasets: [{
      label: 'Daily Expenses',
      data: dailyData.map(item => item.amount),
      borderColor: chartColorSolid,
      backgroundColor: chartColor,
      pointBackgroundColor: chartColorSolid,
      pointRadius: 3,
      pointHoverRadius: 8,
      tension: 0.2,
      borderWidth: 3,
      fill: true
    }]
  };

  // Improved chart options
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
          },
          afterLabel: function(context) {
            // If we have details of the expenses, show them
            const dayData = dailyData[context.dataIndex];
            if (dayData.expenses && dayData.expenses.length > 0) {
              return dayData.expenses.map(expense => 
                `  • ${expense.description}: $${parseFloat(expense.amount).toFixed(2)}`
              );
            }
            return '';
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
            size: 11,
            weight: '600' 
          },
          color: '#555',
          maxRotation: 30,
          minRotation: 30,
          padding: 5
        }
      }
    },
    layout: {
      padding: {
        left: 0,
        right: 10,
        top: 20,
        bottom: 10
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
      {calculatedTotal > 0 && (
        <div className="text-sm text-gray-500 text-center pt-2">
          Weekly total: ${calculatedTotal}
        </div>
      )}
    </div>
  );
};

export default WeeklyChart; 