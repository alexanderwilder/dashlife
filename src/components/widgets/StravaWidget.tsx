import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

interface StravaWidgetProps {
  metric: string;
  timeScope: string;
  customStartDate?: string;
  customEndDate?: string;
  dataFrequency: string;
  goalMetric?: number;
  goalDescription?: string;
  visualizationType: 'line' | 'bar' | 'numeric' | 'calendar';
}

interface StravaData {
  date: string;
  value: number;
}

interface HeatmapValue {
  date: string;
  count: number;
}

interface ReactCalendarHeatmapProps {
  values: HeatmapValue[];
  startDate: Date;
  endDate: Date;
  showWeekdayLabels?: boolean;
  classForValue?: (value: HeatmapValue | null) => string;
  // Add other props as needed
}

const StravaWidget: React.FC<StravaWidgetProps> = ({
  metric,
  timeScope,
  customStartDate,
  customEndDate,
  dataFrequency,
  goalMetric,
  goalDescription,
  visualizationType,
}) => {
  const [data, setData] = useState<StravaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('StravaWidget props:', {
      metric,
      timeScope,
      dataFrequency,
      goalMetric,
      goalDescription,
      visualizationType,
    });
    const fetchStravaData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        console.log('Fetching Strava data with params:', { metric, timeScope, dataFrequency });
        const params: any = { metric, timeScope, dataFrequency };
        if (timeScope === 'custom') {
          params.customStartDate = customStartDate;
          params.customEndDate = customEndDate;
        }

        const response = await axios.get('/api/strava/data', {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Received Strava data:', response.data);
        if (response.data.value.length === 0) {
          console.warn('No Strava data received');
        } else {
          console.log('First data point:', response.data.value[0]);
          console.log('Last data point:', response.data.value[response.data.value.length - 1]);
        }
        setData(response.data.value);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Strava data:', err);
        setError('Failed to fetch Strava data');
        setLoading(false);
      }
    };

    if (
      metric &&
      timeScope &&
      (visualizationType === 'numeric' || dataFrequency) &&
      (timeScope !== 'custom' || (customStartDate && customEndDate))
    ) {
      fetchStravaData();
    } else {
      console.warn('Missing required props for Strava widget:', {
        metric,
        timeScope,
        dataFrequency,
        customStartDate,
        customEndDate,
      });
    }
  }, [
    metric,
    timeScope,
    customStartDate,
    customEndDate,
    dataFrequency,
    goalMetric,
    goalDescription,
    visualizationType,
  ]);

  const renderVisualization = () => {
    if (!data || data.length === 0) return null;

    const chartHeight = 180; // Slightly reduced height

    switch (visualizationType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'calendar':
        return (
          <CalendarHeatmap
            startDate={new Date(data[0].date)}
            endDate={new Date(data[data.length - 1].date)}
            values={data.map((item) => ({ date: item.date, count: item.value }))}
            showWeekdayLabels
            classForValue={(value: { date: string; count: number } | null) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              return `color-github-${Math.min(value.count, 4)}`;
            }}
          />
        );
      case 'numeric':
      default:
        const totalValue = data.reduce((sum, item) => sum + item.value, 0);
        return <p className="text-3xl font-bold text-center my-4">{totalValue.toFixed(2)}</p>;
    }
  };

  const renderContent = () => {
    if (loading) return <p className="text-center text-gray-500">Loading...</p>;
    if (error)
      return (
        <p className="text-center text-red-500">Failed to load data. Please try reconnecting your Strava account.</p>
      );
    if (data.length === 0)
      return <p className="text-center text-gray-500">No activity data found for the selected period.</p>;

    return (
      <div className="space-y-2">
        {renderVisualization()}
        {goalMetric && (
          <p className="text-xs text-gray-600 mt-2">
            Goal: {goalMetric} {goalDescription && `(${goalDescription})`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col p-2">
      <div className="font-semibold text-sm mb-2 text-gray-700">{`${metric} (${timeScope})`}</div>
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default StravaWidget;
