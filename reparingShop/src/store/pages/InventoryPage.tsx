import { useEffect, useState } from 'react';
import {
    Card, Table, Button, Modal, Form, Input, Select, Tag, Space,
    message, Popconfirm, Row, Col, Statistic, Spin, InputNumber,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    AppstoreOutlined, WarningOutlined,
    FilterOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../../admin/services/api';
import usePartStore from '../../admin/store/partStore';
import type { Part } from '../../admin/services/partService';

const categoryOptions = [
    'Engine', 'Brake', 'Suspension', 'Electrical', 'Body',
    'Transmission', 'AC & Cooling', 'Tyre & Wheel', 'Oil & Fluids',
    'Filter', 'Battery', 'Lights', 'Interior', 'Exhaust', 'Steering', 'Other',
];

const categoryColorMap: Record<string, string> = {
    Engine: 'red', Brake: 'orange', Suspension: 'green', Electrical: 'blue',
    Body: 'purple', Transmission: 'magenta', 'AC & Cooling': 'cyan',
    'Tyre & Wheel': 'lime', 'Oil & Fluids': 'volcano', Filter: 'geekblue',
    Battery: 'gold', Lights: 'purple', Interior: 'blue', Exhaust: 'default',
    Steering: 'red', Other: 'default',
};

export default function InventoryPage() {
    const { parts, loading, fetchParts, createPart, updatePart, deletePart } = usePartStore();
    const [searchParams] = useSearchParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
    const [stockFilter, setStockFilter] = useState<string | undefined>(
        searchParams.get('filter') || undefined
    );
    const [form] = Form.useForm();

    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    // Filter parts
    const filtered = parts.filter(p => {
        const q = searchText.toLowerCase();
        const matchesSearch =
            p.partName.toLowerCase().includes(q) ||
            p.partNumber.toLowerCase().includes(q) ||
            (p.vehicleModel || '').toLowerCase().includes(q) ||
            (p.supplier || '').toLowerCase().includes(q);
        const matchesCategory = categoryFilter ? p.category === categoryFilter : true;

        let matchesStock = true;
        if (stockFilter === 'lowStock') {
            matchesStock = p.quantity <= p.minStock && p.quantity > 0;
        } else if (stockFilter === 'outOfStock') {
            matchesStock = p.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    const openCreateModal = () => {
        setEditingPart(null);
        form.resetFields();
        form.setFieldsValue({
            category: 'Other',
            minStock: 5,
            costPrice: 0,
            buyGstPercent: 0,
            sellPrice: 0,
            sellGstPercent: 0,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (part: Part) => {
        setEditingPart(part);
        form.setFieldsValue({
            partName: part.partName,
            partNumber: part.partNumber,
            category: part.category,
            minStock: part.minStock,
            costPrice: part.costPrice,
            buyGstPercent: part.buyGstPercent || 0,
            sellPrice: part.sellPrice,
            sellGstPercent: part.sellGstPercent || 0,
            hsnCode: part.hsnCode || '',
            location: part.location,
            supplier: part.supplier,
            vehicleModel: part.vehicleModel,
            description: part.description,
        });
        setIsModalOpen(true);
    };

    const handlePartNumberBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const pn = e.target.value.trim();
        if (!pn || editingPart) return; // Only auto-fill if it's a new part creation and has a number

        try {
            const res = await api.get(`/store/orders/last-by-part/${encodeURIComponent(pn)}`);
            if (res.data?.success && res.data.data) {
                const po = res.data.data;
                const currentVals = form.getFieldsValue();
                
                form.setFieldsValue({
                    partName: currentVals.partName || po.partName,
                    costPrice: po.unitPrice,
                    buyGstPercent: po.gstPercent,
                });
                message.info(`Auto-filled details from PO #${po._id.slice(-6).toUpperCase()}`);
            }
        } catch (error) {
            // Silently ignore if not found or network error
            console.log('No recent PO found for auto-fill');
        }
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (editingPart) {
            const success = await updatePart(editingPart._id, values);
            if (success) {
                message.success('Part updated successfully!');
                setIsModalOpen(false);
                fetchParts();
            } else {
                message.error('Failed to update part');
            }
        } else {
            const success = await createPart(values);
            if (success) {
                message.success('Part created successfully!');
                setIsModalOpen(false);
                fetchParts();
            } else {
                message.error('Failed to create part');
            }
        }
    };

    const handleDelete = async (part: Part) => {
        const success = await deletePart(part._id);
        if (success) {
            message.success(`${part.partName} deleted`);
            fetchParts();
        } else {
            message.error('Failed to delete part');
        }
    };

    const getStockTag = (part: Part) => {
        if (part.quantity === 0) {
            return <Tag icon={<WarningOutlined />} color="red" style={{ borderRadius: 6, fontWeight: 600 }}>Out of Stock</Tag>;
        }
        if (part.quantity <= part.minStock) {
            return <Tag icon={<WarningOutlined />} color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>Low Stock</Tag>;
        }
        return <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>In Stock</Tag>;
    };

    const columns = [
        {
            title: 'Part',
            key: 'part',
            width: 260,
            render: (_: unknown, record: Part) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: '#4f46e5',
                    }}>
                        {record.partName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{record.partName}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                            {record.partNumber}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 130,
            render: (cat: string) => (
                <Tag
                    color={categoryColorMap[cat] || 'default'}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                >
                    {cat}
                </Tag>
            ),
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            sorter: (a: Part, b: Part) => a.quantity - b.quantity,
            render: (qty: number, record: Part) => (
                <span style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: qty === 0 ? '#ef4444' : qty <= record.minStock ? '#f59e0b' : '#10b981',
                }}>
                    {qty}
                </span>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_: unknown, record: Part) => getStockTag(record),
        },
        {
            title: 'Cost & Buy Tax',
            dataIndex: 'costPrice',
            key: 'costPrice',
            width: 140,
            sorter: (a: Part, b: Part) => a.costPrice - b.costPrice,
            render: (v: number, record: Part) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#64748b' }}>₹{v.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>+ {record.buyGstPercent || 0}% GST</div>
                </div>
            ),
        },
        {
            title: 'Sell & Sell Tax',
            dataIndex: 'sellPrice',
            key: 'sellPrice',
            width: 140,
            sorter: (a: Part, b: Part) => a.sellPrice - b.sellPrice,
            render: (v: number, record: Part) => (
                <div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>₹{v.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>+ {record.sellGstPercent || 0}% GST</div>
                </div>
            ),
        },
        {
            title: 'HSN Code',
            dataIndex: 'hsnCode',
            key: 'hsnCode',
            width: 110,
            render: (v: string) => v ? <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600, fontFamily: 'monospace' }}>{v}</Tag> : <span style={{ color: '#cbd5e1' }}>—</span>,
        },
        {
            title: 'Vehicle',
            dataIndex: 'vehicleModel',
            key: 'vehicleModel',
            width: 130,
            render: (v: string) => v || <span style={{ color: '#cbd5e1' }}>—</span>,
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            width: 100,
            render: (v: string) => v || <span style={{ color: '#cbd5e1' }}>—</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: unknown, record: Part) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        style={{ color: '#4f46e5', fontWeight: 600 }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Part"
                        description={`Are you sure you want to delete ${record.partName}?`}
                        onConfirm={() => handleDelete(record)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Quick stats
    const totalParts = filtered.length;
    const lowStockCount = filtered.filter(p => p.quantity <= p.minStock && p.quantity > 0).length;
    const outOfStockCount = filtered.filter(p => p.quantity === 0).length;
    const totalValue = filtered.reduce((sum, p) => sum + p.quantity * p.sellPrice, 0);

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>📦 Parts Inventory</h1>
                <p>View, search, and manage all auto parts in your store</p>
            </div>

            {/* Quick Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderColor: '#c7d2fe', cursor: 'default' }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>Showing</span>} value={totalParts} valueStyle={{ fontSize: 28, fontWeight: 800 }} suffix="parts" />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fde68a', cursor: 'default' }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>Low Stock</span>} value={lowStockCount} valueStyle={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderColor: '#fca5a5', cursor: 'default' }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>Out of Stock</span>} value={outOfStockCount} valueStyle={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderColor: '#6ee7b7', cursor: 'default' }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>Total Value</span>} value={totalValue} prefix="₹" valueStyle={{ fontSize: 28, fontWeight: 800, color: '#10b981' }} />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>
                            <AppstoreOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                            All Parts
                        </span>
                        <Space wrap>
                            <Input
                                placeholder="Search parts..."
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 200, borderRadius: 10 }}
                                allowClear
                            />
                            <Select
                                placeholder="Category"
                                allowClear
                                value={categoryFilter}
                                onChange={v => setCategoryFilter(v)}
                                style={{ width: 150, borderRadius: 10 }}
                                options={categoryOptions.map(c => ({ value: c, label: c }))}
                            />
                            <Select
                                placeholder={<><FilterOutlined /> Stock Filter</>}
                                allowClear
                                value={stockFilter}
                                onChange={v => setStockFilter(v)}
                                style={{ width: 150, borderRadius: 10 }}
                                options={[
                                    { value: 'lowStock', label: '⚠️ Low Stock' },
                                    { value: 'outOfStock', label: '🔴 Out of Stock' },
                                ]}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                                size="large"
                                style={{ borderRadius: 10 }}
                            >
                                Add Part
                            </Button>
                        </Space>
                    </div>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={loading}>
                    <Table
                        dataSource={filtered}
                        columns={columns}
                        rowKey="_id"
                        pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['10', '15', '25', '50'] }}
                        scroll={{ x: 1200 }}
                        style={{ marginTop: 4 }}
                    />
                </Spin>
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        {editingPart ? '✏️ Edit Part' : '➕ Add New Part'}
                    </span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={680}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark="optional"
                    size="large"
                    style={{ marginTop: 16 }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="partName" label={<span style={{ fontWeight: 600 }}>Part Name</span>} rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="e.g. Brake Pad Set" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="partNumber" label={<span style={{ fontWeight: 600 }}>Part Number</span>} rules={[{ required: true, message: 'Required' }]}>
                                <Input 
                                    placeholder="e.g. BP-001" 
                                    style={{ textTransform: 'uppercase' }} 
                                    onBlur={handlePartNumberBlur}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="category" label={<span style={{ fontWeight: 600 }}>Category</span>} rules={[{ required: true, message: 'Required' }]}>
                                <Select options={categoryOptions.map(c => ({ value: c, label: c }))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="quantity" label={<span style={{ fontWeight: 600 }}>Quantity</span>} rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="minStock" label={<span style={{ fontWeight: 600 }}>Min Stock Level</span>}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="costPrice" label={<span style={{ fontWeight: 600 }}>Cost Price (₹)</span>} rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} prefix="₹" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="buyGstPercent" label={<span style={{ fontWeight: 600 }}>Buy GST (%)</span>}>
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="sellPrice" label={<span style={{ fontWeight: 600 }}>Sell Price (₹)</span>} rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} prefix="₹" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="sellGstPercent" label={<span style={{ fontWeight: 600 }}>Sell GST (%)</span>}>
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="hsnCode" label={<span style={{ fontWeight: 600 }}>HSN Code</span>}>
                                <Input placeholder="e.g. 87089900" style={{ fontFamily: 'monospace' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="location" label={<span style={{ fontWeight: 600 }}>Location / Rack</span>}>
                                <Input placeholder="e.g. Rack A1" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="supplier" label={<span style={{ fontWeight: 600 }}>Supplier</span>}>
                                <Input placeholder="e.g. Bosch India" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="vehicleModel" label={<span style={{ fontWeight: 600 }}>Vehicle Model</span>}>
                                <Input placeholder="e.g. Maruti Swift" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>Description</span>}>
                        <Input.TextArea rows={2} placeholder="Optional description..." />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, fontWeight: 700 }}>
                                {editingPart ? 'Update Part' : 'Create Part'}
                            </Button>
                            <Button onClick={() => setIsModalOpen(false)} block style={{ height: 48 }}>
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
