import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import axios from '../api/axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { TooltipProvider } from './ui/tooltip';
import { useParams } from 'react-router-dom';

const Settings: React.FC = () => {
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaCollecting, setStravaCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStravaFields, setAvailableStravaFields] = useState<string[]>([]);
  const [selectedStravaFields, setSelectedStravaFields] = useState<string[]>([]);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isFieldSelectionOpen, setIsFieldSelectionOpen] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const [tempSelectedStravaFields, setTempSelectedStravaFields] = useState<string[]>([]);
  const [dataSnippets, setDataSnippets] = useState<{ [key: string]: any }>({});
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [fieldsToRemove, setFieldsToRemove] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isDisconnectWarningOpen, setIsDisconnectWarningOpen] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [fieldFilter, setFieldFilter] = useState('');
  const { dataSourceId } = useParams<{ dataSourceId?: string }>();

  useEffect(() => {
    checkStravaConnection();
    fetchOpenAIApiKey();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const justConnected = queryParams.get('justConnected');
    if (justConnected === 'true') {
      fetchAvailableStravaFields();
      setIsFieldSelectionOpen(true);
    }
  }, [location]);

  const checkStravaConnection = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const idToken = await user.getIdToken();
      const response = await axios.get('https://66adc58a-4277-466d-9316-764327f12d64-00-3s35booxl2x8t.riker.replit.dev:3000/api/strava/check-connection', { // Update URL
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setStravaConnected(response.data.isConnected);
      setStravaCollecting(response.data.isCollecting);
      if (response.data.isConnected) {
        setSelectedStravaFields(response.data.selectedFields || []);
        if (response.data.lastSyncTime) {
          setLastSyncTime(new Date(response.data.lastSyncTime));
        }
      }
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setError('Failed to check Strava connection');
    }
  };

  const fetchAvailableStravaFields = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }
      const idToken = await user.getIdToken();
      const response = await axios.get('/api/data-management/available-fields', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setAvailableStravaFields(response.data.availableFields);
    } catch (error) {
      console.error('Error fetching available Strava fields:', error);
      setError('Failed to fetch available Strava fields');
    }
  };

  const fetchOpenAIApiKey = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOpenaiApiKey(docSnap.data().openaiApiKey || '');
      }
    } catch (error) {
      console.error('Error fetching OpenAI API key:', error);
      setError('Failed to fetch OpenAI API key');
    }
  };

  const saveOpenAIKey = async () => {
    try {
      setIsSavingApiKey(true);
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { openaiApiKey }, { merge: true });
      toast.success('OpenAI API key saved successfully');
    } catch (error) {
      console.error('Error saving OpenAI API key:', error);
      setError('Failed to save OpenAI API key');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
    }
  };

  const disconnectStrava = async (deleteData: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        '/api/strava/disconnect',
        { deleteData },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStravaConnected(false);
      setStravaCollecting(false);
      setSelectedStravaFields([]);
      toast.success('Strava disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      toast.error('Failed to disconnect Strava');
    }
  };

  const handleEditDataConnection = () => {
    fetchAvailableStravaFields();
    setIsFieldSelectionOpen(true);
  };

  const handleStravaFieldChange = (field: string) => {
    setTempSelectedStravaFields((prevFields: string[]) =>
      prevFields.includes(field)
        ? prevFields.filter((f: string) => f !== field)
        : [...prevFields, field],
    );
  };

  return (
    <TooltipProvider>
      <div className="p-4">
        {/* ... other code ... */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">OpenAI API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="mb-4 pr-10"
              />
              <button
                type="button"
                onClick={toggleApiKeyVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKey ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
            <Button onClick={saveOpenAIKey} disabled={isSavingApiKey}>
              {isSavingApiKey ? 'Saving...' : 'Save API Key'}
            </Button>
          </CardContent>
        </Card>

        {!isSyncingData && stravaCollecting && (
          <div className="mt-4">
            <p className="text-sm text-gray-700">
              Your data has been synchronized. You can now manage and view your data.
            </p>
            <Link to="/data-management">
              <Button className="mt-2">Go to Data Management</Button>
            </Link>
          </div>
        )}

        <Button onClick={handleLogout} variant="destructive" className="w-full">
          Logout
        </Button>
      </div>
    </TooltipProvider>
  );
};

export default Settings;
