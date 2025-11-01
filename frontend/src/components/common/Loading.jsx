export const Loading = ({ fullScreen = true, size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className={`${sizeClasses[size]} spinner mb-4`}></div>
        <p className="text-gray-600 font-medium animate-pulse-subtle">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} spinner mb-4`}></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`animate-spin rounded-full ${sizes[size]} border-b-2 border-black`}></div>
  );
};
