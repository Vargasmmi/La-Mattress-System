import React from "react";
import { Refine, Authenticated, CanAccess } from "@refinedev/core";
import { ThemedLayoutV2, notificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/react-router-v6";
import { createBrowserRouter, RouterProvider, Route, Routes, Navigate, useNavigate, Outlet, createRoutesFromElements } from "react-router-dom";
import { ConfigProvider, Button, Space, Card, Row, Col, Statistic, Typography, List, Tag, Alert, Table, App as AntdApp } from "antd";
import "@refinedev/antd/dist/reset.css";
import "./styles.css";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Import auth and data provider
import { authProvider, accessControlProvider, User } from "./authProvider";
import { dataProvider } from "./dataProvider";

// Import pages
import LoginPage from "./pages/LoginPage";
import EmployeesPage from "./pages/EmployeesPage";
import CallClientsPage from "./pages/CallClientsPage";
import CallsPage from "./pages/CallsPage";
import AssignedCallsPage from "./pages/AssignedCallsPage";
import CallScriptsPage from "./pages/CallScriptsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import CommissionsPage from "./pages/CommissionsPage";
import CouponsPage from "./pages/CouponsPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import IntegrationPage from "./pages/IntegrationPage";
import UsersManagementPage from "./pages/UsersManagementPage";

// Import icons
import {
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  DollarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  GiftOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Custom Header with Logout
const CustomHeader = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userData: User | null = user ? JSON.parse(user) : null;
  const { modal, message: appMessage } = AntdApp.useApp();
  
  const handleLogout = () => {
    modal.confirm({
      title: 'Are you sure you want to sign out?',
      icon: <LogoutOutlined />,
      okText: 'Yes, Sign Out',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk() {
        authProvider.logout({});
        navigate('/login');
        appMessage.success('Successfully signed out');
      },
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px',
      background: '#fff',
      borderBottom: '3px solid #00bcd4',
      height: '64px'
    }}>
      <Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/assets/logo.jpg" 
            alt="LA Mattress" 
            style={{ height: '40px', width: 'auto' }}
          />
          <Title level={4} style={{ margin: 0, color: '#212121' }}>LA Mattress System</Title>
        </div>
        {userData && (
          <Tag color={userData.role === 'admin' ? '#f44336' : '#00bcd4'} style={{ color: 'white', fontWeight: '600' }}>
            {userData.name} - {userData.role === 'admin' ? 'Administrator' : 'Employee'}
          </Tag>
        )}
      </Space>
      <Button 
        type="primary" 
        danger
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        style={{ color: 'white' }}
      >
        Sign Out
      </Button>
    </div>
  );
};

// Dashboard Component with Charts
const Dashboard = () => {
  const user = localStorage.getItem("user");
  const userData: User | null = user ? JSON.parse(user) : null;
  const isEmployee = userData?.role === 'employee';

  // Mock data for charts
  const weeklyCallsData = [
    { day: 'Lun', calls: 120, successful: 45 },
    { day: 'Mar', calls: 150, successful: 62 },
    { day: 'Mie', calls: 180, successful: 78 },
    { day: 'Jue', calls: 165, successful: 71 },
    { day: 'Vie', calls: 210, successful: 95 },
    { day: 'Sáb', calls: 95, successful: 38 },
    { day: 'Dom', calls: 45, successful: 15 },
  ];

  const employeePerformance = [
    { name: 'María García', sales: 120, target: 100 },
    { name: 'Juan Pérez', sales: 85, target: 100 },
    { name: 'Ana López', sales: 95, target: 100 },
    { name: 'Carlos Ruiz', sales: 110, target: 100 },
    { name: 'Laura Díaz', sales: 75, target: 100 },
  ];

  const subscriptionTypes = [
    { name: 'Basic', value: 45, color: '#00bcd4' },
    { name: 'Premium', value: 30, color: '#f44336' },
    { name: 'Enterprise', value: 25, color: '#ff9800' },
  ];

  const recentActivities = [
    { type: 'sale', message: 'María García made a sale', time: '5 min ago', icon: <DollarOutlined /> },
    { type: 'call', message: 'Juan Pérez completed 50 calls today', time: '15 min ago', icon: <PhoneOutlined /> },
    { type: 'client', message: 'New VIP client registered', time: '30 min ago', icon: <TeamOutlined /> },
    { type: 'bonus', message: 'Carlos Ruiz reached Gold bonus', time: '1 hour ago', icon: <CheckCircleOutlined /> },
  ];

  // Employee ranking data
  const employeeRanking = [
    { rank: 1, name: 'María García', store: 'Store Center', sales: 120, commission: 1200, trend: 'up', previousRank: 3, avatar: '#ff4d4f' },
    { rank: 2, name: 'Carlos Ruiz', store: 'Store North', sales: 110, commission: 1100, trend: 'up', previousRank: 5, avatar: '#1890ff' },
    { rank: 3, name: 'Ana López', store: 'Store Center', sales: 95, commission: 950, trend: 'down', previousRank: 2, avatar: '#52c41a' },
    { rank: 4, name: 'Diego Morales', store: 'Store East', sales: 92, commission: 920, trend: 'up', previousRank: 7, avatar: '#722ed1' },
    { rank: 5, name: 'Laura Díaz', store: 'Store South', sales: 89, commission: 890, trend: 'stable', previousRank: 5, avatar: '#fa8c16' },
    { rank: 6, name: 'Roberto Vega', store: 'Store West', sales: 85, commission: 850, trend: 'down', previousRank: 4, avatar: '#eb2f96' },
    { rank: 7, name: 'Sofia Rivera', store: 'Store Center', sales: 82, commission: 820, trend: 'up', previousRank: 10, avatar: '#13c2c2' },
    { rank: 8, name: 'Miguel Santos', store: 'Store North', sales: 78, commission: 780, trend: 'stable', previousRank: 8, avatar: '#faad14' },
    { rank: 9, name: 'Valeria Torres', store: 'Store East', sales: 75, commission: 750, trend: 'down', previousRank: 6, avatar: '#a0d911' },
    { rank: 10, name: 'Juan Pérez', store: 'Store South', sales: 72, commission: 720, trend: 'up', previousRank: 12, avatar: '#1890ff' },
  ];

  if (isEmployee) {
    // Employee Dashboard with charts
    const myWeeklyCallsData = [
      { day: 'Mon', calls: 18, successful: 7 },
      { day: 'Tue', calls: 22, successful: 10 },
      { day: 'Wed', calls: 25, successful: 12 },
      { day: 'Thu', calls: 20, successful: 8 },
      { day: 'Fri', calls: 24, successful: 11 },
      { day: 'Sat', calls: 15, successful: 6 },
      { day: 'Sun', calls: 8, successful: 3 },
    ];

    const myMonthlyPerformance = [
      { month: 'Week 1', sales: 12, target: 25 },
      { month: 'Week 2', sales: 18, target: 25 },
      { month: 'Week 3', sales: 15, target: 25 },
      { month: 'Week 4', sales: 0, target: 25 },
    ];

    const mySubscriptionTypes = [
      { name: 'Basic', value: 25, color: '#00bcd4' },
      { name: 'Premium', value: 15, color: '#f44336' },
      { name: 'Enterprise', value: 5, color: '#ff9800' },
    ];

    const myRecentActivities = [
      { type: 'sale', message: 'You made a sale to John Doe', time: '2 hours ago', icon: <DollarOutlined /> },
      { type: 'call', message: 'You completed 12 calls today', time: '3 hours ago', icon: <PhoneOutlined /> },
      { type: 'feedback', message: 'Feedback submitted for Client #123', time: '5 hours ago', icon: <CheckCircleOutlined /> },
      { type: 'bonus', message: 'You are 5 sales away from Bronze tier', time: '1 day ago', icon: <TrophyOutlined /> },
    ];

    return (
      <div style={{ padding: "24px" }}>
        <Title level={2} style={{ marginBottom: 24 }}>My Dashboard</Title>
        
        {/* Key Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="My Calls Today"
                value={12}
                prefix={<PhoneOutlined />}
                suffix="/ 25"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="My Sales This Month"
                value={45}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="My Current Commission"
                value={45}
                prefix="$"
                suffix="+ $0 bonus"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="My Conversion Rate"
                value={25.5}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          {/* My Weekly Calls Chart */}
          <Col xs={24} lg={12}>
            <Card title="My Weekly Call Performance">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={myWeeklyCallsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#00bcd4" 
                    name="Total Calls"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="#f44336" 
                    name="Successful Calls"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* My Monthly Performance */}
          <Col xs={24} lg={12}>
            <Card title="My Monthly Sales vs Target">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={myMonthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#00bcd4" name="My Sales" />
                  <Bar dataKey="target" fill="#f44336" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* My Subscription Distribution */}
          <Col xs={24} md={12} lg={8}>
            <Card title="My Subscription Sales">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mySubscriptionTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mySubscriptionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* My Recent Activities */}
          <Col xs={24} md={12} lg={16}>
            <Card title="My Recent Activity">
              <List
                itemLayout="horizontal"
                dataSource={myRecentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.type === 'sale' ? '#52c41a' : '#1890ff'
                      }}>
                        {item.icon}
                      </div>}
                      title={item.message}
                      description={item.time}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Alert
              message="Daily Goal Reminder"
              description="You need to complete 25 daily calls. You've completed 12 so far - keep going! Remember to add feedback after each call."
              type="info"
              showIcon
            />
          </Col>

          {/* Employee Ranking - Show current position and nearby competitors */}
          <Col span={24}>
            <Card 
              className="ranking-card"
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Company Ranking - Your Position</span>
                </Space>
              }
              extra={
                <Space>
                  <Tag color="green" icon={<TrophyOutlined />}>You're #6</Tag>
                  <Tag color="orange" icon={<FireOutlined />}>5 sales to next level</Tag>
                </Space>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <Alert
                  message="Your Current Ranking"
                  description={
                    <Space direction="vertical">
                      <Text>You are currently ranked <Text strong>#6</Text> out of 50 employees company-wide!</Text>
                      <Text>You need <Text strong>5 more sales</Text> to overtake Roberto Vega and move to #5.</Text>
                    </Space>
                  }
                  type="success"
                  showIcon
                  icon={<TrophyOutlined />}
                />
              </div>
              
              <Table
                dataSource={employeeRanking.slice(0, 10)}
                pagination={false}
                size="small"
                rowKey="rank"
                rowClassName={(record) => {
                  let classes = 'ranking-table-row';
                  if (record.rank <= 3) classes += ' top-3';
                  if (record.name === 'Roberto Vega') classes += ' current-user';
                  return classes;
                }}
                columns={[
                  {
                    title: 'Rank',
                    dataIndex: 'rank',
                    key: 'rank',
                    width: 80,
                    render: (rank, record) => (
                      <div className={`rank-badge rank-${rank}`} style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        {rank <= 3 ? <CrownOutlined /> : `#${rank}`}
                      </div>
                    ),
                  },
                  {
                    title: 'Employee',
                    key: 'employee',
                    render: (_, record) => (
                      <Space>
                        <div 
                          className="employee-avatar"
                          style={{ 
                            backgroundColor: record.avatar,
                            width: '32px',
                            height: '32px',
                            fontSize: '12px'
                          }}
                        >
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <Text strong={record.name === 'Roberto Vega'}>{record.name}</Text>
                          {record.name === 'Roberto Vega' && <Tag color="blue" style={{ marginLeft: 8 }}>You</Tag>}
                          <br />
                          <Text type="secondary" style={{ fontSize: '11px' }}>{record.store}</Text>
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: 'Sales',
                    dataIndex: 'sales',
                    key: 'sales',
                    render: (sales) => <Text strong>{sales}</Text>,
                  },
                  {
                    title: 'Gap to You',
                    key: 'gap',
                    render: (_, record) => {
                      const yourSales = 85; // Roberto Vega's sales
                      const gap = record.sales - yourSales;
                      if (record.name === 'Roberto Vega') {
                        return <Tag color="blue">Your Position</Tag>;
                      }
                      if (gap > 0) {
                        return <Text type="danger">+{gap} ahead</Text>;
                      }
                      return <Text type="success">{Math.abs(gap)} behind</Text>;
                    },
                  },
                ]}
              />

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Space direction="vertical">
                  <Text type="secondary">Keep pushing! You're doing great!</Text>
                  <Space>
                    <Tag color="gold">Next Milestone: 100 sales (Gold Medal)</Tag>
                    <Tag color="purple">Current: 85 sales</Tag>
                  </Space>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>
      
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Calls Today"
              value={387}
              prefix={<PhoneOutlined />}
              suffix={
                <span style={{ fontSize: 14, color: '#3f8600' }}>
                  <ArrowUpOutlined /> 12%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sales This Month"
              value={1250}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={24}
              prefix={<UserOutlined />}
              suffix="/ 30"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={73.2}
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        {/* Weekly Calls Chart */}
        <Col xs={24} lg={12}>
          <Card title="Weekly Call Volume">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyCallsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#00bcd4" 
                  name="Total Calls"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  stroke="#f44336" 
                  name="Successful Calls"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Employee Performance */}
        <Col xs={24} lg={12}>
          <Card title="Employee Performance vs Target">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#00bcd4" name="Sales" />
                <Bar dataKey="target" fill="#f44336" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Subscription Distribution */}
        <Col xs={24} md={12} lg={8}>
          <Card title="Subscription Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} md={12} lg={16}>
          <Card title="Recent Activity">
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.type === 'sale' ? '#52c41a' : '#1890ff'
                    }}>
                      {item.icon}
                    </div>}
                    title={item.message}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Employee Ranking */}
        <Col span={24}>
          <Card 
            className="ranking-card"
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span>Employee Ranking - Top Performers</span>
              </Space>
            }
            extra={<Tag color="cyan">Live Rankings</Tag>}
          >
            <div className="ranking-header">
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Title level={4} style={{ margin: 0 }}>Live Performance Tracking</Title>
                  <Text type="secondary">Real-time employee rankings updated every hour</Text>
                </Col>
                <Col>
                  <Space>
                    <Tag color="gold" icon={<CrownOutlined />}>Top 3 Performers</Tag>
                    <Tag color="green" icon={<RiseOutlined />}>Rising Stars</Tag>
                  </Space>
                </Col>
              </Row>
            </div>
            <Table
              dataSource={employeeRanking}
              pagination={false}
              size="middle"
              rowKey="rank"
              rowClassName={(record) => {
                let classes = 'ranking-table-row';
                if (record.rank <= 3) classes += ' top-3';
                return classes;
              }}
              columns={[
                {
                  title: 'Rank',
                  dataIndex: 'rank',
                  key: 'rank',
                  width: 100,
                  render: (rank, record) => (
                    <Space>
                      <div className={`rank-badge rank-${rank}`}>
                        {rank <= 3 ? <CrownOutlined /> : `#${rank}`}
                      </div>
                      {record.trend === 'up' && (
                        <div className="trend-indicator trend-up">
                          <RiseOutlined />
                        </div>
                      )}
                      {record.trend === 'down' && (
                        <div className="trend-indicator trend-down">
                          <ArrowDownOutlined />
                        </div>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Employee',
                  key: 'employee',
                  render: (_, record) => (
                    <Space>
                      <div 
                        className="employee-avatar"
                        style={{ backgroundColor: record.avatar }}
                      >
                        {record.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <Text strong>{record.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.store}</Text>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Sales This Month',
                  dataIndex: 'sales',
                  key: 'sales',
                  render: (sales) => (
                    <div className="sales-badge">
                      <FireOutlined style={{ marginRight: '4px' }} />
                      {sales}
                    </div>
                  ),
                },
                {
                  title: 'Commission',
                  dataIndex: 'commission',
                  key: 'commission',
                  render: (commission) => (
                    <div className="commission-badge">
                      {commission}
                    </div>
                  ),
                },
                {
                  title: 'Movement',
                  key: 'change',
                  width: 150,
                  render: (_, record) => {
                    const change = record.previousRank - record.rank;
                    if (change > 0) {
                      return (
                        <Tag 
                          color="green" 
                          className="position-change-tag"
                          icon={<ArrowUpOutlined />}
                        >
                          +{change} positions
                        </Tag>
                      );
                    } else if (change < 0) {
                      return (
                        <Tag 
                          color="red"
                          className="position-change-tag"
                          icon={<ArrowDownOutlined />}
                        >
                          -{Math.abs(change)} positions
                        </Tag>
                      );
                    }
                    return (
                      <Tag className="position-change-tag">
                        No change
                      </Tag>
                    );
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Protected Layout
const ProtectedLayout = () => {
  return (
    <ThemedLayoutV2 Header={CustomHeader}>
      <Outlet />
    </ThemedLayoutV2>
  );
};

const AppContent: React.FC = () => {
  // Use state to track user role for dynamic menu updates
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check user role on mount and after storage changes
    const checkUserRole = () => {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setUserRole(userData.role);
      } else {
        setUserRole(null);
      }
    };

    checkUserRole();
    
    // Listen for storage changes
    window.addEventListener('storage', checkUserRole);
    
    // Check on focus (in case localStorage changed in another tab)
    window.addEventListener('focus', checkUserRole);
    
    return () => {
      window.removeEventListener('storage', checkUserRole);
      window.removeEventListener('focus', checkUserRole);
    };
  }, []);

  const resources = React.useMemo(() => [
    {
      name: "dashboard",
      list: "/",
      meta: {
        label: "Dashboard",
        icon: <DashboardOutlined />,
      },
    },
    {
      name: "employees",
      list: "/employees",
      create: "/employees/create",
      edit: "/employees/edit/:id",
      show: "/employees/show/:id",
      meta: {
        label: "Employees",
        icon: <UserOutlined />,
        hide: userRole === "employee",
      },
    },
    {
      name: "call-clients",
      list: "/call-clients",
      create: "/call-clients/create",
      edit: "/call-clients/edit/:id",
      meta: {
        label: "Call Clients",
        icon: <TeamOutlined />,
      },
    },
    {
      name: "calls",
      list: "/calls",
      create: "/calls/create",
      show: "/calls/show/:id",
      meta: {
        label: userRole === "employee" ? "My Calls" : "Calls",
        icon: <PhoneOutlined />,
      },
    },
    {
      name: "call-scripts",
      list: "/call-scripts",
      create: "/call-scripts/create",
      edit: "/call-scripts/edit/:id",
      meta: {
        label: "Scripts",
        icon: <FileTextOutlined />,
        hide: userRole === "employee",
      },
    },
    {
      name: "subscriptions",
      list: "/subscriptions",
      show: "/subscriptions/show/:id",
      meta: {
        label: userRole === "employee" ? "My Subscriptions" : "Subscriptions",
        icon: <CreditCardOutlined />,
      },
    },
    {
      name: "commissions",
      list: "/commissions",
      meta: {
        label: "Commissions",
        icon: <DollarOutlined />,
      },
    },
    {
      name: "coupons",
      list: "/coupons",
      meta: {
        label: "Coupons",
        icon: <GiftOutlined />,
      },
    },
    {
      name: "products",
      list: "/products",
      create: "/products/create",
      edit: "/products/edit/:id",
      show: "/products/show/:id",
      meta: {
        label: "Products",
        icon: <ShoppingOutlined />,
      },
    },
    {
      name: "orders",
      list: "/orders",
      show: "/orders/show/:id",
      meta: {
        label: "Orders",
        icon: <ShoppingCartOutlined />,
      },
    },
    {
      name: "customers",
      list: "/customers",
      create: "/customers/create",
      edit: "/customers/edit/:id",
      show: "/customers/show/:id",
      meta: {
        label: "Customers",
        icon: <TeamOutlined />,
      },
    },
    {
      name: "integration",
      list: "/integration",
      meta: {
        label: "Integration",
        icon: <SettingOutlined />,
        hide: userRole === "employee",
      },
    },
    {
      name: "users",
      list: "/users",
      create: "/users/create",
      edit: "/users/edit/:id",
      show: "/users/show/:id",
      meta: {
        label: "Users & Permissions",
        icon: <SafetyOutlined />,
        hide: userRole === "employee",
      },
    },
  ], [userRole]);

  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: "#00bcd4",
        colorSuccess: "#52c41a",
        colorWarning: "#ff9800",
        colorError: "#f44336",
        colorInfo: "#00bcd4",
        borderRadius: 8,
        fontFamily: "'Open Sans', sans-serif",
      },
    }}>
      <AntdApp>
        <Refine
        authProvider={authProvider}
        dataProvider={dataProvider}
        accessControlProvider={accessControlProvider}
        routerProvider={routerProvider}
        notificationProvider={notificationProvider}
        resources={resources.filter(r => !r.meta?.hide)}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            element={
              <Authenticated key="authenticated-layout" fallback={<Navigate to="/login" />}>
                <ProtectedLayout />
              </Authenticated>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Admin Only Routes */}
            <Route
              path="/employees"
              element={
                <CanAccess resource="employees" action="list" fallback={<Navigate to="/" />}>
                  <Outlet />
                </CanAccess>
              }
            >
              <Route index element={<EmployeesPage />} />
              <Route path="create" element={<EmployeesPage />} />
              <Route path="edit/:id" element={<EmployeesPage />} />
              <Route path="show/:id" element={<EmployeesPage />} />
            </Route>

            {/* Shared Routes */}
            <Route path="/call-clients">
              <Route index element={<CallClientsPage />} />
              <Route path="create" element={<CallClientsPage />} />
              <Route path="edit/:id" element={<CallClientsPage />} />
            </Route>

            <Route path="/calls">
              <Route index element={
                userRole === "employee" 
                  ? <AssignedCallsPage />
                  : <CallsPage />
              } />
              <Route path="create" element={<CallsPage />} />
              <Route path="show/:id" element={<CallsPage />} />
            </Route>

            <Route path="/call-scripts">
              <Route index element={<CallScriptsPage />} />
              <Route path="create" element={<CallScriptsPage />} />
              <Route path="edit/:id" element={<CallScriptsPage />} />
            </Route>

            <Route path="/subscriptions">
              <Route index element={<SubscriptionsPage />} />
              <Route path="show/:id" element={<SubscriptionsPage />} />
            </Route>

            <Route path="/commissions" element={<CommissionsPage />} />
            
            <Route path="/coupons" element={<CouponsPage />} />
            
            <Route path="/products">
              <Route index element={<ProductsPage />} />
              <Route path="create" element={<ProductsPage />} />
              <Route path="edit/:id" element={<ProductsPage />} />
              <Route path="show/:id" element={<ProductsPage />} />
            </Route>

            <Route path="/orders">
              <Route index element={<OrdersPage />} />
              <Route path="show/:id" element={<OrdersPage />} />
            </Route>

            <Route path="/customers">
              <Route index element={<CustomersPage />} />
              <Route path="create" element={<CustomersPage />} />
              <Route path="edit/:id" element={<CustomersPage />} />
              <Route path="show/:id" element={<CustomersPage />} />
            </Route>

            {/* Admin Only - Integration */}
            <Route
              path="/integration"
              element={
                <CanAccess resource="integration" action="list" fallback={<Navigate to="/" />}>
                  <IntegrationPage />
                </CanAccess>
              }
            />

            {/* Admin Only - Users Management */}
            <Route
              path="/users"
              element={
                <CanAccess resource="users" action="list" fallback={<Navigate to="/" />}>
                  <UsersManagementPage />
                </CanAccess>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Refine>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/*" element={<AppContent />} />
    )
  );

  return <RouterProvider router={router} />;
};

export default App;