import React, { useState } from "react";
import {
  Table,
  Card,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Select,
  DatePicker,
  Modal,
  Alert,
  Descriptions,
  Tabs,
  App,
} from "antd";
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  FireOutlined,
  BankOutlined,
  CalendarOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useGetIdentity } from "@refinedev/core";
import MedalBadge from "../components/MedalBadge";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
// TabPane is deprecated, using Tabs with items instead

interface Commission {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  storeId: string;
  storeName: string;
  month: string;
  baseSales: number;
  subscriptionRevenue: number; // Total subscription revenue
  baseCommission: number; // 10% of subscription revenue
  bonusAmount: number;
  totalCommission: number;
  status: "pending" | "paid";
  paidDate: string | null;
}

interface StoreStats {
  storeId: string;
  storeName: string;
  totalSales: number;
  totalCommissions: number;
  employeeCount: number;
  avgSalesPerEmployee: number;
}

const CommissionsPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const isEmployee = identity?.role === "employee";
  const currentEmployeeId = identity?.id;

  const [commissions, setCommissions] = useState<Commission[]>([
    // Store Center
    {
      id: "1",
      employeeId: "2",
      employeeName: "María García",
      employeeCode: "CTR001",
      storeId: "1",
      storeName: "Store Center",
      month: "2024-02",
      baseSales: 120,
      subscriptionRevenue: 1200, // 120 sales * $10 subscription
      baseCommission: 120, // 10% of $1200
      bonusAmount: 100,
      totalCommission: 220,
      status: "pending",
      paidDate: null,
    },
    {
      id: "2",
      employeeId: "3",
      employeeName: "Juan Pérez",
      employeeCode: "CTR002",
      storeId: "1",
      storeName: "Tienda Centro",
      month: "2024-02",
      baseSales: 85,
      subscriptionRevenue: 850, // 85 sales * $10 subscription
      baseCommission: 85, // 10% of $850
      bonusAmount: 50,
      totalCommission: 135,
      status: "pending",
      paidDate: null,
    },
    {
      id: "3",
      employeeId: "4",
      employeeName: "Ana López",
      employeeCode: "CTR003",
      storeId: "1",
      storeName: "Tienda Centro",
      month: "2024-02",
      baseSales: 95,
      subscriptionRevenue: 950, // 95 sales * $10 subscription
      baseCommission: 95, // 10% of $950
      bonusAmount: 50,
      totalCommission: 145,
      status: "paid",
      paidDate: "2024-02-28",
    },
    // Tienda Norte
    {
      id: "4",
      employeeId: "12",
      employeeName: "Elena Herrera",
      employeeCode: "NOR001",
      storeId: "2",
      storeName: "Tienda Norte",
      month: "2024-02",
      baseSales: 150,
      subscriptionRevenue: 1500, // 150 sales * $10 subscription
      baseCommission: 150, // 10% of $1500
      bonusAmount: 200,
      totalCommission: 350,
      status: "pending",
      paidDate: null,
    },
    // Tienda Sur
    {
      id: "5",
      employeeId: "22",
      employeeName: "Pedro Martínez",
      employeeCode: "SUR001",
      storeId: "3",
      storeName: "Tienda Sur",
      month: "2024-02",
      baseSales: 200,
      subscriptionRevenue: 2000, // 200 sales * $10 subscription
      baseCommission: 200, // 10% of $2000
      bonusAmount: 300,
      totalCommission: 500,
      status: "pending",
      paidDate: null,
    },
    // Tienda Este
    {
      id: "6",
      employeeId: "32",
      employeeName: "Carmen Silva",
      employeeCode: "EST001",
      storeId: "4",
      storeName: "Tienda Este",
      month: "2024-02",
      baseSales: 75,
      subscriptionRevenue: 750, // 75 sales * $10 subscription
      baseCommission: 75, // 10% of $750
      bonusAmount: 50,
      totalCommission: 125,
      status: "pending",
      paidDate: null,
    },
    // Tienda Oeste
    {
      id: "7",
      employeeId: "42",
      employeeName: "Ricardo Gómez",
      employeeCode: "OES001",
      storeId: "5",
      storeName: "Tienda Oeste",
      month: "2024-02",
      baseSales: 110,
      subscriptionRevenue: 1100, // 110 sales * $10 subscription
      baseCommission: 110, // 10% of $1100
      bonusAmount: 100,
      totalCommission: 210,
      status: "pending",
      paidDate: null,
    },
  ]);

  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);

  const getBonusAmount = (sales: number) => {
    if (sales >= 200) return 300;
    if (sales >= 150) return 200;
    if (sales >= 100) return 100;
    if (sales >= 50) return 50;
    return 0;
  };

  const getBonusTier = (sales: number) => {
    if (sales >= 200) return { tier: "Platinum", color: "#b7b7b7", icon: "🏆" };
    if (sales >= 150) return { tier: "Gold", color: "#faad14", icon: "🥇" };
    if (sales >= 100) return { tier: "Silver", color: "#c0c0c0", icon: "🥈" };
    if (sales >= 50) return { tier: "Bronze", color: "#cd7f32", icon: "🥉" };
    return { tier: "No Bonus", color: "#d9d9d9", icon: "⭐" };
  };

  const getProgressToNextTier = (sales: number) => {
    if (sales >= 200) return { progress: 100, nextTier: "Maximum reached", remaining: 0 };
    if (sales >= 150) return { progress: ((sales - 150) / 50) * 100, nextTier: "Platinum (200)", remaining: 200 - sales };
    if (sales >= 100) return { progress: ((sales - 100) / 50) * 100, nextTier: "Gold (150)", remaining: 150 - sales };
    if (sales >= 50) return { progress: ((sales - 50) / 50) * 100, nextTier: "Silver (100)", remaining: 100 - sales };
    return { progress: (sales / 50) * 100, nextTier: "Bronze (50)", remaining: 50 - sales };
  };

  const handlePayment = () => {
    const updatedCommissions = commissions.map(commission => {
      if (selectedCommissions.includes(commission.id)) {
        return {
          ...commission,
          status: "paid" as const,
          paidDate: moment().format("YYYY-MM-DD"),
        };
      }
      return commission;
    });
    
    setCommissions(updatedCommissions);
    setSelectedCommissions([]);
    setPaymentModalVisible(false);
    message.success("Commissions marked as paid successfully");
  };

  // Filter commissions based on role
  const filteredCommissions = isEmployee 
    ? commissions.filter(c => c.employeeId === currentEmployeeId && c.month === selectedMonth)
    : commissions.filter(c => c.month === selectedMonth);

  // Calculate store statistics
  const storeStats: StoreStats[] = [
    { storeId: "1", storeName: "Tienda Centro", totalSales: 0, totalCommissions: 0, employeeCount: 10, avgSalesPerEmployee: 0 },
    { storeId: "2", storeName: "Tienda Norte", totalSales: 0, totalCommissions: 0, employeeCount: 10, avgSalesPerEmployee: 0 },
    { storeId: "3", storeName: "Tienda Sur", totalSales: 0, totalCommissions: 0, employeeCount: 10, avgSalesPerEmployee: 0 },
    { storeId: "4", storeName: "Tienda Este", totalSales: 0, totalCommissions: 0, employeeCount: 10, avgSalesPerEmployee: 0 },
    { storeId: "5", storeName: "Tienda Oeste", totalSales: 0, totalCommissions: 0, employeeCount: 10, avgSalesPerEmployee: 0 },
  ];

  // Fill store stats with real data
  commissions.filter(c => c.month === selectedMonth).forEach(commission => {
    const store = storeStats.find(s => s.storeId === commission.storeId);
    if (store) {
      store.totalSales += commission.baseSales;
      store.totalCommissions += commission.totalCommission;
      store.avgSalesPerEmployee = store.totalSales / store.employeeCount;
    }
  });

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: any, record: Commission) => (
        <Space direction="vertical" size={0}>
          <strong>{record.employeeName}</strong>
          <Tag>{record.employeeCode}</Tag>
          {!isEmployee && <small>{record.storeName}</small>}
        </Space>
      ),
    },
    {
      title: "Mes",
      dataIndex: "month",
      key: "month",
      render: (month: string) => moment(month).format("MMMM YYYY"),
    },
    {
      title: "Subscriptions",
      dataIndex: "baseSales",
      key: "baseSales",
      render: (sales: number) => {
        const tier = getBonusTier(sales);
        return <MedalBadge tier={tier.tier} icon={tier.icon} sales={sales} />;
      },
    },
    {
      title: "Subscription Revenue",
      dataIndex: "subscriptionRevenue",
      key: "subscriptionRevenue",
      render: (revenue: number) => (
        <Space direction="vertical" size={0}>
          <strong>${revenue}</strong>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Total Value
          </Text>
        </Space>
      ),
    },
    {
      title: "Bonus Level",
      key: "bonusTier",
      render: (_: any, record: Commission) => {
        const tier = getBonusTier(record.baseSales);
        const progress = getProgressToNextTier(record.baseSales);
        return (
          <Space direction="vertical" size={0} style={{ width: "150px" }}>
            <div style={{ marginBottom: 8 }}>
              <MedalBadge tier={tier.tier} icon={tier.icon} />
            </div>
            <Progress 
              percent={progress.progress} 
              size="small" 
              showInfo={false}
            />
            {progress.remaining > 0 && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {progress.remaining} sales to {progress.nextTier}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Commission (10%)",
      dataIndex: "baseCommission",
      key: "baseCommission",
      render: (amount: number, record: Commission) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#52c41a" }}>${amount}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            10% of ${record.subscriptionRevenue}
          </Text>
        </Space>
      ),
    },
    {
      title: "Bonus",
      dataIndex: "bonusAmount",
      key: "bonusAmount",
      render: (amount: number) => (
        <Tag color={amount > 0 ? "gold" : "default"}>
          +${amount}
        </Tag>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalCommission",
      key: "totalCommission",
      render: (amount: number) => (
        <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
          ${amount}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Commission) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === "paid" ? "green" : "orange"}>
            {status === "paid" ? "PAID" : "PENDING"}
          </Tag>
          {record.paidDate && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {moment(record.paidDate).format("DD/MM/YYYY")}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const totalPending = commissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + c.totalCommission, 0);
  const totalPaid = commissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.totalCommission, 0);

  const rowSelection = isEmployee ? undefined : {
    selectedRowKeys: selectedCommissions,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedCommissions(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: Commission) => ({
      disabled: record.status === "paid",
    }),
  };

  if (isEmployee) {
    // Employee view - only their own commissions
    return (
      <div style={{ padding: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={2}>My Commissions</Title>
          </Col>

          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="My Pending Commission"
                value={filteredCommissions
                  .filter(c => c.status === "pending")
                  .reduce((sum, c) => sum + c.totalCommission, 0)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="My Paid Commission"
                value={commissions
                  .filter(c => c.employeeId === currentEmployeeId && c.status === "paid")
                  .reduce((sum, c) => sum + c.totalCommission, 0)}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="My Sales This Month"
                value={filteredCommissions.reduce((sum, c) => sum + c.baseSales, 0)}
                prefix={<RiseOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="My Commissions">
              <Table
                columns={columns}
                dataSource={filteredCommissions}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Admin view - all commissions with store comparison
  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <Title level={2}>Commission Management</Title>
            <Space>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 200 }}
              >
                <Option value="2024-02">February 2024</Option>
                <Option value="2024-01">January 2024</Option>
              </Select>
              <Button
                type="primary"
                icon={<BankOutlined />}
                onClick={() => setPaymentModalVisible(true)}
                disabled={selectedCommissions.length === 0}
                style={{ color: 'white' }}
              >
                Mark as Paid ({selectedCommissions.length})
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Commissions"
              value={totalPending}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Paid Commissions"
              value={totalPaid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Monthly Total"
              value={filteredCommissions.reduce((sum, c) => sum + c.totalCommission, 0)}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Tabs 
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Commissions by Employee",
                children: (
                  <Card>
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredCommissions}
                      rowKey="id"
                      pagination={{ pageSize: 20 }}
                    />
                  </Card>
                ),
              },
              {
                key: "2",
                label: "Performance by Store",
                children: (
                  <Row gutter={[16, 16]}>
                    {storeStats.map(store => (
                      <Col xs={24} lg={12} xl={8} key={store.storeId}>
                        <Card
                          title={
                            <Space>
                              <ShopOutlined />
                              {store.storeName}
                            </Space>
                          }
                          size="small"
                        >
                          <Row gutter={[8, 8]}>
                            <Col span={12}>
                              <Statistic
                                title="Total Sales"
                                value={store.totalSales}
                                valueStyle={{ fontSize: "16px" }}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic
                                title="Commissions"
                                value={store.totalCommissions}
                                prefix="$"
                                valueStyle={{ fontSize: "16px", color: "#52c41a" }}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic
                                title="Employees"
                                value={store.employeeCount}
                                valueStyle={{ fontSize: "16px" }}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic
                                title="Average/Employee"
                                value={store.avgSalesPerEmployee.toFixed(1)}
                                valueStyle={{ fontSize: "16px", color: "#1890ff" }}
                              />
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ),
              },
            ]}
          />
        </Col>

        <Col span={24}>
          <Alert
            message="Commission & Bonus System"
            description={
              <Space direction="vertical" size="small">
                <div>
                  <Text strong>Base Commission Rate: </Text>
                  <Text>10% of subscription revenue (e.g., $1 for every $10 subscription)</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Bonus Tiers (based on number of subscriptions):</Text>
                </div>
                <Text>🥉 Bronze: 50-99 subscriptions = $50 bonus</Text>
                <Text>🥈 Silver: 100-149 subscriptions = $100 bonus</Text>
                <Text>🥇 Gold: 150-199 subscriptions = $200 bonus</Text>
                <Text>🏆 Platinum: 200+ subscriptions = $300 bonus</Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<TrophyOutlined />}
          />
        </Col>
      </Row>

      <Modal
        title="Confirm Commission Payment"
        open={paymentModalVisible}
        onOk={handlePayment}
        onCancel={() => setPaymentModalVisible(false)}
        okText="Confirm Payment"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            message={`You are about to mark ${selectedCommissions.length} commissions as paid`}
            type="warning"
            showIcon
          />
          
          <Card size="small">
            <Descriptions column={1}>
              <Descriptions.Item label="Selected Commissions">
                {selectedCommissions.length}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                  ${commissions
                    .filter(c => selectedCommissions.includes(c.id))
                    .reduce((sum, c) => sum + c.totalCommission, 0)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date">
                {moment().format("DD/MM/YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          
          <Text type="secondary">
            This action cannot be undone. Commissions will be marked as paid with the current date.
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default CommissionsPage;