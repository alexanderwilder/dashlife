import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // Use proxy for API requests
  // ... other configurations ...
});

export default instance;