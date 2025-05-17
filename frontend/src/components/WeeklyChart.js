import React, { useEffect, useRef } from 'react';
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
  const chartRef = useRef(null);
  
  // Cleanup chart instance on unmount to prevent memory leaks
  useEffect(() => {
    // No operation on mount
    return () => {
      // Capture the current value of chartRef for cleanup to fix the React Hook warning
      const chart = chartRef.current;
      if (chart && chart.chartInstance) {
        chart.chartInstance.destroy();
      }
    };
  }, []);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Process and prepare the data for the chart
  const getDailyData = () => {
    // If we have daily data from the API, use it
    if (dailyExpenses && dailyExpenses.length > 0) {
      // Sort by chronological key to ensure proper ordering
      return [...dailyExpenses].sort((a, b) => a.chronological_key - b.chronological_key);
    }
    
    return [];
  };

  const dailyData = getDailyData();

  // Function to format date label properly
  const formatDateLabel = (date) => {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      // Format as Day of week (e.g., "Mon")
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (e) {
      console.error('Error formatting date', e);
      return date;
    }
  };

  // Calculate weekly total for display
  const weeklyTotal = dailyData.reduce((sum, day) => sum + parseFloat(day.total || 0), 0).toFixed(2);

  // Prepare data for the chart
  const chartData = {
    labels: dailyData.map(item => formatDateLabel(item.date)),
    datasets: [{
      label: 'Daily Expenses',
      data: dailyData.map(item => item.total),
      borderColor: chartColorSolid,
      backgroundColor: chartColor,
      pointBackgroundColor: chartColorSolid,
      pointRadius: 0, // Hide points by default
      pointHoverRadius: 8, // Show points on hover
      tension: 0.2,
      borderWidth: 3,
      fill: true
    }]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100, // Add delay to prevent excessive redraws
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
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
          title: function(context) {
            if (context[0].dataIndex >= 0 && context[0].dataIndex < dailyData.length) {
              const item = dailyData[context[0].dataIndex];
              if (item && item.date) {
                try {
                  const date = new Date(item.date);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                } catch (e) {
                  return context[0].label;
                }
              }
            }
            return context[0].label;
          }
        },
        // Prevent tooltips from causing excessive redraws
        animation: {
          duration: 0
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
          color: '#555'
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
      intersect: false,
      // Prevent continuous redraws on hover
      animationDuration: 0
    },
    animation: {
      duration: 300 // Reduce animation duration to prevent excessive rendering
    },
    // Prevent chart from growing beyond its container
    elements: {
      line: {
        tension: 0.2
      }
    }
  };

  return (
    <div className="h-[280px] w-full overflow-hidden">
      <div className="chart-container h-full w-full">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      {weeklyTotal > 0 && (
        <div className="text-sm text-gray-500 text-center pt-2">
          Weekly total: ${weeklyTotal}
        </div>
      )}
    </div>
  );
};

export default WeeklyChart; 