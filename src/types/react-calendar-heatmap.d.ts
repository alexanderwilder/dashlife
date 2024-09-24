declare module 'react-calendar-heatmap' {
  import * as React from 'react';

  export interface HeatmapValue {
    date: string;
    count: number;
  }

  export interface ReactCalendarHeatmapProps {
    values: HeatmapValue[];
    startDate: Date;
    endDate: Date;
    showWeekdayLabels?: boolean;
    classForValue?: (value: HeatmapValue | null) => string;
    // Add other props as needed
  }

  const ReactCalendarHeatmap: React.FC<ReactCalendarHeatmapProps>;
  export default ReactCalendarHeatmap;
}
