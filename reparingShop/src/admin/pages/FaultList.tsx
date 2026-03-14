import { useState, useMemo, useEffect } from 'react';
import { Card, Table, InputNumber, Button, message, Empty, Divider, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import type { FaultyPart } from '../../types';

export default function FaultList() {
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading, fetchJobById, saveFaultyParts } = useJobStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (jobId) fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    const notOkItems = job?.inspectionResults.filter(r => r.status === 'Not OK') || [];

    const [faults, setFaults] = useState<FaultyPart[]>([]);

    // Initialize faults when job data loads
    useEffect(() => {
        if (job) {
            if (job.faultyParts.length) {
                setFaults(job.faultyParts);
            } else {
                setFaults(
                    notOkItems.map(item => ({
                        partName: item.partName,
                        issueDescription: item.comment || 'Needs inspection/repair',
                        estimatedCost: 0,
                        actualCost: 0,
                        labourCharge: 0,
                        discount: 0,
                    }))
                );
            }
        }
    }, [job]);

    const updateFault = (index: number, field: keyof FaultyPart, value: number) => {
        setFaults(prev =>
            prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
        );
    };

    const totals = useMemo(() => {
        const partTotal = faults.reduce((sum, f) => sum + f.estimatedCost, 0);
        const labourTotal = faults.reduce((sum, f) => sum + f.labourCharge, 0);
        const subtotal = partTotal + labourTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, subtotal, gst, grandTotal };
    }, [faults]);

    const handleSend = async () => {
        if (faults.some(f => f.estimatedCost === 0)) {
            message.warning('Please add estimated cost for all parts');
            return;
        }
        if (faults.some(f => f.labourCharge === 0)) {
            message.warning('Please add labour/machine cost for all parts');
            return;
        }

        try {
            await saveFaultyParts(jobId || '', faults);
            message.success('Sent for customer approval!');
            navigate(`/job/${jobId}/approval`);
        } catch {
            message.error('Failed to save faulty parts');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!job || (notOkItems.length === 0 && faults.length === 0)) {
        return (
            <div className="fade-in-up">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back</Button>
                <Empty description="No faulty parts found. All inspection items are OK!" />
                <Button type="primary" onClick={() => navigate(`/job/${jobId}`)} style={{ marginTop: 16 }}>Back to Job</Button>
            </div>
        );
    }

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_: unknown, __: unknown, index: number) => (
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>{index + 1}</span>
            ),
        },
        {
            title: 'Part Name',
            dataIndex: 'partName',
            key: 'partName',
            render: (text: string) => <span style={{ fontWeight: 700 }}>{text}</span>,
        },
        {
            title: 'Issue Description',
            dataIndex: 'issueDescription',
            key: 'issueDescription',
            render: (text: string) => <span style={{ color: '#ef4444' }}>{text}</span>,
        },
        {
            title: 'Part Cost (₹)',
            key: 'estimatedCost',
            width: 160,
            render: (_: unknown, __: FaultyPart, index: number) => (
                <InputNumber
                    min={0}
                    value={faults[index].estimatedCost}
                    onChange={val => updateFault(index, 'estimatedCost', val || 0)}
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Labour/Machine (₹)',
            key: 'labourCharge',
            width: 170,
            render: (_: unknown, __: FaultyPart, index: number) => (
                <InputNumber
                    min={0}
                    value={faults[index].labourCharge}
                    onChange={val => updateFault(index, 'labourCharge', val || 0)}
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Line Total (₹)',
            key: 'lineTotal',
            width: 120,
            render: (_: unknown, __: FaultyPart, index: number) => {
                const f = faults[index];
                const total = f.estimatedCost + f.labourCharge;
                return <span style={{ fontWeight: 700, color: '#4f46e5' }}>₹ {total.toLocaleString()}</span>;
            },
        },
    ];

    return (
        <div className="fade-in-up">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

            <div className="page-header">
                <h1>Faulty Parts List</h1>
                <p>Auto-generated from inspection results for <strong>{jobId}</strong></p>
            </div>

            <Card style={{ cursor: 'default' }}>
                <Table
                    dataSource={faults}
                    columns={columns}
                    rowKey="partName"
                    pagination={false}
                    scroll={{ x: 800 }}
                />

                <Divider />

                {/* Cost Summary */}
                <div style={{ maxWidth: 380, marginLeft: 'auto' }}>
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

                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    size="large"
                    block
                    onClick={handleSend}
                    loading={loading}
                    style={{ marginTop: 24, height: 50 }}
                >
                    Send for Customer Approval
                </Button>
            </Card>
        </div>
    );
}
