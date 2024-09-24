import React, { useState, useEffect } from 'react';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import StravaWidget from './widgets/StravaWidget';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);

interface Module {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  visualizationType: string;
  metric: string;
  timeScope: string;
  dataFrequency: string;
  goalMetric?: number;
  goalDescription?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  customStartDate?: string;
  customEndDate?: string;
}

const timeScopes = [
  { value: 'day', label: 'Day (Current day so far)' },
  { value: 'week', label: 'Week-to-date' },
  { value: 'month', label: 'Month-to-date' },
  { value: 'year', label: 'Year-to-date' },
  { value: 'custom', label: 'Custom Date Range' },
];

const stravaMetrics = [
  { value: 'total_distance', label: 'Total Distance' },
  { value: 'moving_time', label: 'Total Time' },
  { value: 'average_speed', label: 'Average Speed' },
  { value: 'total_elevation_gain', label: 'Total Elevation Gain' },
];

const dataSources = [{ value: 'Strava', label: 'Strava', metrics: stravaMetrics }];

const Dashboard: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [newModule, setNewModule] = useState<Partial<Module>>({});
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const navigate = useNavigate();

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchModules = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().modules) {
          setModules(docSnap.data().modules);
        }
      }
    };
    fetchModules();
  }, [auth.currentUser, db]);

  const saveModules = async (newModules: Module[]) => {
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, { modules: newModules }, { merge: true });
    }
  };

  const isModuleValid = (module: Partial<Module>) => {
    return (
      module.title &&
      module.visualizationType &&
      module.dataSource &&
      module.metric &&
      module.timeScope &&
      (module.visualizationType === 'numeric' || module.dataFrequency)
    );
  };

  const addModule = async () => {
    if (!isModuleValid(newModule)) {
      alert('Please fill in all required fields');
      return;
    }

    const module: Module = {
      ...newModule,
      id: Date.now().toString(),
      type: newModule.type || '',
      title: newModule.title || '',
      dataSource: newModule.dataSource || '',
      visualizationType: newModule.visualizationType || '',
      metric: newModule.metric || '',
      timeScope: newModule.timeScope || '',
      dataFrequency: newModule.dataFrequency || '',
      x: 0,
      y: Infinity,
      w: 3,
      h: 2,
    };
    const updatedModules = [...modules, module];
    setModules(updatedModules);
    await saveModules(updatedModules);
    setIsAddModuleOpen(false);
    setNewModule({});
  };

  const deleteModule = async () => {
    if (editingModule) {
      const updatedModules = modules.filter((module) => module.id !== editingModule.id);
      setModules(updatedModules);
      await saveModules(updatedModules);
      setIsEditModuleOpen(false);
      setEditingModule(null);
    }
  };

  type Layout = import('react-grid-layout').Layout[];

  const onLayoutChange = async (layout: Layout) => {
    console.log('Layout changed:', layout);
    const updatedModules = modules.map((module) => {
      const layoutItem = layout.find((item) => item.i === module.id);
      if (layoutItem) {
        console.log('Updating module:', module.id, {
          oldSize: { w: module.w, h: module.h },
          newSize: { w: layoutItem.w, h: layoutItem.h },
        });
        return {
          ...module,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return module;
    });
    console.log('Updated modules:', updatedModules);
    setModules(updatedModules);
    await saveModules(updatedModules);
  };

  const editModule = (module: Module) => {
    setEditingModule({ ...module });
    setIsEditModuleOpen(true);
  };

  const updateModule = async () => {
    if (!editingModule || !isModuleValid(editingModule)) {
      alert('Please fill in all required fields');
      return;
    }
    const updatedModules = modules.map((m) => (m.id === editingModule.id ? editingModule : m));
    setModules(updatedModules);
    await saveModules(updatedModules);
    setIsEditModuleOpen(false);
    setEditingModule(null);
  };

  const onResizeStart = (
    layout: Layout,
    oldItem: Layout[0],
    newItem: Layout[0],
    placeholder: Layout[0],
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    document.body.classList.add('is-resizing');
  };

  const onResizeStop = (
    layout: Layout,
    oldItem: Layout[0],
    newItem: Layout[0],
    placeholder: Layout[0],
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    console.log('Resize stopped:', { oldItem, newItem, placeholder });
    document.body.classList.remove('is-resizing');
    onLayoutChange(layout);
  };

  const onDragStart = (
    layout: Layout,
    oldItem: Layout[0],
    newItem: Layout[0],
    placeholder: Layout[0],
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    document.body.classList.add('is-dragging');
  };

  const onDragStop = (
    layout: Layout,
    oldItem: Layout[0],
    newItem: Layout[0],
    placeholder: Layout[0],
    e: MouseEvent,
    element: HTMLElement,
  ) => {
    document.body.classList.remove('is-dragging');
    onLayoutChange(layout);
  };

  const renderWidget = (widget: Module) => {
    return (
      <div key={widget.id} className="h-full w-full module-inner-content">
        <Card className="h-full w-full module-content shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center px-2 py-1">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 hover:bg-gray-100"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editModule(widget);
              }}
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent className="card-content p-2">
            {widget.dataSource === 'Strava' && (
              <StravaWidget
                metric={widget.metric}
                timeScope={widget.timeScope}
                customStartDate={widget.customStartDate}
                customEndDate={widget.customEndDate}
                dataFrequency={widget.dataFrequency}
                goalMetric={widget.goalMetric}
                goalDescription={widget.goalDescription}
                visualizationType={widget.visualizationType as 'line' | 'bar' | 'numeric' | 'calendar'}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Button onClick={() => setIsAddModuleOpen(true)}>+ Add Module</Button>
        <Button onClick={() => navigate('/settings')}>Settings</Button>
      </div>
      <ResponsiveGridLayoutWithWidth
        className="layout"
        layouts={{ lg: modules.map((m) => ({ ...m, i: m.id })) }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={onLayoutChange}
        onResizeStop={onResizeStop}
        onDragStop={onDragStop}
        isResizable={true}
        isDraggable={true}
        compactType={null}
        preventCollision={true}
        margin={[20, 20]}
        containerPadding={[20, 20]}
      >
        {modules.map((module) => (
          <div key={module.id} data-grid={{ x: module.x, y: module.y, w: module.w, h: module.h }}>
            {renderWidget(module)}
          </div>
        ))}
      </ResponsiveGridLayoutWithWidth>
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>Configure your new module.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newModule.title || ''}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="visualizationType">Visualization Type</Label>
              <Select
                onValueChange={(value) => {
                  setNewModule({ ...newModule, visualizationType: value });
                  // If 'calendar' is selected, set dataFrequency to 'daily' and disable it
                  if (value === 'calendar') {
                    setNewModule({ ...newModule, dataFrequency: 'daily' });
                  }
                }}
                value={newModule.visualizationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visualization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="calendar">Git Calendar Frequency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dataSource">Data Source</Label>
              <Select
                onValueChange={(value) => {
                  setNewModule({ ...newModule, dataSource: value, metric: undefined });
                }}
                value={newModule.dataSource}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newModule.dataSource && (
              <div>
                <Label htmlFor="metric">Metric</Label>
                <Select
                  onValueChange={(value) => setNewModule({ ...newModule, metric: value })}
                  value={newModule.metric}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources
                      .find((source) => source.value === newModule.dataSource)
                      ?.metrics.map((metric) => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="timeScope">Time Scope</Label>
              <Select
                onValueChange={(value) => setNewModule({ ...newModule, timeScope: value })}
                value={newModule.timeScope}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time scope" />
                </SelectTrigger>
                <SelectContent>
                  {timeScopes.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newModule.timeScope === 'custom' && (
              <>
                <div>
                  <Label htmlFor="customStartDate">Start Date</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={newModule.customStartDate || ''}
                    onChange={(e) => setNewModule({ ...newModule, customStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customEndDate">End Date</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={newModule.customEndDate || ''}
                    onChange={(e) => setNewModule({ ...newModule, customEndDate: e.target.value })}
                  />
                </div>
              </>
            )}
            {newModule.visualizationType !== 'numeric' && (
              <div>
                <Label htmlFor="dataFrequency">Data Frequency</Label>
                <Select
                  onValueChange={(value) => setNewModule({ ...newModule, dataFrequency: value })}
                  value={newModule.dataFrequency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {newModule.visualizationType === 'numeric' && (
              <>
                <div>
                  <Label htmlFor="goalMetric">Goal Metric</Label>
                  <Input
                    id="goalMetric"
                    type="number"
                    value={newModule.goalMetric || ''}
                    onChange={(e) => setNewModule({ ...newModule, goalMetric: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="goalDescription">Goal Description</Label>
                  <Input
                    id="goalDescription"
                    value={newModule.goalDescription || ''}
                    onChange={(e) => setNewModule({ ...newModule, goalDescription: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <Button onClick={addModule} disabled={!isModuleValid(newModule)}>
            Add Module
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editVisualizationType">Visualization Type</Label>
                <Select
                  onValueChange={(value) => {
                    setEditingModule({ ...editingModule, visualizationType: value });
                    // If 'calendar' is selected, set dataFrequency to 'daily' and disable it
                    if (value === 'calendar') {
                      setEditingModule({ ...editingModule, dataFrequency: 'daily' });
                    }
                  }}
                  value={editingModule.visualizationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visualization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="numeric">Numeric</SelectItem>
                    <SelectItem value="calendar">Git Calendar Frequency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDataSource">Data Source</Label>
                <Select
                  onValueChange={(value) => setEditingModule({ ...editingModule, dataSource: value })}
                  value={editingModule.dataSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strava">Strava</SelectItem>
                    {/* Add more data sources here */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editMetric">Metric</Label>
                <Select
                  onValueChange={(value) => setEditingModule({ ...editingModule, metric: value })}
                  value={editingModule.metric}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {stravaMetrics.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editTimeScope">Time Scope</Label>
                <Select
                  onValueChange={(value) => {
                    setEditingModule({ ...editingModule, timeScope: value });
                    if (value !== 'custom') {
                      setEditingModule({
                        ...editingModule,
                        timeScope: value,
                        customStartDate: undefined,
                        customEndDate: undefined,
                      });
                    }
                  }}
                  value={editingModule.timeScope}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeScopes.map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        {scope.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingModule.timeScope === 'custom' && (
                <>
                  <div>
                    <Label htmlFor="customStartDate">Start Date</Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={editingModule.customStartDate || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, customStartDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customEndDate">End Date</Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={editingModule.customEndDate || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, customEndDate: e.target.value })}
                    />
                  </div>
                </>
              )}
              {editingModule.visualizationType !== 'numeric' && (
                <div>
                  <Label htmlFor="editDataFrequency">Data Frequency</Label>
                  <Select
                    onValueChange={(value) => setEditingModule({ ...editingModule, dataFrequency: value })}
                    value={editingModule.dataFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingModule.visualizationType === 'numeric' && (
                <>
                  <div>
                    <Label htmlFor="editGoalMetric">Goal Metric</Label>
                    <Input
                      id="editGoalMetric"
                      type="number"
                      value={editingModule.goalMetric || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, goalMetric: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGoalDescription">Goal Description</Label>
                    <Input
                      id="editGoalDescription"
                      value={editingModule.goalDescription || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, goalDescription: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex justify-between mt-4">
            <Button onClick={deleteModule} variant="destructive">
              Delete Module
            </Button>
            <Button onClick={updateModule} disabled={!editingModule || !isModuleValid(editingModule)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
