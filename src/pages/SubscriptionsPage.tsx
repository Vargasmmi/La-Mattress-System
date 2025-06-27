import React, { useState } from "react";
import {
  Table,
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Descriptions,
  Modal,
  Alert,
  App,
} from "antd";
import {
  CreditCardOutlined,
  LinkOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useGetIdentity } from "@refinedev/core";

const { Title, Text } = Typography;

interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  subscriptionLink: string;
  status: "active" | "cancelled" | "pending";
  amount: number;
  startDate: string;
  nextBillingDate: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

const SubscriptionsPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const isEmployee = identity?.role === "employee";
  const currentEmployeeId = identity?.id;
  const currentEmployeeCode = identity?.employeeCode;

  const [allSubscriptions] = useState<Subscription[]>([
    {
      id: "1",
      customerName: "John Smith",
      customerEmail: "john@example.com",
      employeeId: "2",
      employeeName: "María García",
      employeeCode: "CTR001",
      subscriptionLink: "https://lamattress.com/subscribe/CTR001",
      status: "active",
      amount: 10,
      startDate: "2024-01-15",
      nextBillingDate: "2024-03-15",
      stripeCustomerId: "cus_123456789",
      stripeSubscriptionId: "sub_123456789",
    },
    {
      id: "2",
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      employeeId: "3",
      employeeName: "Juan Pérez",
      employeeCode: "CTR002",
      subscriptionLink: "https://lamattress.com/subscribe/CTR002",
      status: "active",
      amount: 10,
      startDate: "2024-02-01",
      nextBillingDate: "2024-03-01",
      stripeCustomerId: "cus_987654321",
      stripeSubscriptionId: "sub_987654321",
    },
    {
      id: "3",
      customerName: "Michael Brown",
      customerEmail: "michael@example.com",
      employeeId: "2",
      employeeName: "María García",
      employeeCode: "CTR001",
      subscriptionLink: "https://lamattress.com/subscribe/CTR001",
      status: "cancelled",
      amount: 10,
      startDate: "2024-01-01",
      nextBillingDate: "2024-02-01",
      stripeCustomerId: "cus_456789123",
      stripeSubscriptionId: "sub_456789123",
    },
  ]);

  // Filter subscriptions based on role
  const subscriptions = isEmployee 
    ? allSubscriptions.filter(s => s.employeeId === currentEmployeeId)
    : allSubscriptions;

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      active: "green",
      cancelled: "red",
      pending: "orange",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const showDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailModalVisible(true);
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    message.success("Link copied to clipboard");
  };

  const columns = [
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size={0}>
          <strong>{record.customerName}</strong>
          <small>{record.customerEmail}</small>
        </Space>
      ),
    },
    ...(isEmployee ? [] : [{
      title: "Employee",
      key: "employee",
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size={0}>
          <span>{record.employeeName}</span>
          <Tag>{record.employeeCode}</Tag>
        </Space>
      ),
    }]),
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <strong>${amount}/month</strong>
      ),
    },
    {
      title: "Commission (10%)",
      key: "commission",
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#52c41a" }}>${(record.amount * 0.1).toFixed(2)}/month</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>per subscription</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={status === "active" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === "active" && "ACTIVE"}
          {status === "cancelled" && "CANCELLED"}
          {status === "pending" && "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Next Billing",
      dataIndex: "nextBillingDate",
      key: "nextBillingDate",
      render: (date: string, record: Subscription) => {
        if (record.status !== "active") return "-";
        return (
          <Space direction="vertical" size={0}>
            <span>{moment(date).format("DD/MM/YYYY")}</span>
            <small>{moment(date).fromNow()}</small>
          </Space>
        );
      },
    },
    {
      title: "Subscription Link",
      key: "link",
      render: (_: any, record: Subscription) => (
        <Button
          icon={<LinkOutlined />}
          size="small"
          onClick={() => copyLink(record.subscriptionLink)}
        >
          Copy Link
        </Button>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Subscription) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => showDetails(record)}
          size="small"
        >
          View Details
        </Button>
      ),
    },
  ];

  const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
  const monthlyRevenue = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);
  const monthlyCommission = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.amount * 0.1), 0);
  const totalRevenue = subscriptions.length * 10; // Assuming all have paid at least one month

  const employeeStats = subscriptions.reduce((acc, sub) => {
    if (!acc[sub.employeeId]) {
      acc[sub.employeeId] = {
        name: sub.employeeName,
        count: 0,
        revenue: 0,
        commission: 0,
      };
    }
    if (sub.status === "active") {
      acc[sub.employeeId].count++;
      acc[sub.employeeId].revenue += sub.amount;
      acc[sub.employeeId].commission += (sub.amount * 0.1);
    }
    return acc;
  }, {} as Record<string, { name: string; count: number; revenue: number; commission: number }>);

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <Title level={2}>{isEmployee ? "My Subscriptions" : "Subscription Management"}</Title>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isEmployee ? "My Active Subscriptions" : "Active Subscriptions"}
              value={activeSubscriptions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isEmployee ? "My Monthly Revenue" : "Monthly Revenue"}
              value={monthlyRevenue}
              prefix={<DollarOutlined />}
              suffix="/month"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isEmployee ? "My Total Revenue" : "Total Revenue"}
              value={totalRevenue}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isEmployee ? "My Monthly Commission" : "Total Monthly Commission"}
              value={monthlyCommission}
              prefix={<DollarOutlined />}
              suffix="/month"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Alert
            message={isEmployee ? "My Unique Subscription Link" : "Unique Subscription Links"}
            description={
              <Space direction="vertical">
                <Text>
                  {isEmployee 
                    ? `Your unique link: https://lamattress.com/subscribe/${currentEmployeeCode || 'YOUR_CODE'}. When a customer subscribes using this link, the commission is automatically assigned to you.`
                    : "Each employee has a unique link: https://lamattress.com/subscribe/{employee_code}. When a customer subscribes using this link, the commission is automatically assigned to the employee."
                  }
                </Text>
                <Text strong>
                  Commission Rate: 10% of subscription value (e.g., $1 commission for every $10 subscription)
                </Text>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>

        <Col span={24} lg={isEmployee ? 24 : 16}>
          <Card title={isEmployee ? "My Subscriptions List" : "Subscriptions List"}>
            <Table
              columns={columns}
              dataSource={subscriptions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        {!isEmployee && (
          <Col span={24} lg={8}>
            <Card title="Performance by Employee">
              <Space direction="vertical" style={{ width: "100%" }}>
                {Object.values(employeeStats).map((stat, index) => (
                  <Card key={index} size="small">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space direction="vertical" size={0}>
                          <Text strong>{stat.name}</Text>
                          <Text type="secondary">{stat.count} subscriptions</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Space direction="vertical" size={0} align="end">
                          <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                            ${stat.commission.toFixed(2)}/month
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Commission (10%)
                          </Text>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title="Subscription Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedSubscription && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Customer">
              {selectedSubscription.customerName}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedSubscription.customerEmail}
            </Descriptions.Item>
            {!isEmployee && (
              <Descriptions.Item label="Employee">
                {selectedSubscription.employeeName} ({selectedSubscription.employeeCode})
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedSubscription.status)}>
                {selectedSubscription.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              ${selectedSubscription.amount}/mes
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {moment(selectedSubscription.startDate).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Next Billing">
              {selectedSubscription.status === "active" 
                ? moment(selectedSubscription.nextBillingDate).format("DD/MM/YYYY")
                : "N/A"
              }
            </Descriptions.Item>
            <Descriptions.Item label="Subscription Link">
              <Space>
                <Text copyable>{selectedSubscription.subscriptionLink}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Stripe Customer ID">
              {selectedSubscription.stripeCustomerId}
            </Descriptions.Item>
            <Descriptions.Item label="Stripe Subscription ID">
              {selectedSubscription.stripeSubscriptionId}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;