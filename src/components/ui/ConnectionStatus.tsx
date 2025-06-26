
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useFirebaseData } from '@/context/FirebaseDataContext';

const ConnectionStatus: React.FC = () => {
  const { isConnected, isDataSynced } = useFirebaseData();

  if (isDataSynced && isConnected) {
    return (
      <Badge variant="secondary" className="text-green-600 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Synced
      </Badge>
    );
  }

  if (!isConnected) {
    return (
      <Badge variant="destructive" className="text-red-600 border-red-200">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-orange-600 border-orange-200">
      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
      Syncing...
    </Badge>
  );
};

export default ConnectionStatus;
