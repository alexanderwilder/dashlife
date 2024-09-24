import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import axios from '../api/axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';
import { Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { useParams } from 'react-router-dom';

const DataManagement: React.FC = () => {
  const auth = getAuth();
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [tempSelectedFields, setTempSelectedFields] = useState<string[]>([]);
  const [fieldFilter, setFieldFilter] = useState('');
  const [isFieldSelectionOpen, setIsFieldSelectionOpen] = useState(false);
  const [isAIFormulaOpen, setIsAIFormulaOpen] = useState(false);
  const [aiFormula, setAIFormula] = useState('');
  const [aiFormulaResult, setAIFormulaResult] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [totalObjects, setTotalObjects] = useState<number>(0);
  const [storedObjects, setStoredObjects] = useState<number>(0);
  const [isStoring, setIsStoring] = useState<boolean>(false);
  const [editingFormulaColumn, setEditingFormulaColumn] = useState<string | null>(null);
  const [dataSnippets, setDataSnippets] = useState<{ [key: string]: string }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { dataSourceId } = useParams<{ dataSourceId: string }>();

  const gridRef = useRef<AgGridReact<any>>(null);

  useEffect(() => {
    fetchAvailableFields();
  }, []);

  useEffect(() => {
    if (selectedFields.length > 0) {
      fetchData();
      fetchLastSyncTime();
    }
  }, [selectedFields]);

  const fetchAvailableFields = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get('/api/strava/available-fields', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fields = response.data.availableFields;
      setAvailableFields(fields);
      setSelectedFields(fields);
      setTempSelectedFields(fields);
      setDataSnippets(response.data.dataSnippets);
    } catch (err: any) {
      console.error('Error fetching available fields:', err);
      setError('Failed to fetch available fields.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !dataSourceId) return;

      const dataRef = collection(db, 'users', user.uid, 'dataSources', dataSourceId, 'data');
      const snapshot = await getDocs(dataRef);
      const data = snapshot.docs.map(doc => doc.data());

      setRowData(data);

      // Update column definitions based on fetched data
      setColumnDefs(
        Object.keys(data[0] || {}).map((field) => ({
          headerName: field,
          field: field,
          editable: true,
        }))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const onCellValueChanged = async (event: any) => {
    const { data, colDef, newValue } = event;
    const updatedData = { ...data, [colDef.field]: newValue };

    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post('/api/data-management/update', updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Data updated successfully');
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  const handleFieldSelection = (field: string) => {
    setTempSelectedFields((prevFields) =>
      prevFields.includes(field) ? prevFields.filter((f) => f !== field) : [...prevFields, field],
    );
  };

  const applyFieldSelection = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        '/api/strava/update-fields',
        { selectedFields: tempSelectedFields },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSelectedFields(tempSelectedFields);
      setIsFieldSelectionOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating selected fields:', error);
      setError('Failed to update selected fields.');
    }
  };

  const filteredFields = availableFields.filter((field) => field.toLowerCase().includes(fieldFilter.toLowerCase()));

  const handleAIFormulaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAIFormula(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const insertFieldName = (fieldName: string) => {
    const newFormula = aiFormula.slice(0, cursorPosition) + `@${fieldName}` + aiFormula.slice(cursorPosition);
    setAIFormula(newFormula);
    setCursorPosition(cursorPosition + fieldName.length + 1);
  };

  const applyAIFormula = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(
        '/api/data-management/apply-formula',
        { formula: aiFormula, columnName: editingFormulaColumn || 'New Column' },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update the grid with the new column
      const newColumnDefs = [...columnDefs];
      const existingColumnIndex = newColumnDefs.findIndex((col) => col.field === editingFormulaColumn);

      if (existingColumnIndex !== -1) {
        newColumnDefs[existingColumnIndex] = {
          ...newColumnDefs[existingColumnIndex],
          valueGetter: (params: any) => response.data.results[params.data.id],
        };
      } else {
        newColumnDefs.push({
          field: response.data.columnName,
          headerName: response.data.columnName,
          valueGetter: (params: any) => response.data.results[params.data.id],
        });
      }

      setColumnDefs(newColumnDefs);
      setIsAIFormulaOpen(false);
      setEditingFormulaColumn(null);
      setAIFormula('');
    } catch (err: any) {
      console.error('Error applying AI formula:', err);
      if (err.response && err.response.status === 400) {
        setError('OpenAI API key not set. Please set your API key in the Settings page.');
      } else {
        setError('Failed to apply AI formula.');
      }
    } finally {
      setLoading(false);
    }
  };

  const editFormulaColumn = (columnName: string) => {
    setEditingFormulaColumn(columnName);
    setIsAIFormulaOpen(true);
    // Fetch existing formula for the column if it exists
    // setAIFormula(existingFormula);
  };

  const fetchDataStorageInfo = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get('/api/data-management/storage-info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Storage info response:', response.data);

      // Only update state if we have non-zero values
      if (response.data.totalObjects > 0 || response.data.storedObjects > 0) {
        setTotalObjects(response.data.totalObjects);
        setStoredObjects(response.data.storedObjects);
        setIsStoring(response.data.isStoring);
      }
    } catch (err: any) {
      console.error('Error fetching data storage info:', err);
      setError('Failed to fetch data storage information.');
    }
  };

  useEffect(() => {
    fetchDataStorageInfo();
    const interval = setInterval(fetchDataStorageInfo, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const migrateStravaData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        '/api/data-management/migrate-strava-data',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchDataStorageInfo(); // Refresh the storage info after migration
      await fetchData(); // Refresh the grid data after migration
    } catch (err: any) {
      console.error('Error migrating Strava data:', err);
      setError('Failed to migrate Strava data.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllData = async () => {
    if (!window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      return;
    }
    try {
      setIsDeleting(true);
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }
      const idToken = await user.getIdToken();
      await axios.delete('/api/data-management/delete-all', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      // Clear data from grid
      setRowData([]);
      setColumnDefs([]);
      toast.success('All data deleted successfully.');
    } catch (error) {
      console.error('Error deleting all data:', error);
      setError('Failed to delete all data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchLastSyncTime = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get('/api/strava/check-connection', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.lastSyncTime) {
        setLastSyncTime(new Date(response.data.lastSyncTime));
      }
    } catch (error) {
      console.error('Error fetching last sync time:', error);
    }
  };

  const retryDataFetch = () => {
    // Re-fetch the data
    fetchData();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Management</h1>
        <Link to="/settings" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Settings
        </Link>
      </div>

      {lastSyncTime && (
        <p className="text-sm text-gray-500 mb-4">
          Data last synced on: {lastSyncTime.toLocaleString()}
        </p>
      )}

      {loading && (
        <div className="flex items-center mb-4 text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fetching data from Firestore...
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium">
            Data Storage: {storedObjects}/{totalObjects} objects stored
          </p>
          <Progress value={(storedObjects / totalObjects) * 100} className="w-full" />
        </div>
        {isStoring && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>}
      </div>
      <div className="flex space-x-4 mb-4">
        <Dialog open={isFieldSelectionOpen} onOpenChange={setIsFieldSelectionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Select Data Fields</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Select Data Fields to Display</DialogTitle>
              <DialogDescription>Choose the fields you want to display in the data grid.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Filter fields..."
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="mb-4"
            />
            <div className="grid grid-cols-3 gap-4">
              {filteredFields.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={tempSelectedFields.includes(field)}
                    onCheckedChange={() => handleFieldSelection(field)}
                  />
                  <Label htmlFor={field} className="text-sm">
                    {field}
                  </Label>
                  {/* Data snippet */}
                  <span className="text-gray-500 text-sm">{dataSnippets[field]?.toString() || 'No data'}</span>
                </div>
              ))}
            </div>
            <Button onClick={applyFieldSelection} className="mt-4">
              Apply Selection
            </Button>
          </DialogContent>
        </Dialog>
        <Dialog open={isAIFormulaOpen} onOpenChange={setIsAIFormulaOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Add AI Formula</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingFormulaColumn ? `Edit Formula: ${editingFormulaColumn}` : 'Add AI Formula'}
              </DialogTitle>
              <DialogDescription>
                Enter an AI formula to process your data. Use @fieldName to reference data fields.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                ref={textareaRef}
                value={aiFormula}
                onChange={handleAIFormulaChange}
                placeholder="Enter your AI formula here..."
                className="w-full h-32"
              />
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableFields.map((field) => (
                  <Button
                    key={field}
                    variant="outline"
                    size="sm"
                    onClick={() => insertFieldName(field)}
                    className="text-left truncate"
                  >
                    {field}
                  </Button>
                ))}
              </div>
              <Button onClick={applyAIFormula} className="mt-4">
                Apply Formula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button onClick={migrateStravaData}>Migrate Strava Data</Button>
      </div>
      <div className="relative h-[600px]">
        <div className="ag-theme-alpine bg-white h-full w-full">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs.map((col) => ({
              ...col,
              headerComponent: (params: any) => (
                <div className="flex items-center justify-between w-full h-full px-2">
                  <span>{params.displayName}</span>
                  {col.valueGetter && (
                    <Button variant="ghost" size="sm" onClick={() => editFormulaColumn(col.field)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ),
            }))}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              flex: 1,
              minWidth: 100,
            }}
            onCellValueChanged={onCellValueChanged}
            onGridReady={(params) => {
              if (params.api) {
                const dateColumn = params.api.getColumnDef('start_date');
                if (dateColumn) {
                  params.api.applyColumnState({
                    state: [{ colId: 'start_date', sort: 'desc' }],
                  });
                }
                params.api.sizeColumnsToFit();
              } else {
                console.warn('Grid API is not available');
              }
            }}
            domLayout="normal"
            enableCellTextSelection={true}
            suppressCopyRowsToClipboard={true}
          />
        </div>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
      {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" onClick={deleteAllData} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete All Data'}
        </Button>
      </div>
    </div>
  );
};

export default DataManagement;
