export const Input = ({ label, error, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export const Select = ({ label, error, options, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <select
        className={`select ${error ? 'input-error' : ''}`}
        {...props}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export const Textarea = ({ label, error, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`textarea ${error ? 'input-error' : ''}`}
        rows={4}
        {...props}
      />
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};
