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

// Enhanced color palette
const chartColor = 'rgba(53, 162, 235, 0.7)';
const chartColorSolid = 'rgba(53, 162, 235, 1)';

const MonthlyChart = ({ data, weeklyTrends = [] }) => {
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

  if ((!data || !Array.isArray(data) || data.length === 0) && 
      (!weeklyTrends || !Array.isArray(weeklyTrends) || weeklyTrends.length === 0)) {
    return <div className="text-center text-gray-500">No data available for previous month</div>;
  }

  // Use the weekly trends to show actual weekly data
  const getWeeklyData = () => {
    // Return the last 4 weeks from weekly trends, sorted chronologically
    if (weeklyTrends && weeklyTrends.length > 0) {
      return [...weeklyTrends]
        .sort((a, b) => a.sortKey - b.sortKey)  // Sort chronologically from oldest to newest
        .slice(0, 4); // Get the last 4 weeks of data
    }
    
    return [];
  };

  const weeklyData = getWeeklyData();
  
  // Calculate total monthly expenses from the weekly data
  const monthlyTotal = weeklyData.reduce((sum, week) => sum + parseFloat(week.amount || 0), 0).toFixed(2);
  
  // Format week labels to be more concise
  const formatWeekLabel = (label) => {
    if (!label) return '';
    // Extract just the dates from the week label (e.g., "Jan 01 - Jan 07" -> "01-07")
    const parts = label.split(' - ');
    if (parts.length !== 2) return label;
    
    const startParts = parts[0].split(' ');
    const endParts = parts[1].split(' ');
    
    if (startParts.length >= 2 && endParts.length >= 2) {
      // Same month - "Feb 01-07"
      if (startParts[0] === endParts[0]) {
        return `${startParts[0]} ${startParts[1]}-${endParts[1]}`;
      } 
      // Different months - "Jan 25-Feb 01"
      return `${startParts[0]} ${startParts[1]}-${endParts[0]} ${endParts[1]}`;
    }
    
    return label;
  };

  // Prepare chart data
  const chartData = {
    labels: weeklyData.map(item => formatWeekLabel(item.week)),
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
      {monthlyTotal > 0 && (
        <div className="text-sm text-gray-500 text-center pt-2">
          Monthly total: ${monthlyTotal}
        </div>
      )}
    </div>
  );
};

export default MonthlyChart; 