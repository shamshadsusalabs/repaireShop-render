import { useEffect, useState } from 'react';
import {
    Card, Table, Tag, Button, Modal, Select, InputNumber, message,
    Space, Spin, Empty, Badge, Descriptions, Divider, Alert, Row, Col, Statistic,
} from 'antd';
import {
    ToolOutlined, CarOutlined, UserOutlined, CheckCircleOutlined,
    SendOutlined, InboxOutlined, WarningOutlined,
} from '@ant-design/icons';
import jobApiService from '../../admin/services/jobService';
import usePartStore from '../../admin/store/partStore';
import type { Job, FaultyPart } from '../../types';
import type { Part } from '../../admin/services/partService';

export default function PartsRequestsPage() {
    const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [issuing, setIssuing] = useState(false);

    // Parts selection state: maps faultyPart index → { partId, quantity }
    const [partsSelection, setPartsSelection] = useState<
        Array<{ partId: string; quantityIssued: number }>
    >([]);

    const { parts, fetchParts } = usePartStore();

    // Fetch approved jobs
    const loadApprovedJobs = async () => {
        setLoading(true);
        try {
            const { data: res } = await jobApiService.getApprovedForParts();
            setApprovedJobs(res.data);
        } catch (err) {
            console.error(err);
            message.error('Failed to fetch approved jobs');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadApprovedJobs();
        fetchParts();
    }, [fetchParts]);

    // Open issue parts modal for a job
    const openIssueModal = (job: Job) => {
        setSelectedJob(job);
        // Initialize empty parts selection for each faulty part
        setPartsSelection(
            job.faultyParts.map(() => ({ partId: '', quantityIssued: 1 }))
        );
        setIssueModalOpen(true);
    };

    // Issue parts
    const handleIssueParts = async () => {
        if (!selectedJob || issuing) return; // Prevent double submission

        // Filter out entries without selected partId
        const validParts = partsSelection.filter(p => p.partId && p.quantityIssued > 0);

        if (validParts.length === 0) {
            message.warning('Please select at least one part to issue');
            return;
        }

        setIssuing(true);
        try {
            const { data: res } = await jobApiService.issueParts(selectedJob.jobId, validParts);
            if (res.data.errors && res.data.errors.length > 0) {
                message.warning(`${res.data.issued} issued, ${res.data.failed} failed`);
                console.log('Errors:', res.data.errors);
            } else {
                message.success(`✅ ${res.data.issued} parts issued successfully!`);
            }
            setIssueModalOpen(false);
            loadApprovedJobs();
            fetchParts(); // Refresh inventory
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Failed to issue parts');
            console.error('Issue parts error:', err);
        } finally {
            setIssuing(false);
        }
    };

    // Mark job ready for repair
    const handleMarkReady = async (jobId: string) => {
        try {
            await jobApiService.markReadyForRepair(jobId);
            message.success('✅ Job sent to Repairing!');
            loadApprovedJobs();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Failed to mark ready');
        }
    };

    const getStatusTag = (status: string) => {
        if (status === 'Approved') return <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>⏳ Awaiting Parts</Tag>;
        if (status === 'Parts Requested') return <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>📦 Parts Issued</Tag>;
        return <Tag style={{ borderRadius: 6 }}>{status}</Tag>;
    };

    const columns = [
        {
            title: 'Job',
            key: 'job',
            width: 200,
            render: (_: unknown, record: Job) => (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#4f46e5' }}>{record.jobId}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        <CarOutlined /> {record.carModel} • {record.carNumber}
                    </div>
                </div>
            ),
        },
        {
            title: 'Customer',
            key: 'customer',
            width: 180,
            render: (_: unknown, record: Job) => (
                <div>
                    <div style={{ fontWeight: 600 }}><UserOutlined /> {record.customerName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>📱 {record.mobile}</div>
                </div>
            ),
        },
        {
            title: 'Faulty Parts',
            key: 'faultyParts',
            width: 120,
            render: (_: unknown, record: Job) => (
                <Badge
                    count={record.faultyParts.length}
                    color="#ef4444"
                    style={{ fontWeight: 700 }}
                >
                    <Tag color="red" style={{ borderRadius: 6, fontSize: 13, padding: '2px 12px', fontWeight: 600 }}>
                        🔧 {record.faultyParts.length} parts
                    </Tag>
                </Badge>
            ),
        },
        {
            title: 'Parts Issued',
            key: 'partsIssued',
            width: 120,
            render: (_: unknown, record: Job) => {
                const count = record.partsIssued?.length || 0;
                return count > 0 ? (
                    <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                        ✅ {count} issued
                    </Tag>
                ) : (
                    <Tag color="default" style={{ borderRadius: 6, color: '#94a3b8' }}>None yet</Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 160,
            render: (_: unknown, record: Job) => getStatusTag(record.status),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 280,
            render: (_: unknown, record: Job) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => openIssueModal(record)}
                        style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                        Issue Parts
                    </Button>
                    {record.status === 'Parts Requested' && (
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleMarkReady(record.jobId)}
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                background: '#10b981',
                                borderColor: '#10b981',
                            }}
                        >
                            Send to Repair
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    // Quick Stats
    const awaitingParts = approvedJobs.filter(j => j.status === 'Approved').length;
    const partsIssuedCount = approvedJobs.filter(j => j.status === 'Parts Requested').length;

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>🔧 Parts Requests</h1>
                <p>Approved jobs waiting for parts — issue parts from your inventory</p>
            </div>

            {/* Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#fcd34d', cursor: 'default' }}>
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#92400e', fontSize: 12 }}>Awaiting Parts</span>}
                            value={awaitingParts}
                            valueStyle={{ fontSize: 36, fontWeight: 800, color: '#b45309' }}
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderColor: '#93c5fd', cursor: 'default' }}>
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Parts Issued</span>}
                            value={partsIssuedCount}
                            valueStyle={{ fontSize: 36, fontWeight: 800, color: '#2563eb' }}
                            prefix={<InboxOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderColor: '#6ee7b7', cursor: 'default' }}>
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>Total Requests</span>}
                            value={approvedJobs.length}
                            valueStyle={{ fontSize: 36, fontWeight: 800, color: '#059669' }}
                            prefix={<ToolOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Jobs Table */}
            <Card
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        <ToolOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                        Approved Jobs — Pending Parts
                    </span>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={loading}>
                    {approvedJobs.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span style={{ color: '#94a3b8', fontSize: 15 }}>
                                    No approved jobs waiting for parts right now 🎉
                                </span>
                            }
                        />
                    ) : (
                        <Table
                            dataSource={approvedJobs}
                            columns={columns}
                            rowKey="jobId"
                            pagination={false}
                            scroll={{ x: 1100 }}
                        />
                    )}
                </Spin>
            </Card>

            {/* Issue Parts Modal */}
            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        📦 Issue Parts for {selectedJob?.jobId}
                    </span>
                }
                open={issueModalOpen}
                onCancel={() => setIssueModalOpen(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                {selectedJob && (
                    <>
                        {/* Job Info */}
                        <Descriptions
                            bordered
                            size="small"
                            column={2}
                            style={{ marginBottom: 20 }}
                        >
                            <Descriptions.Item label="Customer">{selectedJob.customerName}</Descriptions.Item>
                            <Descriptions.Item label="Mobile">{selectedJob.mobile}</Descriptions.Item>
                            <Descriptions.Item label="Car">{selectedJob.carModel} — {selectedJob.carNumber}</Descriptions.Item>
                            <Descriptions.Item label="KM">{selectedJob.kmDriven.toLocaleString()} km</Descriptions.Item>
                        </Descriptions>

                        {/* Already Issued parts */}
                        {selectedJob.partsIssued && selectedJob.partsIssued.length > 0 && (
                            <Alert
                                message={`${selectedJob.partsIssued.length} parts already issued for this job`}
                                type="info"
                                showIcon
                                style={{ marginBottom: 16, borderRadius: 10 }}
                                description={
                                    <div style={{ fontSize: 12 }}>
                                        {selectedJob.partsIssued.map((ip, i) => (
                                            <Tag key={i} color="blue" style={{ margin: 2, borderRadius: 6 }}>
                                                {ip.partName} × {ip.quantityIssued}
                                            </Tag>
                                        ))}
                                    </div>
                                }
                            />
                        )}

                        <Divider>🔧 Faulty Parts List → Select Inventory Part</Divider>

                        {/* Faulty parts → map to inventory */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {selectedJob.faultyParts.map((fp: FaultyPart, idx: number) => (
                                <Card
                                    key={idx}
                                    size="small"
                                    style={{
                                        borderRadius: 12,
                                        background: partsSelection[idx]?.partId ? '#f0fdf4' : '#fefce8',
                                        border: `1px solid ${partsSelection[idx]?.partId ? '#86efac' : '#fde68a'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                        {/* Faulty part info */}
                                        <div style={{ flex: '0 0 200px' }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                                                🔧 {fp.partName}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{fp.issueDescription}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                                Est: ₹{fp.estimatedCost.toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div style={{ fontSize: 20, color: '#94a3b8' }}>→</div>

                                        {/* Select inventory part */}
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <Select
                                                placeholder="Select part from inventory..."
                                                showSearch
                                                optionFilterProp="label"
                                                value={partsSelection[idx]?.partId || undefined}
                                                onChange={(val) => {
                                                    const updated = [...partsSelection];
                                                    updated[idx] = { ...updated[idx], partId: val };
                                                    setPartsSelection(updated);
                                                }}
                                                style={{ width: '100%' }}
                                                options={parts
                                                    .filter(p => p.isActive && p.quantity > 0)
                                                    .map((p: Part) => ({
                                                        value: p._id,
                                                        label: `${p.partName} (${p.partNumber}) — Stock: ${p.quantity} — ₹${p.sellPrice}`,
                                                    }))
                                                }
                                                allowClear
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div style={{ flex: '0 0 90px' }}>
                                            <InputNumber
                                                min={1}
                                                max={
                                                    parts.find(p => p._id === partsSelection[idx]?.partId)?.quantity || 99
                                                }
                                                value={partsSelection[idx]?.quantityIssued || 1}
                                                onChange={(val) => {
                                                    const updated = [...partsSelection];
                                                    updated[idx] = { ...updated[idx], quantityIssued: val || 1 };
                                                    setPartsSelection(updated);
                                                }}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleIssueParts}
                                loading={issuing}
                                block
                                size="large"
                                style={{
                                    height: 52,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    borderRadius: 14,
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                }}
                            >
                                {issuing ? 'Issuing Parts...' : `Issue ${partsSelection.filter(p => p.partId).length} Parts`}
                            </Button>
                            <Button
                                onClick={() => setIssueModalOpen(false)}
                                size="large"
                                style={{ height: 52, borderRadius: 14 }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
