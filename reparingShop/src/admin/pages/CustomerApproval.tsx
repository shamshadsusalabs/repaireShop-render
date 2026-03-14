import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Table, Divider, message, Result, Spin, Input, Tooltip } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CarOutlined,
    UserOutlined,
    WhatsAppOutlined,
    CopyOutlined,
    ShareAltOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';

export default function CustomerApproval() {
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading, fetchJobById, customerApproval } = useJobStore();
    const navigate = useNavigate();
    const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null);

    // Generate public link
    const approvalLink = `${window.location.origin}/approve/${jobId}`;

    const handleWhatsAppShare = () => {
        const messageText = `Hello ${job?.customerName}, please review and approve the repair estimate for your vehicle (${job?.carNumber}): ${approvalLink}`;
        const whatsappUrl = `https://wa.me/${job?.mobile}?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(approvalLink);
        message.success('Approval link copied!');
    };

    useEffect(() => {
        if (jobId) fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    useEffect(() => {
        if (job) {
            if (job.approved === true) setDecided('approved');
            else if (job.approved === false) setDecided('rejected');
        }
    }, [job]);

    const totals = useMemo(() => {
        if (!job) return { partTotal: 0, labourTotal: 0, subtotal: 0, gst: 0, grandTotal: 0 };
        const partTotal = job.faultyParts.reduce((sum, f) => sum + f.estimatedCost, 0);
        const labourTotal = job.faultyParts.reduce((sum, f) => sum + f.labourCharge, 0);
        const subtotal = partTotal + labourTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, subtotal, gst, grandTotal };
    }, [job]);

    if (loading || !job) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const handleApprove = async () => {
        try {
            await customerApproval(jobId || '', true);
            setDecided('approved');
            message.success('Customer approved! Store will now issue parts.');
        } catch {
            message.error('Failed to update approval');
        }
    };

    const handleReject = async () => {
        try {
            await customerApproval(jobId || '', false);
            setDecided('rejected');
            message.error('Customer rejected the repair.');
        } catch {
            message.error('Failed to update approval');
        }
    };

    if (decided === 'approved') {
        return (
            <div className="fade-in-up" style={{ maxWidth: 600, margin: '60px auto' }}>
                <Result
                    status="success"
                    title="Customer Approved!"
                    subTitle={`Repair work for ${jobId} has been approved. Grand Total: ₹${totals.grandTotal.toLocaleString()} (incl. GST). Store will now issue parts from inventory.`}
                    extra={[
                        <Button type="primary" key="job" onClick={() => navigate(`/job/${jobId}`)}>
                            View Job
                        </Button>,
                        <Button key="dashboard" onClick={() => navigate('/')}>
                            Go to Dashboard
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    if (decided === 'rejected') {
        return (
            <div className="fade-in-up" style={{ maxWidth: 600, margin: '60px auto' }}>
                <Result
                    status="error"
                    title="Customer Rejected"
                    subTitle={`The customer has declined the repair for ${jobId}.`}
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => navigate('/')}>
                            Go to Dashboard
                        </Button>,
                        <Button key="job" onClick={() => navigate(`/job/${jobId}`)}>
                            View Job Details
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        {
            title: 'Part Name',
            dataIndex: 'partName',
            key: 'partName',
            render: (text: string) => <span style={{ fontWeight: 700 }}>{text}</span>,
        },
        {
            title: 'Issue',
            dataIndex: 'issueDescription',
            key: 'issueDescription',
        },
        {
            title: 'Part Cost (₹)',
            dataIndex: 'estimatedCost',
            key: 'estimatedCost',
            render: (cost: number) => (
                <span style={{ fontWeight: 700, color: '#1e293b' }}>₹ {cost.toLocaleString()}</span>
            ),
        },
        {
            title: 'Labour/Machine (₹)',
            dataIndex: 'labourCharge',
            key: 'labourCharge',
            render: (cost: number) => (
                <span style={{ fontWeight: 600, color: '#475569' }}>₹ {cost.toLocaleString()}</span>
            ),
        },
        {
            title: 'Line Total (₹)',
            key: 'lineTotal',
            render: (_: unknown, record: { estimatedCost: number; labourCharge: number }) => (
                <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                    ₹ {(record.estimatedCost + record.labourCharge).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

            <div className="page-header">
                <h1>Customer Approval</h1>
                <p>Review and approve the repair estimate</p>
            </div>

            <Card className="approval-card" style={{ maxWidth: 900, cursor: 'default' }}>
                {/* Customer & Car Quick Info */}
                <div style={{
                    display: 'flex',
                    gap: 32,
                    marginBottom: 24,
                    padding: '16px 20px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserOutlined style={{ color: '#4f46e5', fontSize: 18 }} />
                        <div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>CUSTOMER</div>
                            <div style={{ fontWeight: 700 }}>{job.customerName}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CarOutlined style={{ color: '#4f46e5', fontSize: 18 }} />
                        <div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>VEHICLE</div>
                            <div style={{ fontWeight: 700 }}>{job.carModel} ({job.carNumber})</div>
                        </div>
                    </div>
                </div>

                <Table
                    dataSource={job.faultyParts}
                    columns={columns}
                    rowKey="partName"
                    pagination={false}
                    scroll={{ x: 700 }}
                />

                <Divider />

                {/* Cost Summary */}
                <div style={{ maxWidth: 380, marginLeft: 'auto', marginBottom: 24 }}>
                    {[
                        { label: 'Parts Total', value: totals.partTotal },
                        { label: 'Labour / Machine Total', value: totals.labourTotal },
                    ].map(item => (
                        <div key={item.label} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: 14,
                        }}>
                            <span style={{ color: '#64748b' }}>{item.label}</span>
                            <span style={{ fontWeight: 600 }}>₹ {item.value.toLocaleString()}</span>
                        </div>
                    ))}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: 15,
                        fontWeight: 600,
                    }}>
                        <span>Subtotal</span>
                        <span>₹ {totals.subtotal.toLocaleString()}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: 14,
                    }}>
                        <span style={{ color: '#64748b' }}>GST (18%)</span>
                        <span style={{ fontWeight: 600 }}>₹ {totals.gst.toLocaleString()}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        marginTop: 8,
                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                        borderRadius: 12,
                        border: '1px solid #c7d2fe',
                    }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>Grand Total</span>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5' }}>₹ {totals.grandTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* Share Section */}
                <div style={{ marginBottom: 24, padding: '16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <ShareAltOutlined style={{ color: '#16a34a' }} />
                        <span style={{ fontWeight: 600, color: '#15803d' }}>Share Estimate with Customer</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Input
                            value={approvalLink}
                            readOnly
                            style={{ flex: 1 }}
                            addonAfter={
                                <Tooltip title="Copy Link">
                                    <CopyOutlined onClick={handleCopyLink} style={{ cursor: 'pointer' }} />
                                </Tooltip>
                            }
                        />
                        <Button
                            icon={<WhatsAppOutlined />}
                            onClick={handleWhatsAppShare}
                            style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: 600 }}
                        >
                            WhatsApp
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        size="large"
                        onClick={handleApprove}
                        loading={loading}
                        style={{
                            flex: 1,
                            height: 54,
                            fontSize: 16,
                            background: '#10b981',
                            borderColor: '#10b981',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        }}
                    >
                        ✓ Approve Repair
                    </Button>
                    <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        size="large"
                        onClick={handleReject}
                        loading={loading}
                        style={{
                            flex: 1,
                            height: 54,
                            fontSize: 16,
                        }}
                    >
                        ✗ Reject
                    </Button>
                </div>
            </Card>
        </div>
    );
}
