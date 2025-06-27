import React from "react";
import { Refine, Authenticated, CanAccess } from "@refinedev/core";
import { ThemedLayoutV2, notificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/react-router-v6";
import { createBrowserRouter, RouterProvider, Route, Routes, Navigate, useNavigate, Outlet, createRoutesFromElements } from "react-router-dom";
import { ConfigProvider, Button, Space, Tag, App as AntdApp } from "antd";
import "@refinedev/antd/dist/reset.css";
import "./styles.css";

// Import auth and data provider
import { authProvider, accessControlProvider, User } from "./authProvider";
import { dataProvider } from "./dataProvider";

// Import pages
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
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
  GiftOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  SafetyOutlined,
} from "@ant-design/icons";


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
          <span style={{ fontSize: '20px', fontWeight: '600', color: '#212121' }}>La Mattress System</span>
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

// Dashboard component is now imported from ./pages/Dashboard

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