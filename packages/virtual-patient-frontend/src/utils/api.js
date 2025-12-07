// API configuration utility
const getApiUrl = (endpoint) => {
  // In development, Vite proxy handles /api routes
  // In production, we need the full URL
  if (import.meta.env.PROD) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    console.log('🔧 DEBUG - Environment:', {
      PROD: import.meta.env.PROD,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      baseUrl: baseUrl,
      endpoint: endpoint,
      finalUrl: `${baseUrl}${endpoint}`
    });
    return `${baseUrl}${endpoint}`;
  }
  // Development - use relative URL (handled by Vite proxy)
  console.log('🔧 DEBUG - Development mode, using proxy:', endpoint);
  return endpoint;
};

export { getApiUrl }; 