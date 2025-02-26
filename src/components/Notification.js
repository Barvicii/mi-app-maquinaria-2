import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const Notification = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
      <CheckCircle className="w-5 h-5 mr-2" />
      <span>{message}</span>
    </div>
  );
};

export default Notification;