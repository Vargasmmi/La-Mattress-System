import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Descriptions,
  Alert,
  Tooltip,
  InputNumber,
  Switch,
  Progress,
  App,
} from "antd";
import {
  GiftOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SyncOutlined,
  PercentageOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useGetIdentity, useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { apiHelpers } from "../dataProvider";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  platform: "shopify" | "stripe" | "both";
  valid_from: string;
  valid_until: string;
  max_uses?: number;
  current_uses?: number;
  minimum_purchase?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const CouponsPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [syncLoading, setSyncLoading] = useState(false);

  // Fetch coupons from backend
  const { data, isLoading, refetch } = useList<Coupon>({
    resource: "coupons",
    queryOptions: {
      enabled: true,
    }
  });

  const { mutate: createCoupon, isLoading: createLoading } = useCreate();
  const { mutate: updateCoupon, isLoading: updateLoading } = useUpdate();
  const { mutate: deleteCoupon, isLoading: deleteLoading } = useDelete();

  const coupons = data?.data || [];

  // Calculate statistics
  const activeCoupons = coupons.filter(c => c.active).length;
  const totalCoupons = coupons.length;
  const percentageCoupons = coupons.filter(c => c.discount_type === "percentage").length;
  const fixedCoupons = coupons.filter(c => c.discount_type === "fixed_amount").length;

  const handleCreate = async (values: any) => {
    try {
      createCoupon({
        resource: "coupons",
        values: {
          ...values,
          valid_from: values.valid_from.format("YYYY-MM-DD"),
          valid_until: values.valid_until.format("YYYY-MM-DD"),
        },
      }, {
        onSuccess: () => {
          message.success("Coupon created successfully");
          setCreateModalVisible(false);
          form.resetFields();
          refetch();
        },
        onError: (error: any) => {
          message.error(error.message || "Failed to create coupon");
        },
      });
    } catch (error) {
      message.error("Failed to create coupon");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!selectedCoupon) return;

    try {
      updateCoupon({
        resource: "coupons",
        id: selectedCoupon.id,
        values: {
          description: values.description,
          valid_until: values.valid_until.format("YYYY-MM-DD"),
          max_uses: values.max_uses,
        },
      }, {
        onSuccess: () => {
          message.success("Coupon updated successfully");
          setEditModalVisible(false);
          editForm.resetFields();
          refetch();
        },
        onError: (error: any) => {
          message.error(error.message || "Failed to update coupon");
        },
      });
    } catch (error) {
      message.error("Failed to update coupon");
    }
  };

  const handleToggle = async (couponId: string) => {
    try {
      await apiHelpers.toggleCouponStatus(couponId);
      message.success("Coupon status updated");
      refetch();
    } catch (error) {
      message.error("Failed to update coupon status");
    }
  };

  const handleDelete = async (couponId: string) => {
    Modal.confirm({
      title: "Delete Coupon",
      content: "Are you sure you want to delete this coupon?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          deleteCoupon({
            resource: "coupons",
            id: couponId,
          }, {
            onSuccess: () => {
              message.success("Coupon deleted successfully");
              refetch();
            },
            onError: (error: any) => {
              message.error(error.message || "Failed to delete coupon");
            },
          });
        } catch (error) {
          message.error("Failed to delete coupon");
        }
      },
    });
  };

  const handleSync = async (platform: "shopify" | "stripe" | "both") => {
    setSyncLoading(true);
    try {
      await apiHelpers.syncCoupons(platform);
      message.success(`Synced coupons from ${platform}`);
      refetch();
    } catch (error) {
      message.error(`Failed to sync coupons from ${platform}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const showDetails = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDetailModalVisible(true);
  };

  const showEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    editForm.setFieldsValue({
      description: coupon.description,
      valid_until: moment(coupon.valid_until),
      max_uses: coupon.max_uses,
    });
    setEditModalVisible(true);
  };

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.active) return "default";
    const now = moment();
    const validUntil = moment(coupon.valid_until);
    if (now.isAfter(validUntil)) return "red";
    if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) return "orange";
    return "green";
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.active) return "INACTIVE";
    const now = moment();
    const validUntil = moment(coupon.valid_until);
    if (now.isAfter(validUntil)) return "EXPIRED";
    if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) return "LIMIT REACHED";
    return "ACTIVE";
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Text strong copyable>
          {code}
        </Text>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Discount",
      key: "discount",
      render: (_: any, record: Coupon) => (
        <Space>
          {record.discount_type === "percentage" ? (
            <>
              <PercentageOutlined />
              <Text strong>{record.discount_value}%</Text>
            </>
          ) : (
            <>
              <DollarOutlined />
              <Text strong>${record.discount_value}</Text>
            </>
          )}
        </Space>
      ),
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (platform: string) => (
        <Tag color={platform === "shopify" ? "green" : platform === "stripe" ? "blue" : "purple"}>
          {platform.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Valid Period",
      key: "validity",
      render: (_: any, record: Coupon) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {moment(record.valid_from).format("DD/MM/YYYY")} - {moment(record.valid_until).format("DD/MM/YYYY")}
          </Text>
          <Text type={moment().isAfter(record.valid_until) ? "danger" : "success"} style={{ fontSize: "12px" }}>
            {moment(record.valid_until).fromNow()}
          </Text>
        </Space>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: any, record: Coupon) => {
        if (!record.max_uses) return <Text type="secondary">Unlimited</Text>;
        const used = record.current_uses || 0;
        const percentage = (used / record.max_uses) * 100;
        return (
          <Tooltip title={`${used} of ${record.max_uses} uses`}>
            <div style={{ width: 80 }}>
              <Progress percent={percentage} size="small" status={percentage >= 100 ? "exception" : "active"} />
              <Text type="secondary" style={{ fontSize: "12px" }}>{used}/{record.max_uses}</Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Coupon) => (
        <Tag color={getStatusColor(record)}>
          {getStatusText(record)}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Coupon) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showDetails(record)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showEdit(record)}
          />
          <Tooltip title={record.active ? "Deactivate" : "Activate"}>
            <Switch
              checked={record.active}
              onChange={() => handleToggle(record.id)}
              size="small"
            />
          </Tooltip>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <Title level={2}>Coupon Management</Title>
            <Space>
              <Button
                icon={<SyncOutlined />}
                loading={syncLoading}
                onClick={() => handleSync("both")}
              >
                Sync All
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create Coupon
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Coupons"
              value={totalCoupons}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Coupons"
              value={activeCoupons}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Percentage Discounts"
              value={percentageCoupons}
              prefix={<PercentageOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Fixed Amount"
              value={fixedCoupons}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Table
              columns={columns}
              dataSource={coupons}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal
        title="Create New Coupon"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[{ required: true, message: "Please enter coupon code" }]}
              >
                <Input placeholder="e.g., SUMMER2024" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="platform"
                label="Platform"
                rules={[{ required: true, message: "Please select platform" }]}
              >
                <Select placeholder="Select platform">
                  <Option value="shopify">Shopify</Option>
                  <Option value="stripe">Stripe</Option>
                  <Option value="both">Both</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={2} placeholder="Brief description of the coupon" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discount_type"
                label="Discount Type"
                rules={[{ required: true, message: "Please select discount type" }]}
              >
                <Select placeholder="Select type">
                  <Option value="percentage">Percentage</Option>
                  <Option value="fixed_amount">Fixed Amount</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount_value"
                label="Discount Value"
                rules={[{ required: true, message: "Please enter discount value" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter value"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="valid_from"
                label="Valid From"
                rules={[{ required: true, message: "Please select start date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="valid_until"
                label="Valid Until"
                rules={[{ required: true, message: "Please select end date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="max_uses"
                label="Maximum Uses"
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="Leave empty for unlimited"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="minimum_purchase"
                label="Minimum Purchase"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Minimum purchase amount"
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                Create Coupon
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Coupon"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="valid_until"
            label="Valid Until"
            rules={[{ required: true, message: "Please select end date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="max_uses"
            label="Maximum Uses"
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Leave empty for unlimited"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={updateLoading}>
                Update Coupon
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Coupon Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedCoupon && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">
              <Text strong copyable>{selectedCoupon.code}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedCoupon.description}
            </Descriptions.Item>
            <Descriptions.Item label="Platform">
              <Tag color={selectedCoupon.platform === "shopify" ? "green" : selectedCoupon.platform === "stripe" ? "blue" : "purple"}>
                {selectedCoupon.platform.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Discount">
              {selectedCoupon.discount_type === "percentage" ? (
                <Space>
                  <PercentageOutlined />
                  <Text strong>{selectedCoupon.discount_value}%</Text>
                </Space>
              ) : (
                <Space>
                  <DollarOutlined />
                  <Text strong>${selectedCoupon.discount_value}</Text>
                </Space>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Valid From">
              {moment(selectedCoupon.valid_from).format("MMMM DD, YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Valid Until">
              {moment(selectedCoupon.valid_until).format("MMMM DD, YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Usage">
              {selectedCoupon.max_uses ? (
                `${selectedCoupon.current_uses || 0} of ${selectedCoupon.max_uses} uses`
              ) : (
                "Unlimited"
              )}
            </Descriptions.Item>
            {selectedCoupon.minimum_purchase && (
              <Descriptions.Item label="Minimum Purchase">
                ${selectedCoupon.minimum_purchase}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedCoupon)}>
                {getStatusText(selectedCoupon)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {moment(selectedCoupon.created_at).format("MMMM DD, YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {moment(selectedCoupon.updated_at).format("MMMM DD, YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CouponsPage;