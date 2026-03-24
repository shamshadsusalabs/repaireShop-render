import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Input,
    Table,
    Tag,
    Button,
    Space,
    message,
    Empty,
    Row,
    Col,
    Descriptions,
    Spin,
    Tooltip,
} from 'antd';
import {
    SearchOutlined,
    PhoneOutlined,
    CarOutlined,
    FileTextOutlined,
    WhatsAppOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import jobService from '../../admin/services/jobService';
import DeliveryWhatsAppModal from '../../admin/components/DeliveryWhatsAppModal';
import type { Job } from '../../types';

// Status colors
const statusColorMap: Record<string, string> = {
    Pending: 'orange',
    Assigned: 'blue',
    Inspection: 'cyan',
    Approval: 'gold',
    Approved: 'green',
    Rejected: 'red',
    'Parts Requested': 'purple',
    Repairing: 'geekblue',
    Completed: 'green',
};

export default function ReceptionistDashboard() {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sendDropModalOpen, setSendDropModalOpen] = useState(false);
    const [selectedJobForDrop, setSelectedJobForDrop] = useState<Job | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customerInfo, setCustomerInfo] = useState<{
        customerName: string;
        mobile: string;
        carModel: string;
        carNumber: string;
        kmDriven: number;
    } | null>(null);

    // Fetch all jobs (on page load)
    const fetchAllJobs = useCallback(async () => {
        setLoading(true);
        try {
            const { data: res } = await jobService.getAll();
            setJobs(res.data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    // Load all jobs on mount
    useEffect(() => {
        fetchAllJobs();
    }, [fetchAllJobs]);

    // Search by mobile number
    const handleSearch = async () => {
        const query = searchValue.trim();
        if (!query) {
            // If search is empty, load all jobs
            setCustomerInfo(null);
            fetchAllJobs();
            return;
        }

        setSearching(true);
        try {
            const { data: res } = await jobService.getHistory(query);
            setCustomerInfo(res.data.customer);

            // Fetch jobs matching the search
            const { data: allJobsRes } = await jobService.getAll({ search: query });
            setJobs(allJobsRes.data);
        } catch {
            message.error('Failed to search. Please try again.');
            setJobs([]);
            setCustomerInfo(null);
        } finally {
            setSearching(false);
        }
    };

    const handleSendDropWAClick = (job: Job) => {
        setSelectedJobForDrop(job);
        setSendDropModalOpen(true);
    };

    const columns = [
        {
            title: 'Job ID',
            dataIndex: 'jobId',
            key: 'jobId',
            render: (text: string) => (
                <span style={{ fontWeight: 700, color: '#4f46e5' }}>{text}</span>
            ),
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_: unknown, record: Job) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.customerName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        <PhoneOutlined style={{ marginRight: 4 }} />
                        {record.mobile}
                    </div>
                </div>
            ),
        },
        {
            title: 'Vehicle',
            key: 'vehicle',
            render: (_: unknown, record: Job) => (
                <div>
                    <div style={{ fontWeight: 600 }}>
                        <CarOutlined style={{ marginRight: 4 }} />
                        {record.carModel}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.carNumber}</div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'jobType',
            key: 'jobType',
            render: (type: string) => (
                <Tag color={type === 'Pickup' ? 'blue' : 'green'} style={{ borderRadius: 6 }}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag
                    color={statusColorMap[status] || 'default'}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Grand Total',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            render: (total: number) => (
                <span style={{ fontWeight: 700, color: '#10b981' }}>
                    ₹{(total || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => new Date(text).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Job) => (
                <Space size="small">
                    <Tooltip title="View Invoice">
                        <Button
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => navigate(`/invoice/${record.jobId}`)}
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                background: '#4f46e5',
                                borderColor: '#4f46e5',
                                color: '#fff',
                            }}
                        />
                    </Tooltip>
                    {record.status === 'Completed' && (
                        <Tooltip title="Send Delivery WA">
                            <Button
                                size="small"
                                icon={<WhatsAppOutlined />}
                                onClick={() => handleSendDropWAClick(record)}
                                style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    color: '#15803d',
                                    borderColor: '#22c55e',
                                    background: '#f0fdf4',
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>🛎️ Reception Desk</h1>
                <p>Search vehicle records by mobile number or car number</p>
            </div>

            {/* Search Bar */}
            <Card style={{ marginBottom: 24, cursor: 'default' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Input
                            size="large"
                            placeholder="Enter mobile number or car number (e.g. 9876543210 or MH12AB1234)"
                            prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{
                                height: 52,
                                borderRadius: 12,
                                fontSize: 16,
                            }}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            size="large"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={searching}
                            style={{
                                height: 52,
                                borderRadius: 12,
                                fontWeight: 700,
                                paddingInline: 32,
                            }}
                        >
                            Search
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Customer Info Card */}
            {customerInfo && (
                <Card
                    style={{ marginBottom: 24, cursor: 'default' }}
                    title={
                        <span style={{ fontSize: 16, fontWeight: 700 }}>
                            <UserOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                            Customer Details
                        </span>
                    }
                >
                    <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="middle">
                        <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Name</span>}>
                            {customerInfo.customerName}
                        </Descriptions.Item>
                        <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Mobile</span>}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            {customerInfo.mobile}
                        </Descriptions.Item>
                        <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Car Model</span>}>
                            <CarOutlined style={{ marginRight: 4 }} />
                            {customerInfo.carModel}
                        </Descriptions.Item>
                        <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Car Number</span>}>
                            {customerInfo.carNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label={<span style={{ fontWeight: 600 }}>KM Driven</span>}>
                            {customerInfo.kmDriven?.toLocaleString('en-IN')} km
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            {/* Job Records Table */}
            <Card
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        <CarOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                        Job Records {jobs.length > 0 && `(${jobs.length})`}
                    </span>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={searching || loading}>
                    {jobs.length === 0 && !loading && !searching ? (
                        <Empty
                            description={
                                <span style={{ color: '#94a3b8' }}>
                                    No records found. Try a different mobile number or car number.
                                </span>
                            }
                        />
                    ) : (
                        <Table
                            dataSource={jobs}
                            columns={columns}
                            rowKey="jobId"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 1200 }}
                        />
                    )}
                </Spin>
            </Card>
            {/* Modals */}
            <DeliveryWhatsAppModal
                open={sendDropModalOpen}
                job={selectedJobForDrop}
                onCancel={() => {
                    setSendDropModalOpen(false);
                    setSelectedJobForDrop(null);
                }}
                onSuccess={() => {
                    setSendDropModalOpen(false);
                    setSelectedJobForDrop(null);
                }}
            />
        </div>
    );
}
