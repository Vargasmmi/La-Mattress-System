import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Button, Space, Timeline, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { checkApiHealth, API_CONFIG } from '../services/apiConfig';

interface HealthCheck {
  timestamp: Date;
  success: boolean;
  responseTime?: number;
  error?: string;
}

export const BackendMonitor: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [healthHistory, setHealthHistory] = useState<HealthCheck[]>([]);
  const [averageResponseTime, setAverageResponseTime] = useState<number>(0);
  const [uptime, setUptime] = useState<number>(0);

  const performHealthCheck = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      const healthy = await checkApiHealth();
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        timestamp: new Date(),
        success: healthy,
        responseTime,
      };
      
      setIsConnected(healthy);
      setHealthHistory(prev => [healthCheck, ...prev.slice(0, 9)]); // Keep last 10 checks
      
      // Calculate average response time
      const successfulChecks = healthHistory.filter(h => h.success && h.responseTime);
      if (successfulChecks.length > 0) {
        const avgTime = successfulChecks.reduce((sum, check) => sum + (check.responseTime || 0), 0) / successfulChecks.length;
        setAverageResponseTime(Math.round(avgTime));
      }
      
    } catch (error: any) {
      const healthCheck: HealthCheck = {
        timestamp: new Date(),
        success: false,
        error: error.message,
      };
      
      setIsConnected(false);
      setHealthHistory(prev => [healthCheck, ...prev.slice(0, 9)]);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    performHealthCheck();
    
    // Periodic checks every 30 seconds
    const interval = setInterval(performHealthCheck, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate uptime percentage
    if (healthHistory.length > 0) {
      const successfulChecks = healthHistory.filter(h => h.success).length;
      const uptimePercent = (successfulChecks / healthHistory.length) * 100;
      setUptime(Math.round(uptimePercent));
    }
  }, [healthHistory]);

  const getStatusAlert = () => {
    if (isConnected === null) {
      return (
        <Alert
          message="Backend Status Unknown"
          description="Checking backend connection..."
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
        />
      );
    }
    
    if (isConnected) {
      return (
        <Alert
          message="Backend Connected"
          description={`Successfully connected to ${API_CONFIG.BASE_URL}`}
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      );
    }
    
    const lastCheck = healthHistory[0];
    return (
      <Alert
        message="Backend Connection Failed"
        description={
          <div>
            <div>Unable to connect to {API_CONFIG.BASE_URL}</div>
            {lastCheck?.error && <div>Error: {lastCheck.error}</div>}
            <div style={{ marginTop: 8 }}>
              <Button 
                type="primary" 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={performHealthCheck}
                loading={isChecking}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        }
        type="error"
        showIcon
        icon={<CloseCircleOutlined />}
      />
    );
  };

  return (
    <Card title="Backend Monitor" extra={
      <Button 
        icon={<ReloadOutlined spin={isChecking} />}
        onClick={performHealthCheck}
        disabled={isChecking}
      >
        Refresh
      </Button>
    }>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {getStatusAlert()}
        
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Connection Status"
              value={isConnected ? 'Connected' : 'Disconnected'}
              prefix={isConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              valueStyle={{ 
                color: isConnected ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Average Response Time"
              value={averageResponseTime}
              suffix="ms"
              prefix={<ApiOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Uptime"
              value={uptime}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: uptime >= 90 ? '#3f8600' : uptime >= 70 ? '#faad14' : '#cf1322' 
              }}
            />
          </Col>
        </Row>

        {healthHistory.length > 0 && (
          <Card size="small" title="Recent Health Checks">
            <Timeline
              items={healthHistory.map((check, index) => ({
                color: check.success ? 'green' : 'red',
                children: (
                  <div>
                    <Space>
                      <span>{check.timestamp.toLocaleTimeString()}</span>
                      <Tag color={check.success ? 'success' : 'error'}>
                        {check.success ? 'SUCCESS' : 'FAILED'}
                      </Tag>
                      {check.responseTime && (
                        <Tag>{check.responseTime}ms</Tag>
                      )}
                    </Space>
                    {check.error && (
                      <div style={{ color: '#cf1322', fontSize: '12px' }}>
                        {check.error}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        )}

        <Card size="small" title="Configuration">
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <strong>API Base URL:</strong>
            </Col>
            <Col span={12}>
              {API_CONFIG.BASE_URL}
            </Col>
            <Col span={12}>
              <strong>Environment:</strong>
            </Col>
            <Col span={12}>
              {import.meta.env.DEV ? 'Development' : 'Production'}
            </Col>
            <Col span={12}>
              <strong>Timeout:</strong>
            </Col>
            <Col span={12}>
              {API_CONFIG.TIMEOUT}ms
            </Col>
            <Col span={12}>
              <strong>Retry Attempts:</strong>
            </Col>
            <Col span={12}>
              {API_CONFIG.RETRY_ATTEMPTS}
            </Col>
          </Row>
        </Card>
      </Space>
    </Card>
  );
};

export default BackendMonitor;