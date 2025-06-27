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
  TimePicker,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  App,
  Tooltip,
  Badge,
  InputNumber,
  Divider,
} from "antd";
import {
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DollarOutlined,
  LinkOutlined,
  FireOutlined,
  WarningOutlined,
  EyeOutlined,
  MessageOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Call, CallClient } from "../types";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CallsPageContent: React.FC = () => {
  const { message: appMessage, modal } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const isEmployee = identity?.role === "employee";
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingCall, setEditingCall] = useState<Call | null>(null);
  const [viewingCall, setViewingCall] = useState<Call | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [outcomeFilter, setOutcomeFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Fetch calls from API
  const { data: callsData, isLoading: callsLoading, refetch: refetchCalls } = useList<Call>({
    resource: "calls",
    pagination: { current: 1, pageSize: 100 },
    filters: [
      ...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : []),
      ...(outcomeFilter ? [{ field: 'outcome', operator: 'eq' as const, value: outcomeFilter }] : []),
      ...(isEmployee && identity?.id ? [{ field: 'employee_id', operator: 'eq' as const, value: identity.id }] : []),
    ],
    queryOptions: { enabled: true }
  });

  // Fetch clients for creating calls
  const { data: clientsData } = useList<CallClient>({
    resource: "call-clients",
    pagination: { current: 1, pageSize: 200 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
  });

  // Fetch employees for assignment (admin only)
  const { data: employeesData } = useList({
    resource: "employees",
    pagination: { current: 1, pageSize: 100 },
    queryOptions: { enabled: !isEmployee }
  });

  // CRUD mutations
  const { mutate: createCall, isLoading: isCreating } = useCreate();
  const { mutate: updateCall, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteCall } = useDelete();

  const calls = callsData?.data || [];
  const clients = clientsData?.data || [];
  const employees = employeesData?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const scheduledCalls = calls.filter(c => c.status === 'scheduled').length;
    const failedCalls = calls.filter(c => c.status === 'failed').length;
    
    const todayCalls = calls.filter(c => {
      const callDate = c.scheduled_at || c.completed_at;
      return callDate && dayjs(callDate).isSame(dayjs(), 'day');
    });
    
    const successfulSales = calls.filter(c => c.outcome === 'sale').length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = completedCalls > 0 ? totalDuration / completedCalls : 0;
    
    const conversionRate = completedCalls > 0 ? (successfulSales / completedCalls) * 100 : 0;

    return {
      totalCalls,
      completedCalls,
      scheduledCalls,
      failedCalls,
      todayCallsCount: todayCalls.length,
      successfulSales,
      avgDuration,
      conversionRate,
    };
  }, [calls]);

  const handleCreateCall = (values: any) => {
    const callData = {
      ...values,
      scheduled_at: values.scheduled_at ? dayjs(values.scheduled_at).toISOString() : undefined,
      employee_id: isEmployee ? identity?.id : values.employee_id,
      status: 'scheduled',
    };

    createCall({
      resource: "calls",
      values: callData,
      successNotification: {
        message: "Llamada programada exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
        refetchCalls();
        appMessage.success("Llamada programada exitosamente");
      },
      onError: (error) => {
        console.error("Error creating call:", error);
        appMessage.error("Error al programar llamada");
      }
    });
  };

  const handleUpdateCall = (values: any) => {
    if (!editingCall) return;

    const updateData = {
      ...values,
      scheduled_at: values.scheduled_at ? dayjs(values.scheduled_at).toISOString() : undefined,
      completed_at: values.status === 'completed' && !editingCall.completed_at 
        ? dayjs().toISOString() 
        : editingCall.completed_at,
    };

    updateCall({
      resource: "calls",
      id: editingCall.id,
      values: updateData,
      successNotification: {
        message: "Llamada actualizada exitosamente",
        type: "success",
      },
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingCall(null);
        refetchCalls();
        appMessage.success("Llamada actualizada exitosamente");
      },
      onError: (error) => {
        console.error("Error updating call:", error);
        appMessage.error("Error al actualizar llamada");
      }
    });
  };

  const handleDeleteCall = (call: Call) => {
    modal.confirm({
      title: "Eliminar Llamada",
      content: `¿Estás seguro que deseas eliminar esta llamada con ${call.client_name}?`,
      okText: "Sí, Eliminar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteCall({
          resource: "calls",
          id: call.id,
          successNotification: {
            message: "Llamada eliminada exitosamente",
            type: "success",
          },
        }, {
          onSuccess: () => {
            refetchCalls();
            appMessage.success("Llamada eliminada exitosamente");
          },
          onError: (error) => {
            console.error("Error deleting call:", error);
            appMessage.error("Error al eliminar llamada");
          }
        });
      }
    });
  };

  const handleEditCall = (call: Call) => {
    setEditingCall(call);
    editForm.setFieldsValue({
      client_id: call.client_id,
      employee_id: call.employee_id,
      scheduled_at: call.scheduled_at ? dayjs(call.scheduled_at) : undefined,
      duration: call.duration,
      status: call.status,
      outcome: call.outcome,
      notes: call.notes,
    });
    setIsEditModalVisible(true);
  };

  const handleViewCall = (call: Call) => {
    setViewingCall(call);
    setIsViewModalVisible(true);
  };

  const formatDuration = (seconds: number) => {
    const dur = dayjs.duration(seconds, 'seconds');
    const hours = Math.floor(dur.asHours());
    const mins = dur.minutes();
    const secs = dur.seconds();
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'scheduled': return 'processing';
      case 'failed': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'scheduled': return <ClockCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'rescheduled': return <WarningOutlined />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Programada';
      case 'failed': return 'Fallida';
      case 'rescheduled': return 'Reprogramada';
      default: return status;
    }
  };

  const getOutcomeColor = (outcome?: string | null) => {
    switch (outcome) {
      case 'sale': return 'success';
      case 'follow_up': return 'processing';
      case 'not_interested': return 'error';
      case 'no_answer': return 'warning';
      default: return 'default';
    }
  };

  const getOutcomeIcon = (outcome?: string | null) => {
    switch (outcome) {
      case 'sale': return <DollarOutlined />;
      case 'follow_up': return <LinkOutlined />;
      case 'not_interested': return <CloseCircleOutlined />;
      case 'no_answer': return <PhoneOutlined />;
      default: return null;
    }
  };

  const getOutcomeText = (outcome?: string | null) => {
    switch (outcome) {
      case 'sale': return 'Venta';
      case 'follow_up': return 'Seguimiento';
      case 'not_interested': return 'No interesado';
      case 'no_answer': return 'Sin respuesta';
      default: return '-';
    }
  };

  const columns: ColumnsType<Call> = [
    {
      title: "Cliente",
      key: "client",
      render: (_: any, record: Call) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.client_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.client_id}
          </Text>
        </Space>
      ),
    },
    {
      title: "Empleado",
      key: "employee",
      render: (_: any, record: Call) => (
        <Tag icon={<UserOutlined />} color="blue">
          {record.employee_name}
        </Tag>
      ),
      filters: isEmployee ? undefined : employees.map(emp => ({
        text: emp.name || emp.user?.name || 'Sin nombre',
        value: emp.id as React.Key,
      })),
      onFilter: (value: any, record: Call) => record.employee_id === value,
    },
    {
      title: "Fecha/Hora",
      key: "datetime",
      render: (_, record) => {
        const dateTime = record.scheduled_at || record.completed_at;
        if (!dateTime) return '-';
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(dateTime).format('DD/MM/YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(dateTime).format('HH:mm')}
            </Text>
          </Space>
        );
      },
      sorter: (a: Call, b: Call) => {
        const dateA = a.scheduled_at || a.completed_at;
        const dateB = b.scheduled_at || b.completed_at;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dayjs(dateA).unix() - dayjs(dateB).unix();
      },
    },
    {
      title: "Duración",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => duration ? formatDuration(duration) : '-',
      sorter: (a: Call, b: Call) => (a.duration || 0) - (b.duration || 0),
      width: 100,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'Completada', value: 'completed' },
        { text: 'Programada', value: 'scheduled' },
        { text: 'Fallida', value: 'failed' },
        { text: 'Reprogramada', value: 'rescheduled' },
      ],
      onFilter: (value: any, record: Call) => record.status === value,
    },
    {
      title: "Resultado",
      dataIndex: "outcome",
      key: "outcome",
      render: (outcome?: string | null) => outcome ? (
        <Tag color={getOutcomeColor(outcome)} icon={getOutcomeIcon(outcome)}>
          {getOutcomeText(outcome)}
        </Tag>
      ) : '-',
      filters: [
        { text: 'Venta', value: 'sale' },
        { text: 'Seguimiento', value: 'follow_up' },
        { text: 'No interesado', value: 'not_interested' },
        { text: 'Sin respuesta', value: 'no_answer' },
      ],
      onFilter: (value: any, record: Call) => record.outcome === value,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: Call) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewCall(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditCall(record)}
            />
          </Tooltip>
          {!isEmployee && (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteCall(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Gestión de Llamadas</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Llamadas"
              value={stats.totalCalls}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completadas"
              value={stats.completedCalls}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={(stats.completedCalls / stats.totalCalls) * 100} 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ventas Exitosas"
              value={stats.successfulSales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Conversión: {stats.conversionRate.toFixed(1)}%
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Duración Promedio"
              value={formatDuration(stats.avgDuration)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Alert
            message="Resumen del Día"
            description={`Tienes ${stats.todayCallsCount} llamadas programadas para hoy. ${stats.scheduledCalls} llamadas pendientes en total.`}
            type="info"
            showIcon
            icon={<CalendarOutlined />}
          />
        </Col>
      </Row>

      {/* Action Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Programar Llamada
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchCalls()}
              loading={callsLoading}
            >
              Actualizar
            </Button>
          </Space>
          <Space wrap>
            <Select
              placeholder="Estado"
              style={{ width: 150 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="completed">Completadas</Option>
              <Option value="scheduled">Programadas</Option>
              <Option value="failed">Fallidas</Option>
              <Option value="rescheduled">Reprogramadas</Option>
            </Select>
            <Select
              placeholder="Resultado"
              style={{ width: 150 }}
              allowClear
              value={outcomeFilter}
              onChange={setOutcomeFilter}
            >
              <Option value="sale">Ventas</Option>
              <Option value="follow_up">Seguimiento</Option>
              <Option value="not_interested">No interesado</Option>
              <Option value="no_answer">Sin respuesta</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* Calls Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={calls}
          rowKey="id"
          loading={callsLoading}
          scroll={{ x: 1000 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} llamadas`,
          }}
        />
      </Card>

      {/* Create Call Modal */}
      <Modal
        title="Programar Nueva Llamada"
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
          onFinish={handleCreateCall}
          layout="vertical"
        >
          <Form.Item
            name="client_id"
            label="Cliente"
            rules={[{ required: true, message: "Por favor selecciona un cliente" }]}
          >
            <Select 
              placeholder="Selecciona un cliente"
              showSearch
              filterOption={(input, option) =>
                option?.children ? String(option.children).toLowerCase().includes(input.toLowerCase()) : false
              }
            >
              {clients.map(client => (
                <Option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {!isEmployee && (
            <Form.Item
              name="employee_id"
              label="Asignar a"
              rules={[{ required: true, message: "Por favor selecciona un empleado" }]}
            >
              <Select placeholder="Selecciona un empleado">
                {employees.map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    {emp.name || emp.user?.name || 'Sin nombre'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="scheduled_at"
            label="Fecha y Hora"
            rules={[{ required: true, message: "Por favor selecciona fecha y hora" }]}
          >
            <DatePicker 
              showTime 
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Selecciona fecha y hora"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notas"
          >
            <TextArea rows={3} placeholder="Notas sobre la llamada..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                icon={<PhoneOutlined />}
              >
                Programar Llamada
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

      {/* Edit Call Modal */}
      <Modal
        title="Editar Llamada"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingCall(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateCall}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Estado"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="scheduled">Programada</Option>
                  <Option value="completed">Completada</Option>
                  <Option value="failed">Fallida</Option>
                  <Option value="rescheduled">Reprogramada</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="outcome"
                label="Resultado"
              >
                <Select allowClear>
                  <Option value="sale">Venta</Option>
                  <Option value="follow_up">Seguimiento</Option>
                  <Option value="not_interested">No interesado</Option>
                  <Option value="no_answer">Sin respuesta</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduled_at"
                label="Fecha y Hora"
              >
                <DatePicker 
                  showTime 
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Duración (segundos)"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {!isEmployee && (
            <Form.Item
              name="employee_id"
              label="Empleado"
            >
              <Select>
                {employees.map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    {emp.name || emp.user?.name || 'Sin nombre'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="notes"
            label="Notas"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<EditOutlined />}
              >
                Actualizar Llamada
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setEditingCall(null);
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Call Modal */}
      <Modal
        title="Detalles de la Llamada"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingCall(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalVisible(false);
            setViewingCall(null);
          }}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {viewingCall && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Información del Cliente">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Cliente:</Text>
                      <br />
                      <Text strong>{viewingCall.client_name}</Text>
                    </div>
                    <div>
                      <Text type="secondary">ID Cliente:</Text>
                      <br />
                      <Text>{viewingCall.client_id}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Información del Empleado">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Empleado:</Text>
                      <br />
                      <Text strong>{viewingCall.employee_name}</Text>
                    </div>
                    <div>
                      <Text type="secondary">ID Empleado:</Text>
                      <br />
                      <Text>{viewingCall.employee_id}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            
            <Card size="small" title="Detalles de la Llamada" style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text type="secondary">Estado:</Text>
                  <br />
                  <Tag color={getStatusColor(viewingCall.status)} icon={getStatusIcon(viewingCall.status)}>
                    {getStatusText(viewingCall.status)}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Resultado:</Text>
                  <br />
                  {viewingCall.outcome ? (
                    <Tag color={getOutcomeColor(viewingCall.outcome)} icon={getOutcomeIcon(viewingCall.outcome)}>
                      {getOutcomeText(viewingCall.outcome)}
                    </Tag>
                  ) : '-'}
                </Col>
                <Col span={8}>
                  <Text type="secondary">Duración:</Text>
                  <br />
                  <Text>{viewingCall.duration ? formatDuration(viewingCall.duration) : '-'}</Text>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Programada para:</Text>
                  <br />
                  <Text>
                    {viewingCall.scheduled_at 
                      ? dayjs(viewingCall.scheduled_at).format('DD/MM/YYYY HH:mm')
                      : '-'}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Completada en:</Text>
                  <br />
                  <Text>
                    {viewingCall.completed_at 
                      ? dayjs(viewingCall.completed_at).format('DD/MM/YYYY HH:mm')
                      : '-'}
                  </Text>
                </Col>
              </Row>
            </Card>
            
            {viewingCall.notes && (
              <Card size="small" title="Notas" style={{ marginTop: 16 }}>
                <Text>{viewingCall.notes}</Text>
              </Card>
            )}
            
            <Card size="small" title="Información del Sistema" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Creado:</Text>
                  <br />
                  <Text>{dayjs(viewingCall.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Última actualización:</Text>
                  <br />
                  <Text>{dayjs(viewingCall.updated_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CallsPage: React.FC = () => {
  return (
    <App>
      <CallsPageContent />
    </App>
  );
};

export default CallsPage;