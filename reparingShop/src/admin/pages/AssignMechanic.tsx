import { useEffect } from 'react';
import { Card, Button, Tag, Row, Col, App, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    StarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useMechanicStore from '../store/mechanicStore';

export default function AssignMechanic() {
    const { message } = App.useApp();
    const { jobId } = useParams<{ jobId: string }>();
    const { assignMechanic, loading: jobLoading } = useJobStore();
    const { mechanicsRaw, loading: mechLoading, fetchMechanics } = useMechanicStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMechanics();
    }, [fetchMechanics]);

    const handleAssign = async (mongoId: string, name: string) => {
        try {
            await assignMechanic(jobId || '', mongoId);
            message.success(`${name} assigned to ${jobId}`);
            navigate(`/job/${jobId}`);
        } catch {
            message.error('Failed to assign mechanic');
        }
    };

    const loading = jobLoading || mechLoading;

    return (
        <div className="fade-in-up">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/job/${jobId}`)}
                style={{ fontWeight: 600, marginBottom: 8 }}
            >
                Back to Job
            </Button>

            <div className="page-header">
                <h1>Assign Mechanic</h1>
                <p>Select a mechanic for <strong>{jobId}</strong></p>
            </div>

            <Spin spinning={loading}>
                <Row gutter={[20, 20]}>
                    {mechanicsRaw.map(mech => (
                        <Col xs={24} sm={12} lg={8} key={mech._id}>
                            <Card
                                className="mechanic-card"
                                style={{
                                    opacity: mech.available ? 1 : 0.5,
                                    cursor: mech.available ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() => mech.available && handleAssign(mech._id, mech.name)}
                            >
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <div style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 20,
                                        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 40,
                                        margin: '0 auto 12px',
                                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.1)',
                                    }}>
                                        {mech.avatar}
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>{mech.name}</h3>
                                    <Tag color={mech.available ? 'green' : 'red'}>
                                        {mech.available ? 'Available' : 'Busy'}
                                    </Tag>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                    }}>
                                        <ClockCircleOutlined style={{ color: '#4f46e5' }} />
                                        <span style={{ fontSize: 13, color: '#475569' }}>{mech.experience} Experience</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                    }}>
                                        <StarOutlined style={{ color: '#f59e0b' }} />
                                        <span style={{ fontSize: 13, color: '#475569' }}>{mech.specialty}</span>
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    block
                                    disabled={!mech.available}
                                    style={{ marginTop: 20, height: 44 }}
                                >
                                    Assign
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Spin>
        </div>
    );
}
