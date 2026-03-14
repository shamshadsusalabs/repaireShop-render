import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Input,
    Table,
    Tag,
    Button,
    Modal,
    Select,
    Space,
    message,
    Empty,
    Row,
    Col,
    Descriptions,
    Spin,
    Result,
    Tooltip,
} from 'antd';
import {
    SearchOutlined,
    PhoneOutlined,
    CarOutlined,
    UserOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import jobService from '../../admin/services/jobService';
import type { Job, Driver } from '../../types';

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
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customerInfo, setCustomerInfo] = useState<{
        customerName: string;
        mobile: string;
        carModel: string;
        carNumber: string;
        kmDriven: number;
    } | null>(null);

    // Driver assignment modal
    const [driverModalOpen, setDriverModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<'Pickup' | 'Drop'>('Pickup');
    const [assigning, setAssigning] = useState(false);

    // Success state
    const [assignmentResult, setAssignmentResult] = useState<{
        show: boolean;
        customerName: string;
        driverName: string;
        driverTask: string;
        jobId: string;
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

    // Fetch drivers
    const fetchDrivers = useCallback(async () => {
        setLoadingDrivers(true);
        try {
            const { data: res } = await jobService.getDrivers();
            setDrivers(res.data);
        } catch {
            // ignore
        } finally {
            setLoadingDrivers(false);
        }
    }, []);

    // Load all jobs + drivers on mount
    useEffect(() => {
        fetchAllJobs();
        fetchDrivers();
    }, [fetchAllJobs, fetchDrivers]);

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

    // Open driver assignment modal
    const openDriverModal = (job: Job) => {
        setSelectedJob(job);
        setSelectedDriverId(null);
        setSelectedTask('Pickup');
        setDriverModalOpen(true);
    };

    // Assign driver
    const handleAssignDriver = async () => {
        if (!selectedJob || !selectedDriverId) {
            message.warning('Please select a driver');
            return;
        }

        setAssigning(true);
        try {
            await jobService.assignDriver(selectedJob.jobId, selectedDriverId, selectedTask);
            message.success(`Driver assigned for ${selectedTask} on Job ${selectedJob.jobId}`);
            setDriverModalOpen(false);

            // Find driver name for success message
            const assignedDriver = drivers.find(d => d._id === selectedDriverId);
            const driverName = assignedDriver?.name || 'Driver';

            // Show success result
            setAssignmentResult({
                show: true,
                customerName: selectedJob.customerName,
                driverName,
                driverTask: selectedTask,
                jobId: selectedJob.jobId,
            });

            // Refresh job list
            if (searchValue.trim()) {
                const { data: allJobsRes } = await jobService.getAll({ search: searchValue.trim() });
                setJobs(allJobsRes.data);
            } else {
                fetchAllJobs();
            }
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Failed to assign driver');
        } finally {
            setAssigning(false);
        }
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
            title: 'Driver',
            key: 'driver',
            render: (_: unknown, record: Job) => {
                const driver = record.driverId;
                if (driver && typeof driver === 'object') {
                    return (
                        <div>
                            <Tag color="green" style={{ borderRadius: 6 }}>
                                {driver.avatar} {driver.name}
                            </Tag>
                            {record.driverTask && (
                                <Tag color={record.driverTask === 'Pickup' ? 'blue' : 'orange'} style={{ borderRadius: 6, marginTop: 4 }}>
                                    {record.driverTask}
                                </Tag>
                            )}
                        </div>
                    );
                }
                return <span style={{ color: '#94a3b8', fontSize: 12 }}>Not Assigned</span>;
            },
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
                    <Button
                        type="primary"
                        size="small"
                        icon={<CarOutlined />}
                        onClick={() => openDriverModal(record)}
                        style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                        Assign Driver
                    </Button>
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
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>🛎️ Reception Desk</h1>
                <p>Search vehicle records by mobile number or car number, and assign drivers for Pickup/Drop</p>
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

            {/* Driver Assignment Modal */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        🚗 Assign Driver — {selectedJob?.jobId}
                    </span>
                }
                open={driverModalOpen}
                onCancel={() => setDriverModalOpen(false)}
                footer={null}
                width={520}
                destroyOnClose
            >
                {selectedJob && (
                    <div style={{ marginTop: 16 }}>
                        {/* Job Info Summary */}
                        <Card
                            size="small"
                            style={{
                                marginBottom: 20,
                                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                                borderColor: '#c7d2fe',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedJob.customerName}</div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>
                                        {selectedJob.carModel} • {selectedJob.carNumber}
                                    </div>
                                </div>
                                <Tag color={statusColorMap[selectedJob.status]} style={{ borderRadius: 6, fontWeight: 600 }}>
                                    {selectedJob.status}
                                </Tag>
                            </div>
                        </Card>

                        {/* Task Type Selection */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 14 }}>
                                <CarOutlined style={{ marginRight: 6 }} /> Task Type
                            </label>
                            <Space size="middle">
                                <Button
                                    type={selectedTask === 'Pickup' ? 'primary' : 'default'}
                                    size="large"
                                    onClick={() => setSelectedTask('Pickup')}
                                    style={{
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        height: 48,
                                        paddingInline: 32,
                                        ...(selectedTask === 'Pickup' ? { background: '#3b82f6' } : {}),
                                    }}
                                >
                                    🚙 Pickup Vehicle
                                </Button>
                                <Button
                                    type={selectedTask === 'Drop' ? 'primary' : 'default'}
                                    size="large"
                                    onClick={() => setSelectedTask('Drop')}
                                    style={{
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        height: 48,
                                        paddingInline: 32,
                                        ...(selectedTask === 'Drop' ? { background: '#f59e0b' } : {}),
                                    }}
                                >
                                    📦 Drop Vehicle
                                </Button>
                            </Space>
                        </div>

                        {/* Driver Selection */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 14 }}>
                                <UserOutlined style={{ marginRight: 6 }} /> Select Driver
                            </label>
                            <Select
                                size="large"
                                placeholder="Choose a driver"
                                value={selectedDriverId}
                                onChange={setSelectedDriverId}
                                loading={loadingDrivers}
                                style={{ width: '100%', borderRadius: 10 }}
                                options={drivers.map(d => ({
                                    value: d._id,
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 18 }}>{d.avatar || '🚗'}</span>
                                            <span style={{ fontWeight: 600 }}>{d.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: 12 }}>{d.email}</span>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>

                        {/* Submit */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleAssignDriver}
                                loading={assigning}
                                disabled={!selectedDriverId}
                                style={{ height: 48, fontWeight: 700, borderRadius: 10 }}
                            >
                                Assign Driver for {selectedTask}
                            </Button>
                            <Button
                                size="large"
                                block
                                onClick={() => setDriverModalOpen(false)}
                                style={{ height: 48, borderRadius: 10 }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Success Modal */}
            <Modal
                open={!!assignmentResult?.show}
                onCancel={() => setAssignmentResult(null)}
                footer={null}
                width={480}
                centered
                destroyOnClose
            >
                {assignmentResult && (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                        title="Driver Assigned Successfully! 🎉"
                        subTitle={`${assignmentResult.driverName} assigned for ${assignmentResult.driverTask} — Job ${assignmentResult.jobId}`}
                        extra={[
                            <Button
                                key="close"
                                type="primary"
                                size="large"
                                onClick={() => setAssignmentResult(null)}
                                style={{ borderRadius: 12, height: 48, fontWeight: 700 }}
                            >
                                Close
                            </Button>,
                        ]}
                    />
                )}
            </Modal>
        </div>
    );
}
