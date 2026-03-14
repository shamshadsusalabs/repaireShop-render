import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, OrderedListOutlined } from '@ant-design/icons';
import useInspectionItemStore from '../store/inspectionItemStore';
import type { InspectionItem } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const PREDEFINED_ICONS = [
    '🔧', '⚙️', '🔥', '🛑', '🔩', '🔋', '🛞', '💡', '❄️', '🎯', '💨', '🚗', '🛠️', '🪛', '🛢️', '🚿', '🔑', '🧼', '📻', '💺'
];

export default function ManageInspectionItems() {
    const { items, loading, fetchItems, createItem, updateItem, deleteItem } = useInspectionItemStore();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({ icon: '🔧' }); // default icon
        setIsModalVisible(true);
    };

    const handleEdit = (record: InspectionItem) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteItem(id);
            message.success('Item deleted successfully');
        } catch (error) {
            // Error managed by store
        }
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            if (editingItem) {
                await updateItem(editingItem._id!, values);
                message.success('Item updated successfully');
            } else {
                await createItem(values);
                message.success('Item created successfully');
            }
            setIsModalVisible(false);
        } catch (error) {
            // Error managed by store
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Icon',
            dataIndex: 'icon',
            key: 'icon',
            width: 80,
            align: 'center' as const,
            render: (icon: string) => <span style={{ fontSize: 24 }}>{icon}</span>,
        },
        {
            title: 'Inspection Item Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            align: 'right' as const,
            render: (_: any, record: InspectionItem) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#3b82f6' }} />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete Item"
                        description={`Are you sure you want to delete "${record.name}"?`}
                        onConfirm={() => handleDelete(record._id!)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <OrderedListOutlined style={{ marginRight: 12, color: '#4f46e5' }} />
                        Checklist Settings
                    </Title>
                    <Text type="secondary">Manage the dynamic inspection items checklist for mechanics.</Text>
                </div>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} style={{ borderRadius: 8, fontWeight: 600 }}>
                    Add New Item
                </Button>
            </div>

            <Card style={{ cursor: 'default', borderRadius: 12 }}>
                <Table
                    columns={columns}
                    dataSource={items}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingItem ? "Edit Inspection Item" : "Add Inspection Item"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="name"
                        label="Item Name"
                        rules={[{ required: true, message: 'Please enter the item name (e.g., Engine, Brake)' }]}
                    >
                        <Input placeholder="e.g. Steering, Brake, Engine" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="icon"
                        label="Emoji Icon"
                        rules={[{ required: true, message: 'Please select an emoji icon' }]}
                    >
                        <Select placeholder="Select an icon" size="large">
                            {PREDEFINED_ICONS.map(icon => (
                                <Option key={icon} value={icon}>
                                    <span style={{ fontSize: 20 }}>{icon}</span>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <Button onClick={() => setIsModalVisible(false)} size="large">
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitting} size="large">
                                {editingItem ? 'Update Item' : 'Create Item'}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
