import React from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import BackendMonitor from '../components/BackendMonitor';
import ConnectionStatus from '../components/ConnectionStatus';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export const TestConnectionPage: React.FC = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2}>Backend Connection Test</Title>
          <Paragraph>
            This page provides comprehensive monitoring and testing of the backend connection.
            Use this to diagnose connection issues and monitor API health.
          </Paragraph>
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <ConnectionStatus showDetails />
            </Col>
            
            <Col span={24}>
              <BackendMonitor />
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default TestConnectionPage;