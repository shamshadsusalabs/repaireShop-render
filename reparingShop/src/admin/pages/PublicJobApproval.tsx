import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Table, Divider, message, Result, Spin } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    SafetyCertificateOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import type { Job } from '../../types';

// Use direct axios for public route to avoid auth interceptors
const API_URL = import.meta.env.VITE_API_URL || 'https://repaireshop.onrender.com/api';

export default function PublicJobApproval() {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await axios.get<{ success: boolean; data: Job }>(`${API_URL}/public/approval/${jobId}`);
                if (res.data.success) {
                    setJob(res.data.data);
                    if (res.data.data.approved === true) setDecided('approved');
                    else if (res.data.data.approved === false) setDecided('rejected');
                }
            } catch (err) {
                setError('Invalid link or job not found.');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) fetchJob();
    }, [jobId]);

    const totals = useMemo(() => {
        if (!job) return { partTotal: 0, labourTotal: 0, subtotal: 0, gst: 0, grandTotal: 0 };
        const partTotal = job.faultyParts.reduce((sum, f) => sum + f.estimatedCost, 0);
        const labourTotal = job.faultyParts.reduce((sum, f) => sum + f.labourCharge, 0);
        const subtotal = partTotal + labourTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, subtotal, gst, grandTotal };
    }, [job]);

    const handleAction = async (approved: boolean) => {
        setActionLoading(true);
        try {
            await axios.put(`${API_URL}/public/approval/${jobId}`, { approved });
            setDecided(approved ? 'approved' : 'rejected');
            message.success(approved ? 'You have approved the repair!' : 'You have rejected the repair.');
        } catch (err) {
            message.error('Failed to submit your response. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <Spin size="large" tip="Loading Job Details..." />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <Result status="error" title="Job Not Found" subTitle={error || "This link may have expired or is invalid."} />
            </div>
        );
    }

    if (decided === 'approved') {
        return (
            <div style={{ padding: 20, minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ maxWidth: 600, width: '100%', textAlign: 'center', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <Result
                        status="success"
                        title="Thank You for Your Approval!"
                        subTitle={
                            <div>
                                <p>We have received your confirmation for <strong>{job.jobId}</strong>.</p>
                                <p>Our team will start the repair work immediately.</p>
                                <Divider />
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    Estimated Total: <span style={{ color: '#16a34a' }}>₹ {totals.grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        }
                    />
                </Card>
            </div>
        );
    }

    if (decided === 'rejected') {
        return (
            <div style={{ padding: 20, minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ maxWidth: 600, width: '100%', textAlign: 'center', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <Result
                        status="warning"
                        title="Repair Request Declined"
                        subTitle="You have declined the repair Estimate. Our mechanic will contact you shortly for further instructions."
                    />
                </Card>
            </div>
        );
    }

    const columns = [
        {
            title: 'Part / Service',
            dataIndex: 'partName',
            key: 'partName',
            render: (text: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#ef4444' }}>{record.issueDescription}</div>
                </div>
            ),
        },
        {
            title: 'Cost',
            key: 'total',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <span style={{ fontWeight: 600, color: '#475569' }}>
                    ₹ {(record.estimatedCost + record.labourCharge).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px 12px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', borderRadius: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 16 }}>
                        <SafetyCertificateOutlined style={{ color: '#4f46e5', fontSize: 18 }} />
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>LUXRE Official Repair Estimate</span>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Approval Request</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Please review the repair estimate for your vehicle</p>
                </div>

                <Card style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
                    {/* Vehicle & Customer Info */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>VEHICLE</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{job.carModel}</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>{job.carNumber}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>JOB ID</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>{job.jobId}</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>{job.date}</div>
                            </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <UserOutlined style={{ color: '#64748b' }} />
                            <span style={{ fontWeight: 600, color: '#475569' }}>{job.customerName}</span>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <PhoneOutlined style={{ color: '#64748b' }} />
                            <span style={{ color: '#475569' }}>+91 {job.mobile}</span>
                        </div>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Required Repairs</h3>
                    <Table
                        dataSource={job.faultyParts}
                        columns={columns}
                        rowKey="partName"
                        pagination={false}
                        size="small"
                        bordered={false}
                    />

                    <div style={{ marginTop: 24, background: '#f0fdf4', padding: '20px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: '#475569' }}>Parts + Labour</span>
                            <span style={{ fontWeight: 600 }}>₹ {totals.subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#475569' }}>GST (18%)</span>
                            <span style={{ fontWeight: 600 }}>₹ {totals.gst.toLocaleString()}</span>
                        </div>
                        <Divider style={{ margin: '12px 0', borderColor: '#86efac' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#14532d' }}>Total Estimate</span>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>₹ {totals.grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            size="large"
                            onClick={() => handleAction(true)}
                            loading={actionLoading}
                            style={{
                                height: 56,
                                fontSize: 18,
                                fontWeight: 700,
                                background: '#16a34a',
                                borderColor: '#16a34a',
                                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                            }}
                        >
                            Approve Estimate
                        </Button>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            size="large"
                            onClick={() => handleAction(false)}
                            loading={actionLoading}
                            style={{ height: 50, fontSize: 16, fontWeight: 600 }}
                        >
                            Reject
                        </Button>
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                        <p>By approving, you agree to the repair costs and terms of service of LUXRE.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
