import { useState, useEffect, useCallback } from 'react';
import {
    Card, Input, Button, Select, message,
    Spin, Result, Tag, Alert, Progress,
} from 'antd';
import {
    PhoneOutlined, SendOutlined, ReloadOutlined, CheckCircleOutlined,
    FileTextOutlined, TeamOutlined, QrcodeOutlined,
} from '@ant-design/icons';
import whatsappCampaignService, { type WhatsAppSession, type CampaignStatus } from '../services/whatsappCampaignService';
import whatsAppService, { type WhatsAppGroup, type WhatsAppTemplate } from '../services/whatsAppService';

export default function SendNotification() {
    // Data from Database
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerName, setCustomerName] = useState('');

    // WhatsApp Session State
    const [session, setSession] = useState<WhatsAppSession | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);

    // Campaign State
    const [sending, setSending] = useState(false);
    const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | null>(null);
    const [finished, setFinished] = useState(false);

    // ── Load Data ──
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [tpls, grps] = await Promise.all([
                whatsAppService.getAllTemplates(),
                whatsAppService.getAllGroups()
            ]);
            setTemplates(tpls);
            setGroups(grps);
        } catch (error) {
            message.error('Failed to load templates or groups');
        } finally {
            setLoadingData(false);
        }
    };

    const fetchSessionStatus = useCallback(async (showLoading = false) => {
        if (showLoading) setLoadingSession(true);
        try {
            const status = await whatsappCampaignService.getSessionStatus();
            setSession(status);
        } catch (err) {
            console.error('Session check failed', err);
        } finally {
            if (showLoading) setLoadingSession(false);
        }
    }, []);

    useEffect(() => {
        fetchSessionStatus(true);
        // Polling: Slow down to 15 seconds to avoid excessive Render API calls
        const timer = setInterval(() => fetchSessionStatus(false), 15000);
        return () => clearInterval(timer);
    }, [fetchSessionStatus]);

    const startWhatsApp = async () => {
        setLoadingSession(true);
        try {
            const status = await whatsappCampaignService.startSession();
            setSession(status);
            message.info('WhatsApp initialization started...');
        } catch (err) {
            message.error('Failed to start WhatsApp session');
        } finally {
            setLoadingSession(false);
        }
    };

    // ── Logic ──
    const selectedTemplate = templates.find(t => t._id === selectedTemplateId);
    const selectedGroup = groups.find(g => g._id === selectedGroupId);

    const handleSend = async () => {
        if (!selectedTemplate) return message.warning('Please select a template');
        if (!selectedGroup) return message.warning('Please select a group');
        if (!customerMobile.trim()) return message.warning('Please enter customer mobile number');

        setSending(true);
        setFinished(false);

        // Collect all recipients
        const recipients = [
            ...selectedGroup.members.map(m => ({ phone: m.mobile, name: m.name })),
            { phone: customerMobile.trim(), name: customerName.trim() || 'Customer' }
        ];

        try {
            const job = await whatsappCampaignService.startCampaign(recipients, selectedTemplate.body);
            setCampaignStatus(job);
            
            // Start polling for results: Slowed to 5 seconds
            const poll = setInterval(async () => {
                const status = await whatsappCampaignService.getCampaignStatus(job.id);
                setCampaignStatus(status);
                if (['completed', 'failed', 'cancelled'].includes(status.status)) {
                    clearInterval(poll);
                    setSending(false);
                    setFinished(true);
                    message.success('All messages processed!');
                }
            }, 5000);

        } catch (err: any) {
            message.error(err?.response?.data?.error || 'Failed to start campaign');
            setSending(false);
        }
    };

    const handleReset = () => {
        setFinished(false);
        setCampaignStatus(null);
        setSelectedTemplateId(null);
        setSelectedGroupId(null);
        setCustomerMobile('');
        setCustomerName('');
    };

    // ── Render ──
    if (finished && campaignStatus) {
        return (
            <div className="fade-in-up">
                <div className="page-header">
                    <h1>✅ Notification Status</h1>
                    <p>All messages have been processed</p>
                </div>
                <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                    <Result
                        status="success"
                        title="Campaign Finished!"
                        subTitle={`Sent to ${campaignStatus.sent} recipients successfully. Failed: ${campaignStatus.failed}.`}
                        extra={[
                            <Button type="primary" key="new" onClick={handleReset} size="large" style={{ borderRadius: 10 }}>
                                Send Another Notification
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>📲 Send Notification</h1>
                <p>Bulk message group members and customer via WhatsApp server</p>
            </div>

            <Spin spinning={loadingData}>
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                    
                    {/* Main Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Card title={<><FileTextOutlined /> 1. Select Template</>}>
                            <Select
                                placeholder="Choose a template..."
                                showSearch
                                optionFilterProp="children"
                                style={{ width: '100%' }}
                                size="large"
                                value={selectedTemplateId}
                                onChange={setSelectedTemplateId}
                                options={templates.map(t => ({ value: t._id, label: t.title }))}
                            />
                            {selectedTemplate && (
                                <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', border: '1px solid #e2e8f0' }}>
                                    <strong>Preview Body:</strong><br/>
                                    {selectedTemplate.body}
                                </div>
                            )}
                        </Card>

                        <Card title={<><TeamOutlined /> 2. Select Group</>}>
                            <Select
                                placeholder="Choose a group to notify..."
                                style={{ width: '100%' }}
                                size="large"
                                value={selectedGroupId}
                                onChange={setSelectedGroupId}
                                options={groups.map(g => ({ value: g._id, label: `${g.name} (${g.members.length} members)` }))}
                            />
                            {selectedGroup && (
                                <div style={{ marginTop: 12 }}>
                                    {selectedGroup.members.map((m, i) => (
                                        <Tag key={m._id || i} color="blue" style={{ marginBottom: 4 }}>{m.name} ({m.role})</Tag>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card title={<><PhoneOutlined /> 3. Customer Details</>}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Mobile Number *</label>
                                    <Input
                                        placeholder="e.g. 9876543210"
                                        size="large"
                                        value={customerMobile}
                                        onChange={e => setCustomerMobile(e.target.value)}
                                        prefix={<span style={{ color: '#94a3b8' }}>+91</span>}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Customer Name</label>
                                    <Input
                                        placeholder="Optional"
                                        size="large"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Button
                            type="primary"
                            size="large"
                            icon={sending ? <ReloadOutlined spin /> : <SendOutlined />}
                            block
                            onClick={handleSend}
                            loading={sending}
                            disabled={!session || session.status !== 'ready' || sending}
                            style={{ height: 56, borderRadius: 12, fontSize: 18, fontWeight: 700, background: '#25D366', borderColor: '#25D366' }}
                        >
                            {sending ? 'Sending Messages...' : 'Send WhatsApp Notification'}
                        </Button>

                        {sending && campaignStatus && (
                            <Card>
                                <div style={{ marginBottom: 8, fontWeight: 600 }}>Sending Progress:</div>
                                <Progress percent={Math.round((campaignStatus.processed / campaignStatus.total) * 100)} status="active" />
                                <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
                                    Processed: {campaignStatus.processed} / {campaignStatus.total} | 
                                    Success: <span style={{ color: '#059669' }}>{campaignStatus.sent}</span> | 
                                    Failed: <span style={{ color: '#dc2626' }}>{campaignStatus.failed}</span>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar: Connection Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Card title={<><QrcodeOutlined /> WhatsApp Server</>} size="small">
                            <Spin spinning={loadingSession}>
                                {!session ? (
                                    <Alert type="warning" message="Server Offline" showIcon />
                                ) : session.status === 'ready' ? (
                                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <div style={{ color: '#059669', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                                            <CheckCircleOutlined /> Connected
                                        </div>
                                        <Tag color="green">Logged in: {session.phoneNumber}</Tag>
                                    </div>
                                ) : session.status === 'qr' && session.qrDataUrl ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Scan this QR with WhatsApp</p>
                                        <img src={session.qrDataUrl} alt="QR" style={{ width: '100%', maxWidth: 220, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                        <Button size="small" icon={<ReloadOutlined />} onClick={() => fetchSessionStatus(true)} style={{ marginTop: 12 }}>Refresh</Button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <Alert message={`Status: ${session.status}`} type="info" />
                                        <Button type="primary" onClick={startWhatsApp} style={{ marginTop: 16 }}>Start Session</Button>
                                    </div>
                                )}
                            </Spin>
                        </Card>

                        <Card size="small" title="Help">
                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                                • Ensure WhatsApp server (port 3001) is running.<br/>
                                • Scan QR once every 12 hours.<br/>
                                • Message will be sent to the selected group members and the customer number.
                            </div>
                        </Card>
                    </div>

                </div>
            </Spin>
        </div>
    );
}
