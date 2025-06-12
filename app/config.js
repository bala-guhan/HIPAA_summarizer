const config = {
  development: {
    apiUrl: process.env.NEXT_PUBLIC_API_ROOT || 'http://localhost:8000',
    environment: 'development'
  },
  production: {
    apiUrl: process.env.NEXT_PUBLIC_API_ROOT || 'https://hipaasummarizerbackend.up.railway.app',
    environment: 'production'
  }
};

const env = process.env.NODE_ENV || 'development';
console.log(`Running in ${env} environment`);

export const getConfig = () => {
  return config[env] || config.development;
};

// Export as a constant function to ensure it's always callable
export const getApiUrl = function() {
  const apiRoot = process.env.NEXT_PUBLIC_API_ROOT;
  if (apiRoot) {
    return apiRoot.endsWith('/') ? apiRoot.slice(0, -1) : apiRoot;
  }
  return getConfig().apiUrl;
};

// 
// () => {
//   return process.env.NEXT_PUBLIC_API_URL || getConfig().apiUrl;
// }; 