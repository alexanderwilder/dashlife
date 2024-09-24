import React from 'react';
import { Button } from '@/components/ui/button';

const StravaAuth: React.FC = () => {
  const handleStravaAuth = () => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    const scope = 'read,activity:read_all';

    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  return <Button onClick={handleStravaAuth}>Connect with Strava</Button>;
};

export default StravaAuth;
