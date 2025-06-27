import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Card,
  Space,
  Typography,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Input,
  App,
} from "antd";
import {
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FireOutlined,
  TrophyOutlined,
  MessageOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useGetIdentity } from "@refinedev/core";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AssignedCall {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  priority: "high" | "medium" | "low";
  assignedDate: string;
  status: "pending" | "completed";
  feedback?: string;
  result?: "sold" | "interested" | "not_interested" | "call_later" | "no_answer" | "busy";
  callDuration?: number;
  subscriptionLink?: string;
}

const AssignedCallsPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const [assignedCalls, setAssignedCalls] = useState<AssignedCall[]>([
    {
      id: "1",
      clientName: "Ana Martínez",
      clientPhone: "+1234567890",
      clientEmail: "ana@ejemplo.com",
      priority: "high",
      assignedDate: moment().format("YYYY-MM-DD"),
      status: "pending",
    },
    {
      id: "2",
      clientName: "Carlos Rodríguez",
      clientPhone: "+1234567891",
      clientEmail: "carlos@ejemplo.com",
      priority: "medium",
      assignedDate: moment().format("YYYY-MM-DD"),
      status: "pending",
    },
    {
      id: "3",
      clientName: "Luis Fernández",
      clientPhone: "+1234567892",
      clientEmail: "luis@ejemplo.com",
      priority: "low",
      assignedDate: moment().format("YYYY-MM-DD"),
      status: "completed",
      feedback: "Cliente muy interesado pero quiere pensarlo durante el fin de semana. Prefiere que lo llamen el lunes por la mañana.",
      result: "call_later",
      callDuration: 380,
    },
  ]);

  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [selectedCall, setSelectedCall] = useState<AssignedCall | null>(null);
  const [form] = Form.useForm();

  const todayAssignedCalls = assignedCalls.filter(call => 
    call.assignedDate === moment().format("YYYY-MM-DD")
  );
  const completedToday = todayAssignedCalls.filter(call => call.status === "completed").length;
  const dailyCallsGoal = 25;
  const remainingCalls = Math.max(0, dailyCallsGoal - completedToday);
  const todaySales = todayAssignedCalls.filter(call => call.result === "sold").length;

  const getPriorityColor = (priority: string) => {
    const colors = { high: "red", medium: "orange", low: "green" };
    return colors[priority as keyof typeof colors] || "default";
  };

  const getResultColor = (result: string) => {
    const colors = {
      sold: "green",
      interested: "blue", 
      not_interested: "red",
      call_later: "orange",
      no_answer: "gray",
      busy: "yellow",
    };
    return colors[result as keyof typeof colors] || "default";
  };

  const showFeedbackModal = (call: AssignedCall) => {
    setSelectedCall(call);
    form.resetFields();
    setIsFeedbackModalVisible(true);
  };

  const handleFeedbackSubmit = () => {
    form.validateFields().then((values) => {
      if (!selectedCall) return;

      const updatedCalls = assignedCalls.map(call => {
        if (call.id === selectedCall.id) {
          const updatedCall: AssignedCall = {
            ...call,
            status: "completed",
            feedback: values.feedback,
            result: values.result,
            callDuration: values.callDuration,
          };

          // Generate subscription link if sold
          if (values.result === "sold" && identity?.employeeCode) {
            updatedCall.subscriptionLink = `https://lamattress.com/subscribe/${identity.employeeCode}`;
          }

          return updatedCall;
        }
        return call;
      });

      setAssignedCalls(updatedCalls);
      message.success("Feedback registrado exitosamente");

      // Check if employee reached daily goal
      const newCompletedCount = completedToday + 1;
      if (newCompletedCount === dailyCallsGoal) {
        Modal.success({
          title: "¡Felicitaciones!",
          content: "Has completado tu meta diaria de 25 llamadas. ¡Excelente trabajo!",
          icon: <TrophyOutlined style={{ color: "#faad14" }} />,
        });
      }

      setIsFeedbackModalVisible(false);
      form.resetFields();
      setSelectedCall(null);
    });
  };

  const columns = [
    {
      title: "Cliente",
      key: "client",
      render: (_: any, record: AssignedCall) => (
        <Space direction="vertical" size={0}>
          <strong>{record.clientName}</strong>
          <small>{record.clientPhone}</small>
          <small>{record.clientEmail}</small>
        </Space>
      ),
    },
    {
      title: "Prioridad",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === "high" && "ALTA"}
          {priority === "medium" && "MEDIA"}
          {priority === "low" && "BAJA"}
        </Tag>
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: AssignedCall) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === "completed" ? "green" : "orange"}>
            {status === "completed" ? "COMPLETADA" : "PENDIENTE"}
          </Tag>
          {record.result && (
            <Tag color={getResultColor(record.result)}>
              {record.result === "sold" && "Vendido"}
              {record.result === "interested" && "Interesado"}
              {record.result === "not_interested" && "No Interesado"}
              {record.result === "call_later" && "Llamar Después"}
              {record.result === "no_answer" && "No Contestó"}
              {record.result === "busy" && "Ocupado"}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Feedback",
      dataIndex: "feedback",
      key: "feedback",
      width: 300,
      ellipsis: true,
      render: (feedback: string) => feedback || "-",
    },
    {
      title: "Link Suscripción",
      dataIndex: "subscriptionLink",
      key: "subscriptionLink",
      render: (link: string) => {
        if (!link) return "-";
        return (
          <Button
            icon={<LinkOutlined />}
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(link);
              message.success("Link copiado al portapapeles");
            }}
          >
            Copiar
          </Button>
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: AssignedCall) => (
        <Space>
          {record.status === "pending" ? (
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => showFeedbackModal(record)}
              size="small"
            >
              Completar Llamada
            </Button>
          ) : (
            <Button
              icon={<MessageOutlined />}
              onClick={() => showFeedbackModal(record)}
              size="small"
            >
              Ver Feedback
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <Title level={2}>Mis Llamadas Asignadas</Title>
          </div>
        </Col>

        <Col span={24}>
          <Alert
            message={`Meta Diaria: ${completedToday} / ${dailyCallsGoal} llamadas completadas`}
            description={
              remainingCalls > 0 
                ? `Te faltan ${remainingCalls} llamadas por completar hoy.`
                : "¡Felicitaciones! Has completado tu meta diaria."
            }
            type={remainingCalls > 10 ? "warning" : remainingCalls > 0 ? "info" : "success"}
            showIcon
            icon={remainingCalls === 0 ? <TrophyOutlined /> : <PhoneOutlined />}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Llamadas Completadas Hoy"
              value={completedToday}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${dailyCallsGoal}`}
            />
            <Progress 
              percent={Math.min((completedToday / dailyCallsGoal) * 100, 100)} 
              size="small" 
              status={completedToday >= dailyCallsGoal ? "success" : "active"}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ventas Hoy"
              value={todaySales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
            {todaySales >= 3 && <FireOutlined style={{ color: "#ff4d4f", fontSize: "24px" }} />}
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Llamadas Pendientes"
              value={todayAssignedCalls.filter(c => c.status === "pending").length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tasa de Conversión"
              value={completedToday > 0 ? ((todaySales / completedToday) * 100).toFixed(1) : "0"}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Lista de Llamadas Asignadas">
            <Table
              columns={columns}
              dataSource={todayAssignedCalls}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedCall?.status === "completed" ? "Ver Feedback" : "Completar Llamada"}
        open={isFeedbackModalVisible}
        onOk={selectedCall?.status === "pending" ? handleFeedbackSubmit : undefined}
        onCancel={() => {
          setIsFeedbackModalVisible(false);
          setSelectedCall(null);
          form.resetFields();
        }}
        footer={selectedCall?.status === "completed" ? [
          <Button key="close" onClick={() => setIsFeedbackModalVisible(false)}>
            Cerrar
          </Button>
        ] : undefined}
        width={600}
      >
        {selectedCall && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <h4>Información del Cliente</h4>
              <p><strong>Nombre:</strong> {selectedCall.clientName}</p>
              <p><strong>Teléfono:</strong> {selectedCall.clientPhone}</p>
              <p><strong>Email:</strong> {selectedCall.clientEmail}</p>
              <p><strong>Prioridad:</strong> 
                <Tag color={getPriorityColor(selectedCall.priority)} style={{ marginLeft: 8 }}>
                  {selectedCall.priority.toUpperCase()}
                </Tag>
              </p>
            </Card>

            {selectedCall.status === "pending" ? (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="result"
                  label="Resultado de la Llamada"
                  rules={[{ required: true, message: "Seleccione el resultado" }]}
                >
                  <Select placeholder="¿Cómo fue la llamada?">
                    <Option value="sold">Vendido - Cliente compró</Option>
                    <Option value="interested">Interesado - Quiere más información</Option>
                    <Option value="not_interested">No Interesado - No le interesa</Option>
                    <Option value="call_later">Llamar Después - Pedir llamar más tarde</Option>
                    <Option value="no_answer">No Contestó - No respondió</Option>
                    <Option value="busy">Ocupado - Línea ocupada</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="callDuration"
                  label="Duración de la Llamada (segundos)"
                  rules={[{ required: true, message: "Ingrese la duración" }]}
                >
                  <Input type="number" min={0} placeholder="Ej: 180 (3 minutos)" />
                </Form.Item>

                <Form.Item
                  name="feedback"
                  label="Feedback Detallado"
                  rules={[
                    { required: true, message: "El feedback es obligatorio" },
                    { min: 20, message: "El feedback debe tener al menos 20 caracteres" },
                  ]}
                  extra="Describe detalladamente cómo fue la conversación, qué dijo el cliente, su actitud, etc."
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Ej: El cliente se mostró muy interesado en el colchón premium. Mencionó que tiene problemas de espalda y está buscando algo específico. Pidió más detalles sobre la garantía. Se comprometió a decidir mañana."
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>
              </Form>
            ) : (
              <div>
                <h4>Feedback de la Llamada:</h4>
                <p style={{ 
                  background: "#f5f5f5", 
                  padding: "12px", 
                  borderRadius: "4px",
                  whiteSpace: "pre-wrap"
                }}>
                  {selectedCall.feedback}
                </p>
                
                {selectedCall.result && (
                  <p>
                    <strong>Resultado:</strong> 
                    <Tag color={getResultColor(selectedCall.result)} style={{ marginLeft: 8 }}>
                      {selectedCall.result === "sold" && "Vendido"}
                      {selectedCall.result === "interested" && "Interesado"}
                      {selectedCall.result === "not_interested" && "No Interesado"}
                      {selectedCall.result === "call_later" && "Llamar Después"}
                      {selectedCall.result === "no_answer" && "No Contestó"}
                      {selectedCall.result === "busy" && "Ocupado"}
                    </Tag>
                  </p>
                )}

                {selectedCall.callDuration && (
                  <p>
                    <strong>Duración:</strong> {Math.floor(selectedCall.callDuration / 60)}:{(selectedCall.callDuration % 60).toString().padStart(2, '0')} minutos
                  </p>
                )}

                {selectedCall.subscriptionLink && (
                  <p>
                    <strong>Link de Suscripción:</strong>
                    <Button
                      type="link"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCall.subscriptionLink!);
                        message.success("Link copiado");
                      }}
                    >
                      {selectedCall.subscriptionLink}
                    </Button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignedCallsPage;