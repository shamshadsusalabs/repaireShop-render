import { useEffect } from 'react';
import { Card, Statistic, Table, Tag, Button, Row, Col, Spin } from 'antd';
import {
    CarOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import type { Job, JobStatus } from '../../types';

const statusColorMap: Record<JobStatus, string> = {
    Pending: 'orange',
    Assigned: 'blue',
    Inspection: 'geekblue',
    Approval: 'purple',
    Approved: 'cyan',
    Rejected: 'red',
    'Parts Requested': 'volcano',
    Repairing: 'processing',
    Completed: 'green',
};

export default function Dashboard() {
    const { jobs, loading, fetchJobs } = useJobStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const totalCars = jobs.length;
    const pending = jobs.filter(j => j.status === 'Pending').length;
    const inProgress = jobs.filter(j =>
        ['Assigned', 'Inspection', 'Approval', 'Approved', 'Repairing'].includes(j.status)
    ).length;
    const completed = jobs.filter(j => j.status === 'Completed').length;

    const stats = [
        {
            title: 'Total Cars',
            value: totalCars,
            icon: <CarOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
            bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '#c7d2fe',
        },
        {
            title: 'Pending Jobs',
            value: pending,
            icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
            bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '#fde68a',
        },
        {
            title: 'In Progress',
            value: inProgress,
            icon: <SyncOutlined spin style={{ fontSize: 28, color: '#3b82f6' }} />,
            bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '#93c5fd',
        },
        {
            title: 'Completed',
            value: completed,
            icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#10b981' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#6ee7b7',
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
            title: 'Car',
            key: 'car',
            render: (_: unknown, record: Job) => (
                <span>{record.carModel} <span style={{ color: '#94a3b8', fontSize: 12 }}>({record.carNumber})</span></span>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => <span style={{ color: '#64748b', fontSize: 13 }}>{text}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: JobStatus) => (
                <Tag color={statusColorMap[status]}>{status.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Job) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/job/${record.jobId}`)}
                    style={{ fontWeight: 600, color: '#4f46e5' }}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's what's happening at the workshop today.</p>
            </div>

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

            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Recent Jobs</span>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/create-job')}
                            size="large"
                        >
                            Create New Job
                        </Button>
                    </div>
                }
                style={{ cursor: 'default' }}
            >
                <Spin spinning={loading}>
                    <Table
                        dataSource={jobs}
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
