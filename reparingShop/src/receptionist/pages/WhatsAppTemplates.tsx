import { useState, useEffect } from 'react';
import {
    Card, Button, Input, Modal, Form, Popconfirm,
    message, Empty, Space, Tooltip, Tag, Spin,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    FileTextOutlined, EyeOutlined, CopyOutlined,
} from '@ant-design/icons';
import whatsAppService, { type WhatsAppTemplate } from '../services/whatsAppService';

// ── Constants ──────────────────────────────────────────────────────────
const VARIABLES = [
    { tag: '{{name}}',   desc: 'Customer or member name' },
    { tag: '{{mobile}}', desc: 'Mobile number' },
    { tag: '{{task}}',   desc: 'Pickup or Drop task' },
    { tag: '{{job}}',    desc: 'Job ID or Vehicle number' },
    { tag: '{{date}}',   desc: 'Scheduled Date' },
];

// ── Main Component ─────────────────────────────────────────────────────
export default function WhatsAppTemplates() {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
    const [bodyValue, setBodyValue] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await whatsAppService.getAllTemplates();
            setTemplates(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0]._id);
            }
        } catch (error) {
            message.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const selectedTpl = templates.find(t => t._id === selectedId) || null;

    // ── CRUD ──
    const openCreate = () => {
        setEditingTpl(null);
        setBodyValue('');
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (tpl: WhatsAppTemplate) => {
        setEditingTpl(tpl);
        setBodyValue(tpl.body);
        form.setFieldsValue({ title: tpl.title, body: tpl.body });
        setModalOpen(true);
    };

    const handleSave = async (values: { title: string; body: string }) => {
        try {
            if (editingTpl) {
                await whatsAppService.updateTemplate(editingTpl._id, {
                    title: values.title.trim(),
                    body: values.body.trim()
                });
                message.success('Template updated successfully!');
            } else {
                const newTpl = await whatsAppService.createTemplate({
                    title: values.title.trim(),
                    body: values.body.trim()
                });
                setSelectedId(newTpl._id);
                message.success('Template created successfully!');
            }
            fetchTemplates();
            setModalOpen(false);
        } catch (error) {
            message.error('Failed to save template');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await whatsAppService.deleteTemplate(id);
            message.success('Template deleted successfully');
            if (selectedId === id) setSelectedId(null);
            fetchTemplates();
        } catch (error) {
            message.error('Failed to delete template');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Copied to clipboard!');
    };

    // Insert variable into textarea at current cursor or end
    const insertVar = (tag: string) => {
        const cur = bodyValue;
        const next = cur ? `${cur} ${tag}` : tag;
        setBodyValue(next);
        form.setFieldsValue({ body: next });
    };

    // ── Render ──
    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>📝 Message Templates</h1>
                <p>Create and manage message templates with easy-to-use variables</p>
            </div>

            <Spin spinning={loading}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                    {/* ── Left: Template List ── */}
                    <div style={{ width: 300, flexShrink: 0 }}>
                        <Card
                            title={
                                <span style={{ fontWeight: 700 }}>
                                    <FileTextOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                    Templates ({templates.length})
                                </span>
                            }
                            extra={
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={openCreate}
                                    style={{ borderRadius: 8 }}
                                >
                                    New
                                </Button>
                            }
                            style={{ cursor: 'default' }}
                            bodyStyle={{ padding: 0 }}
                        >
                            {templates.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center' }}>
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span style={{ color: '#94a3b8', fontSize: 13 }}>
                                                No templates found.<br />
                                                Click "New" to create one.
                                            </span>
                                        }
                                    />
                                </div>
                            ) : (
                                <div>
                                    {templates.map(t => (
                                        <div
                                            key={t._id}
                                            onClick={() => setSelectedId(t._id)}
                                            style={{
                                                padding: '14px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f1f5f9',
                                                background: selectedId === t._id
                                                    ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)'
                                                    : 'transparent',
                                                transition: 'background 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 8,
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: selectedId === t._id ? '#4f46e5' : '#1e293b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {t.title}
                                                </div>
                                                <div style={{
                                                    fontSize: 12,
                                                    color: '#94a3b8',
                                                    marginTop: 2,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {t.body.slice(0, 40)}{t.body.length > 40 ? '…' : ''}
                                                </div>
                                            </div>
                                            <Space size={4}>
                                                <Tooltip title="Edit">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={e => { e.stopPropagation(); openEdit(t); }}
                                                        style={{ color: '#4f46e5' }}
                                                    />
                                                </Tooltip>
                                                <Popconfirm
                                                    title="Delete this template?"
                                                    onConfirm={e => { e?.stopPropagation(); handleDelete(t._id); }}
                                                    okText="Yes" cancelText="No"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        danger
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </Popconfirm>
                                            </Space>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ── Right: Template Detail + Preview ── */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {selectedTpl ? (
                            <>
                                {/* Raw Template */}
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 18, fontWeight: 700 }}>
                                                📝 {selectedTpl.title}
                                            </span>
                                            <Space>
                                                <Button
                                                    icon={<CopyOutlined />}
                                                    onClick={() => handleCopy(selectedTpl.body)}
                                                    style={{ borderRadius: 8 }}
                                                >
                                                    Copy Body
                                                </Button>
                                                <Button
                                                    icon={<EditOutlined />}
                                                    onClick={() => openEdit(selectedTpl)}
                                                    style={{ borderRadius: 8 }}
                                                >
                                                    Edit
                                                </Button>
                                            </Space>
                                        </div>
                                    }
                                    style={{ cursor: 'default' }}
                                >
                                    <div style={{
                                        background: '#f8fafc',
                                        borderRadius: 10,
                                        padding: '16px 20px',
                                        fontFamily: 'monospace',
                                        fontSize: 14,
                                        color: '#334155',
                                        lineHeight: 1.8,
                                        whiteSpace: 'pre-wrap',
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        {selectedTpl.body.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
                                            part.startsWith('{{') ? (
                                                <Tag key={i} color="blue" style={{ borderRadius: 6, fontWeight: 600, margin: '0 2px' }}>
                                                    {part}
                                                </Tag>
                                            ) : (
                                                <span key={i}>{part}</span>
                                            )
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                                        Created: {new Date(selectedTpl.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </Card>

                                {/* Info Card */}
                                <Card
                                    title={
                                        <span style={{ fontSize: 16, fontWeight: 700 }}>
                                            <EyeOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                            Template Logic
                                        </span>
                                    }
                                    style={{ cursor: 'default' }}
                                >
                                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                                        This template uses manual placeholders like <Tag color="blue">{'{{name}}'}</Tag>. 
                                        When you select this template in the <strong>Send Notification</strong> page, 
                                        you can quickly replace these fields with actual customer details.
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <Card style={{ cursor: 'default' }}>
                                <Empty
                                    description={
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                                                No template selected
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                                                Select a template from the left or create a new one
                                            </div>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                                Create First Template
                                            </Button>
                                        </div>
                                    }
                                />
                            </Card>
                        )}
                    </div>
                </div>
            </Spin>

            {/* ── Create / Edit Modal ── */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        {editingTpl ? '✏️ Edit Template' : '➕ Create New Template'}
                    </span>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    style={{ marginTop: 16 }}
                    size="large"
                >
                    <Form.Item
                        name="title"
                        label={<span style={{ fontWeight: 600 }}>Template Title</span>}
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. Pickup Alert, Job Ready, Driver Assigned..." />
                    </Form.Item>

                    {/* Variable chips */}
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#475569' }}>
                            Click to insert placeholders:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {VARIABLES.map(v => (
                                <Tag
                                    key={v.tag}
                                    color="blue"
                                    style={{ cursor: 'pointer', borderRadius: 6, fontWeight: 600, fontSize: 13, padding: '3px 10px' }}
                                    onClick={() => insertVar(v.tag)}
                                    title={v.desc}
                                >
                                    {v.tag}
                                </Tag>
                            ))}
                        </div>
                    </div>

                    <Form.Item
                        name="body"
                        label={<span style={{ fontWeight: 600 }}>Message Body</span>}
                        rules={[{ required: true, message: 'Please enter message content' }]}
                    >
                        <Input.TextArea
                            rows={8}
                            placeholder={`Hi {{name}}!\n\nYour car is ready for pickup.\nJob: {{job}}\nDate: {{date}}\n\nThank you!`}
                            value={bodyValue}
                            onChange={e => setBodyValue(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: 14 }}
                        />
                    </Form.Item>

                    {/* Simple Preview */}
                    {bodyValue.trim() && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 8 }}>
                                <EyeOutlined style={{ marginRight: 6 }} /> Preview:
                            </div>
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '12px 16px',
                                fontSize: 14,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                                color: '#1e293b',
                            }}>
                                {bodyValue.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
                                    part.startsWith('{{') ? (
                                        <span key={i} style={{ color: '#4f46e5', fontWeight: 700 }}>{part}</span>
                                    ) : (
                                        <span key={i}>{part}</span>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            style={{ height: 46, fontWeight: 700, borderRadius: 10 }}
                        >
                            {editingTpl ? 'Update Template' : 'Save Template'}
                        </Button>
                        <Button
                            block
                            onClick={() => setModalOpen(false)}
                            style={{ height: 46, borderRadius: 10 }}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
