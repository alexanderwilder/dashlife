import React from 'react';

interface ModularCardProps {
  title: string;
  visualizationType: string;
  dataSource?: string;
  timeScope?: string;
  dataFrequency?: string;
}

const ModularCard: React.FC<ModularCardProps> = ({
  title,
  visualizationType,
  dataSource,
  timeScope,
  dataFrequency,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p>Visualization: {visualizationType}</p>
      {dataSource && <p>Data Source: {dataSource}</p>}
      {timeScope && <p>Time Scope: {timeScope}</p>}
      {dataFrequency && <p>Data Frequency: {dataFrequency}</p>}
    </div>
  );
};

export default ModularCard;
