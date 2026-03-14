import { useState, useEffect } from 'react';
import {
    Card, Button, Input, Modal, Form, Popconfirm,
    message, Empty, Tag, Space, Table, Spin,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    UserOutlined, PhoneOutlined, TeamOutlined,
} from '@ant-design/icons';
import whatsAppService, { type WhatsAppGroup, type GroupMember } from '../services/whatsAppService';

// ── Types ──────────────────────────────────────────────────────────────
type MemberRole = 'mechanic' | 'driver' | 'manager' | 'receptionist';

// ── Constants ──────────────────────────────────────────────────────────
const roleConfig: Record<MemberRole, { label: string; color: string; emoji: string }> = {
    mechanic:     { label: 'Mechanic',     color: 'blue',    emoji: '🔧' },
    driver:       { label: 'Driver',       color: 'green',   emoji: '🚗' },
    manager:      { label: 'Manager',      color: 'purple',  emoji: '📋' },
    receptionist: { label: 'Receptionist', color: 'orange',  emoji: '🛎️' },
};

// ── Main Component ─────────────────────────────────────────────────────
export default function WhatsAppGroups() {
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [form] = Form.useForm();

    useEffect(() => { 
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await whatsAppService.getAllGroups();
            setGroups(data);
        } catch (error) {
            message.error('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    // ── CRUD ──
    const openCreate = () => {
        setEditingGroup(null);
        setMembers([{ name: '', mobile: '', role: 'mechanic' }]);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (group: WhatsAppGroup) => {
        setEditingGroup(group);
        setMembers(group.members.map(m => ({ ...m })));
        form.setFieldsValue({ name: group.name });
        setModalOpen(true);
    };

    const handleSave = async (values: { name: string }) => {
        const validMembers = members.filter(m => m.name.trim() && m.mobile.trim());
        if (validMembers.length === 0) {
            message.warning('Please add at least one member with both name and mobile number');
            return;
        }

        try {
            if (editingGroup) {
                await whatsAppService.updateGroup(editingGroup._id, {
                    name: values.name.trim(),
                    members: validMembers
                });
                message.success('Group updated successfully!');
            } else {
                await whatsAppService.createGroup({
                    name: values.name.trim(),
                    members: validMembers
                });
                message.success('Group created successfully!');
            }
            fetchGroups();
            setModalOpen(false);
        } catch (error) {
            message.error('Failed to save group');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await whatsAppService.deleteGroup(id);
            message.success('Group deleted successfully');
            fetchGroups();
        } catch (error) {
            message.error('Failed to delete group');
        }
    };

    // ── Member helpers ──
    const addMember = (role: MemberRole) => {
        // Using a temporary random ID for React key purposes during editing
        setMembers(prev => [...prev, { name: '', mobile: '', role }]);
    };

    const updateMember = (index: number, field: keyof GroupMember, value: string) => {
        setMembers(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const removeMember = (index: number) => {
        setMembers(prev => prev.filter((_, i) => i !== index));
    };

    const columns = [
        {
            title: 'Group Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span style={{ fontWeight: 700 }}>{text}</span>,
        },
        {
            title: 'Members',
            key: 'members',
            render: (_: unknown, record: WhatsAppGroup) => (
                <Space size={[0, 4]} wrap>
                    {record.members.map((m, i) => (
                        <Tag key={m._id || i} color={roleConfig[m.role].color} style={{ borderRadius: 6 }}>
                            {roleConfig[m.role].emoji} {m.name}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_: unknown, record: WhatsAppGroup) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(record)}
                        style={{ color: '#4f46e5' }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Group?"
                        description="Are you sure you want to delete this group?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── Render ──
    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>👥 Contact Groups</h1>
                <p>Manage groups of mechanics, drivers, managers, and receptionists</p>
            </div>

            <Card
                title={
                    <span style={{ fontWeight: 700 }}>
                        <TeamOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                        All Groups ({groups.length})
                    </span>
                }
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>
                        Create New Group
                    </Button>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={loading}>
                    <Table
                        dataSource={groups}
                        columns={columns}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                        locale={{
                            emptyText: (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={<span style={{ color: '#94a3b8' }}>No groups found. Click "Create New Group" to start.</span>}
                                    />
                                </div>
                            )
                        }}
                    />
                </Spin>
            </Card>

            {/* ── Modal ── */}
            <Modal
                title={<span style={{ fontSize: 18, fontWeight: 700 }}>{editingGroup ? 'Edit Group' : 'Create New Group'}</span>}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={640}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }} size="large">
                    <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 600 }}>Group Name</span>}
                        rules={[{ required: true, message: 'Please enter a group name' }]}
                    >
                        <Input placeholder="e.g. Sales Team, Workshop Staff" />
                    </Form.Item>

                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Members</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {members.map((m, index) => {
                            return (
                                <div key={index} style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {(['mechanic', 'driver', 'manager', 'receptionist'] as MemberRole[]).map(r => (
                                                <Button
                                                    key={r}
                                                    size="small"
                                                    type={m.role === r ? 'primary' : 'default'}
                                                    onClick={() => {
                                                        const next = [...members];
                                                        next[index] = { ...next[index], role: r };
                                                        setMembers(next);
                                                    }}
                                                    style={{ borderRadius: 6, fontWeight: 600 }}
                                                >
                                                    {roleConfig[r].emoji} {roleConfig[r].label}
                                                </Button>
                                            ))}
                                        </div>
                                        {members.length > 1 && (
                                            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeMember(index)} />
                                        )}
                                    </div>

                                    <div style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                                            <UserOutlined style={{ marginRight: 4 }} />
                                            Member Name
                                        </div>
                                        <Input
                                            size="large"
                                            placeholder="Enter name"
                                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                            value={m.name}
                                            onChange={(e) => updateMember(index, 'name', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                                            <PhoneOutlined style={{ marginRight: 4 }} /> Mobile Number
                                        </div>
                                        <Input
                                            placeholder="Enter mobile number"
                                            prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                                            value={m.mobile}
                                            onChange={e => updateMember(index, 'mobile', e.target.value.replace(/[^\d]/g, ''))}
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {(['mechanic', 'driver', 'manager', 'receptionist'] as MemberRole[]).map(r => (
                            <Button key={r} icon={<PlusOutlined />} size="small" onClick={() => addMember(r)} style={{ borderRadius: 8 }}>
                                Add {roleConfig[r].label}
                            </Button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block style={{ height: 46, fontWeight: 700, borderRadius: 10 }}>
                            {editingGroup ? 'Update Group' : 'Save Group'}
                        </Button>
                        <Button block onClick={() => setModalOpen(false)} style={{ height: 46, borderRadius: 10 }}>
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
