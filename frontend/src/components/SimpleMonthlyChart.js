import React from 'react';

// A simple chart component using just HTML/CSS
const SimpleMonthlyChart = ({ data }) => {
  console.log("SimpleMonthlyChart received data:", data);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500">No data available for chart</div>;
  }

  // Sort the data by month
  const sortedData = [...data].sort((a, b) => {
    if (a.month && b.month) {
      return a.month.localeCompare(b.month);
    }
    return 0;
  });
  
  // Find the maximum value for scaling
  const maxValue = Math.max(...sortedData.map(item => {
    if (item.total !== undefined) return item.total;
    if (item.amount !== undefined) return item.amount;
    return 0;
  }));
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Monthly Expenses</h3>
      <div className="flex items-end h-64 space-x-2 border-b border-l border-gray-300 relative">
        {sortedData.map((item, index) => {
          // Get the value from either total or amount property
          const value = item.total !== undefined ? item.total : 
                       (item.amount !== undefined ? item.amount : 0);
          
          const height = (value / maxValue) * 100;
          let label = `${index + 1}`;
          
          // Format label from month if available
          try {
            if (item.month) {
              const [year, month] = item.month.split('-');
              label = `${month}/${year.slice(2)}`;
            }
          } catch (e) {
            console.error("Error formatting month label in SimpleMonthlyChart:", e, item);
          }
          
          return (
            <div key={index} className="flex flex-col items-center flex-1" style={{ minWidth: '30px' }}>
              <div 
                className="w-full bg-blue-500 rounded-t" 
                style={{ height: `${height}%`, minHeight: '4px' }}
              />
              <div className="mt-2 text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
                {label}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-800">
                ${value.toFixed(0)}
              </div>
            </div>
          );
        })}
        
        {/* Y-axis labels */}
        <div className="absolute -left-12 top-0 h-full flex flex-col justify-between">
          <div className="text-xs text-gray-500">${maxValue.toFixed(0)}</div>
          <div className="text-xs text-gray-500">${(maxValue/2).toFixed(0)}</div>
          <div className="text-xs text-gray-500">$0</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMonthlyChart; 