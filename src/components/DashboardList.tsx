import React from 'react';
import { Link } from 'react-router-dom';

const DashboardList: React.FC = () => {
  return (
    <div className="dashboard-list p-4">
      <h2 className="text-2xl font-bold mb-4">Your Dashboards</h2>
      <ul>
        <li className="mb-2">
          <Link to="/dashboard/1" className="text-blue-500 hover:underline">
            Dashboard 1
          </Link>
        </li>
        <li className="mb-2">
          <Link to="/dashboard/2" className="text-blue-500 hover:underline">
            Dashboard 2
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default DashboardList;
