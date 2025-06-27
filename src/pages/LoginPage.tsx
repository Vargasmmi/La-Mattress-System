import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, Space, Alert, Row, Col } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { mutate: login, isLoading } = useLogin();
  const [form] = Form.useForm();

  const handleSubmit = (values: { email: string; password: string }) => {
    login(values);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)",
    }}>
      <Row justify="center" style={{ width: "100%", padding: "20px" }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card
            style={{
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <Space direction="vertical" style={{ width: "100%", textAlign: "center" }} size="large">
              <div>
                <img 
                  src="/assets/logo.jpg" 
                  alt="LA Mattress" 
                  style={{ width: '120px', height: 'auto', marginBottom: '8px' }}
                />
                <Title level={2} style={{ marginTop: "16px", marginBottom: "8px" }}>
                  LA Mattress System
                </Title>
                <Text type="secondary">LA Mattress - Sales Management</Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Invalid email" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Email"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "Please enter your password" }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>

              <Alert
                message="Demo Credentials"
                description={
                  <Space direction="vertical" style={{ width: "100%", textAlign: "left" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <Text strong style={{ color: "#1890ff" }}>Database Users (from PostgreSQL):</Text>
                    </div>
                    <div>
                      <strong>Admin 1:</strong> lbencomo94@gmail.com / Atec2019chino
                    </div>
                    <div>
                      <strong>Admin 2:</strong> test@test.com / (ask administrator)
                    </div>
                    <div>
                      <strong>Admin 3:</strong> admin@test.com / (ask administrator)
                    </div>
                    <div style={{ marginTop: "12px", marginBottom: "8px" }}>
                      <Text strong style={{ color: "#52c41a" }}>Local Demo Users:</Text>
                    </div>
                    <div>
                      <strong>Admin:</strong> admin@lamattress.com / admin123
                    </div>
                    <div>
                      <strong>Employee:</strong> maria@lamattress.com / maria123
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                      API integration active - connects to backend-mu-three-66.vercel.app
                    </div>
                  </Space>
                }
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;