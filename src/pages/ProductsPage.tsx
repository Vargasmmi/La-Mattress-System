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
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Descriptions,
  Switch,
  Alert,
  Tooltip,
  Progress,
  App,
} from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  DatabaseOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { apiHelpers } from "../dataProvider";
import shopifyTest from "../services/shopifyTest";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  inventory_quantity: number;
  active: boolean;
  shopify_product_id?: string;
  stripe_product_id?: string;
  created_at: string;
  updated_at: string;
}

const ProductsPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<any>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [inventoryForm] = Form.useForm();
  const [syncLoading, setSyncLoading] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [showShopifyProducts, setShowShopifyProducts] = useState(false);
  const [shopifyLoading, setShopifyLoading] = useState(false);

  // Fetch products from backend
  const { data, isLoading, refetch } = useList<Product>({
    resource: "products",
    queryOptions: {
      enabled: true,
    }
  });

  const { mutate: createProduct, isLoading: createLoading } = useCreate();
  const { mutate: updateProduct, isLoading: updateLoading } = useUpdate();
  const { mutate: deleteProduct, isLoading: deleteLoading } = useDelete();

  const products = data?.data || [];

  // Calculate statistics
  const activeProducts = products.filter(p => p.active).length;
  const totalProducts = products.length;
  const totalInventory = products.reduce((sum, p) => sum + p.inventory_quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.inventory_quantity), 0);

  const handleCreate = async (values: any) => {
    try {
      createProduct({
        resource: "products",
        values: {
          ...values,
          create_in_shopify: values.create_in_shopify || false,
          create_in_stripe: values.create_in_stripe || false,
        },
      }, {
        onSuccess: () => {
          message.success("Product created successfully");
          setCreateModalVisible(false);
          form.resetFields();
          refetch();
        },
        onError: (error: any) => {
          message.error(error.message || "Failed to create product");
        },
      });
    } catch (error) {
      message.error("Failed to create product");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!selectedProduct) return;

    try {
      updateProduct({
        resource: "products",
        id: selectedProduct.id,
        values: {
          ...values,
          update_in_shopify: values.update_in_shopify || false,
          update_in_stripe: values.update_in_stripe || false,
        },
      }, {
        onSuccess: () => {
          message.success("Product updated successfully");
          setEditModalVisible(false);
          editForm.resetFields();
          refetch();
        },
        onError: (error: any) => {
          message.error(error.message || "Failed to update product");
        },
      });
    } catch (error) {
      message.error("Failed to update product");
    }
  };

  const handleUpdateInventory = async (values: any) => {
    if (!selectedProduct) return;

    try {
      await apiHelpers.updateProductInventory(selectedProduct.id, values.inventory_quantity);
      message.success("Inventory updated successfully");
      setInventoryModalVisible(false);
      inventoryForm.resetFields();
      refetch();
    } catch (error) {
      message.error("Failed to update inventory");
    }
  };

  const handleToggle = async (productId: string) => {
    try {
      await apiHelpers.toggleProductStatus(productId);
      message.success("Product status updated");
      refetch();
    } catch (error) {
      message.error("Failed to update product status");
    }
  };

  const handleDelete = async (productId: string) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure you want to delete this product? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          deleteProduct({
            resource: "products",
            id: productId,
          }, {
            onSuccess: () => {
              message.success("Product deleted successfully");
              refetch();
            },
            onError: (error: any) => {
              message.error(error.message || "Failed to delete product");
            },
          });
        } catch (error) {
          message.error("Failed to delete product");
        }
      },
    });
  };

  const handleSyncFromShopify = async () => {
    setSyncLoading(true);
    try {
      // First test the connection
      const connectionTest = await shopifyTest.testConnection();
      
      if (!connectionTest.success) {
        message.error(connectionTest.error || "Failed to connect to Shopify. Please check your integration settings.");
        return;
      }
      
      // Show connection success with product count
      message.info(`Connected to Shopify. Found ${connectionTest.data?.productCount || 0} products.`);
      
      // Sync products from Shopify
      const syncResult = await shopifyTest.syncProducts();
      
      if (syncResult.success) {
        message.success(`Successfully synced ${syncResult.count} products from Shopify`);
        
        // Now sync to our backend
        try {
          // Send the products to our backend
          const response = await fetch(`https://backend-mu-three-66.vercel.app/api/products/sync-from-shopify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ products: syncResult.products }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save products to backend');
          }
          
          // Refresh the product list
          refetch();
        } catch (backendError) {
          console.error("Backend sync error:", backendError);
          message.warning("Products fetched from Shopify but couldn't save to backend. Using local display.");
          
          // Even if backend fails, we can show the products locally
          // This is a fallback - normally products should be saved to backend
        }
      } else {
        message.error(syncResult.error || "Failed to sync products from Shopify");
      }
    } catch (error: any) {
      console.error("Shopify sync error:", error);
      message.error(error.message || "Failed to sync products from Shopify. Please check your Shopify integration settings.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleFetchShopifyProducts = async () => {
    setShopifyLoading(true);
    try {
      const result = await shopifyTest.fetchAllProducts();
      setShopifyProducts(result);
      setShowShopifyProducts(true);
      message.success(`Fetched ${result.length} products directly from Shopify`);
    } catch (error: any) {
      console.error("Shopify fetch error:", error);
      message.error(error.message || "Failed to fetch products from Shopify");
    } finally {
      setShopifyLoading(false);
    }
  };

  const showDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const showEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.setFieldsValue({
      title: product.title,
      description: product.description,
      price: product.price,
      inventory_quantity: product.inventory_quantity,
      active: product.active,
    });
    setEditModalVisible(true);
  };

  const showInventoryUpdate = (product: Product) => {
    setSelectedProduct(product);
    inventoryForm.setFieldsValue({
      inventory_quantity: product.inventory_quantity,
    });
    setInventoryModalVisible(true);
  };

  const getInventoryStatus = (quantity: number) => {
    if (quantity === 0) return { color: "red", text: "Out of Stock" };
    if (quantity < 10) return { color: "orange", text: "Low Stock" };
    return { color: "green", text: "In Stock" };
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_: any, record: Product) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.title}</Text>
          <Text type="secondary" ellipsis style={{ maxWidth: 200, fontSize: "12px" }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <Text strong>${price.toFixed(2)}</Text>
      ),
    },
    {
      title: "Inventory",
      dataIndex: "inventory_quantity",
      key: "inventory",
      render: (quantity: number) => {
        const status = getInventoryStatus(quantity);
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{quantity} units</Text>
            <Tag color={status.color}>{status.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Platform Integration",
      key: "platforms",
      render: (_: any, record: Product) => (
        <Space>
          {record.shopify_product_id && (
            <Tooltip title={`Shopify ID: ${record.shopify_product_id}`}>
              <Tag color="green" icon={<ShopOutlined />}>Shopify</Tag>
            </Tooltip>
          )}
          {record.stripe_product_id && (
            <Tooltip title={`Stripe ID: ${record.stripe_product_id}`}>
              <Tag color="blue" icon={<DollarOutlined />}>Stripe</Tag>
            </Tooltip>
          )}
          {!record.shopify_product_id && !record.stripe_product_id && (
            <Tag color="default">Local Only</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Product) => (
        <Switch
          checked={record.active}
          onChange={() => handleToggle(record.id)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
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
          <Button
            icon={<DatabaseOutlined />}
            size="small"
            onClick={() => showInventoryUpdate(record)}
          >
            Update Stock
          </Button>
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
            <Title level={2}>Product Management</Title>
            <Space>
              <Button
                icon={<ShopOutlined />}
                loading={shopifyLoading}
                onClick={handleFetchShopifyProducts}
              >
                View Shopify Products
              </Button>
              <Button
                icon={<SyncOutlined />}
                loading={syncLoading}
                onClick={handleSyncFromShopify}
              >
                Sync from Shopify
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Add Product
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={totalProducts}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Products"
              value={activeProducts}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Inventory"
              value={totalInventory}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Inventory Value"
              value={totalValue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal
        title="Add New Product"
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
          <Form.Item
            name="title"
            label="Product Title"
            rules={[{ required: true, message: "Please enter product title" }]}
          >
            <Input placeholder="e.g., Premium Memory Foam Mattress" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={3} placeholder="Product description..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inventory_quantity"
                label="Initial Inventory"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="Platform Integration"
            description="Select where to create this product"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="create_in_shopify"
                valuePropName="checked"
              >
                <Switch /> Create in Shopify
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="create_in_stripe"
                valuePropName="checked"
              >
                <Switch /> Create in Stripe
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
                Create Product
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Product"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="title"
            label="Product Title"
            rules={[{ required: true, message: "Please enter product title" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inventory_quantity"
                label="Inventory"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="active"
            valuePropName="checked"
          >
            <Switch /> Product is active
          </Form.Item>

          <Alert
            message="Update Platforms"
            description="Update product on integrated platforms"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="update_in_shopify"
                valuePropName="checked"
              >
                <Switch /> Update in Shopify
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="update_in_stripe"
                valuePropName="checked"
              >
                <Switch /> Update in Stripe
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={updateLoading}>
                Update Product
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Inventory Update Modal */}
      <Modal
        title="Update Inventory"
        open={inventoryModalVisible}
        onCancel={() => {
          setInventoryModalVisible(false);
          inventoryForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={inventoryForm}
          layout="vertical"
          onFinish={handleUpdateInventory}
        >
          <Alert
            message="Update Stock Level"
            description={`Current stock: ${selectedProduct?.inventory_quantity || 0} units`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="inventory_quantity"
            label="New Inventory Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter new quantity"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setInventoryModalVisible(false);
                inventoryForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Inventory
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Product Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedProduct && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Title">
              <Text strong>{selectedProduct.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedProduct.description}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              <Text strong>${selectedProduct.price.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Inventory">
              {(() => {
                const status = getInventoryStatus(selectedProduct.inventory_quantity);
                return (
                  <Space>
                    <Text strong>{selectedProduct.inventory_quantity} units</Text>
                    <Tag color={status.color}>{status.text}</Tag>
                  </Space>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedProduct.active ? "green" : "red"}>
                {selectedProduct.active ? "Active" : "Inactive"}
              </Tag>
            </Descriptions.Item>
            {selectedProduct.shopify_product_id && (
              <Descriptions.Item label="Shopify ID">
                <Text copyable>{selectedProduct.shopify_product_id}</Text>
              </Descriptions.Item>
            )}
            {selectedProduct.stripe_product_id && (
              <Descriptions.Item label="Stripe ID">
                <Text copyable>{selectedProduct.stripe_product_id}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created">
              {new Date(selectedProduct.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(selectedProduct.updated_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Shopify Products Modal */}
      <Modal
        title="Shopify Products"
        open={showShopifyProducts}
        onCancel={() => setShowShopifyProducts(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setShowShopifyProducts(false)}>
            Close
          </Button>,
        ]}
      >
        <Alert
          message="Live Shopify Products"
          description="These products are fetched directly from your Shopify store. Use 'Sync from Shopify' to import them into your system."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          dataSource={shopifyProducts}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Product",
              key: "product",
              render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.title}</Text>
                  {record.vendor && (
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      by {record.vendor}
                    </Text>
                  )}
                </Space>
              ),
            },
            {
              title: "Price",
              key: "price",
              render: (_: any, record: any) => (
                <Text strong>${record.price?.toFixed(2) || '0.00'}</Text>
              ),
            },
            {
              title: "Inventory",
              key: "inventory",
              render: (_: any, record: any) => {
                const quantity = record.inventory_quantity || 0;
                const status = getInventoryStatus(quantity);
                return (
                  <Space direction="vertical" size={0}>
                    <Text strong>{quantity} units</Text>
                    <Tag color={status.color}>{status.text}</Tag>
                  </Space>
                );
              },
            },
            {
              title: "Variants",
              key: "variants",
              render: (_: any, record: any) => (
                <Text>{record.variants?.length || 0} variant(s)</Text>
              ),
            },
            {
              title: "Status",
              key: "status",
              render: (_: any, record: any) => (
                <Tag color={record.active ? "green" : "default"}>
                  {record.active ? "Active" : "Draft"}
                </Tag>
              ),
            },
            {
              title: "Shopify ID",
              key: "id",
              render: (_: any, record: any) => (
                <Text copyable style={{ fontSize: "12px" }}>
                  {record.id}
                </Text>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default ProductsPage;