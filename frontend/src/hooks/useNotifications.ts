import { useCallback } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface NotificationOptions extends ToastOptions {
  onClose?: () => void;
}

export const useNotifications = () => {
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }, []);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }, []);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }, []);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 