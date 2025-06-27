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
  DatePicker,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Timeline,
  Alert,
  App,
  Tooltip,
  Badge,
  Divider,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  SearchOutlined,
  TeamOutlined,
  StarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  UserOutlined,
  BankOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { CallClient } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CallClientsPageContent: React.FC = () => {
  const { message: appMessage, modal } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const isEmployee = identity?.role === "employee";
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<CallClient | null>(null);
  const [viewingClient, setViewingClient] = useState<CallClient | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);

  // Fetch call clients from API
  const { data: clientsData, isLoading: clientsLoading, refetch: refetchClients } = useList<CallClient>({
    resource: "call-clients",
    pagination: { current: 1, pageSize: 100 },
    filters: [
      ...(searchText ? [{ field: 'search', operator: 'contains' as const, value: searchText }] : []),
      ...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : []),
      ...(priorityFilter ? [{ field: 'priority', operator: 'eq' as const, value: priorityFilter }] : []),
    ],
    queryOptions: { enabled: true }
  });

  // Fetch employees for assignment
  const { data: employeesData } = useList({
    resource: "employees",
    pagination: { current: 1, pageSize: 100 },
  });

  // CRUD mutations
  const { mutate: createClient, isLoading: isCreating } = useCreate();
  const { mutate: updateClient, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteClient } = useDelete();

  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const inactiveClients = totalClients - activeClients;
    const highPriorityClients = clients.filter(c => c.priority === 'high').length;
    const withRecentContact = clients.filter(c => {
      if (!c.last_contact_date) return false;
      const lastContact = dayjs(c.last_contact_date);
      return lastContact.isAfter(dayjs().subtract(7, 'days'));
    }).length;

    return {
      totalClients,
      activeClients,
      inactiveClients,
      highPriorityClients,
      withRecentContact,
    };
  }, [clients]);

  const handleCreateClient = (values: any) => {
    createClient({
      resource: "call-clients",
      values: {
        ...values,
        status: values.status || 'active',
        priority: values.priority || 'medium',
      },
      successNotification: {
        message: "Cliente creado exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        refetchClients();
        appMessage.success("Cliente creado exitosamente");
      },
      onError: (error) => {
        console.error("Error creating client:", error);
        appMessage.error("Error al crear cliente");
      }
    });
  };

  const handleUpdateClient = (values: any) => {
    if (!editingClient) return;

    updateClient({
      resource: "call-clients",
      id: editingClient.id,
      values,
      successNotification: {
        message: "Cliente actualizado exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingClient(null);
        refetchClients();
        appMessage.success("Cliente actualizado exitosamente");
      },
      onError: (error) => {
        console.error("Error updating client:", error);
        appMessage.error("Error al actualizar cliente");
      }
    });
  };

  const handleDeleteClient = (client: CallClient) => {
    modal.confirm({
      title: "Eliminar Cliente",
      content: `¿Estás seguro que deseas eliminar a ${client.name}?`,
      okText: "Sí, Eliminar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteClient({
          resource: "call-clients",
          id: client.id,
          successNotification: {
            message: "Cliente eliminado exitosamente",
            type: "success",
          },
        }, {
          onSuccess: () => {
            refetchClients();
            appMessage.success("Cliente eliminado exitosamente");
          },
          onError: (error) => {
            console.error("Error deleting client:", error);
            appMessage.error("Error al eliminar cliente");
          }
        });
      }
    });
  };

  const handleEditClient = (client: CallClient) => {
    setEditingClient(client);
    editForm.setFieldsValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      status: client.status,
      priority: client.priority,
      notes: client.notes,
      assigned_employee_id: client.assigned_employee_id,
    });
    setIsEditModalVisible(true);
  };

  const handleViewClient = (client: CallClient) => {
    setViewingClient(client);
    setIsViewModalVisible(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <FireOutlined />;
      case 'medium': return <ExclamationCircleOutlined />;
      case 'low': return <ClockCircleOutlined />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge status="success" text="Activo" />
      : <Badge status="default" text="Inactivo" />;
  };

  const columns: ColumnsType<CallClient> = [
    {
      title: "Cliente",
      key: "client",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <Text strong>{record.name}</Text>
            {record.priority && (
              <Tag color={getPriorityColor(record.priority)} icon={getPriorityIcon(record.priority)}>
                {record.priority === 'high' ? 'Alta' : record.priority === 'medium' ? 'Media' : 'Baja'} Prioridad
              </Tag>
            )}
          </Space>
          {record.company && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <BankOutlined style={{ marginRight: 4 }} />
              {record.company}
            </Text>
          )}
        </Space>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        const searchValue = value.toString().toLowerCase();
        return (
          record.name.toLowerCase().includes(searchValue) ||
          (record.email?.toLowerCase().includes(searchValue) ?? false) ||
          (record.phone?.includes(searchValue) ?? false) ||
          (record.company?.toLowerCase().includes(searchValue) ?? false)
        );
      },
    },
    {
      title: "Contacto",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.phone}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.email}
          </Text>
        </Space>
      ),
      width: 200,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusBadge(status),
      filters: [
        { text: 'Activo', value: 'active' },
        { text: 'Inactivo', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 100,
    },
    {
      title: "Último Contacto",
      dataIndex: "last_contact_date",
      key: "last_contact_date",
      render: (date: string) => date ? (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Space>
      ) : (
        <Text type="secondary">Sin contacto</Text>
      ),
      sorter: (a, b) => {
        if (!a.last_contact_date && !b.last_contact_date) return 0;
        if (!a.last_contact_date) return 1;
        if (!b.last_contact_date) return -1;
        return dayjs(a.last_contact_date).unix() - dayjs(b.last_contact_date).unix();
      },
      width: 150,
    },
    {
      title: "Asignado a",
      key: "assigned",
      render: (_, record) => {
        const employee = employees.find(e => e.id === record.assigned_employee_id);
        return employee ? (
          <Tag icon={<UserOutlined />} color="blue">
            {employee.name || employee.user?.name || 'Sin nombre'}
          </Tag>
        ) : (
          <Text type="secondary">Sin asignar</Text>
        );
      },
      width: 150,
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
              onClick={() => handleViewClient(record)}
            />
          </Tooltip>
          {!isEmployee && (
            <>
              <Tooltip title="Editar">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditClient(record)}
                />
              </Tooltip>
              <Popconfirm
                title="¿Eliminar cliente?"
                description="Esta acción no se puede deshacer"
                onConfirm={() => handleDeleteClient(record)}
                okText="Sí"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Gestión de Clientes</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Clientes"
              value={stats.totalClients}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Clientes Activos"
              value={stats.activeClients}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Alta Prioridad"
              value={stats.highPriorityClients}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Contactados (7 días)"
              value={stats.withRecentContact}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            {!isEmployee && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Agregar Cliente
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchClients()}
              loading={clientsLoading}
            >
              Actualizar
            </Button>
          </Space>
          <Space wrap>
            <Input.Search
              placeholder="Buscar clientes..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="Estado"
              style={{ width: 120 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="active">Activos</Option>
              <Option value="inactive">Inactivos</Option>
            </Select>
            <Select
              placeholder="Prioridad"
              style={{ width: 120 }}
              allowClear
              value={priorityFilter}
              onChange={setPriorityFilter}
            >
              <Option value="high">Alta</Option>
              <Option value="medium">Media</Option>
              <Option value="low">Baja</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* Clients Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="id"
          loading={clientsLoading}
          scroll={{ x: 1000 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} clientes`,
          }}
        />
      </Card>

      {/* Create Client Modal */}
      <Modal
        title="Agregar Nuevo Cliente"
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
          onFinish={handleCreateClient}
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
                rules={[{ required: true, message: "Por favor ingresa el teléfono" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company"
                label="Empresa"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Prioridad"
                initialValue="medium"
              >
                <Select>
                  <Option value="high">Alta</Option>
                  <Option value="medium">Media</Option>
                  <Option value="low">Baja</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assigned_employee_id"
                label="Asignar a"
              >
                <Select placeholder="Selecciona un empleado">
                  {employees.map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      {emp.name || emp.user?.name || 'Sin nombre'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notas"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                icon={<UserAddOutlined />}
              >
                Crear Cliente
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

      {/* Edit Client Modal */}
      <Modal
        title="Editar Cliente"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingClient(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateClient}
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
                rules={[{ required: true, message: "Por favor ingresa el teléfono" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company"
                label="Empresa"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Prioridad"
              >
                <Select>
                  <Option value="high">Alta</Option>
                  <Option value="medium">Media</Option>
                  <Option value="low">Baja</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assigned_employee_id"
            label="Asignar a"
          >
            <Select placeholder="Selecciona un empleado">
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name || emp.user?.name || 'Sin nombre'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notas"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<EditOutlined />}
              >
                Actualizar Cliente
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setEditingClient(null);
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Client Modal */}
      <Modal
        title="Detalles del Cliente"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingClient(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalVisible(false);
            setViewingClient(null);
          }}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {viewingClient && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Información Personal">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Nombre:</Text>
                      <br />
                      <Text strong>{viewingClient.name}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Email:</Text>
                      <br />
                      <Text>{viewingClient.email}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Teléfono:</Text>
                      <br />
                      <Text>{viewingClient.phone}</Text>
                    </div>
                    {viewingClient.company && (
                      <div>
                        <Text type="secondary">Empresa:</Text>
                        <br />
                        <Text>{viewingClient.company}</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Estado del Cliente">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Estado:</Text>
                      <br />
                      {getStatusBadge(viewingClient.status)}
                    </div>
                    <div>
                      <Text type="secondary">Prioridad:</Text>
                      <br />
                      <Tag color={getPriorityColor(viewingClient.priority)} icon={getPriorityIcon(viewingClient.priority)}>
                        {viewingClient.priority === 'high' ? 'Alta' : viewingClient.priority === 'medium' ? 'Media' : 'Baja'}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary">Último Contacto:</Text>
                      <br />
                      <Text>
                        {viewingClient.last_contact_date 
                          ? dayjs(viewingClient.last_contact_date).format('DD/MM/YYYY HH:mm')
                          : 'Sin contacto previo'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            
            {viewingClient.notes && (
              <Card size="small" title="Notas" style={{ marginTop: 16 }}>
                <Text>{viewingClient.notes}</Text>
              </Card>
            )}
            
            <Card size="small" title="Información Adicional" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Creado:</Text>
                  <br />
                  <Text>{dayjs(viewingClient.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Última actualización:</Text>
                  <br />
                  <Text>{dayjs(viewingClient.updated_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CallClientsPage: React.FC = () => {
  return (
    <App>
      <CallClientsPageContent />
    </App>
  );
};

export default CallClientsPage;