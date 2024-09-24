import { STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI } from '../config';

const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=read,activity:read_all`;