const config = {
  development: {
    apiUrl: 'http://localhost:8000',
    environment: 'development'
  },
  production: {
    apiUrl: 'https://hipaasummarizerbackend.up.railway.app',
    environment: 'production'
  }
};

const env = process.env.NODE_ENV || 'development';
console.log(`Running in ${env} environment`);

export const getConfig = () => {
  return config[env] || config.development;
};

export const getApiUrl = "https://hipaa-summarizer-backend.onrender.com/";
// 
// () => {
//   return process.env.NEXT_PUBLIC_API_URL || getConfig().apiUrl;
// }; 