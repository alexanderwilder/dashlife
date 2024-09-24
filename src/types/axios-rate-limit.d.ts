declare module 'axios-rate-limit' {
  import { AxiosInstance } from 'axios';
  
  interface RateLimitedAxiosInstance extends AxiosInstance {
    getMaxRPS: () => number;
    setMaxRPS: (rps: number) => void;
    setRateLimitOptions: (options: {
      maxRequests: number;
      perMilliseconds: number;
    }) => void;
  }

  function rateLimit(
    axios: AxiosInstance,
    options?: {
      maxRequests?: number;
      perMilliseconds?: number;
    }
  ): RateLimitedAxiosInstance;

  export default rateLimit;
}