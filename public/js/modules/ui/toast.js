/**
 * Toast Notification Module
 * Show toast notifications
 */

const ToastUI = {
    queue: [],
    isShowing: false,
    maxVisible: 3,

    /**
     * Show toast notification with enhanced features
     */
    show(message, type = 'info', options = {}) {
        const {
            duration = 5000,
            dismissible = true,
            action = null,
            position = 'top-right',
            persistent = false
        } = options;

        // Add to queue if too many toasts are showing
        if (this.queue.length >= this.maxVisible) {
            this.queue.push({ message, type, options });
            return;
        }

        this.isShowing = true;

        // Remove existing toast if same type and message
        const existingToast = document.querySelector(`.toast-notification[data-message="${message}"]`);
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.setAttribute('data-message', message);
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        // Set icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        // Build toast content
        let content = `
            <div class="toast-content">
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-message">${message}</div>
        `;

        if (action) {
            content += `
                <button class="toast-action" onclick="${action.callback}" aria-label="${action.label}">
                    ${action.label}
                </button>
            `;
        }

        if (dismissible) {
            content += `
                <button class="toast-dismiss" onclick="ToastUI.dismiss(this.parentElement.parentElement)" aria-label="Dismiss notification">
                    ×
                </button>
            `;
        }

        content += `</div>`;

        if (!persistent) {
            content += `<div class="toast-progress"></div>`;
        }

        toast.innerHTML = content;

        // Apply styles
        toast.style.cssText = `
            position: fixed;
            ${position.includes('top') ? 'top: 20px' : 'bottom: 20px'};
            ${position.includes('right') ? 'right: 20px' : 'left: 20px'};
            padding: 16px 20px;
            background-color: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            max-width: 500px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            cursor: ${dismissible ? 'pointer' : 'default'};
        `;

        // Add CSS for toast components
        if (!document.getElementById('toast-styles')) {
            const toastStyle = document.createElement('style');
            toastStyle.id = 'toast-styles';
            toastStyle.textContent = `
                .toast-notification {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .toast-icon {
                    font-size: 18px;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .toast-message {
                    flex: 1;
                    font-weight: 500;
                }

                .toast-action {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .toast-action:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .toast-dismiss {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 20px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .toast-dismiss:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .toast-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 0 0 8px 8px;
                    animation: toast-progress ${duration}ms linear;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }

                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(toastStyle);
        }

        // Add to document
        document.body.appendChild(toast);

        // Auto remove after duration (if not persistent)
        if (!persistent) {
            const timeoutId = setTimeout(() => {
                this.dismiss(toast);
            }, duration);

            // Store timeout ID for cleanup
            toast._timeoutId = timeoutId;
        }

        // Handle click to dismiss
        if (dismissible) {
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('toast-action')) {
                    this.dismiss(toast);
                }
            });
        }

        // Show next toast in queue after a delay
        setTimeout(() => {
            this.isShowing = false;
            this.showNextInQueue();
        }, 100);
    },

    /**
     * Dismiss a toast notification
     */
    dismiss(toastElement) {
        if (!toastElement) return;

        // Clear timeout if exists
        if (toastElement._timeoutId) {
            clearTimeout(toastElement._timeoutId);
        }

        // Animate out
        toastElement.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
            this.showNextInQueue();
        }, 300);
    },

    /**
     * Show next toast in queue
     */
    showNextInQueue() {
        if (this.queue.length > 0 && !this.isShowing) {
            const next = this.queue.shift();
            this.show(next.message, next.type, next.options);
        }
    },

    /**
     * Clear all toasts
     */
    clear() {
        const toasts = document.querySelectorAll('.toast-notification');
        toasts.forEach(toast => this.dismiss(toast));
        this.queue = [];
    },

    // Convenience methods
    success(message, options = {}) {
        this.show(message, 'success', options);
    },

    error(message, options = {}) {
        this.show(message, 'error', options);
    },

    warning(message, options = {}) {
        this.show(message, 'warning', options);
    },

    info(message, options = {}) {
        this.show(message, 'info', options);
    },

    /**
     * Show loading toast
     */
    loading(message = 'Loading...', options = {}) {
        return this.show(message, 'info', {
            ...options,
            dismissible: false,
            persistent: true
        });
    },

    /**
     * Update loading toast
     */
    updateLoading(toastElement, message, type = 'success') {
        if (!toastElement) return;

        const messageElement = toastElement.querySelector('.toast-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // Change type/color
        toastElement.className = `toast-notification toast-${type}`;
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toastElement.style.backgroundColor = colors[type] || colors.info;

        // Make dismissible and auto-remove
        setTimeout(() => {
            this.dismiss(toastElement);
        }, 2000);
    }
};

// Export
window.ToastUI = ToastUI;
