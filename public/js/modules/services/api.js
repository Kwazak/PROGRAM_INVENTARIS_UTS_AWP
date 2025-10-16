/**
 * API Service Module
 * Centralized API communication
 */

const APIService = {
    /**
     * Get API base URL
     */
    getBaseUrl() {
        return AppConfig.getApiUrl();
    },

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const token = StorageUtil.getToken();
        const url = `${this.getBaseUrl()}${endpoint}`;

        if (AppConfig.debug.enabled) {
            console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);
            console.log(`🔑 Token: ${token ? 'Present' : 'Missing'}`);
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (AppConfig.debug.enabled) {
                console.log(`📥 API Response: ${response.status} ${endpoint}`);
            }

            // Parse JSON response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                return { success: false, message: 'Invalid response format' };
            }

            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed:', data.message);
                UIUtil.showToast(data.message || 'Session expired. Please login again.', 'error');
                
                // Clear auth and redirect to login
                StorageUtil.clearAuth();
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
                
                return null;
            }

            // Handle other errors
            if (!response.ok) {
                console.error(`API Error ${response.status}:`, data.message);
                if (data.message) {
                    UIUtil.showToast(data.message, 'error');
                }
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            UIUtil.showToast('Terjadi kesalahan saat menghubungi server', 'error');
            return { success: false, message: error.message };
        }
    },

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    },

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },

    /**
     * Upload file
     */
    async upload(endpoint, formData) {
        const token = StorageUtil.getToken();
        const url = `${this.getBaseUrl()}${endpoint}`;

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData // Don't set Content-Type for FormData
            });

            const data = await response.json();

            if (!response.ok) {
                UIUtil.showToast(data.message || 'Upload failed', 'error');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            UIUtil.showToast('Terjadi kesalahan saat upload file', 'error');
            return { success: false, message: error.message };
        }
    }
};

// Export
window.APIService = APIService;
