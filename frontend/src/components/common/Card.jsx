export const Card = ({ children, className = '', title, subtitle, actions }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={title ? 'card-body' : ''}>
        {children}
      </div>
    </div>
  );
};
