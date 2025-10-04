import React, { createContext, useContext, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  };

  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 7000, // Errors stay longer
      ...options
    });
  };

  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  };

  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRemove }) {
  const { type, message, title } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "relative p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-105";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`;
    }
  };

  return (
    <div className={`${getStyles()} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {message}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="ml-3 flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}