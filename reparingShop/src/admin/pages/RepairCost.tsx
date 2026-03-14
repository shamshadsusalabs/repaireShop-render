import { useState, useMemo, useEffect } from 'react';
import { Card, Table, InputNumber, Button, Divider, message, Spin } from 'antd';
import { ArrowLeftOutlined, FileDoneOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import type { FaultyPart } from '../../types';

export default function RepairCost() {
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading, fetchJobById, saveRepairCost, completeJob } = useJobStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (jobId) fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    const [costs, setCosts] = useState<FaultyPart[]>([]);

    // Initialize costs when job data loads
    useEffect(() => {
        if (job) {
            setCosts(
                job.faultyParts.map(f => ({
                    ...f,
                    actualCost: f.actualCost || f.estimatedCost,
                    labourCharge: f.labourCharge || 0,
                    discount: f.discount || 0,
                }))
            );
        }
    }, [job]);

    const updateCost = (index: number, field: keyof FaultyPart, value: number) => {
        setCosts(prev =>
            prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
        );
    };

    const totals = useMemo(() => {
        const partTotal = costs.reduce((s, c) => s + c.actualCost, 0);
        const labourTotal = costs.reduce((s, c) => s + c.labourCharge, 0);
        const discountTotal = costs.reduce((s, c) => s + c.discount, 0);
        const subtotal = partTotal + labourTotal - discountTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, discountTotal, subtotal, gst, grandTotal };
    }, [costs]);

    const handleGenerate = async () => {
        try {
            await saveRepairCost(jobId || '', costs);
            await completeJob(jobId || '');
            message.success('Job completed & Invoice generated!');
            navigate(`/job/${jobId}/invoice`);
        } catch {
            message.error('Failed to update job');
        }
    };

    if (loading || !job) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const columns = [
        {
            title: 'Part Name',
            dataIndex: 'partName',
            key: 'partName',
            render: (text: string) => <span style={{ fontWeight: 700 }}>{text}</span>,
        },
        {
            title: 'Part Cost (₹)',
            key: 'actualCost',
            width: 150,
            render: (_: unknown, __: FaultyPart, index: number) => (
                <InputNumber
                    min={0}
                    value={costs[index]?.actualCost}
                    onChange={val => updateCost(index, 'actualCost', val || 0)}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Labour (₹)',
            key: 'labourCharge',
            width: 130,
            render: (_: unknown, __: FaultyPart, index: number) => (
                <InputNumber
                    min={0}
                    value={costs[index]?.labourCharge}
                    onChange={val => updateCost(index, 'labourCharge', val || 0)}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Discount (₹)',
            key: 'discount',
            width: 130,
            render: (_: unknown, __: FaultyPart, index: number) => (
                <InputNumber
                    min={0}
                    value={costs[index]?.discount}
                    onChange={val => updateCost(index, 'discount', val || 0)}
                    style={{ width: '100%' }}
                />
            ),
        },
        {
            title: 'Line Total (₹)',
            key: 'lineTotal',
            width: 120,
            render: (_: unknown, __: FaultyPart, index: number) => {
                const c = costs[index];
                if (!c) return null;
                const total = c.actualCost + c.labourCharge - c.discount;
                return <span style={{ fontWeight: 700, color: '#4f46e5' }}>₹ {total.toLocaleString()}</span>;
            },
        },
    ];

    return (
        <div className="fade-in-up">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

            <div className="page-header">
                <h1>Repair & Cost Entry</h1>
                <p>Final cost breakdown for <strong>{jobId}</strong></p>
            </div>

            <Card style={{ cursor: 'default' }}>
                <Table
                    dataSource={costs}
                    columns={columns}
                    rowKey="partName"
                    pagination={false}
                />

                <Divider />

                {/* Cost Summary */}
                <div style={{ maxWidth: 400, marginLeft: 'auto' }}>
                    {[
                        { label: 'Parts Total', value: totals.partTotal },
                        { label: 'Labour Total', value: totals.labourTotal },
                        { label: 'Discount', value: -totals.discountTotal, color: '#10b981' },
                    ].map(item => (
                        <div key={item.label} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: 14,
                        }}>
                            <span style={{ color: '#64748b' }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: item.color || '#1e293b' }}>
                                {item.value < 0 ? '-' : ''}₹ {Math.abs(item.value).toLocaleString()}
                            </span>
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
                    icon={<FileDoneOutlined />}
                    size="large"
                    block
                    onClick={handleGenerate}
                    loading={loading}
                    style={{ marginTop: 28, height: 54, fontSize: 16 }}
                >
                    Generate Invoice
                </Button>
            </Card>
        </div>
    );
}
