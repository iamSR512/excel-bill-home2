// API base URL configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://excel-bill-home2-3.onrender.com' 
  : 'http://localhost:5000';

// Application configuration
export const APP_CONFIG = {
  appName: 'Excel Bill Management System',
  version: '1.0.0',
  supportEmail: 'support@excelbill.com'
};

// Export default for easier imports
export default {
  API_BASE_URL,
  APP_CONFIG
};