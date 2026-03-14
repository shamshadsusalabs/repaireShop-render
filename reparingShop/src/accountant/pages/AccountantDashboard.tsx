import { useEffect, useState } from 'react';
import { Card, Statistic, Table, Tag, Button, Row, Col, Spin, Input } from 'antd';
import {
    CheckCircleOutlined,
    FileDoneOutlined,
    DollarOutlined,
    CarOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useJobStore from '../../admin/store/jobStore';
import type { Job } from '../../types';

export default function AccountantDashboard() {
    const { jobs, loading, fetchJobs } = useJobStore();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Only show completed jobs
    const completedJobs = jobs.filter(j => j.status === 'Completed');

    // Search filter
    const filtered = completedJobs.filter(j => {
        const q = searchText.toLowerCase();
        return (
            j.jobId.toLowerCase().includes(q) ||
            j.customerName.toLowerCase().includes(q) ||
            j.carModel.toLowerCase().includes(q) ||
            j.carNumber.toLowerCase().includes(q) ||
            j.mobile.includes(q)
        );
    });

    // Stats
    const totalCompleted = completedJobs.length;
    const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.grandTotal || 0), 0);
    const invoicesPending = completedJobs.filter(j => !j.grandTotal || j.grandTotal === 0).length;
    const invoicesDone = completedJobs.filter(j => j.grandTotal && j.grandTotal > 0).length;

    const stats = [
        {
            title: 'Completed Jobs',
            value: totalCompleted,
            icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#10b981' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#6ee7b7',
        },
        {
            title: 'Total Revenue',
            value: totalRevenue,
            prefix: '₹',
            icon: <DollarOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
            bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '#fde68a',
        },
        {
            title: 'Invoices Generated',
            value: invoicesDone,
            icon: <FileDoneOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
            bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '#c7d2fe',
        },
        {
            title: 'Pending Invoices',
            value: invoicesPending,
            icon: <CarOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: '#fca5a5',
        },
    ];

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
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: 'Mobile',
            dataIndex: 'mobile',
            key: 'mobile',
            render: (text: string) => <span style={{ color: '#64748b' }}>+91 {text}</span>,
        },
        {
            title: 'Car',
            key: 'car',
            render: (_: unknown, record: Job) => (
                <span>{record.carModel} <span style={{ color: '#94a3b8', fontSize: 12 }}>({record.carNumber})</span></span>
            ),
        },
        {
            title: 'Grand Total',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            render: (value: number) => (
                <span style={{ fontWeight: 700, color: value ? '#10b981' : '#94a3b8' }}>
                    {value ? `₹${value.toLocaleString()}` : '—'}
                </span>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: () => (
                <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    COMPLETED
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Job) => (
                <Button
                    type="primary"
                    icon={<FileDoneOutlined />}
                    onClick={() => navigate(`/job/${record.jobId}/invoice`)}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                >
                    Invoice
                </Button>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>💰 Accountant Dashboard</h1>
                <p>View completed jobs and generate invoices</p>
            </div>

            {/* Stats */}
            <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
                {stats.map((stat, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card
                            className="stat-card"
                            style={{
                                background: stat.bg,
                                borderColor: stat.border,
                                cursor: 'default',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Statistic
                                    title={<span style={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>{stat.title}</span>}
                                    value={stat.value}
                                    prefix={stat.prefix}
                                    valueStyle={{ fontSize: 36, fontWeight: 800, color: '#1e293b' }}
                                />
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    background: 'rgba(255,255,255,0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)',
                                }}>
                                    {stat.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Table */}
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>
                            <CheckCircleOutlined style={{ marginRight: 8, color: '#10b981' }} />
                            Completed Jobs
                        </span>
                        <Input
                            placeholder="Search by Job ID, customer, car..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 300, borderRadius: 10 }}
                            allowClear
                        />
                    </div>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={loading}>
                    <Table
                        dataSource={filtered}
                        columns={columns}
                        rowKey="jobId"
                        pagination={{ pageSize: 10 }}
                        style={{ marginTop: 4 }}
                    />
                </Spin>
            </Card>
        </div>
    );
}
