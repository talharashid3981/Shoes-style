// src/utils/toast.js
let toastContainer = null;

// Create toast container if it doesn't exist
const createToastContainer = () => {
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-20 right-4 z-50 flex flex-col gap-3';
    document.body.appendChild(container);
    toastContainer = container;
  }
  return toastContainer;
};

// Remove toast after duration
const removeToast = (toastElement, duration = 3000) => {
  setTimeout(() => {
    toastElement.style.animation = 'slide-out 0.3s ease forwards';
    setTimeout(() => {
      toastElement.remove();
      if (toastContainer && toastContainer.children.length === 0) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 300);
  }, duration);
};

// Toast function
const Toast = (message, type = 'info') => {
  const container = createToastContainer();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transform transition-all duration-300 animate-slide-in min-w-[300px] max-w-md`;
  
  // Set colors based on type
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
  };
  
  toast.className += ` ${colors[type] || colors.info}`;
  
  // Icons
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <div class="flex-shrink-0 text-xl font-bold">${icons[type] || icons.info}</div>
    <p class="text-sm font-medium flex-1">${message}</p>
    <button class="ml-4 hover:opacity-70 text-lg">✕</button>
  `;
  
  container.appendChild(toast);
  
  // Add click handler to close button
  const closeBtn = toast.querySelector('button');
  closeBtn.onclick = () => {
    toast.style.animation = 'slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  };
  
  // Auto remove
  removeToast(toast, 3000);
};

// Add CSS animations to your global CSS
const addToastStyles = () => {
  if (document.getElementById('toast-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slide-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .animate-slide-in {
      animation: slide-in 0.3s ease forwards;
    }
  `;
  document.head.appendChild(style);
};

// Initialize styles on load
if (typeof window !== 'undefined') {
  addToastStyles();
}

export default Toast;