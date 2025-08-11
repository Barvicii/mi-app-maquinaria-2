import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Notification = ({ message, type = 'success', onClose, duration = 5000, show }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-700';
      default:
        return 'bg-green-50 border-green-500 text-green-700';
    }
  };

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-md rounded-md border-l-4 p-4 shadow-md ${getTypeStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Notification;