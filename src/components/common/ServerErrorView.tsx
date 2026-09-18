import React from 'react';
import { MaintenanceView } from './MaintenanceView';

interface ServerErrorViewProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ServerErrorView: React.FC<ServerErrorViewProps> = ({ error, resetError }) => {
  return <MaintenanceView error={error} resetError={resetError} isCrash={true} />;
};


