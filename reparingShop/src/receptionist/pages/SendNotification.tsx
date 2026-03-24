import { useState, useEffect } from 'react';
import {
    Card, Input, Button, Select, message,
    Spin, Result, Tag,
} from 'antd';
import {
    PhoneOutlined, SendOutlined, ReloadOutlined,
    FileTextOutlined, TeamOutlined, CarOutlined,
} from '@ant-design/icons';
import whatsappCampaignService, { type CampaignStatus } from '../services/whatsappCampaignService';
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

    // Driver Details (auto-filled from template, but editable)
    const [driverName, setDriverName] = useState('');
    const [driverNumber, setDriverNumber] = useState('');
    const [companyName, setCompanyName] = useState('Luxure');
    const [contactNumber, setContactNumber] = useState('9217099701');
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

    // ── Logic ──
    const selectedTemplate = templates.find(t => t._id === selectedTemplateId);
    const selectedGroup = groups.find(g => g._id === selectedGroupId);

    // Auto-fill driver fields when template changes
    useEffect(() => {
        if (selectedTemplate) {
            setDriverName(selectedTemplate.driverName || '');
            setDriverNumber(selectedTemplate.driverNumber || '');
            setCompanyName(selectedTemplate.companyName || 'Luxure');
            setContactNumber(selectedTemplate.contactNumber || '9217099701');
        }
    }, [selectedTemplateId]);

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
            const job = await whatsappCampaignService.startCampaign(
                recipients,
                selectedTemplate.body,
                {
                    driverName:    driverName.trim(),
                    driverNumber:  driverNumber.trim(),
                    companyName:   companyName.trim() || 'Luxure',
                    contactNumber: contactNumber.trim() || '9217099701',
                }
            );
            setCampaignStatus(job);
            setSending(false);
            setFinished(true);
            message.success('All messages processed!');
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
        setDriverName('');
        setDriverNumber('');
        setCompanyName('Luxure');
        setContactNumber('9217099701');
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
                <p>Bulk message group members and customer via Interakt WhatsApp API</p>
            </div>

            <Spin spinning={loadingData}>
                <div style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* 1. Template */}
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
                            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                                <strong>Preview:</strong>{'\n'}{selectedTemplate.body}
                            </div>
                        )}
                    </Card>

                    {/* 2. Group */}
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

                    {/* 3. Customer Details */}
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
                                    placeholder="e.g. Rohan"
                                    size="large"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>                    {/* 4. Driver Details — editable, auto-filled from template */}
                    <Card title={<><CarOutlined /> 4. Driver Details</>} style={{ borderColor: '#25D366' }}>
                        <div style={{ fontSize: 12, color: '#166534', marginBottom: 14, background: '#f0fdf4', padding: '6px 12px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                            ✅ Template se auto-fill hua hai — aap yahan change kar sakte hain
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>{'{{2}}'} Driver Name</label>
                                <Input
                                    size="large"
                                    value={driverName}
                                    onChange={e => setDriverName(e.target.value)}
                                    placeholder="e.g. Sham"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>{'{{3}}'} Driver Number</label>
                                <Input
                                    size="large"
                                    value={driverNumber}
                                    onChange={e => setDriverNumber(e.target.value)}
                                    placeholder="e.g. 8898989889"
                                    prefix={<span style={{ color: '#94a3b8' }}>+91</span>}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>{'{{4}}'} Company Name</label>
                                <Input
                                    size="large"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    placeholder="Luxure"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>{'{{5}}'} Helpline Number</label>
                                <Input
                                    size="large"
                                    value={contactNumber}
                                    onChange={e => setContactNumber(e.target.value)}
                                    prefix={<span style={{ color: '#94a3b8' }}>+91</span>}
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
                        disabled={sending}
                        style={{ height: 56, borderRadius: 12, fontSize: 18, fontWeight: 700, background: '#25D366', borderColor: '#25D366' }}
                    >
                        {sending ? 'Sending Messages...' : 'Send WhatsApp Notification'}
                    </Button>
                </div>
            </Spin>
        </div>
    );
}
