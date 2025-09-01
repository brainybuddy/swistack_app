import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export default function Button({ label, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 
        bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 
        focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}