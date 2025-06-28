import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Button, Space, notification } from 'antd';
import { WifiOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { checkApiHealth, API_CONFIG } from '../services/apiConfig';

interface ConnectionStatusProps {
  showDetails?: boolean;
  onStatusChange?: (isConnected: boolean) => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false,
  onStatusChange
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const healthy = await checkApiHealth();
      setIsConnected(healthy);
      setLastChecked(new Date());
      onStatusChange?.(healthy);
      
      if (!healthy) {
        setError('Backend health check failed');
      }
    } catch (error: any) {
      setIsConnected(false);
      setError(error.message || 'Connection failed');
      onStatusChange?.(false);
      console.error('Connection check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Periodic health checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show notification on connection loss
    if (isConnected === false && error) {
      notification.warning({
        message: 'Connection Issue',
        description: `Backend connection lost: ${error}`,
        placement: 'topRight',
        duration: 5,
        icon: <WarningOutlined style={{ color: '#ff7f00' }} />,
      });
    }
  }, [isConnected, error]);

  const getStatusColor = () => {
    if (isConnected === null) return 'default';
    return isConnected ? 'success' : 'error';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const getTooltipContent = () => {
    const baseInfo = `API: ${API_CONFIG.BASE_URL}`;
    const statusInfo = `Status: ${getStatusText()}`;
    const lastCheckedInfo = lastChecked 
      ? `Last checked: ${lastChecked.toLocaleTimeString()}`
      : 'Not checked yet';
    const errorInfo = error ? `Error: ${error}` : '';
    
    return (
      <div>
        <div>{baseInfo}</div>
        <div>{statusInfo}</div>
        <div>{lastCheckedInfo}</div>
        {errorInfo && <div style={{ color: '#ff4d4f' }}>{errorInfo}</div>}
      </div>
    );
  };

  if (showDetails) {
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <Badge 
            status={getStatusColor()} 
            text={`Backend: ${getStatusText()}`}
          />
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined spin={isChecking} />}
            onClick={checkConnection}
            disabled={isChecking}
          >
            Refresh
          </Button>
        </Space>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>API: {API_CONFIG.BASE_URL}</div>
          {lastChecked && (
            <div>Last checked: {lastChecked.toLocaleString()}</div>
          )}
          {error && (
            <div style={{ color: '#ff4d4f' }}>Error: {error}</div>
          )}
        </div>
      </Space>
    );
  }

  return (
    <Tooltip title={getTooltipContent()}>
      <Badge 
        status={getStatusColor()} 
        text={
          <span>
            <WifiOutlined /> {getStatusText()}
          </span>
        }
      />
    </Tooltip>
  );
};

export default ConnectionStatus;