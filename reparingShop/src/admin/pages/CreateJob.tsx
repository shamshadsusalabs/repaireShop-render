import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, App, Upload, Divider, Table, Tag, Row, Col, Radio } from 'antd';
import { SaveOutlined, UploadOutlined, IdcardOutlined, HistoryOutlined, CarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useCarModelStore from '../store/carModelStore';
import dayjs from 'dayjs';

export default function CreateJob() {
    const { message } = App.useApp();
    const { createJob, searchHistory, customerHistory, loading } = useJobStore();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const currentDate = dayjs().format('YYYY-MM-DD HH:mm');
    const [searchValue, setSearchValue] = useState('');
    const [jobType, setJobType] = useState<'Pickup' | 'Walk-in'>('Walk-in');

    const { models, fetchModels, loading: modelsLoading } = useCarModelStore();

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    // Auto-fill when history is found
    useEffect(() => {
        if (customerHistory.customer) {
            const { customerName, mobile, carModel, carNumber } = customerHistory.customer;
            // Only fill if form fields are empty or match the search (to avoid overwriting user edits too aggressively)
            // But usually user wants auto-fill.
            form.setFieldsValue({
                customerName,
                mobile,
                carModel,
                carNumber,
            });
            message.success(`Found existing customer: ${customerName}`);
        }
    }, [customerHistory, form]);

    const handleSearch = (value: string) => {
        if (value && (value.length >= 4)) {
            searchHistory(value);
            setSearchValue(value);
        }
    };

    const onFinish = async (values: any) => {
        const carImages = values.carImages?.map((file: any) => file.originFileObj) || [];

        const job = await createJob({
            customerName: values.customerName,
            mobile: values.mobile,
            carModel: values.carModel,
            carNumber: values.carNumber.toUpperCase(),
            kmDriven: values.kmDriven,
            jobType: values.jobType,
            location: values.location || '',
            carImages: carImages,
        });

        if (job) {
            message.success(`Job ${job.jobId} created successfully!`);
            navigate(`/job/${job.jobId}`);
        }
    };

    const historyColumns = [
        { title: 'Job ID', dataIndex: 'jobId', key: 'jobId', render: (t: string) => <a onClick={() => window.open(`/job/${t}`, '_blank')}>{t}</a> },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Car', dataIndex: 'carModel', key: 'carModel' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={s === 'Completed' ? 'green' : 'blue'}>{s.toUpperCase()}</Tag>
            )
        },
        { title: 'Total', dataIndex: 'grandTotal', key: 'grandTotal', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>Create New Job Card</h1>
                <p>Register a new vehicle for service</p>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={14}>
                    <Card style={{ cursor: 'default' }}>
                        {/* Auto-generated info */}
                        <div style={{
                            display: 'flex',
                            gap: 24,
                            marginBottom: 28,
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            borderRadius: 12,
                            border: '1px solid #c7d2fe',
                        }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>Job ID</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b' }}>
                                    <IdcardOutlined style={{ marginRight: 8 }} />Auto Generated
                                </div>
                            </div>
                            <Divider type="vertical" style={{ height: 'auto' }} />
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>Date & Time</div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#1e1b4b' }}>{currentDate}</div>
                            </div>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            size="large"
                            initialValues={{ jobType: 'Walk-in' }}
                        >
                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Mobile Number (Search)</span>}
                                name="mobile"
                                rules={[
                                    { required: true, message: 'Mobile number is required' },
                                    { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                                ]}
                            >
                                <Input
                                    placeholder="Enter mobile to search history"
                                    maxLength={10}
                                    addonBefore="+91"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.length === 10) handleSearch(val);
                                    }}
                                    suffix={<Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => handleSearch(form.getFieldValue('mobile'))}>Search</Button>}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Customer Name</span>}
                                name="customerName"
                                rules={[{ required: true, message: 'Customer name is required' }]}
                            >
                                <Input placeholder="Enter customer name" />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Car Number (Search)</span>}
                                name="carNumber"
                                rules={[{ required: true, message: 'Car number is required' }]}
                            >
                                <Input
                                    placeholder="e.g. MH-12-AB-1234"
                                    style={{ textTransform: 'uppercase' }}
                                    onBlur={(e) => handleSearch(e.target.value)}
                                    suffix={<Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => handleSearch(form.getFieldValue('carNumber'))}>Search</Button>}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Car Model</span>}
                                name="carModel"
                                rules={[{ required: true, message: 'Please select a car model' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search & select car model"
                                    optionFilterProp="label"
                                    loading={modelsLoading}
                                    options={models.map(m => ({ value: `${m.brand} ${m.modelName}`, label: `${m.brand} ${m.modelName}` }))}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Kilometer Driven</span>}
                                name="kmDriven"
                                rules={[{ required: true, message: 'Kilometer reading is required' }]}
                            >
                                <InputNumber
                                    placeholder="Enter current odometer reading"
                                    style={{ width: '100%' }}
                                    min={0}
                                    max={999999}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Car Photos (Up to 10)</span>}
                                name="carImages"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => {
                                    if (Array.isArray(e)) return e;
                                    return e?.fileList;
                                }}
                            >
                                <Upload
                                    listType="picture"
                                    maxCount={10}
                                    multiple
                                    beforeUpload={() => false}
                                >
                                    <Button icon={<UploadOutlined />}>Upload Car Photos</Button>
                                </Upload>
                            </Form.Item>

                            <Divider style={{ margin: '16px 0' }}><span style={{ color: '#94a3b8', fontSize: 12 }}>Service Type</span></Divider>

                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Job Type</span>}
                                name="jobType"
                                rules={[{ required: true, message: 'Please select job type' }]}
                            >
                                <Radio.Group
                                    onChange={(e) => setJobType(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Radio.Button
                                            value="Walk-in"
                                            style={{
                                                flex: 1, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 12, fontWeight: 600, fontSize: 15,
                                            }}
                                        >
                                            🚗 Walk-in
                                        </Radio.Button>
                                        <Radio.Button
                                            value="Pickup"
                                            style={{
                                                flex: 1, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 12, fontWeight: 600, fontSize: 15,
                                            }}
                                        >
                                            🚛 Pickup
                                        </Radio.Button>
                                    </div>
                                </Radio.Group>
                            </Form.Item>

                            {jobType === 'Pickup' && (
                                <Form.Item
                                    label={<span style={{ fontWeight: 600 }}><EnvironmentOutlined style={{ marginRight: 4 }} /> Pickup Location</span>}
                                    name="location"
                                    rules={[{ required: true, message: 'Pickup location is required' }]}
                                >
                                    <Input.TextArea
                                        placeholder="Enter full pickup address (e.g. 123, Main Road, Ranchi, Jharkhand 834001)"
                                        rows={3}
                                        style={{ borderRadius: 12 }}
                                    />
                                </Form.Item>
                            )}

                            <Form.Item style={{ marginTop: 12 }}>
                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" loading={loading}>
                                    Save & Continue
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={10}>
                    {customerHistory.history.length > 0 && (
                        <div className="fade-in-right">
                            <div style={{
                                background: '#fff',
                                padding: 24,
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <HistoryOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 700 }}>Service History</h3>
                                        <div style={{ fontSize: 13, color: '#64748b' }}>
                                            Found {customerHistory.history.length} previous visit(s)
                                        </div>
                                    </div>
                                </div>

                                <Table
                                    dataSource={customerHistory.history}
                                    columns={historyColumns}
                                    rowKey="jobId"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: true }}
                                />
                            </div>
                        </div>
                    )}

                    {!customerHistory.history.length && searchValue && (
                        <div className="fade-in-right" style={{
                            background: '#f8fafc',
                            padding: 32,
                            borderRadius: 12,
                            border: '1px dashed #cbd5e1',
                            textAlign: 'center',
                            color: '#94a3b8'
                        }}>
                            <CarOutlined style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                            <div>No history found for "{searchValue}"</div>
                            <div style={{ fontSize: 12 }}>New customer registration</div>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
}
