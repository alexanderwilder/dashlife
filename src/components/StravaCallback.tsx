import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { getAuth } from 'firebase/auth';

const StravaCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize the auth object
  const auth = getAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    const error = queryParams.get('error');

    if (error) {
      setErrorMessage('Failed to authorize with Strava.');
    } else if (code) {
      exchangeCodeForToken(code);
    } else {
      setErrorMessage('No code provided.');
    }
  }, [location]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();

      const response = await axios.post('/api/strava/token', { code }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      console.log('Strava token exchange successful:', response.data);

      // Redirect to settings or wherever appropriate
      navigate('/settings?justConnected=true');
    } catch (error: any) {
      console.error('Error exchanging authorization code for token:', error.response?.data || error.message);
      setErrorMessage('Failed to exchange authorization code for token.');
    }
  };

  return (
    <div>
      {errorMessage ? <p>{errorMessage}</p> : <p>Authorizing with Strava...</p>}
    </div>
  );
};

export default StravaCallback;
