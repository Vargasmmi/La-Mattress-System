import React, { useState } from "react";
import { useList, useCreate, useUpdate, useDelete, useNavigation } from "@refinedev/core";
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
  Spin,
  Badge,
  Dropdown,
  Menu,
  Tooltip,
  Progress,
  Alert,
  Descriptions,
  Avatar,
  List,
  App,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  ShoppingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
  ExportOutlined,
  StarOutlined,
  TeamOutlined,
  CalendarOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { Customer } from "../types";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Option } = Select;

const CustomersPage: React.FC = () => {
  const { show } = useNavigation();
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Fetch customers from backend
  const { data, isLoading, refetch } = useList<Customer>({
    resource: "customers",
    queryOptions: { enabled: true }
  });

  const { mutate: createCustomer, isLoading: isCreating } = useCreate();
  const { mutate: updateCustomer, isLoading: isUpdating } = useUpdate();
  const { mutate: deleteCustomer, isLoading: isDeleting } = useDelete();

  const customers = data?.data || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalCustomers = customers.length;
    const totalSpent = customers.reduce((sum, customer) => sum + customer.total_spent, 0);
    const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
    const averageOrders = totalCustomers > 0 
      ? customers.reduce((sum, customer) => sum + customer.orders_count, 0) / totalCustomers 
      : 0;

    const vipCustomers = customers.filter(customer => customer.total_spent > 1000);
    const newCustomers = customers.filter(customer => {
      const created = dayjs(customer.created_at);
      return created.isAfter(dayjs().subtract(30, 'days'));
    });

    return {
      totalCustomers,
      totalSpent,
      averageSpent,
      averageOrders,
      vipCustomers: vipCustomers.length,
      newCustomers: newCustomers.length,
    };
  }, [customers]);

  // Filter customers
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchText === "" || 
        customer.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.phone?.includes(searchText);

      const matchesPlatform = platformFilter === "all" || customer.platform === platformFilter;

      return matchesSearch && matchesPlatform;
    });
  }, [customers, searchText, platformFilter]);

  const handleCreateCustomer = (values: any) => {
    createCustomer({
      resource: "customers",
      values: {
        ...values,
        platform: values.platform || 'shopify',
        total_spent: 0,
        orders_count: 0,
      },
      successNotification: {
        message: "Customer created successfully",
        type: "success",
      },
      errorNotification: {
        message: "Failed to create customer",
        type: "error",
      },
    }, {
      onSuccess: () => {
        setIsCreateModalVisible(false);
        form.resetFields();
        refetch();
        message.success("Customer created successfully");
      },
    });
  };

  const handleUpdateCustomer = (values: any) => {
    if (!selectedCustomer) return;

    updateCustomer({
      resource: "customers",
      id: selectedCustomer.id,
      values,
      successNotification: {
        message: "Customer updated successfully",
        type: "success",
      },
      errorNotification: {
        message: "Failed to update customer",
        type: "error",
      },
    }, {
      onSuccess: () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
        setSelectedCustomer(null);
        refetch();
        message.success("Customer updated successfully");
      },
    });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: "Delete Customer",
      content: `Are you sure you want to delete ${customer.first_name} ${customer.last_name}?`,
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteCustomer({
          resource: "customers",
          id: customer.id,
          successNotification: {
            message: "Customer deleted successfully",
            type: "success",
          },
          errorNotification: {
            message: "Failed to delete customer",
            type: "error",
          },
        }, {
          onSuccess: () => {
            refetch();
            message.success("Customer deleted successfully");
          },
        });
      },
    });
  };

  const handleShowDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.setFieldsValue({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      platform: customer.platform,
      address: customer.address,
    });
    setIsEditModalVisible(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getCustomerTypeTag = (customer: Customer) => {
    if (customer.total_spent > 5000) {
      return <Tag color="purple" icon={<StarOutlined />}>VIP</Tag>;
    } else if (customer.total_spent > 1000) {
      return <Tag color="gold" icon={<StarOutlined />}>Premium</Tag>;
    } else if (customer.orders_count === 0) {
      return <Tag color="blue">New</Tag>;
    }
    return <Tag color="default">Regular</Tag>;
  };

  const actionMenu = (customer: Customer) => {
    const items = [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => handleShowDetails(customer),
      },
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit Customer",
        onClick: () => handleEditCustomer(customer),
      },
      {
        type: "divider" as const,
      },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete Customer",
        danger: true,
        onClick: () => handleDeleteCustomer(customer),
      },
    ];
    
    return <Menu items={items} />;
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: record.total_spent > 1000 ? "#722ed1" : "#1890ff" }}
            icon={<UserOutlined />}
          >
            {getInitials(record.first_name, record.last_name)}
          </Avatar>
          <div>
            <Text strong>{record.first_name} {record.last_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.phone && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </Text>
          )}
          {record.address?.city && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.address.city}, {record.address.state}
            </Text>
          )}
        </Space>
      ),
      width: 200,
    },
    {
      title: "Orders",
      dataIndex: "orders_count",
      key: "orders_count",
      render: (count: number) => (
        <Badge count={count} showZero>
          <ShoppingOutlined style={{ fontSize: 18 }} />
        </Badge>
      ),
      sorter: (a, b) => a.orders_count - b.orders_count,
      width: 100,
      align: "center",
    },
    {
      title: "Total Spent",
      dataIndex: "total_spent",
      key: "total_spent",
      render: (amount: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          ${amount ? amount.toFixed(2) : '0.00'}
        </Text>
      ),
      sorter: (a, b) => a.total_spent - b.total_spent,
      width: 120,
    },
    {
      title: "Type",
      key: "type",
      render: (_, record) => getCustomerTypeTag(record),
      filters: [
        { text: "VIP", value: "vip" },
        { text: "Premium", value: "premium" },
        { text: "Regular", value: "regular" },
        { text: "New", value: "new" },
      ],
      onFilter: (value, record) => {
        if (value === "vip") return record.total_spent > 5000;
        if (value === "premium") return record.total_spent > 1000 && record.total_spent <= 5000;
        if (value === "new") return record.orders_count === 0;
        return record.total_spent <= 1000 && record.orders_count > 0;
      },
      width: 100,
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (platform: string) => (
        <Tag color={platform === "shopify" ? "green" : platform === "stripe" ? "blue" : "purple"}>
          {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Unknown'}
        </Tag>
      ),
      filters: [
        { text: "Shopify", value: "shopify" },
        { text: "Stripe", value: "stripe" },
        { text: "Both", value: "both" },
      ],
      onFilter: (value, record) => record.platform === value,
      width: 100,
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      width: 120,
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
      <Title level={2}>Customers Management</Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalSpent}
              prefix="$"
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="VIP Customers"
              value={stats.vipCustomers}
              prefix={<StarOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="New This Month"
              value={stats.newCustomers}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
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
                title="Average Order Value"
                value={stats.averageSpent}
                prefix="$"
                precision={2}
              />
              <Statistic
                title="Average Orders per Customer"
                value={stats.averageOrders}
                precision={1}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="Search customers by name, email, or phone"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={platformFilter}
            onChange={setPlatformFilter}
            placeholder="Filter by platform"
          >
            <Option value="all">All Platforms</Option>
            <Option value="shopify">Shopify</Option>
            <Option value="stripe">Stripe</Option>
            <Option value="both">Both</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Add Customer
          </Button>
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

      {/* Customers Table */}
      <Card>
        {stats.newCustomers > 0 && (
          <Alert
            message={`You have ${stats.newCustomers} new customers this month!`}
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} customers`,
          }}
        />
      </Card>

      {/* Customer Details Modal */}
      <Modal
        title="Customer Details"
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setIsDetailsModalVisible(false);
              handleEditCustomer(selectedCustomer!);
            }}
          >
            Edit Customer
          </Button>,
        ]}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Space>
                  <Avatar
                    size={64}
                    style={{ backgroundColor: selectedCustomer.total_spent > 1000 ? "#722ed1" : "#1890ff" }}
                    icon={<UserOutlined />}
                  >
                    {getInitials(selectedCustomer.first_name, selectedCustomer.last_name)}
                  </Avatar>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </Title>
                    {getCustomerTypeTag(selectedCustomer)}
                  </div>
                </Space>
              </Col>
            </Row>

            <Descriptions 
              column={2} 
              style={{ marginTop: 24 }}
              bordered
            >
              <Descriptions.Item label="Email">
                <MailOutlined style={{ marginRight: 8 }} />
                {selectedCustomer.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <PhoneOutlined style={{ marginRight: 8 }} />
                {selectedCustomer.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Total Orders">
                <Badge count={selectedCustomer.orders_count} showZero />
              </Descriptions.Item>
              <Descriptions.Item label="Total Spent">
                <Text strong style={{ color: "#52c41a" }}>
                  ${selectedCustomer.total_spent ? selectedCustomer.total_spent.toFixed(2) : '0.00'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Platform">
                <Tag color={selectedCustomer.platform === "shopify" ? "green" : selectedCustomer.platform === "stripe" ? "blue" : "purple"}>
                  {selectedCustomer.platform ? selectedCustomer.platform.charAt(0).toUpperCase() + selectedCustomer.platform.slice(1) : 'Unknown'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Since">
                {dayjs(selectedCustomer.created_at).format("MMMM D, YYYY")}
              </Descriptions.Item>
            </Descriptions>

            {selectedCustomer.address && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>
                  Address Information
                </Title>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Address">
                    {selectedCustomer.address.line1}
                    {selectedCustomer.address.line2 && <>, {selectedCustomer.address.line2}</>}
                  </Descriptions.Item>
                  <Descriptions.Item label="City, State">
                    {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.postal_code}
                  </Descriptions.Item>
                  <Descriptions.Item label="Country">
                    {selectedCustomer.address.country || "United States"}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        title="Add New Customer"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleCreateCustomer}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="platform"
            label="Platform"
            initialValue="shopify"
          >
            <Select>
              <Option value="shopify">Shopify</Option>
              <Option value="stripe">Stripe</Option>
              <Option value="both">Both</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Create Customer
              </Button>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        title="Edit Customer"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedCustomer(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateCustomer}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="platform"
            label="Platform"
          >
            <Select>
              <Option value="shopify">Shopify</Option>
              <Option value="stripe">Stripe</Option>
              <Option value="both">Both</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Update Customer
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setSelectedCustomer(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;