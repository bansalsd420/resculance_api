import { RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { useState, useEffect } from 'react';

export const ResponsiveTable = ({ columns, data, onRowClick, onRefresh, isRefreshing }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Mobile: Card-based layout
    return (
      <div className="space-y-3">
        {onRefresh && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-card border border-border hover:bg-background text-sm transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-text-secondary">Refresh</span>
            </button>
          </div>
        )}
        
        {data.length === 0 ? (
          <Card>
            <p className="text-center text-text-secondary py-8">No data available</p>
          </Card>
        ) : (
          data.map((row, rowIndex) => (
            <Card
              key={rowIndex}
              className={`p-4 ${onRowClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              <div className="space-y-3">
                {columns.map((column, colIndex) => {
                  if (column.header === 'Actions') {
                    return (
                      <div key={colIndex} className="pt-3 border-t border-border">
                        {column.render ? column.render(row) : row[column.accessor]}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={colIndex} className="flex justify-between items-start gap-3">
                      <span className="text-sm font-medium text-text-secondary flex-shrink-0">
                        {column.header}:
                      </span>
                      <div className="text-sm text-text text-right flex-1">
                        {column.render ? column.render(row) : row[column.accessor]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  // Desktop: Traditional table
  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-semibold text-text"
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {index === columns.length - 1 && onRefresh && (
                      <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 px-2 py-1 rounded-md bg-background hover:bg-border text-sm shadow-sm transition-colors"
                        title="Refresh table"
                      >
                        <RefreshCw className={`w-4 h-4 text-text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-secondary">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-background transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-text">
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
