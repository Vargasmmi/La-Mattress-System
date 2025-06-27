import React, { useState } from "react";
import { useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Card,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Popconfirm,
  Select,
  DatePicker,
  Switch,
  Avatar,
  Tooltip,
  Divider,
  Alert,
  App,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  PhoneOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Employee, Store } from "../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeesPageContent: React.FC = () => {
  const { message: appMessage, modal } = App.useApp();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Fetch employees from API
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = useList<Employee>({
    resource: "employees",
    pagination: { current: 1, pageSize: 50 },
    queryOptions: { enabled: true }
  });

  // Fetch stores for the select dropdown
  const { data: storesData, isLoading: storesLoading } = useList<Store>({
    resource: "stores",
    pagination: { current: 1, pageSize: 100 },
    queryOptions: { enabled: true }
  });

  // CRUD mutations
  const { mutate: createEmployee, isLoading: isCreating } = useCreate();
  const { mutate: updateEmployee, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteEmployee, isLoading: isDeleting } = useDelete();

  const employees = employeesData?.data || [];
  const stores = storesData?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.is_active).length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    const averageCallGoal = totalEmployees > 0 
      ? employees.reduce((sum, emp) => sum + (emp.daily_call_goal || 0), 0) / totalEmployees 
      : 0;

    const roleDistribution = employees.reduce((acc, emp) => {
      const role = emp.role || emp.user?.role || 'agent';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      averageCallGoal,
      roleDistribution,
    };
  }, [employees]);

  const generateEmployeeCode = () => {
    const existingCodes = employees.map(emp => emp.employee_code);
    let number = 1;
    let code = `EMP${number.toString().padStart(3, "0")}`;
    
    while (existingCodes.includes(code)) {
      number++;
      code = `EMP${number.toString().padStart(3, "0")}`;
    }
    
    return code;
  };

  const handleCreateEmployee = (values: any) => {
    const employeeData = {
      ...values,
      employee_code: values.employee_code || generateEmployeeCode(),
      daily_call_goal: values.daily_call_goal || 50,
      hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : undefined,
    };

    createEmployee({
      resource: "employees",
      values: employeeData,
      successNotification: {
        message: "Empleado creado exitosamente",
        type: "success",
      },
      errorNotification: {
        message: "Error al crear empleado",
        type: "error",
      },
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        refetchEmployees();
        appMessage.success("Empleado creado exitosamente");
      },
      onError: (error) => {
        console.error("Error creating employee:", error);
        appMessage.error("Error al crear empleado");
      }
    });
  };

  const handleUpdateEmployee = (values: any) => {
    if (!editingEmployee) return;

    const updateData = {
      ...values,
      hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : undefined,
    };

    updateEmployee({
      resource: "employees",
      id: editingEmployee.id,
      values: updateData,
      successNotification: {
        message: "Empleado actualizado exitosamente",
        type: "success",
      },
      errorNotification: {
        message: "Error al actualizar empleado",
        type: "error",
      },
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingEmployee(null);
        refetchEmployees();
        appMessage.success("Empleado actualizado exitosamente");
      },
      onError: (error) => {
        console.error("Error updating employee:", error);
        appMessage.error("Error al actualizar empleado");
      }
    });
  };

  const handleDeleteEmployee = (employee: Employee) => {
    modal.confirm({
      title: "Eliminar Empleado",
      content: `¿Estás seguro que deseas eliminar a ${employee.name || employee.user?.name || 'este empleado'}?`,
      okText: "Sí, Eliminar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteEmployee({
          resource: "employees",
          id: employee.id,
          successNotification: {
            message: "Empleado eliminado exitosamente",
            type: "success",
          },
          errorNotification: {
            message: "Error al eliminar empleado",
            type: "error",
          },
        }, {
          onSuccess: () => {
            refetchEmployees();
            appMessage.success("Empleado eliminado exitosamente");
          },
          onError: (error) => {
            console.error("Error deleting employee:", error);
            appMessage.error("Error al eliminar empleado");
          }
        });
      }
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    editForm.setFieldsValue({
      name: employee.name || employee.user?.name,
      phone: employee.phone,
      role: employee.role || employee.user?.role,
      store_id: employee.store_id,
      daily_call_goal: employee.daily_call_goal,
      is_active: employee.is_active,
      hire_date: employee.hire_date ? dayjs(employee.hire_date) : undefined,
    });
    setIsEditModalVisible(true);
  };

  const toggleEmployeeStatus = (employee: Employee) => {
    updateEmployee({
      resource: "employees",
      id: employee.id,
      values: {
        is_active: !employee.is_active,
      },
    }, {
      onSuccess: () => {
        refetchEmployees();
        appMessage.success(`Empleado ${employee.is_active ? 'desactivado' : 'activado'} exitosamente`);
      },
      onError: (error) => {
        console.error("Error toggling employee status:", error);
        appMessage.error("Error al cambiar estado del empleado");
      }
    });
  };

  const getAvatarColor = (role?: string) => {
    switch (role) {
      case 'admin': return '#f50';
      case 'supervisor': return '#1890ff';
      case 'agent': return '#52c41a';
      default: return '#722ed1';
    }
  };

  const getRoleTag = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Tag color="red" icon={<TrophyOutlined />}>Administrador</Tag>;
      case 'supervisor':
        return <Tag color="blue" icon={<TeamOutlined />}>Supervisor</Tag>;
      case 'agent':
        return <Tag color="green" icon={<UserOutlined />}>Agente</Tag>;
      default:
        return <Tag color="default">Sin rol</Tag>;
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: "Empleado",
      key: "employee",
      render: (_, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: getAvatarColor(record.role || record.user?.role) }}
            icon={<UserOutlined />}
          >
            {(record.name || record.user?.name || 'N/A').split(' ').map(n => n[0]).join('').toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.name || record.user?.name || 'Sin nombre'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email || record.user?.email || 'Sin email'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.employee_code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contacto",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.phone && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </Text>
          )}
          {record.store?.name && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <TeamOutlined style={{ marginRight: 4 }} />
              {record.store.name}
            </Text>
          )}
        </Space>
      ),
      width: 200,
    },
    {
      title: "Rol",
      key: "role",
      render: (_, record) => getRoleTag(record.role || record.user?.role),
      filters: [
        { text: 'Administrador', value: 'admin' },
        { text: 'Supervisor', value: 'supervisor' },
        { text: 'Agente', value: 'agent' },
      ],
      onFilter: (value, record) => (record.role || record.user?.role) === value,
      width: 150,
    },
    {
      title: "Meta Diaria",
      dataIndex: "daily_call_goal",
      key: "daily_call_goal",
      render: (goal: number) => (
        <Space>
          <PhoneOutlined />
          <Text>{goal || 0} llamadas</Text>
        </Space>
      ),
      sorter: (a, b) => (a.daily_call_goal || 0) - (b.daily_call_goal || 0),
      width: 120,
    },
    {
      title: "Estado",
      key: "status",
      render: (_, record) => (
        <Space>
          <Tag
            color={record.is_active ? 'success' : 'error'}
            icon={record.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {record.is_active ? 'Activo' : 'Inactivo'}
          </Tag>
          <Switch
            size="small"
            checked={record.is_active}
            onChange={() => toggleEmployeeStatus(record)}
          />
        </Space>
      ),
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      width: 120,
    },
    {
      title: "Fecha Ingreso",
      dataIndex: "hire_date",
      key: "hire_date",
      render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY") : "N/A",
      sorter: (a, b) => {
        if (!a.hire_date && !b.hire_date) return 0;
        if (!a.hire_date) return 1;
        if (!b.hire_date) return -1;
        return dayjs(a.hire_date).unix() - dayjs(b.hire_date).unix();
      },
      width: 120,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditEmployee(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar empleado?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDeleteEmployee(record)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
      width: 100,
      fixed: "right",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Gestión de Empleados</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Empleados"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Empleados Activos"
              value={stats.activeEmployees}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Empleados Inactivos"
              value={stats.inactiveEmployees}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Meta Promedio"
              value={Math.round(stats.averageCallGoal)}
              prefix={<PhoneOutlined />}
              suffix="llamadas"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Agregar Empleado
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchEmployees()}
              loading={employeesLoading}
            >
              Actualizar
            </Button>
          </Space>
          <Space>
            {Object.entries(stats.roleDistribution).map(([role, count]) => (
              <Tag key={role} color={role === 'admin' ? 'red' : role === 'supervisor' ? 'blue' : 'green'}>
                {role === 'admin' ? 'Admins' : role === 'supervisor' ? 'Supervisores' : 'Agentes'}: {count}
              </Tag>
            ))}
          </Space>
        </Space>
      </Card>

      {/* Employees Table */}
      <Card>
        {employees.length === 0 && !employeesLoading && (
          <Alert
            message="No hay empleados registrados"
            description="Agrega el primer empleado haciendo clic en 'Agregar Empleado'"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={employeesLoading || isDeleting}
          scroll={{ x: 1200 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} empleados`,
          }}
        />
      </Card>

      {/* Create Employee Modal */}
      <Modal
        title="Agregar Nuevo Empleado"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          onFinish={handleCreateEmployee}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre Completo"
                rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
              >
                <Input />
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
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Teléfono"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employee_code"
                label="Código Empleado"
                tooltip="Se generará automáticamente si se deja vacío"
              >
                <Input placeholder={generateEmployeeCode()} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true, message: "Selecciona un rol" }]}
              >
                <Select>
                  <Option value="agent">Agente</Option>
                  <Option value="supervisor">Supervisor</Option>
                  <Option value="admin">Administrador</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="store_id"
                label="Tienda"
              >
                <Select
                  placeholder="Selecciona una tienda"
                  loading={storesLoading}
                  allowClear
                >
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>{store.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="daily_call_goal"
                label="Meta Diaria de Llamadas"
                initialValue={50}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hire_date"
                label="Fecha de Ingreso"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                icon={<UserAddOutlined />}
              >
                Crear Empleado
              </Button>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                createForm.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title="Editar Empleado"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingEmployee(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateEmployee}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre Completo"
                rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Teléfono"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true, message: "Selecciona un rol" }]}
              >
                <Select>
                  <Option value="agent">Agente</Option>
                  <Option value="supervisor">Supervisor</Option>
                  <Option value="admin">Administrador</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="store_id"
                label="Tienda"
              >
                <Select
                  placeholder="Selecciona una tienda"
                  loading={storesLoading}
                  allowClear
                >
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>{store.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="daily_call_goal"
                label="Meta Diaria de Llamadas"
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hire_date"
                label="Fecha de Ingreso"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Estado"
            valuePropName="checked"
          >
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<EditOutlined />}
              >
                Actualizar Empleado
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setEditingEmployee(null);
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const EmployeesPage: React.FC = () => {
  return (
    <App>
      <EmployeesPageContent />
    </App>
  );
};

export default EmployeesPage;