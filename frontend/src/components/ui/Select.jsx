import React from 'react';
import ReactSelect from 'react-select';
import { useTheme } from '../../contexts/ThemeContext';

const Select = (props) => {
  const { isDark } = useTheme();

  const defaultStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 30000 }),
    menu: (base) => ({ ...base, boxShadow: isDark ? '0 8px 20px rgba(2,6,23,0.6)' : '0 10px 30px rgba(2,6,23,0.08)', borderRadius: 12, background: isDark ? '#0b1220' : '#ffffff' }),
    control: (base, state) => ({
      ...base,
      minHeight: 44,
      borderRadius: 10,
      background: isDark ? '#071022' : '#ffffff',
      borderColor: state.isFocused ? (isDark ? '#0ea5a3' : '#34d399') : (isDark ? '#1f2937' : '#e6eef9'),
      boxShadow: 'none',
      paddingLeft: 6,
      color: isDark ? '#e6eef9' : '#0f172a'
    }),
    option: (base, state) => ({
      ...base,
      padding: '10px 12px',
      background: state.isFocused ? (isDark ? '#06242e' : 'linear-gradient(90deg,#14b8a6,#06b6d4)') : state.isSelected ? (isDark ? 'rgba(14,165,140,0.08)' : 'rgba(20,184,166,0.06)') : (isDark ? '#071022' : '#ffffff'),
      color: state.isFocused || state.isSelected ? (isDark ? '#e6eef9' : '#ffffff') : (isDark ? '#e6eef9' : '#0f172a'),
    }),
    singleValue: (base) => ({ ...base, color: isDark ? '#e6eef9' : '#0f172a' }),
    menuList: (base) => ({ ...base, background: isDark ? '#071022' : '#ffffff' })
  };

  return (
    <ReactSelect
      {...props}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      classNamePrefix={props.classNamePrefix || 'react-select'}
      styles={{ ...(props.styles || {}), ...defaultStyles }}
    />
  );
};

export default Select;
