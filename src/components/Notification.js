import React, { useEffect, useState } from 'react';

const Notification = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const hideTimer = setTimeout(() => {
            setVisible(false);
            // Give time for fade out animation before calling onClose
            setTimeout(() => {
                onClose?.();
            }, 500);
        }, duration);

        return () => {
            clearTimeout(hideTimer);
        };
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div className={`
            fixed bottom-4 right-4 p-4 rounded-lg shadow-lg
            ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}
            text-white flex items-center gap-2 z-50
            transition-all duration-500 ease-in-out
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
            {type === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            )}
            <span>{message}</span>
        </div>
    );
};

export default Notification;