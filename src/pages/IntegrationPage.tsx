import React, { useState, useEffect } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Button,
  Switch,
  Alert,
  Divider,
  Space,
  Spin,
  Tag,
  Modal,
  Descriptions,
  Table,
  Progress,
  Tooltip,
  App,
} from "antd";
import {
  ShopOutlined,
  CreditCardOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  DatabaseOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import shopifyTest from "../services/shopifyTest";

const { Title, Text, Paragraph } = Typography;

interface ShopifySettings {
  id?: string;
  shop_name: string;
  api_key: string;
  password: string;
  api_version?: string;
  is_active?: boolean;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

interface StripeSettings {
  id?: string;
  secret_key: string;
  webhook_secret?: string;
  is_active?: boolean;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

interface SyncStatus {
  platform: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  progress?: number;
  recordsProcessed?: number;
  recordsTotal?: number;
}

const IntegrationPage: React.FC = () => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity();
  const [shopifyForm] = Form.useForm();
  const [stripeForm] = Form.useForm();

  const [shopifySettings, setShopifySettings] = useState<ShopifySettings | null>(null);
  const [stripeSettings, setStripeSettings] = useState<StripeSettings | null>(null);
  const [loadingShopify, setLoadingShopify] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [testingShopify, setTestingShopify] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  // Check if user is admin
  const isAdmin = (identity as any)?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadIntegrationSettings();
    }
  }, [isAdmin]);

  const loadIntegrationSettings = async () => {
    try {
      // Load Shopify settings
      setLoadingShopify(true);
      
      // Try to load from backend first
      let shopifyData = null;
      try {
        shopifyData = await api.settings.shopify.get();
      } catch (backendError) {
        console.log('Backend Shopify settings not available, checking localStorage');
      }
      
      // If no backend data, check localStorage
      if (!shopifyData) {
        const localShopifySettings = localStorage.getItem('shopify_settings');
        if (localShopifySettings) {
          shopifyData = JSON.parse(localShopifySettings);
        }
      }
      
      setShopifySettings(shopifyData);
      if (shopifyData) {
        shopifyForm.setFieldsValue(shopifyData);
        // Ensure localStorage is synchronized
        localStorage.setItem('shopify_settings', JSON.stringify(shopifyData));
      }
    } catch (error) {
      console.error('Error loading Shopify settings:', error);
    } finally {
      setLoadingShopify(false);
    }

    try {
      // Load Stripe settings
      setLoadingStripe(true);
      const stripeData = await api.settings.stripe.get();
      setStripeSettings(stripeData);
      if (stripeData) {
        stripeForm.setFieldsValue({
          ...stripeData,
          secret_key: stripeData.secret_key ? '••••••••••••••••' : '',
        });
      }
    } catch (error) {
      console.error('Error loading Stripe settings:', error);
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleShopifySubmit = async (values: ShopifySettings) => {
    setLoadingShopify(true);
    try {
      // Save to backend first
      await api.settings.shopify.save(values);
      
      // Also save to localStorage for the Shopify client
      localStorage.setItem('shopify_settings', JSON.stringify(values));
      
      message.success('Shopify settings saved successfully');
      setShowShopifyModal(false);
      loadIntegrationSettings();
    } catch (error) {
      message.error('Failed to save Shopify settings');
      console.error('Error saving Shopify settings:', error);
    } finally {
      setLoadingShopify(false);
    }
  };

  const handleStripeSubmit = async (values: StripeSettings) => {
    setLoadingStripe(true);
    try {
      await api.settings.stripe.save(values);
      message.success('Stripe settings saved successfully');
      setShowStripeModal(false);
      loadIntegrationSettings();
    } catch (error) {
      message.error('Failed to save Stripe settings');
      console.error('Error saving Stripe settings:', error);
    } finally {
      setLoadingStripe(false);
    }
  };

  const testShopifyConnection = async () => {
    setTestingShopify(true);
    try {
      // Use the new Shopify client test
      const result = await shopifyTest.testConnection();
      
      if (result.success) {
        Modal.success({
          title: 'Shopify Connection Successful',
          content: (
            <div>
              <p>Successfully connected to your Shopify store!</p>
              <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="Total Products">
                  {result.data?.productCount || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Sample Products">
                  {result.data?.sampleProducts?.slice(0, 3).map((p: any, i: number) => (
                    <div key={i}>
                      • {p.title} - ${p.price}
                    </div>
                  ))}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ),
          width: 600,
        });
      } else {
        message.error(result.error || 'Shopify connection test failed');
      }
    } catch (error: any) {
      message.error(error.message || 'Shopify connection test failed');
      console.error('Error testing Shopify connection:', error);
    } finally {
      setTestingShopify(false);
    }
  };

  const testStripeConnection = async () => {
    setTestingStripe(true);
    try {
      const result = await api.settings.stripe.test();
      if (result.success) {
        message.success('Stripe connection test successful');
      } else {
        message.error(`Stripe connection test failed: ${result.message}`);
      }
    } catch (error) {
      message.error('Stripe connection test failed');
      console.error('Error testing Stripe connection:', error);
    } finally {
      setTestingStripe(false);
    }
  };

  const performSync = async (platform: 'shopify' | 'stripe', entityType: 'products' | 'customers' | 'orders' | 'coupons') => {
    const newSyncStatus: SyncStatus = {
      platform: `${platform}_${entityType}`,
      status: 'syncing',
      progress: 0,
      message: `Syncing ${entityType} from ${platform}...`
    };

    setSyncStatus(prev => [...prev.filter(s => s.platform !== newSyncStatus.platform), newSyncStatus]);

    try {
      let result: any;
      switch (entityType) {
        case 'products':
          result = await api.products.syncFromShopify();
          break;
        case 'coupons':
          result = await api.coupons.sync(platform as 'shopify' | 'stripe' | 'both');
          break;
        default:
          throw new Error(`Sync not implemented for ${entityType}`);
      }

      setSyncStatus(prev => prev.map(s => 
        s.platform === newSyncStatus.platform 
          ? { ...s, status: 'success', progress: 100, message: `Successfully synced ${result.count || 0} ${entityType}` }
          : s
      ));
      
      message.success(`Successfully synced ${entityType} from ${platform}`);
    } catch (error: any) {
      setSyncStatus(prev => prev.map(s => 
        s.platform === newSyncStatus.platform 
          ? { ...s, status: 'error', message: `Failed to sync ${entityType}: ${error.message}` }
          : s
      ));
      
      message.error(`Failed to sync ${entityType} from ${platform}`);
      console.error(`Error syncing ${entityType}:`, error);
    }
  };

  const getConnectionStatus = (settings: any) => {
    if (!settings) {
      return <Tag color="default">Not Configured</Tag>;
    }
    if (settings.is_active) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>;
    }
    return <Tag color="warning" icon={<ExclamationCircleOutlined />}>Inactive</Tag>;
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access this page. Only administrators can manage integrations."
          type="error"
          showIcon
          style={{ maxWidth: 500, margin: "0 auto" }}
        />
      </div>
    );
  }

  const syncColumns = [
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color={platform === 'shopify' ? 'green' : 'blue'}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => {
        const status = syncStatus.find(s => s.platform === `${record.platform}_${record.entity}`);
        if (!status) {
          return <Tag color="default">Ready</Tag>;
        }
        
        const colorMap = {
          idle: 'default',
          syncing: 'processing',
          success: 'success',
          error: 'error',
        };
        
        return (
          <Space>
            <Tag color={colorMap[status.status]} icon={status.status === 'syncing' ? <SyncOutlined spin /> : undefined}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </Tag>
            {status.progress !== undefined && status.status === 'syncing' && (
              <Progress size="small" percent={status.progress} style={{ width: 100 }} />
            )}
          </Space>
        );
      },
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (date: string) => date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<SyncOutlined />}
          onClick={() => performSync(record.platform, record.entity)}
          loading={syncStatus.some(s => s.platform === `${record.platform}_${record.entity}` && s.status === 'syncing')}
        >
          Sync Now
        </Button>
      ),
    },
  ];

  const syncData = [
    { key: '1', entity: 'products', platform: 'shopify', lastSync: shopifySettings?.last_sync },
    { key: '2', entity: 'coupons', platform: 'shopify', lastSync: shopifySettings?.last_sync },
    { key: '3', entity: 'coupons', platform: 'stripe', lastSync: stripeSettings?.last_sync },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>
        <SettingOutlined style={{ marginRight: 8 }} />
        Platform Integrations
      </Title>
      <Paragraph>
        Manage your Shopify and Stripe integrations. Configure API credentials, test connections, and sync data between platforms.
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* Shopify Integration */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ShopOutlined style={{ color: '#95bf47' }} />
                <span>Shopify Integration</span>
                {getConnectionStatus(shopifySettings)}
              </Space>
            }
            extra={
              <Space>
                {shopifySettings && (
                  <Button
                    size="small"
                    icon={<ExperimentOutlined />}
                    onClick={testShopifyConnection}
                    loading={testingShopify}
                  >
                    Test
                  </Button>
                )}
                <Button
                  type="primary"
                  size="small"
                  icon={shopifySettings ? <EditOutlined /> : <SettingOutlined />}
                  onClick={() => setShowShopifyModal(true)}
                >
                  {shopifySettings ? 'Edit' : 'Configure'}
                </Button>
              </Space>
            }
            loading={loadingShopify}
          >
            {shopifySettings ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Shop Name">
                  {shopifySettings.shop_name}
                </Descriptions.Item>
                <Descriptions.Item label="API Version">
                  {shopifySettings.api_version || '2023-10'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {shopifySettings.is_active ? 'Active' : 'Inactive'}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {shopifySettings.updated_at ? new Date(shopifySettings.updated_at).toLocaleString() : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert
                message="Shopify Not Configured"
                description="Configure your Shopify store connection to start syncing products, customers, and orders."
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>

        {/* Stripe Integration */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CreditCardOutlined style={{ color: '#635bff' }} />
                <span>Stripe Integration</span>
                {getConnectionStatus(stripeSettings)}
              </Space>
            }
            extra={
              <Space>
                {stripeSettings && (
                  <Button
                    size="small"
                    icon={<ExperimentOutlined />}
                    onClick={testStripeConnection}
                    loading={testingStripe}
                  >
                    Test
                  </Button>
                )}
                <Button
                  type="primary"
                  size="small"
                  icon={stripeSettings ? <EditOutlined /> : <SettingOutlined />}
                  onClick={() => setShowStripeModal(true)}
                >
                  {stripeSettings ? 'Edit' : 'Configure'}
                </Button>
              </Space>
            }
            loading={loadingStripe}
          >
            {stripeSettings ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Secret Key">
                  ••••••••••••••••{stripeSettings.secret_key?.slice(-4)}
                </Descriptions.Item>
                <Descriptions.Item label="Webhooks">
                  {stripeSettings.webhook_secret ? 'Configured' : 'Not configured'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {stripeSettings.is_active ? 'Active' : 'Inactive'}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {stripeSettings.updated_at ? new Date(stripeSettings.updated_at).toLocaleString() : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert
                message="Stripe Not Configured"
                description="Configure your Stripe account connection to start processing payments and managing subscriptions."
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Data Synchronization */}
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>Data Synchronization</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Alert
          message="Data Sync Information"
          description="Synchronize data between your external platforms and the local database. This ensures all product, customer, and order information is up to date."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={syncColumns}
          dataSource={syncData}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Shopify Configuration Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined style={{ color: '#95bf47' }} />
            <span>Shopify Configuration</span>
          </Space>
        }
        open={showShopifyModal}
        onCancel={() => setShowShopifyModal(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="Shopify API Configuration"
          description="Enter your Shopify store credentials. You can find these in your Shopify admin under Apps > Private apps."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form
          form={shopifyForm}
          layout="vertical"
          onFinish={handleShopifySubmit}
        >
          <Form.Item
            name="shop_name"
            label="Shop Name"
            rules={[{ required: true, message: 'Please enter your shop name' }]}
            tooltip="Your shop name (e.g., mystore.myshopify.com)"
          >
            <Input 
              placeholder="mystore.myshopify.com"
              prefix={<ShopOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="api_key"
            label="API Key"
            rules={[{ required: true, message: 'Please enter your API key' }]}
          >
            <Input.Password 
              placeholder="Enter your Shopify API key"
              prefix={<ApiOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              placeholder="Enter your Shopify password"
              prefix={<SafetyCertificateOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="api_version"
            label="API Version"
            tooltip="Shopify API version (default: 2023-10)"
          >
            <Input 
              placeholder="2023-10"
              defaultValue="2023-10"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadingShopify}
                icon={<SettingOutlined />}
              >
                Save Configuration
              </Button>
              <Button onClick={() => setShowShopifyModal(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stripe Configuration Modal */}
      <Modal
        title={
          <Space>
            <CreditCardOutlined style={{ color: '#635bff' }} />
            <span>Stripe Configuration</span>
          </Space>
        }
        open={showStripeModal}
        onCancel={() => setShowStripeModal(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="Stripe API Configuration"
          description="Enter your Stripe API credentials. You can find these in your Stripe dashboard under Developers > API keys."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form
          form={stripeForm}
          layout="vertical"
          onFinish={handleStripeSubmit}
        >
          <Form.Item
            name="secret_key"
            label="Secret Key"
            rules={[{ required: true, message: 'Please enter your secret key' }]}
            tooltip="Your Stripe secret key (starts with sk_)"
          >
            <Input.Password 
              placeholder={stripeSettings?.secret_key ? '••••••••••••••••' : 'sk_test_...'}
              prefix={<SafetyCertificateOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="webhook_secret"
            label="Webhook Secret"
            tooltip="Your Stripe webhook endpoint secret (optional)"
          >
            <Input.Password 
              placeholder="whsec_..."
              prefix={<LinkOutlined />}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadingStripe}
                icon={<SettingOutlined />}
              >
                Save Configuration
              </Button>
              <Button onClick={() => setShowStripeModal(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IntegrationPage;