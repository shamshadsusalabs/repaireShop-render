import { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Card, Statistic, Space } from 'antd';
import { EyeOutlined, PlusOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../admin/services/api';
import type { PurchaseOrder } from '../../types';

const { Title, Text } = Typography;

interface VendorOption {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    gstNumber?: string;
}

export default function StoreOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<VendorOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form] = Form.useForm();

    // Live cost preview
    const [preview, setPreview] = useState({ subtotal: 0, discount: 0, gst: 0, total: 0 });

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/store/orders');
            setOrders(res.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get('/store/vendors');
            setVendors(res.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch vendors');
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchVendors();
    }, []);

    // Recalculate preview when form values change
    const onValuesChange = () => {
        const values = form.getFieldsValue();
        const unitPrice = values.unitPrice || 0;
        const quantity = values.quantity || 0;
        const discount = values.discount || 0;
        const gstPercent = values.gstPercent ?? 18;

        const subtotal = unitPrice * quantity;
        const discountAmt = subtotal * (discount / 100);
        const afterDiscount = subtotal - discountAmt;
        const gstAmt = afterDiscount * (gstPercent / 100);
        const total = afterDiscount + gstAmt;

        setPreview({
            subtotal: Math.round(subtotal * 100) / 100,
            discount: Math.round(discountAmt * 100) / 100,
            gst: Math.round(gstAmt * 100) / 100,
            total: Math.round(total * 100) / 100,
        });
    };

    const handleCreatePO = async (values: any) => {
        try {
            setCreating(true);
            const res = await api.post('/store/orders', values);
            if (res.data.success) {
                message.success('Purchase Order created successfully!');
                setIsModalOpen(false);
                fetchOrders();
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create PO');
        } finally {
            setCreating(false);
        }
    };

    const handlePartNumberBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const pn = e.target.value.trim();
        if (!pn) return;

        try {
            // First we need to get the part details from inventory to auto-fill the name
            // We use the existing Get All Parts route with a search query
            const res = await api.get(`/parts?search=${encodeURIComponent(pn)}`);
            if (res.data?.success && res.data.data?.length > 0) {
                // Find exact match just in case
                const exactMatch = res.data.data.find((p: any) => p.partNumber.toLowerCase() === pn.toLowerCase());
                if (exactMatch) {
                    const currentVals = form.getFieldsValue();
                    if (!currentVals.partName) { // Only auto-fill if not already filled
                        form.setFieldsValue({ partName: exactMatch.partName });
                        message.info('Part name auto-filled from inventory');
                    }
                }
            }
        } catch (error) {
            console.log('Error fetching part details for auto-fill');
        }
    };

    const openCreateModal = () => {
        form.resetFields();
        form.setFieldsValue({ quantity: 1, discount: 0, gstPercent: 18 });
        setPreview({ subtotal: 0, discount: 0, gst: 0, total: 0 });
        setIsModalOpen(true);
    };


    const totalOrders = orders.length;
    const totalSpent = orders.reduce((s, o) => s + o.totalCost, 0);

    const columns = [
        {
            title: 'Order Number',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            width: 140,
            render: (text: string, record: any) => <Tag color="blue">{text || record._id.substring(record._id.length - 6).toUpperCase()}</Tag>,
        },
        {
            title: 'Part Name',
            dataIndex: 'partName',
            key: 'partName',
        },
        {
            title: 'Part Number',
            dataIndex: 'partNumber',
            key: 'partNumber',
            render: (text: string) => text || '-',
        },
        {
            title: 'Vendor',
            dataIndex: ['vendorId', 'name'],
            key: 'vendor',
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 60,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            render: (v: number) => `₹${v.toLocaleString()}`,
        },
        {
            title: 'GST%',
            dataIndex: 'gstPercent',
            key: 'gstPercent',
            width: 70,
            render: (v: number) => `${v || 18}%`,
        },
        {
            title: 'Total (₹)',
            dataIndex: 'totalCost',
            key: 'totalCost',
            render: (cost: number) => <Text strong>₹{cost.toFixed(2)}</Text>,
        },

        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: PurchaseOrder) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/order-invoice/${record._id}`)}
                    size="small"
                >
                    Invoice
                </Button>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Purchase Orders</Title>
                    <Text type="secondary">Create and track purchase orders placed with vendors</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={openCreateModal}
                    style={{ borderRadius: 10, height: 48, fontWeight: 700 }}
                >
                    Create Purchase Order
                </Button>
            </div>

            {/* Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title="Total Orders"
                            value={totalOrders}
                            prefix={<ShoppingCartOutlined style={{ color: '#4f46e5' }} />}
                            valueStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic
                            title="Total Spent"
                            value={`₹${totalSpent.toFixed(2)}`}
                            prefix={<DollarOutlined style={{ color: '#059669' }} />}
                            valueStyle={{ color: '#059669', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>

            </Row>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                loading={loading}
                style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            />

            {/* Create PO Modal */}
            <Modal
                title={<span style={{ fontSize: 18, fontWeight: 700 }}>➕ Create Purchase Order</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={640}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreatePO}
                    onValuesChange={onValuesChange}
                    requiredMark="optional"
                    size="large"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="vendorId"
                        label={<span style={{ fontWeight: 600 }}>🚚 Select Vendor</span>}
                        rules={[{ required: true, message: 'Please select a vendor' }]}
                    >
                        <Select
                            placeholder="Choose vendor"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {vendors.map(v => (
                                <Select.Option key={v._id} value={v._id}>
                                    {v.name}{v.companyName ? ` (${v.companyName})` : ''}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item
                                name="partName"
                                label={<span style={{ fontWeight: 600 }}>Part Name</span>}
                                rules={[{ required: true, message: 'Part name is required' }]}
                            >
                                <Input placeholder="e.g. Brake Pad Set" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item
                                name="partNumber"
                                label={<span style={{ fontWeight: 600 }}>Part Number</span>}
                                rules={[{ required: true, message: 'Part number is required' }]}
                            >
                                <Input 
                                    placeholder="e.g. BP-2024-A" 
                                    style={{ textTransform: 'uppercase' }}
                                    onBlur={handlePartNumberBlur}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="unitPrice"
                                label={<span style={{ fontWeight: 600 }}>Unit Price (₹)</span>}
                                rules={[{ required: true, message: 'Price is required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="0.00" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="quantity"
                                label={<span style={{ fontWeight: 600 }}>Quantity</span>}
                                rules={[{ required: true, message: 'Quantity is required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="discount"
                                label={<span style={{ fontWeight: 600 }}>Discount (%)</span>}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} max={100} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="gstPercent"
                                label={<span style={{ fontWeight: 600 }}>GST (%)</span>}
                            >
                                <InputNumber style={{ width: '100%' }} min={0} max={100} />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item
                                name="notes"
                                label={<span style={{ fontWeight: 600 }}>Notes</span>}
                            >
                                <Input placeholder="Optional notes" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Cost Preview */}
                    <Card size="small" style={{ background: '#f8fafc', borderRadius: 12, marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Subtotal</Text>
                                <div style={{ fontWeight: 700 }}>₹{preview.subtotal.toFixed(2)}</div>
                            </Col>
                            <Col span={6}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Discount</Text>
                                <div style={{ fontWeight: 700, color: '#10b981' }}>-₹{preview.discount.toFixed(2)}</div>
                            </Col>
                            <Col span={6}>
                                <Text type="secondary" style={{ fontSize: 12 }}>GST</Text>
                                <div style={{ fontWeight: 700, color: '#d97706' }}>+₹{preview.gst.toFixed(2)}</div>
                            </Col>
                            <Col span={6}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Total</Text>
                                <div style={{ fontWeight: 800, fontSize: 18, color: '#4f46e5' }}>₹{preview.total.toFixed(2)}</div>
                            </Col>
                        </Row>
                    </Card>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={creating}
                                block
                                style={{ height: 48, fontWeight: 700, flex: 1 }}
                            >
                                Create Order
                            </Button>
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                block
                                style={{ height: 48, flex: 1 }}
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
