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
    Switch,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    SearchOutlined,
    MailOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CrownOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import useUserStore from '../store/userStore';
import type { UserFromAPI } from '../services/userService';

const roleOptions = [
    { value: 'admin', label: '👑 Admin', color: 'purple' },
    { value: 'manager', label: '📋 Manager', color: 'blue' },
    { value: 'store', label: '🏪 Store', color: 'cyan' },
    { value: 'accountant', label: '💰 Accountant', color: 'gold' },
    { value: 'driver', label: '🚗 Driver', color: 'green' },
    { value: 'receptionist', label: '🛎️ Receptionist', color: 'magenta' },
];

const roleColorMap: Record<string, string> = {
    admin: 'purple',
    manager: 'blue',
    store: 'cyan',
    accountant: 'gold',
    driver: 'green',
    receptionist: 'magenta',
};

const roleIconMap: Record<string, string> = {
    admin: '👑',
    manager: '📋',
    store: '🏪',
    accountant: '💰',
    driver: '🚗',
    receptionist: '🛎️',
};

const avatarOptions = ['👤', '👨‍💼', '👩‍💼', '🧑‍💻', '🏪', '💼', '🚗', '📊'];

export default function UserManagement() {
    const {
        users,
        loading,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
    } = useUserStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserFromAPI | null>(null);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Stats
    const totalUsers = users.length;
    const activeCount = users.filter(u => u.isActive).length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const managerCount = users.filter(u => u.role === 'manager').length;

    // Filtered users
    const filtered = users.filter(u => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email.toLowerCase().includes(searchText.toLowerCase()) ||
            (u.mobileNumber || '').includes(searchText);
        const matchesRole = roleFilter ? u.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ avatar: '👤', role: 'manager', isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserFromAPI) => {
        setEditingUser(user);
        form.setFieldsValue({
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            avatar: user.avatar,
            isActive: user.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        if (editingUser) {
            const payload: any = { ...values };
            if (!payload.password) delete payload.password;
            const success = await updateUser(editingUser._id, payload);
            if (success) {
                message.success(`${values.name} updated successfully!`);
                setIsModalOpen(false);
                fetchUsers();
            } else {
                message.error('Failed to update user');
            }
        } else {
            const success = await createUser(values);
            if (success) {
                message.success(`${values.name} created successfully!`);
                setIsModalOpen(false);
                fetchUsers();
            } else {
                message.error('Failed to create user');
            }
        }
    };

    const handleDelete = async (user: UserFromAPI) => {
        const success = await deleteUser(user._id);
        if (success) {
            message.success(`${user.name} deleted`);
            fetchUsers();
        } else {
            message.error('Failed to delete user');
        }
    };

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_: unknown, record: UserFromAPI) => (
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
                        {record.avatar || '👤'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{record.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            <MailOutlined style={{ marginRight: 4 }} />
                            {record.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag
                    color={roleColorMap[role] || 'default'}
                    style={{ borderRadius: 6, fontWeight: 600, textTransform: 'capitalize' as const }}
                >
                    {roleIconMap[role] || '👤'} {role}
                </Tag>
            ),
        },
        {
            title: 'Mobile',
            dataIndex: 'mobileNumber',
            key: 'mobileNumber',
            render: (mobile: string) => (
                <span style={{ fontSize: 13, color: '#475569' }}>
                    <PhoneOutlined style={{ marginRight: 4, color: '#4f46e5' }} />
                    {mobile || '—'}
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (active: boolean) => (
                <Tag
                    icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={active ? 'green' : 'red'}
                    style={{ borderRadius: 6 }}
                >
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: unknown, record: UserFromAPI) => (
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
                        title="Delete User"
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
            title: 'Total Users',
            value: totalUsers,
            icon: <UserOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
            bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '#c7d2fe',
        },
        {
            title: 'Active',
            value: activeCount,
            icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#10b981' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#6ee7b7',
        },
        {
            title: 'Admins',
            value: adminCount,
            icon: <CrownOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />,
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '#c4b5fd',
        },
        {
            title: 'Managers',
            value: managerCount,
            icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#3b82f6' }} />,
            bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '#93c5fd',
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>Team Management</h1>
                <p>Create, edit, and manage all team members — admins, managers, store, accountant, and drivers</p>
            </div>

            {/* Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
                {stats.map((stat, i) => (
                    <Col xs={24} sm={12} md={6} key={i}>
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
                            <UserOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                            All Team Members
                        </span>
                        <Space>
                            <Input
                                placeholder="Search users..."
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 200, borderRadius: 10 }}
                                allowClear
                            />
                            <Select
                                placeholder="All Roles"
                                allowClear
                                value={roleFilter}
                                onChange={v => setRoleFilter(v)}
                                style={{ width: 150, borderRadius: 10 }}
                                options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                                size="large"
                                style={{ borderRadius: 10 }}
                            >
                                Add User
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
                        {editingUser ? '✏️ Edit User' : '➕ Add New User'}
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
                        <Input placeholder="e.g. user@luxre.com" />
                    </Form.Item>

                    <Form.Item
                        name="mobileNumber"
                        label={<span style={{ fontWeight: 600 }}><PhoneOutlined style={{ marginRight: 6 }} />Mobile Number</span>}
                        rules={[
                            { required: true, message: 'Mobile number is required' },
                            { pattern: /^[0-9]{10}$/, message: 'Enter a valid 10-digit mobile number' },
                        ]}
                    >
                        <Input placeholder="e.g. 9876543210" maxLength={10} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={
                            <span style={{ fontWeight: 600 }}>
                                <LockOutlined style={{ marginRight: 6 }} />
                                Password {editingUser ? '(leave blank to keep current)' : '(for login)'}
                            </span>
                        }
                        rules={editingUser ? [] : [
                            { required: true, message: 'Password is required' },
                            { min: 6, message: 'Minimum 6 characters' },
                        ]}
                    >
                        <Input.Password placeholder={editingUser ? 'Leave blank to keep current' : 'Minimum 6 characters'} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="role"
                                label={<span style={{ fontWeight: 600 }}><SafetyCertificateOutlined style={{ marginRight: 6 }} />Role</span>}
                                rules={[{ required: true, message: 'Select a role' }]}
                            >
                                <Select
                                    placeholder="Select role"
                                    options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="avatar"
                                label={<span style={{ fontWeight: 600 }}>Avatar Icon</span>}
                            >
                                <Select
                                    placeholder="Choose icon"
                                    options={avatarOptions.map(a => ({
                                        value: a,
                                        label: <span style={{ fontSize: 20 }}>{a}</span>,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {editingUser && (
                        <Form.Item
                            name="isActive"
                            label={<span style={{ fontWeight: 600 }}>Active Status</span>}
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 48, fontWeight: 700 }}
                            >
                                {editingUser ? 'Update User' : 'Create User'}
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
