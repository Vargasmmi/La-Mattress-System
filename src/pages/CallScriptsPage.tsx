import React, { useState } from "react";
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
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  List,
  Select,
  App,
} from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  EyeOutlined,
  CopyOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CallScript {
  id: string;
  name: string;
  category: "sales" | "reactivation" | "new_client" | "follow_up";
  content: string;
  variables: string[];
  effectiveness: number;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  isActive: boolean;
}

const CallScriptsPage: React.FC = () => {
  const { message } = App.useApp();
  const [scripts, setScripts] = useState<CallScript[]>([
    {
      id: "1",
      name: "Script Ventas Premium",
      category: "sales",
      content: "Hola {nombre_cliente}, soy {nombre_empleado} de LA Mattress. ¿Cómo está usted hoy? Le llamo porque tenemos una promoción especial en nuestros colchones premium con un 30% de descuento...",
      variables: ["nombre_cliente", "nombre_empleado"],
      effectiveness: 78,
      usageCount: 150,
      lastUsed: "2024-02-20",
      createdAt: "2024-01-10",
      isActive: true,
    },
    {
      id: "2",
      name: "Script Reactivación",
      category: "reactivation",
      content: "Buenos días {nombre_cliente}, soy {nombre_empleado} de LA Mattress. Veo que hace tiempo no realiza una compra con nosotros y queríamos ofrecerle un descuento exclusivo del 40%...",
      variables: ["nombre_cliente", "nombre_empleado"],
      effectiveness: 65,
      usageCount: 89,
      lastUsed: "2024-02-19",
      createdAt: "2024-01-15",
      isActive: true,
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [previewScript, setPreviewScript] = useState<CallScript | null>(null);
  const [form] = Form.useForm();

  const categoryColors = {
    sales: "green",
    reactivation: "blue",
    new_client: "gold",
    follow_up: "orange",
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = content.matchAll(regex);
    const variables = new Set<string>();
    for (const match of matches) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  const showModal = (script?: CallScript) => {
    if (script) {
      setEditingScript(script);
      form.setFieldsValue(script);
    } else {
      setEditingScript(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showPreview = (script: CallScript) => {
    setPreviewScript(script);
    setIsPreviewVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const variables = extractVariables(values.content);
      
      if (editingScript) {
        setScripts(
          scripts.map((script) =>
            script.id === editingScript.id
              ? { ...script, ...values, variables }
              : script
          )
        );
        message.success("Script actualizado exitosamente");
      } else {
        const newScript: CallScript = {
          ...values,
          id: Date.now().toString(),
          variables,
          effectiveness: 0,
          usageCount: 0,
          lastUsed: null,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setScripts([...scripts, newScript]);
        message.success("Script creado exitosamente");
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setScripts(scripts.filter((script) => script.id !== id));
    message.success("Script eliminado exitosamente");
  };

  const copyScript = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("Script copiado al portapapeles");
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: CallScript) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Tag color={categoryColors[record.category]}>
            {record.category === "sales" && "Ventas"}
            {record.category === "reactivation" && "Reactivación"}
            {record.category === "new_client" && "Nuevo Cliente"}
            {record.category === "follow_up" && "Seguimiento"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Variables",
      dataIndex: "variables",
      key: "variables",
      render: (variables: string[]) => (
        <Space wrap>
          {variables.map((variable) => (
            <Tag key={variable}>{`{${variable}}`}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Efectividad",
      dataIndex: "effectiveness",
      key: "effectiveness",
      render: (effectiveness: number) => (
        <Space>
          <PercentageOutlined />
          <span style={{ 
            color: effectiveness >= 70 ? "#52c41a" : effectiveness >= 50 ? "#faad14" : "#ff4d4f" 
          }}>
            {effectiveness}%
          </span>
        </Space>
      ),
    },
    {
      title: "Uso",
      dataIndex: "usageCount",
      key: "usageCount",
      render: (count: number, record: CallScript) => (
        <Space direction="vertical" size={0}>
          <span>{count} veces</span>
          {record.lastUsed && <small>Último: {record.lastUsed}</small>}
        </Space>
      ),
    },
    {
      title: "Estado",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "ACTIVO" : "INACTIVO"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: CallScript) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showPreview(record)}
            size="small"
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyScript(record.content)}
            size="small"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            size="small"
          />
          <Popconfirm
            title="¿Estás seguro de eliminar este script?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeScripts = scripts.filter(s => s.isActive).length;
  const avgEffectiveness = scripts.length > 0
    ? (scripts.reduce((sum, s) => sum + s.effectiveness, 0) / scripts.length).toFixed(1)
    : "0";
  const totalUsage = scripts.reduce((sum, s) => sum + s.usageCount, 0);

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <Title level={2}>Scripts de Conversación</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              size="large"
            >
              Nuevo Script
            </Button>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Scripts Activos"
              value={activeScripts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Efectividad Promedio"
              value={avgEffectiveness}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Uso Total"
              value={totalUsage}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Alert
            message="Consejo"
            description="Usa variables como {nombre_cliente} y {nombre_empleado} en tus scripts para personalizarlos automáticamente."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>

        <Col span={24}>
          <Card title="Lista de Scripts">
            <Table
              columns={columns}
              dataSource={scripts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingScript ? "Editar Script" : "Nuevo Script"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Nombre del Script"
                rules={[{ required: true, message: "Por favor ingrese el nombre" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Categoría"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="sales">Ventas</Select.Option>
                  <Select.Option value="reactivation">Reactivación</Select.Option>
                  <Select.Option value="new_client">Nuevo Cliente</Select.Option>
                  <Select.Option value="follow_up">Seguimiento</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Contenido del Script"
            rules={[{ required: true, message: "Por favor ingrese el contenido" }]}
            extra="Usa {variable} para crear campos dinámicos"
          >
            <TextArea 
              rows={8} 
              placeholder="Ejemplo: Hola {nombre_cliente}, soy {nombre_empleado} de LA Mattress..."
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Estado"
          >
            <Select>
              <Select.Option value={true}>Activo</Select.Option>
              <Select.Option value={false}>Inactivo</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Vista Previa del Script"
        visible={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={() => previewScript && copyScript(previewScript.content)}>
            Copiar Script
          </Button>,
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Cerrar
          </Button>,
        ]}
        width={600}
      >
        {previewScript && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Card size="small">
              <Text strong>Nombre:</Text> {previewScript.name}
            </Card>
            <Card size="small">
              <Text strong>Variables detectadas:</Text>
              <div style={{ marginTop: 8 }}>
                {previewScript.variables.map((variable) => (
                  <Tag key={variable}>{`{${variable}}`}</Tag>
                ))}
              </div>
            </Card>
            <Card size="small">
              <Text strong>Contenido:</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {previewScript.content}
              </Paragraph>
            </Card>
            <Card size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Efectividad"
                    value={previewScript.effectiveness}
                    suffix="%"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Veces Usado"
                    value={previewScript.usageCount}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Último Uso"
                    value={previewScript.lastUsed || "Nunca"}
                  />
                </Col>
              </Row>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CallScriptsPage;