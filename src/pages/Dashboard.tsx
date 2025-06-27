import React, { useEffect, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Typography, Alert, Space, Button, Empty, Spin } from "antd";
import {
  PhoneOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TrophyOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { data: identity } = useGetIdentity<any>();
  const navigate = useNavigate();
  const isAdmin = identity?.role === 'admin';
  const [loading, setLoading] = useState(true);

  // Fetch real data
  const { data: productsData, isLoading: productsLoading } = useList({
    resource: "products",
    pagination: { pageSize: 1000 },
  });

  const { data: ordersData, isLoading: ordersLoading } = useList({
    resource: "orders",
    pagination: { pageSize: 1000 },
  });

  const { data: customersData, isLoading: customersLoading } = useList({
    resource: "customers",
    pagination: { pageSize: 1000 },
  });

  const { data: callsData, isLoading: callsLoading } = useList({
    resource: "calls",
    pagination: { pageSize: 1000 },
    filters: !isAdmin && identity?.id ? [
      { field: 'employee_id', operator: 'eq' as const, value: identity.id }
    ] : [],
  });

  useEffect(() => {
    // Set loading to false when all data is loaded
    if (!productsLoading && !ordersLoading && !customersLoading && !callsLoading) {
      setLoading(false);
    }
  }, [productsLoading, ordersLoading, customersLoading, callsLoading]);

  // Calculate real metrics
  const products = productsData?.data || [];
  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];
  const calls = callsData?.data || [];

  // Admin metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  // Employee metrics
  const todaysCalls = calls.filter(call => {
    const callDate = new Date(call.created_at);
    const today = new Date();
    return callDate.toDateString() === today.toDateString();
  }).length;

  const monthSales = calls.filter(call => {
    const callDate = new Date(call.created_at);
    const now = new Date();
    return callDate.getMonth() === now.getMonth() && 
           callDate.getFullYear() === now.getFullYear() &&
           call.outcome === 'sale';
  }).length;

  // Welcome message for first-time users
  const isFirstTime = totalProducts === 0 && totalOrders === 0 && totalCustomers === 0;

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
        <Text style={{ display: "block", marginTop: 16 }}>Loading dashboard data...</Text>
      </div>
    );
  }

  if (isFirstTime && isAdmin) {
    return (
      <div style={{ padding: "24px" }}>
        <Row justify="center">
          <Col xs={24} lg={16}>
            <Card>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <RocketOutlined style={{ fontSize: 64, color: "#00bcd4", marginBottom: 24 }} />
                <Title level={2}>Welcome to La Mattress System!</Title>
                <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
                  Let's get your business up and running. Follow these steps to get started:
                </Paragraph>
                
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable 
                      onClick={() => navigate('/integration')}
                      style={{ cursor: 'pointer', height: '100%' }}
                    >
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        <div style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          background: '#e3f2fd', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ShoppingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        </div>
                        <Title level={4}>1. Connect Shopify</Title>
                        <Text>Configure your Shopify integration to sync products and orders</Text>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable 
                      onClick={() => navigate('/employees')}
                      style={{ cursor: 'pointer', height: '100%' }}
                    >
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        <div style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          background: '#f3e5f5', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TeamOutlined style={{ fontSize: 24, color: '#9c27b0' }} />
                        </div>
                        <Title level={4}>2. Add Employees</Title>
                        <Text>Create employee accounts for your sales team</Text>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable 
                      onClick={() => navigate('/products')}
                      style={{ cursor: 'pointer', height: '100%' }}
                    >
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        <div style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          background: '#e8f5e9', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ShoppingCartOutlined style={{ fontSize: 24, color: '#4caf50' }} />
                        </div>
                        <Title level={4}>3. Import Products</Title>
                        <Text>Sync your products from Shopify or add them manually</Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <Alert
                  message="Need Help?"
                  description="Check out our documentation or contact support for assistance getting started."
                  type="info"
                  showIcon
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Regular dashboard for users with data
  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
      </Title>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {isAdmin ? (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Total Revenue"
                  value={totalRevenue}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Total Orders"
                  value={totalOrders}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Total Customers"
                  value={totalCustomers}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Active Products"
                  value={activeProducts}
                  suffix={`/ ${totalProducts}`}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="My Calls Today"
                  value={todaysCalls}
                  prefix={<PhoneOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="My Sales This Month"
                  value={monthSales}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Total Calls"
                  value={calls.length}
                  prefix={<PhoneOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Success Rate"
                  value={calls.length > 0 ? ((monthSales / calls.length) * 100).toFixed(1) : 0}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Charts Section */}
      {(orders.length > 0 || calls.length > 0) ? (
        <Row gutter={[16, 16]}>
          {isAdmin && orders.length > 0 && (
            <Col xs={24} lg={12}>
              <Card title="Recent Orders Trend">
                <Empty 
                  description="Order analytics will appear here once you have more data"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            </Col>
          )}
          
          {!isAdmin && calls.length > 0 && (
            <Col xs={24} lg={12}>
              <Card title="My Call Performance">
                <Empty 
                  description="Your call analytics will appear here once you have more data"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            </Col>
          )}

          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                {isAdmin ? (
                  <>
                    <Button type="primary" block onClick={() => navigate('/products')}>
                      Manage Products
                    </Button>
                    <Button block onClick={() => navigate('/orders')}>
                      View Orders
                    </Button>
                    <Button block onClick={() => navigate('/employees')}>
                      Manage Employees
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="primary" block onClick={() => navigate('/call-clients')}>
                      Make Calls
                    </Button>
                    <Button block onClick={() => navigate('/calls')}>
                      View My Calls
                    </Button>
                    <Button block onClick={() => navigate('/customers')}>
                      View Customers
                    </Button>
                  </>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text>No data to display yet</Text>
                <Text type="secondary">
                  {isAdmin 
                    ? "Start by syncing products from Shopify or creating your first order"
                    : "Start making calls to see your performance metrics"}
                </Text>
              </Space>
            }
          />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;