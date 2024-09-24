import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

const instance = axios.create({
  baseURL,
  // ... other configurations ...
});

export default instance;
