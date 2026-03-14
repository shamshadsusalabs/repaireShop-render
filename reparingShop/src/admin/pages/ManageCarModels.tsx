import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined } from '@ant-design/icons';
import useCarModelStore from '../store/carModelStore';
import type { CarModel } from '../../types';

const { Title, Text } = Typography;

export default function ManageCarModels() {
    const { models, loading, fetchModels, createModel, updateModel, deleteModel } = useCarModelStore();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingModel, setEditingModel] = useState<CarModel | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const handleAdd = () => {
        setEditingModel(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record: CarModel) => {
        setEditingModel(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteModel(id);
            message.success('Car model deleted successfully');
        } catch (error) {
            // Error managed by store
        }
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            if (editingModel) {
                await updateModel(editingModel._id, values);
                message.success('Car model updated successfully');
            } else {
                await createModel(values);
                message.success('Car model created successfully');
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
            title: 'Car Brand',
            dataIndex: 'brand',
            key: 'brand',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
            sorter: (a: CarModel, b: CarModel) => a.brand.localeCompare(b.brand),
            defaultSortOrder: 'ascend' as const,
        },
        {
            title: 'Model Name',
            dataIndex: 'modelName',
            key: 'modelName',
            sorter: (a: CarModel, b: CarModel) => a.modelName.localeCompare(b.modelName),
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            align: 'right' as const,
            render: (_: any, record: CarModel) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#3b82f6' }} />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete Car Model"
                        description={`Are you sure you want to delete "${record.brand} ${record.modelName}"?`}
                        onConfirm={() => handleDelete(record._id)}
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
                        <CarOutlined style={{ marginRight: 12, color: '#4f46e5' }} />
                        Car Models
                    </Title>
                    <Text type="secondary">Manage the dynamic car models list for job creations.</Text>
                </div>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} style={{ borderRadius: 8, fontWeight: 600 }}>
                    Add New Model
                </Button>
            </div>

            <Card style={{ cursor: 'default', borderRadius: 12 }}>
                <Table
                    columns={columns}
                    dataSource={models}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Card>

            <Modal
                title={editingModel ? "Edit Car Model" : "Add Car Model"}
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
                        name="brand"
                        label="Car Brand"
                        rules={[{ required: true, message: 'Please enter the car brand (e.g., Toyota, Honda)' }]}
                    >
                        <Input placeholder="e.g. Maruti Suzuki, Toyota, Honda" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="modelName"
                        label="Model Name"
                        rules={[{ required: true, message: 'Please enter the car model name' }]}
                    >
                        <Input placeholder="e.g. Swift, Innova, City" size="large" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <Button onClick={() => setIsModalVisible(false)} size="large">
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitting} size="large">
                                {editingModel ? 'Update Model' : 'Create Model'}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
