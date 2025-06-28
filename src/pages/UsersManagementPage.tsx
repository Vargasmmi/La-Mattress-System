import React, { useState } from "react";
import { useList, useCreate, useUpdate, useDelete, useGetIdentity } from "@refinedev/core";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Card,
  Space,
  Typography,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  App,
  Tooltip,
  Switch,
  Descriptions,
  Avatar,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  TeamOutlined,
  CrownOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  MailOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { logger } from '../utils/logger';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  last_login?: string;
  permissions?: string[];
}

interface Permission {
  key: string;
  label: string;
  description: string;
  module: string;
}

const UsersManagementPageContent: React.FC = () => {
  const { message: appMessage, modal } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Available permissions
  const availablePermissions: Permission[] = [
    // User Management
    { key: "users.view", label: "View Users", description: "Can view all users", module: "Users" },
    { key: "users.create", label: "Create Users", description: "Can create new users", module: "Users" },
    { key: "users.edit", label: "Edit Users", description: "Can edit existing users", module: "Users" },
    { key: "users.delete", label: "Delete Users", description: "Can delete users", module: "Users" },
    { key: "users.permissions", label: "Manage Permissions", description: "Can manage user permissions", module: "Users" },
    
    // Products
    { key: "products.view", label: "View Products", description: "Can view products", module: "Products" },
    { key: "products.create", label: "Create Products", description: "Can create products", module: "Products" },
    { key: "products.edit", label: "Edit Products", description: "Can edit products", module: "Products" },
    { key: "products.delete", label: "Delete Products", description: "Can delete products", module: "Products" },
    { key: "products.sync", label: "Sync Products", description: "Can sync products from Shopify", module: "Products" },
    
    // Orders
    { key: "orders.view", label: "View Orders", description: "Can view orders", module: "Orders" },
    { key: "orders.edit", label: "Edit Orders", description: "Can edit order status", module: "Orders" },
    
    // Customers
    { key: "customers.view", label: "View Customers", description: "Can view customers", module: "Customers" },
    { key: "customers.create", label: "Create Customers", description: "Can create customers", module: "Customers" },
    { key: "customers.edit", label: "Edit Customers", description: "Can edit customers", module: "Customers" },
    { key: "customers.delete", label: "Delete Customers", description: "Can delete customers", module: "Customers" },
    
    // Employees
    { key: "employees.view", label: "View Employees", description: "Can view employees", module: "Employees" },
    { key: "employees.create", label: "Create Employees", description: "Can create employees", module: "Employees" },
    { key: "employees.edit", label: "Edit Employees", description: "Can edit employees", module: "Employees" },
    { key: "employees.delete", label: "Delete Employees", description: "Can delete employees", module: "Employees" },
    
    // Calls
    { key: "calls.view", label: "View Calls", description: "Can view all calls", module: "Calls" },
    { key: "calls.create", label: "Create Calls", description: "Can create calls", module: "Calls" },
    { key: "calls.edit", label: "Edit Calls", description: "Can edit calls", module: "Calls" },
    { key: "calls.delete", label: "Delete Calls", description: "Can delete calls", module: "Calls" },
    
    // Commissions
    { key: "commissions.view", label: "View Commissions", description: "Can view commissions", module: "Commissions" },
    { key: "commissions.manage", label: "Manage Commissions", description: "Can manage commission payments", module: "Commissions" },
    
    // Settings
    { key: "settings.view", label: "View Settings", description: "Can view settings", module: "Settings" },
    { key: "settings.edit", label: "Edit Settings", description: "Can edit settings", module: "Settings" },
    { key: "integrations.manage", label: "Manage Integrations", description: "Can manage Shopify/Stripe integrations", module: "Settings" },
  ];

  // Fetch users from API with mock fallback
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useList<User>({
    resource: "users",
    pagination: { current: 1, pageSize: 100 },
    queryOptions: { 
      enabled: true,
      onError: () => {
        // Return mock data if API fails
        return {
          data: [
            {
              id: "1",
              name: "Admin Principal",
              email: "admin@lamattress.com",
              role: "admin",
              status: "active",
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
              last_login: "2024-02-20T10:30:00Z",
              permissions: ["*"], // All permissions
            },
            {
              id: "2",
              name: "María García",
              email: "maria@lamattress.com",
              role: "employee",
              status: "active",
              created_at: "2024-01-15T00:00:00Z",
              updated_at: "2024-01-15T00:00:00Z",
              last_login: "2024-02-20T09:00:00Z",
              permissions: ["calls.view", "calls.create", "calls.edit", "customers.view"],
            },
            {
              id: "3",
              name: "Juan Pérez",
              email: "juan@lamattress.com",
              role: "employee",
              status: "active",
              created_at: "2024-01-20T00:00:00Z",
              updated_at: "2024-01-20T00:00:00Z",
              last_login: "2024-02-19T14:00:00Z",
              permissions: ["calls.view", "calls.create", "calls.edit", "customers.view"],
            },
          ],
          total: 3,
        };
      }
    }
  });

  // CRUD mutations
  const { mutate: createUser, isLoading: isCreating } = useCreate();
  const { mutate: updateUser, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteUser } = useDelete();

  const users = usersData?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const employeeUsers = users.filter(u => u.role === 'employee').length;

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      employeeUsers,
    };
  }, [users]);

  const handleCreateUser = (values: any) => {
    createUser({
      resource: "users",
      values: {
        ...values,
        status: 'active',
        permissions: values.role === 'admin' ? ['*'] : selectedPermissions,
      },
      successNotification: {
        message: "Usuario creado exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        setSelectedPermissions([]);
        refetchUsers();
        appMessage.success("Usuario creado exitosamente");
      },
      onError: (error) => {
        logger.error('Error creating user', error, 'UsersManagementPage');
        appMessage.error("Error al crear usuario");
      }
    });
  };

  const handleUpdateUser = (values: any) => {
    if (!editingUser) return;

    updateUser({
      resource: "users",
      id: editingUser.id,
      values: {
        ...values,
        permissions: values.role === 'admin' ? ['*'] : selectedPermissions,
      },
      successNotification: {
        message: "Usuario actualizado exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingUser(null);
        setSelectedPermissions([]);
        refetchUsers();
        appMessage.success("Usuario actualizado exitosamente");
      },
      onError: (error) => {
        logger.error('Error updating user', error, 'UsersManagementPage');
        appMessage.error("Error al actualizar usuario");
      }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === identity?.id) {
      appMessage.error("No puedes eliminar tu propio usuario");
      return;
    }

    modal.confirm({
      title: "Eliminar Usuario",
      content: `¿Estás seguro que deseas eliminar a ${user.name}?`,
      okText: "Sí, Eliminar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteUser({
          resource: "users",
          id: user.id,
          successNotification: {
            message: "Usuario eliminado exitosamente",
            type: "success",
          },
        }, {
          onSuccess: () => {
            refetchUsers();
            appMessage.success("Usuario eliminado exitosamente");
          },
          onError: (error) => {
            logger.error('Error deleting user', error, 'UsersManagementPage');
            appMessage.error("Error al eliminar usuario");
          }
        });
      }
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedPermissions(user.permissions || []);
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsEditModalVisible(true);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsViewModalVisible(true);
  };

  const handlePermissionsModal = (user: User) => {
    setEditingUser(user);
    setSelectedPermissions(user.permissions || []);
    setIsPermissionsModalVisible(true);
  };

  const handleUpdatePermissions = () => {
    if (!editingUser) return;

    updateUser({
      resource: "users",
      id: editingUser.id,
      values: {
        permissions: selectedPermissions,
      },
      successNotification: {
        message: "Permisos actualizados exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsPermissionsModalVisible(false);
        setEditingUser(null);
        setSelectedPermissions([]);
        refetchUsers();
        appMessage.success("Permisos actualizados exitosamente");
      },
      onError: (error) => {
        logger.error('Error updating permissions', error, 'UsersManagementPage');
        appMessage.error("Error al actualizar permisos");
      }
    });
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'red' : 'blue';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'default';
  };

  const hasPermission = (user: User, permission: string): boolean => {
    if (!user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const columns: ColumnsType<User> = [
    {
      title: "Usuario",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: getRoleColor(record.role) }} />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag 
          color={getRoleColor(role)} 
          icon={role === 'admin' ? <CrownOutlined /> : <UserOutlined />}
        >
          {role === 'admin' ? 'ADMINISTRADOR' : 'EMPLEADO'}
        </Tag>
      ),
      filters: [
        { text: 'Administrador', value: 'admin' },
        { text: 'Empleado', value: 'employee' },
      ],
      onFilter: (value: any, record: User) => record.role === value,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag 
          color={getStatusColor(status)}
          icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status === 'active' ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: 'active' },
        { text: 'Inactivo', value: 'inactive' },
      ],
      onFilter: (value: any, record: User) => record.status === value,
    },
    {
      title: "Permisos",
      key: "permissions",
      render: (_, record) => {
        if (record.permissions?.includes('*')) {
          return <Tag color="gold" icon={<SafetyOutlined />}>Todos los permisos</Tag>;
        }
        return (
          <Space>
            <Text>{record.permissions?.length || 0} permisos</Text>
            <Button 
              size="small" 
              icon={<KeyOutlined />}
              onClick={() => handlePermissionsModal(record)}
              disabled={record.role === 'admin'}
            >
              Gestionar
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Último acceso",
      dataIndex: "last_login",
      key: "last_login",
      render: (date: string) => date ? (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Space>
      ) : (
        <Text type="secondary">Nunca</Text>
      ),
      sorter: (a, b) => {
        if (!a.last_login && !b.last_login) return 0;
        if (!a.last_login) return 1;
        if (!b.last_login) return -1;
        return dayjs(a.last_login).unix() - dayjs(b.last_login).unix();
      },
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              disabled={record.id === identity?.id}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record)}
              disabled={record.id === identity?.id || stats.adminUsers === 1 && record.role === 'admin'}
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  // Group permissions by module
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Gestión de Usuarios y Permisos</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Usuarios"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Usuarios Activos"
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Administradores"
              value={stats.adminUsers}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Empleados"
              value={stats.employeeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        message="Gestión de Permisos"
        description="Los administradores tienen acceso completo al sistema. Los empleados solo tienen acceso a las funciones que se les asignen específicamente."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Action Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Crear Usuario
          </Button>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={usersLoading}
          scroll={{ x: 1000 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} usuarios`,
          }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Crear Nuevo Usuario"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
          setSelectedPermissions([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          onFinish={handleCreateUser}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre Completo"
                rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Por favor ingresa el email" },
                  { type: "email", message: "Ingresa un email válido" }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: "Por favor ingresa la contraseña" },
                  { min: 6, message: "La contraseña debe tener al menos 6 caracteres" }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true, message: "Por favor selecciona un rol" }]}
                initialValue="employee"
              >
                <Select>
                  <Option value="admin">Administrador</Option>
                  <Option value="employee">Empleado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate>
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'admin') {
                return (
                  <Alert
                    message="Permisos de Administrador"
                    description="Los administradores tienen acceso completo a todas las funciones del sistema."
                    type="warning"
                    showIcon
                  />
                );
              }
              return (
                <>
                  <Divider>Seleccionar Permisos</Divider>
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} style={{ marginBottom: 16 }}>
                      <Text strong>{module}</Text>
                      <div style={{ marginTop: 8 }}>
                        {perms.map(perm => (
                          <Tag
                            key={perm.key}
                            color={selectedPermissions.includes(perm.key) ? "blue" : "default"}
                            style={{ cursor: "pointer", marginBottom: 8 }}
                            onClick={() => {
                              if (selectedPermissions.includes(perm.key)) {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                              } else {
                                setSelectedPermissions([...selectedPermissions, perm.key]);
                              }
                            }}
                          >
                            {selectedPermissions.includes(perm.key) && <CheckCircleOutlined />}
                            {perm.label}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                icon={<UserOutlined />}
              >
                Crear Usuario
              </Button>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                createForm.resetFields();
                setSelectedPermissions([]);
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Editar Usuario"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingUser(null);
          setSelectedPermissions([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateUser}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre Completo"
                rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Por favor ingresa el email" },
                  { type: "email", message: "Ingresa un email válido" }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true, message: "Por favor selecciona un rol" }]}
              >
                <Select>
                  <Option value="admin">Administrador</Option>
                  <Option value="employee">Empleado</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Estado"
              >
                <Select>
                  <Option value="active">Activo</Option>
                  <Option value="inactive">Inactivo</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate>
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'admin') {
                return (
                  <Alert
                    message="Permisos de Administrador"
                    description="Los administradores tienen acceso completo a todas las funciones del sistema."
                    type="warning"
                    showIcon
                  />
                );
              }
              return (
                <>
                  <Divider>Permisos Asignados</Divider>
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} style={{ marginBottom: 16 }}>
                      <Text strong>{module}</Text>
                      <div style={{ marginTop: 8 }}>
                        {perms.map(perm => (
                          <Tag
                            key={perm.key}
                            color={selectedPermissions.includes(perm.key) ? "blue" : "default"}
                            style={{ cursor: "pointer", marginBottom: 8 }}
                            onClick={() => {
                              if (selectedPermissions.includes(perm.key)) {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                              } else {
                                setSelectedPermissions([...selectedPermissions, perm.key]);
                              }
                            }}
                          >
                            {selectedPermissions.includes(perm.key) && <CheckCircleOutlined />}
                            {perm.label}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<EditOutlined />}
              >
                Actualizar Usuario
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setEditingUser(null);
                setSelectedPermissions([]);
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View User Modal */}
      <Modal
        title="Detalles del Usuario"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingUser(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalVisible(false);
            setViewingUser(null);
          }}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {viewingUser && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small">
                  <Space>
                    <Avatar 
                      size={64} 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: getRoleColor(viewingUser.role) }} 
                    />
                    <Space direction="vertical">
                      <Title level={4} style={{ margin: 0 }}>{viewingUser.name}</Title>
                      <Text type="secondary">{viewingUser.email}</Text>
                      <Space>
                        <Tag color={getRoleColor(viewingUser.role)}>
                          {viewingUser.role === 'admin' ? 'Administrador' : 'Empleado'}
                        </Tag>
                        <Tag color={getStatusColor(viewingUser.status)}>
                          {viewingUser.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Tag>
                      </Space>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID de Usuario">
                {viewingUser.id}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                <CalendarOutlined /> {dayjs(viewingUser.created_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización">
                <CalendarOutlined /> {dayjs(viewingUser.updated_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Último Acceso">
                {viewingUser.last_login ? (
                  <>
                    <CalendarOutlined /> {dayjs(viewingUser.last_login).format('DD/MM/YYYY HH:mm')}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({dayjs(viewingUser.last_login).fromNow()})
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">Nunca ha iniciado sesión</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {viewingUser.role !== 'admin' && (
              <>
                <Divider>Permisos Asignados</Divider>
                {viewingUser.permissions?.length ? (
                  <div>
                    {Object.entries(groupedPermissions).map(([module, perms]) => {
                      const modulePerms = perms.filter(p => viewingUser.permissions?.includes(p.key));
                      if (modulePerms.length === 0) return null;
                      
                      return (
                        <div key={module} style={{ marginBottom: 16 }}>
                          <Text strong>{module}</Text>
                          <div style={{ marginTop: 8 }}>
                            {modulePerms.map(perm => (
                              <Tag key={perm.key} color="blue" icon={<CheckCircleOutlined />}>
                                {perm.label}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert
                    message="Sin permisos asignados"
                    description="Este usuario no tiene permisos específicos asignados."
                    type="warning"
                    showIcon
                  />
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Permissions Modal */}
      <Modal
        title={`Gestionar Permisos - ${editingUser?.name}`}
        open={isPermissionsModalVisible}
        onOk={handleUpdatePermissions}
        onCancel={() => {
          setIsPermissionsModalVisible(false);
          setEditingUser(null);
          setSelectedPermissions([]);
        }}
        width={700}
        okText="Guardar Permisos"
        okButtonProps={{ loading: isUpdating }}
      >
        <Alert
          message="Asignación de Permisos"
          description="Selecciona los permisos que deseas asignar a este usuario. Los permisos determinan qué acciones puede realizar en el sistema."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {Object.entries(groupedPermissions).map(([module, perms]) => (
          <div key={module} style={{ marginBottom: 24 }}>
            <Title level={5}>{module}</Title>
            <div style={{ marginTop: 8 }}>
              {perms.map(perm => (
                <div key={perm.key} style={{ marginBottom: 8 }}>
                  <Tag
                    color={selectedPermissions.includes(perm.key) ? "blue" : "default"}
                    style={{ cursor: "pointer", width: "100%", padding: "8px" }}
                    onClick={() => {
                      if (selectedPermissions.includes(perm.key)) {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                      } else {
                        setSelectedPermissions([...selectedPermissions, perm.key]);
                      }
                    }}
                  >
                    <Space>
                      {selectedPermissions.includes(perm.key) ? (
                        <CheckCircleOutlined style={{ color: "#1890ff" }} />
                      ) : (
                        <div style={{ width: 14 }} />
                      )}
                      <div>
                        <Text strong>{perm.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{perm.description}</Text>
                      </div>
                    </Space>
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Divider />
        
        <Alert
          message={`${selectedPermissions.length} permisos seleccionados`}
          type={selectedPermissions.length > 0 ? "success" : "warning"}
          showIcon
        />
      </Modal>
    </div>
  );
};

const UsersManagementPage: React.FC = () => {
  return (
    <App>
      <UsersManagementPageContent />
    </App>
  );
};

export default UsersManagementPage;