import React, { useState } from "react";
import { useList, useUpdate, useNavigation } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  InputNumber,
  Spin,
  Badge,
  Dropdown,
  Menu,
  Tooltip,
  Progress,
  Alert,
  DatePicker,
  App,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  EllipsisOutlined,
  ExportOutlined,
  PrinterOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Order } from "../types";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdersPage: React.FC = () => {
  const { message } = App.useApp();
  const { show } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isUpdateStatusModalVisible, setIsUpdateStatusModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch orders from backend
  const { data, isLoading, refetch } = useList<Order>({
    resource: "orders",
    queryOptions: { enabled: true }
  });

  const { mutate: updateOrder, isLoading: isUpdating } = useUpdate();

  const orders = data?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const pendingOrders = orders.filter(order => order.status === 'pending');
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const todayRevenue = todayOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      todayRevenue,
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      completionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0
    };
  }, [orders]);

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchText === "" || 
        order.order_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      const matchesDateRange = !dateRange || (
        dateRange[0] && dateRange[1] &&
        dayjs(order.created_at).isAfter(dateRange[0]) &&
        dayjs(order.created_at).isBefore(dateRange[1].endOf('day'))
      );

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [orders, searchText, statusFilter, dateRange]);

  const handleUpdateStatus = (order: Order, newStatus: string) => {
    updateOrder({
      resource: "orders",
      id: order.id,
      values: { status: newStatus },
      successNotification: {
        message: "Order status updated successfully",
        type: "success",
      },
      errorNotification: {
        message: "Failed to update order status",
        type: "error",
      },
    }, {
      onSuccess: () => {
        refetch();
        message.success(`Order ${order.order_number} status updated to ${newStatus}`);
      },
    });
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      completed: "green",
      cancelled: "red",
      refunded: "purple",
    };
    return statusColors[status] || "default";
  };

  const getPaymentStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: "green",
      pending: "orange",
      failed: "red",
      refunded: "purple",
    };
    return statusColors[status] || "default";
  };

  const actionMenu = (order: Order) => {
    const items = [
      {
        key: "view",
        icon: <SearchOutlined />,
        label: "View Details",
        onClick: () => handleShowDetails(order),
      },
      {
        key: "update",
        icon: <SyncOutlined />,
        label: "Update Status",
        onClick: () => {
          setSelectedOrder(order);
          setIsUpdateStatusModalVisible(true);
        },
      },
      {
        type: "divider" as const,
      },
      {
        key: "invoice",
        icon: <PrinterOutlined />,
        label: "Print Invoice",
      },
      {
        key: "email",
        icon: <MailOutlined />,
        label: "Send Email",
      },
      {
        type: "divider" as const,
      },
      {
        key: "cancel",
        icon: <CloseCircleOutlined />,
        label: "Cancel Order",
        danger: true,
        disabled: order.status === 'completed' || order.status === 'cancelled',
        onClick: () => handleUpdateStatus(order, 'cancelled'),
      },
    ];
    
    return <Menu items={items} />;
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (text: string, record: Order) => (
        <Button type="link" onClick={() => handleShowDetails(record)}>
          {text}
        </Button>
      ),
      width: 120,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("MMM D, YYYY h:mm A"),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      width: 180,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customer_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.customer_email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: any[]) => (
        <Badge count={items?.length || 0} showZero>
          <ShoppingCartOutlined style={{ fontSize: 18 }} />
        </Badge>
      ),
      width: 80,
      align: "center",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          ${total.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.total - b.total,
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ textTransform: "capitalize" }}>
          {status}
        </Tag>
      ),
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Processing", value: "processing" },
        { text: "Completed", value: "completed" },
        { text: "Cancelled", value: "cancelled" },
        { text: "Refunded", value: "refunded" },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)} style={{ textTransform: "capitalize" }}>
          {status}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={["click"]}>
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
      width: 80,
      fixed: "right",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Orders Management</Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Today's Orders"
              value={stats.todayOrders}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix="$"
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={stats.completionRate}
              suffix="%"
              precision={1}
              prefix={
                <Progress
                  type="circle"
                  percent={Math.round(stats.completionRate)}
                  width={40}
                  strokeColor="#52c41a"
                />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Space size="large" wrap>
              <Statistic
                title="Pending Orders"
                value={stats.pendingOrders}
                valueStyle={{ color: "#faad14" }}
                prefix={<ClockCircleOutlined />}
              />
              <Statistic
                title="Completed Today"
                value={stats.todayRevenue}
                prefix="$"
                precision={2}
                valueStyle={{ color: "#52c41a" }}
              />
              <Statistic
                title="Average Order Value"
                value={stats.averageOrderValue}
                prefix="$"
                precision={2}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="Search by order #, customer name or email"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by status"
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="processing">Processing</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="refunded">Refunded</Option>
          </Select>
          <RangePicker
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
            format="YYYY-MM-DD"
            placeholder={["Start Date", "End Date"]}
          />
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button 
            icon={<SyncOutlined spin={isLoading} />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Orders Table */}
      <Card>
        {stats.pendingOrders > 0 && (
          <Alert
            message={`You have ${stats.pendingOrders} pending orders that need attention`}
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={`Order Details - ${selectedOrder?.order_number}`}
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" icon={<PrinterOutlined />}>
            Print Invoice
          </Button>,
          <Button
            key="update"
            type="primary"
            onClick={() => {
              setIsDetailsModalVisible(false);
              setIsUpdateStatusModalVisible(true);
            }}
          >
            Update Status
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Order Number</Text>
                <br />
                <Text strong>{selectedOrder.order_number}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Date</Text>
                <br />
                <Text strong>
                  {dayjs(selectedOrder.created_at).format("MMM D, YYYY h:mm A")}
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <br />
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Payment Status</Text>
                <br />
                <Tag color={getPaymentStatusColor(selectedOrder.payment_status)}>
                  {selectedOrder.payment_status}
                </Tag>
              </Col>
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>
              Customer Information
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Name</Text>
                <br />
                <Text strong>{selectedOrder.customer_name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Email</Text>
                <br />
                <Text strong>{selectedOrder.customer_email}</Text>
              </Col>
              {selectedOrder.customer_phone && (
                <Col span={12}>
                  <Text type="secondary">Phone</Text>
                  <br />
                  <Text strong>{selectedOrder.customer_phone}</Text>
                </Col>
              )}
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>
              Order Items
            </Title>
            <Table
              dataSource={selectedOrder.items || []}
              columns={[
                { title: "Product", dataIndex: "product_name", key: "product_name" },
                { title: "Quantity", dataIndex: "quantity", key: "quantity", width: 100 },
                {
                  title: "Price",
                  dataIndex: "price",
                  key: "price",
                  render: (price: number) => `$${price.toFixed(2)}`,
                  width: 100,
                },
                {
                  title: "Total",
                  key: "total",
                  render: (_, record) =>
                    `$${(record.quantity * record.price).toFixed(2)}`,
                  width: 100,
                },
              ]}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: "#52c41a" }}>
                        ${selectedOrder.total.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            {selectedOrder.notes && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>
                  Order Notes
                </Title>
                <Text>{selectedOrder.notes}</Text>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title="Update Order Status"
        open={isUpdateStatusModalVisible}
        onCancel={() => setIsUpdateStatusModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values) => {
            if (selectedOrder) {
              handleUpdateStatus(selectedOrder, values.status);
              setIsUpdateStatusModalVisible(false);
              form.resetFields();
            }
          }}
          layout="vertical"
        >
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: "Please select a status" }]}
            initialValue={selectedOrder?.status}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Update Status
              </Button>
              <Button onClick={() => setIsUpdateStatusModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;