import { useEffect } from 'react';
import { Card, Tag, Steps, Button, Descriptions, Row, Col, Empty, Spin, Image } from 'antd';
import {
    UserOutlined,
    CarOutlined,
    TeamOutlined,
    SearchOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ToolOutlined,
    FileDoneOutlined,
    ArrowLeftOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useMechanicStore from '../store/mechanicStore';
import useAuthStore from '../store/authStore';
import type { JobStatus } from '../../types';

const statusStepMap: Record<JobStatus, number> = {
    Pending: 0,
    Assigned: 1,
    Inspection: 2,
    Approval: 3,
    Approved: 4,
    Rejected: 3,
    'Parts Requested': 5,
    Repairing: 6,
    Completed: 7,
};

const statusColorMap: Record<JobStatus, string> = {
    Pending: 'orange',
    Assigned: 'blue',
    Inspection: 'geekblue',
    Approval: 'purple',
    Approved: 'cyan',
    Rejected: 'red',
    'Parts Requested': 'gold',
    Repairing: 'processing',
    Completed: 'green',
};

export default function JobDetails() {
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading, fetchJobById } = useJobStore();
    const { mechanics, fetchMechanics } = useMechanicStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (jobId) {
            fetchJobById(jobId);
        }
        fetchMechanics();
    }, [jobId, fetchJobById, fetchMechanics]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="fade-in-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Empty description="Job not found" />
            </div>
        );
    }

    const mechanic = job.mechanicId ? mechanics.find(m => m.id === job.mechanicId) : null;
    const currentStep = statusStepMap[job.status];

    const getNextAction = () => {
        switch (job.status) {
            case 'Pending':
                return { label: 'Assign Mechanic', path: `/job/${job.jobId}/assign`, icon: <TeamOutlined /> };
            case 'Assigned':
                // Manager waits — mechanic will do inspection
                if (isManager) return null;
                return { label: 'Start Inspection', path: `/job/${job.jobId}/inspection`, icon: <SearchOutlined /> };
            case 'Inspection':
                // Inspection done — manager can view faults, admin can also view inspection
                if (isManager) {
                    return { label: 'View Faults & Approval', path: `/job/${job.jobId}/faults`, icon: <FileTextOutlined /> };
                }
                return { label: 'Start Inspection', path: `/job/${job.jobId}/inspection`, icon: <SearchOutlined /> };
            case 'Approval':
                return { label: 'View Faults & Approval', path: `/job/${job.jobId}/faults`, icon: <FileTextOutlined /> };
            case 'Approved':
            case 'Parts Requested':
                // Store must issue parts first — admin/manager cannot skip to repair
                return null;
            case 'Repairing':
                return { label: 'Repair & Cost', path: `/job/${job.jobId}/repair-cost`, icon: <ToolOutlined /> };
            case 'Completed':
                return { label: 'View Invoice', path: `/job/${job.jobId}/invoice`, icon: <FileDoneOutlined /> };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

    return (
        <div className="fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    style={{ fontWeight: 600 }}
                >
                    Back
                </Button>
            </div>

            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1>{job.jobId}</h1>
                    <Tag color={statusColorMap[job.status]} style={{ fontSize: 14, padding: '4px 16px' }}>
                        {job.status.toUpperCase()}
                    </Tag>
                </div>
                <p>Job overview and progress tracking</p>
            </div>

            {/* Progress Stepper */}
            <Card style={{ marginBottom: 24, cursor: 'default' }}>
                <Steps
                    current={currentStep}
                    size="small"
                    items={[
                        { title: 'Registered', icon: <CarOutlined /> },
                        { title: 'Assigned', icon: <TeamOutlined /> },
                        { title: 'Inspection', icon: <SearchOutlined /> },
                        { title: 'Approval', icon: <CheckCircleOutlined /> },
                        { title: 'Approved', icon: <FileTextOutlined /> },
                        { title: 'Parts Issued', icon: <ToolOutlined /> },
                        { title: 'Repairing', icon: <ToolOutlined /> },
                        { title: 'Completed', icon: <FileDoneOutlined /> },
                    ]}
                />
            </Card>

            <Row gutter={[20, 20]}>
                {/* Customer Details */}
                <Col xs={24} md={12}>
                    <Card
                        title={
                            <span style={{ fontWeight: 700 }}>
                                <UserOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                Customer Details
                            </span>
                        }
                        style={{ cursor: 'default' }}
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Name</span>}>
                                {job.customerName}
                            </Descriptions.Item>
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Mobile</span>}>
                                +91 {job.mobile}
                            </Descriptions.Item>
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Date</span>}>
                                {job.date}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                {/* Car Details */}
                <Col xs={24} md={12}>
                    <Card
                        title={
                            <span style={{ fontWeight: 700 }}>
                                <CarOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                Car Details
                            </span>
                        }
                        style={{ cursor: 'default' }}
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Model</span>}>
                                {job.carModel}
                            </Descriptions.Item>
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Number</span>}>
                                {job.carNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>KM Driven</span>}>
                                {job.kmDriven.toLocaleString()} km
                            </Descriptions.Item>
                            <Descriptions.Item label={<span style={{ fontWeight: 600 }}>Type</span>}>
                                <Tag color={job.jobType === 'Pickup' ? 'blue' : 'green'} style={{ borderRadius: 6, fontWeight: 600 }}>
                                    {job.jobType === 'Pickup' ? '🚛 Pickup' : '🚗 Walk-in'}
                                </Tag>
                            </Descriptions.Item>
                            {job.location && (
                                <Descriptions.Item label={<span style={{ fontWeight: 600 }}>📍 Location</span>}>
                                    {job.location}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                </Col>

                {/* Vehicle Photos */}
                {job.carImages && job.carImages.length > 0 && (
                    <Col xs={24}>
                        <Card
                            title={
                                <span style={{ fontWeight: 700 }}>
                                    <PictureOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                    Vehicle Photos ({job.carImages.length})
                                </span>
                            }
                            style={{ cursor: 'default' }}
                        >
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <Image.PreviewGroup>
                                    {job.carImages.map((url, i) => (
                                        <Image
                                            key={i}
                                            width={120}
                                            height={120}
                                            src={url}
                                            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                        />
                                    ))}
                                </Image.PreviewGroup>
                            </div>
                        </Card>
                    </Col>
                )}

                {/* Mechanic Info */}
                {mechanic && (
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <span style={{ fontWeight: 700 }}>
                                    <ToolOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                    Assigned Mechanic
                                </span>
                            }
                            style={{ cursor: 'default' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 28,
                                }}>
                                    {mechanic.avatar}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{mechanic.name}</div>
                                    <div style={{ color: '#64748b', fontSize: 13 }}>{mechanic.specialty}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{mechanic.experience} Experience</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                )}

                {/* Faulty Parts Summary (if any) */}
                {job.faultyParts.length > 0 && (
                    <Col xs={24} md={mechanic ? 12 : 24}>
                        <Card
                            title={
                                <span style={{ fontWeight: 700 }}>
                                    <FileTextOutlined style={{ marginRight: 8, color: '#ef4444' }} />
                                    Issues Found ({job.faultyParts.length})
                                </span>
                            }
                            style={{ cursor: 'default' }}
                        >
                            {job.faultyParts.map((part, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: i < job.faultyParts.length - 1 ? '1px solid #f1f5f9' : 'none',
                                }}>
                                    <span style={{ fontWeight: 500 }}>{part.partName}</span>
                                    <span style={{ fontWeight: 700, color: '#ef4444' }}>₹{part.estimatedCost.toLocaleString()}</span>
                                </div>
                            ))}
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Waiting for Store - show info when parts need to be issued */}
            {(job.status === 'Approved' || job.status === 'Parts Requested') && (
                <Card
                    style={{
                        marginTop: 24,
                        background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                        border: '1px solid #fde68a',
                        borderRadius: 16,
                        cursor: 'default',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'rgba(245,158,11,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28,
                        }}>📦</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#92400e' }}>
                                {job.status === 'Approved'
                                    ? '⏳ Waiting for Store to Issue Parts'
                                    : '✅ Parts Issued — Waiting for Store to Send to Repair'}
                            </div>
                            <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>
                                {job.status === 'Approved'
                                    ? 'Store user needs to select and issue parts from inventory for this job. Repair will begin after parts are issued.'
                                    : 'Store has issued parts. Once confirmed, the job will move to Repairing status.'}
                            </div>
                            {job.partsIssued && job.partsIssued.length > 0 && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {job.partsIssued.map((ip, i) => (
                                        <Tag key={i} color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                                            {ip.partName} × {ip.quantityIssued}
                                        </Tag>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            {nextAction && (
                <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        icon={nextAction.icon}
                        size="large"
                        onClick={() => navigate(nextAction.path)}
                        style={{ minWidth: 200 }}
                    >
                        {nextAction.label}
                    </Button>
                    {job.status === 'Completed' && (
                        <Button
                            size="large"
                            onClick={() => navigate(`/job/${job.jobId}/invoice`)}
                            icon={<FileDoneOutlined />}
                        >
                            View Invoice
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
