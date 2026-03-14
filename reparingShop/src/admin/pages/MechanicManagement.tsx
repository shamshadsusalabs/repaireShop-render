import { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Space,
    message,
    Popconfirm,
    Row,
    Col,
    Statistic,
    Spin,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    MailOutlined,
    LockOutlined,
    UserOutlined,
} from '@ant-design/icons';
import useMechanicStore from '../store/mechanicStore';
import type { MechanicFromAPI } from '../services/mechanicService';

const specialties = [
    'Engine & Transmission',
    'Brakes & Suspension',
    'Electrical & Battery',
    'Body & Paint',
    'Full Service Specialist',
    'AC & Cooling System',
    'Tyre & Wheel Alignment',
    'Diagnostics & Scanning',
];

const avatarOptions = ['🔧', '🛠️', '⚡', '🎨', '🏆', '🔩', '⚙️', '🛞'];

export default function MechanicManagement() {
    const {
        mechanicsRaw,
        loading,
        fetchMechanics,
        createMechanic,
        updateMechanic,
        deleteMechanic,
    } = useMechanicStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMechanic, setEditingMechanic] = useState<MechanicFromAPI | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchMechanics();
    }, [fetchMechanics]);

    // Stats
    const totalMechanics = mechanicsRaw.length;
    const availableCount = mechanicsRaw.filter(m => m.available).length;
    const busyCount = mechanicsRaw.filter(m => !m.available).length;

    // Filtered mechanics
    const filtered = mechanicsRaw.filter(m =>
        m.name.toLowerCase().includes(searchText.toLowerCase()) ||
        m.email.toLowerCase().includes(searchText.toLowerCase()) ||
        m.specialty.toLowerCase().includes(searchText.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingMechanic(null);
        form.resetFields();
        form.setFieldsValue({ avatar: '🔧' });
        setIsModalOpen(true);
    };

    const openEditModal = (mechanic: MechanicFromAPI) => {
        setEditingMechanic(mechanic);
        form.setFieldsValue({
            name: mechanic.name,
            email: mechanic.email,
            experience: mechanic.experience,
            specialty: mechanic.specialty,
            mobile: mechanic.mobile,
            avatar: mechanic.avatar,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        if (editingMechanic) {
            // Update
            const payload: any = { ...values };
            // Only include password if it's filled
            if (!payload.password) delete payload.password;
            const success = await updateMechanic(editingMechanic._id, payload);
            if (success) {
                message.success(`${values.name} updated successfully!`);
                setIsModalOpen(false);
                fetchMechanics(); // refresh list
            } else {
                message.error('Failed to update mechanic');
            }
        } else {
            // Create
            const success = await createMechanic(values);
            if (success) {
                message.success(`${values.name} added successfully!`);
                setIsModalOpen(false);
                fetchMechanics(); // refresh list
            } else {
                message.error('Failed to create mechanic');
            }
        }
    };

    const handleDelete = async (mechanic: MechanicFromAPI) => {
        const success = await deleteMechanic(mechanic._id);
        if (success) {
            message.success(`${mechanic.name} deleted`);
            fetchMechanics();
        } else {
            message.error('Failed to delete mechanic');
        }
    };

    const columns = [
        {
            title: 'Mechanic',
            key: 'mechanic',
            render: (_: unknown, record: MechanicFromAPI) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                    }}>
                        {record.avatar || '🔧'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{record.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.mechanicId}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text: string) => (
                <span style={{ color: '#475569', fontSize: 13 }}>
                    <MailOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                    {text}
                </span>
            ),
        },
        {
            title: 'Specialty',
            dataIndex: 'specialty',
            key: 'specialty',
            render: (text: string) => (
                <Tag color="geekblue" style={{ borderRadius: 6 }}>{text}</Tag>
            ),
        },
        {
            title: 'Experience',
            dataIndex: 'experience',
            key: 'experience',
            render: (text: string) => (
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{text}</span>
            ),
        },
        {
            title: 'Mobile',
            dataIndex: 'mobile',
            key: 'mobile',
            render: (text: string) => text ? `+91 ${text}` : '—',
        },
        {
            title: 'Status',
            dataIndex: 'available',
            key: 'available',
            render: (available: boolean) => (
                <Tag
                    icon={available ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={available ? 'green' : 'red'}
                    style={{ borderRadius: 6 }}
                >
                    {available ? 'Available' : 'Busy'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: unknown, record: MechanicFromAPI) => (
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
                        title="Delete Mechanic"
                        description={`Are you sure you want to delete ${record.name}?`}
                        onConfirm={() => handleDelete(record)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const stats = [
        {
            title: 'Total Mechanics',
            value: totalMechanics,
            icon: <TeamOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
            bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '#c7d2fe',
        },
        {
            title: 'Available',
            value: availableCount,
            icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#10b981' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#6ee7b7',
        },
        {
            title: 'Busy',
            value: busyCount,
            icon: <CloseCircleOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '#fca5a5',
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>Mechanic Management</h1>
                <p>Create, edit, and manage all mechanics in the workshop</p>
            </div>

            {/* Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
                {stats.map((stat, i) => (
                    <Col xs={24} sm={8} key={i}>
                        <Card
                            className="stat-card"
                            style={{
                                background: stat.bg,
                                borderColor: stat.border,
                                cursor: 'default',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Statistic
                                    title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>{stat.title}</span>}
                                    value={stat.value}
                                    valueStyle={{ fontSize: 36, fontWeight: 800, color: '#1e293b' }}
                                />
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    background: 'rgba(255,255,255,0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)',
                                }}>
                                    {stat.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Table */}
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>
                            <TeamOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                            All Mechanics
                        </span>
                        <Space>
                            <Input
                                placeholder="Search mechanics..."
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 240, borderRadius: 10 }}
                                allowClear
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                                size="large"
                                style={{ borderRadius: 10 }}
                            >
                                Add Mechanic
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
                        pagination={{ pageSize: 10 }}
                    />
                </Spin>
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        {editingMechanic ? '✏️ Edit Mechanic' : '➕ Add New Mechanic'}
                    </span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={520}
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
                    <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 600 }}><UserOutlined style={{ marginRight: 6 }} />Full Name</span>}
                        rules={[{ required: true, message: 'Name is required' }]}
                    >
                        <Input placeholder="e.g. Rajesh Kumar" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={<span style={{ fontWeight: 600 }}><MailOutlined style={{ marginRight: 6 }} />Email (for login)</span>}
                        rules={[
                            { required: true, message: 'Email is required' },
                            { type: 'email', message: 'Enter a valid email' },
                        ]}
                    >
                        <Input placeholder="e.g. rajesh@luxre.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={
                            <span style={{ fontWeight: 600 }}>
                                <LockOutlined style={{ marginRight: 6 }} />
                                Password {editingMechanic ? '(leave blank to keep current)' : '(for login)'}
                            </span>
                        }
                        rules={editingMechanic ? [] : [
                            { required: true, message: 'Password is required' },
                            { min: 6, message: 'Minimum 6 characters' },
                        ]}
                    >
                        <Input.Password placeholder={editingMechanic ? 'Leave blank to keep current' : 'Minimum 6 characters'} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="experience"
                                label={<span style={{ fontWeight: 600 }}>Experience</span>}
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <Input placeholder="e.g. 5 Years" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="mobile"
                                label={<span style={{ fontWeight: 600 }}>Mobile</span>}
                            >
                                <Input placeholder="10-digit mobile" maxLength={10} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="specialty"
                        label={<span style={{ fontWeight: 600 }}>Specialty</span>}
                        rules={[{ required: true, message: 'Select a specialty' }]}
                    >
                        <Select
                            placeholder="Select specialty"
                            options={specialties.map(s => ({ value: s, label: s }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="avatar"
                        label={<span style={{ fontWeight: 600 }}>Avatar Icon</span>}
                    >
                        <Select
                            placeholder="Choose an icon"
                            options={avatarOptions.map(a => ({
                                value: a,
                                label: <span style={{ fontSize: 20 }}>{a}</span>,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 48, fontWeight: 700 }}
                            >
                                {editingMechanic ? 'Update Mechanic' : 'Create Mechanic'}
                            </Button>
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                block
                                style={{ height: 48 }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
