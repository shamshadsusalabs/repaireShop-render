import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Alert, Spin } from 'antd';
import { WhatsAppOutlined, SendOutlined } from '@ant-design/icons';
import jobService from '../services/jobService';
import api from '../services/api';
import type { Job } from '../../types';

interface DeliveryWhatsAppModalProps {
    open: boolean;
    job: Job | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function DeliveryWhatsAppModal({ open, job, onCancel, onSuccess }: DeliveryWhatsAppModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetchingSettings, setFetchingSettings] = useState(false);
    const [previewText, setPreviewText] = useState('');

    useEffect(() => {
        if (open && job) {
            setFetchingSettings(true);
            // Fetch default company settings
            api.get('/notification-settings/job_drop').then((res) => {
                const settings = res.data?.data;
                const cName = settings?.companyName || 'Luxure';
                const hNumber = settings?.contactNumber || '9217099701';

                form.setFieldsValue({
                    driverName: '', // To be filled by user
                    companyName: cName,
                    helplineNumber: hNumber,
                });
                updatePreview('', '', cName, hNumber);
            }).catch(() => {
                form.setFieldsValue({
                    driverName: '',
                    driverContact: '',
                    companyName: 'Luxure',
                    helplineNumber: '9217099701',
                });
                updatePreview('', '', 'Luxure', '9217099701');
            }).finally(() => {
                setFetchingSettings(false);
            });
        }
    }, [open, job, form]);

    const updatePreview = (dName: string, dContact: string, cName: string, hNumber: string) => {
        if (!job) return;
        const driverText = dName.trim() ? dName : '[Driver Name]';
        const contactText = dContact.trim() ? dContact : '[Driver Contact]';
        const template = `Hi ${job.customerName}, your car ${job.carModel} (${job.carNumber}) is repaired and out for delivery from ${cName}.\n\nDriver: ${driverText}\nDriver Contact: ${contactText}\n\nFor any queries, call us at ${hNumber}.\n\nThank you!`;
        setPreviewText(template);
    };

    const handleValuesChange = (_: any, allValues: any) => {
        updatePreview(
            allValues.driverName || '',
            allValues.driverContact || '',
            allValues.companyName || '',
            allValues.helplineNumber || ''
        );
    };

    const handleSend = async (values: any) => {
        if (!job) return;
        setLoading(true);
        // Map to interakt variables:
        // {{1}} Customer Name
        // {{2}} Car Model
        // {{3}} Car Number
        // {{4}} Company Name
        // {{5}} Driver Name
        // {{6}} Helpline
        const variables = [
            job.customerName,
            job.carModel,
            job.carNumber,
            values.companyName,
            values.driverName,
            values.driverContact,
            values.helplineNumber,
        ];

        try {
            const res = await jobService.sendDropWhatsApp(job.jobId, variables);
            if (res.data.success) {
                message.success('Delivery WhatsApp notification sent successfully!');
                onSuccess();
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to send WhatsApp notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<><WhatsAppOutlined style={{ color: '#25D366', marginRight: 8 }} />Send Delivery Notification</>}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            width={500}
        >
            <Spin spinning={fetchingSettings}>
                {job && (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSend}
                        onValuesChange={handleValuesChange}
                        style={{ marginTop: 16 }}
                    >
                        <Alert
                            message="Message Preview"
                            description={
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}>
                                    {previewText}
                                </div>
                            }
                            type="success"
                            style={{ marginBottom: 24, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                        />

                        <div style={{ display: 'flex', gap: 16 }}>
                            <Form.Item
                                label="Driver Name"
                                name="driverName"
                                rules={[{ required: true, message: 'Please enter the driver name' }]}
                                style={{ flex: 1 }}
                            >
                                <Input placeholder="E.g. Ramesh Kumar" />
                            </Form.Item>
                            
                            <Form.Item
                                label="Driver Contact No."
                                name="driverContact"
                                rules={[{ required: true, message: 'Please enter driver contact number' }]}
                                style={{ flex: 1 }}
                            >
                                <Input placeholder="E.g. 9876543210" />
                            </Form.Item>
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <Form.Item
                                label="Company Name"
                                name="companyName"
                                rules={[{ required: true, message: 'Required' }]}
                                style={{ flex: 1 }}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Helpline Number"
                                name="helplineNumber"
                                rules={[{ required: true, message: 'Required' }]}
                                style={{ flex: 1 }}
                            >
                                <Input />
                            </Form.Item>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                            <Button onClick={onCancel}>Cancel</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SendOutlined />}
                                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                            >
                                Send WhatsApp
                            </Button>
                        </div>
                    </Form>
                )}
            </Spin>
        </Modal>
    );
}
