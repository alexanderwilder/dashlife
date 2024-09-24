import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const StravaActivities: React.FC = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('/strava/activities');
        setActivities(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Strava activities:', err);
        setError('Failed to fetch Strava activities. Please try again later.');
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) return <div>Loading Strava activities...</div>;
  if (error) return <div>{error}</div>;
  if (activities.length === 0) return <div>No Strava activities found.</div>;

  // Process data for chart
  const chartData = activities.map((activity: any) => ({
    name: new Date(activity.start_date).toLocaleDateString(),
    distance: activity.distance / 1000, // Convert to km
    movingTime: activity.moving_time / 60, // Convert to minutes
  }));

  return (
    <div>
      <h2>Strava Activities</h2>
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#8884d8" name="Distance (km)" />
        <Line yAxisId="right" type="monotone" dataKey="movingTime" stroke="#82ca9d" name="Moving Time (min)" />
      </LineChart>
    </div>
  );
};

export default StravaActivities;
