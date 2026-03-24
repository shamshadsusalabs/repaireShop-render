import { useState, useEffect } from 'react';
import { Card, Input, Button, Switch, message, Spin, Divider } from 'antd';
import { SaveOutlined, WhatsAppOutlined } from '@ant-design/icons';
import api from '../services/api';

// ── Template 1: Job Created ──
const JOB_CREATED_TEMPLATE = `Hi {{1}}, your car has been received at {{2}}.

Job ID: {{3}}
Car: {{4}} ({{5}})
Service Type: {{6}}

We'll keep you updated on the progress.
For any help, call us at {{7}}.

Thank you! We look forward to serving you.`;

const JOB_CREATED_VARS = [
    { tag: '{{1}}', label: 'Customer Name', auto: true },
    { tag: '{{2}}', label: 'Company Name', auto: false },
    { tag: '{{3}}', label: 'Job ID', auto: true },
    { tag: '{{4}}', label: 'Car Model', auto: true },
    { tag: '{{5}}', label: 'Car Number', auto: true },
    { tag: '{{6}}', label: 'Job Type', auto: true },
    { tag: '{{7}}', label: 'Helpline Number', auto: false },
];

// ── Template 2: Customer Approval ──
const APPROVAL_TEMPLATE = `Hi {{1}}, your car {{2}} ({{3}}) inspection is complete at {{4}}.

Issues found: {{5}}

Estimated Cost: ₹{{6}} (approximate, may vary)

Please review and approve: {{7}}

Thank you! We look forward to serving you again.`;

const APPROVAL_VARS = [
    { tag: '{{1}}', label: 'Customer Name', auto: true },
    { tag: '{{2}}', label: 'Car Model', auto: true },
    { tag: '{{3}}', label: 'Car Number', auto: true },
    { tag: '{{4}}', label: 'Company Name', auto: false },
    { tag: '{{5}}', label: 'Faulty Parts List', auto: true },
    { tag: '{{6}}', label: 'Estimated Cost (₹)', auto: true },
    { tag: '{{7}}', label: 'Approval Link', auto: true },
];

// ── Template 3: Invoice Ready ──
const INVOICE_TEMPLATE = `Hi {{1}}, your car {{2}} ({{3}}) service is complete at {{4}}.

Final Bill: ₹{{5}}
Job ID: {{6}}

View or Download Invoice: {{7}}

Thank you! We look forward to serving you again.`;

const INVOICE_VARS = [
    { tag: '{{1}}', label: 'Customer Name', auto: true },
    { tag: '{{2}}', label: 'Car Model', auto: true },
    { tag: '{{3}}', label: 'Car Number', auto: true },
    { tag: '{{4}}', label: 'Company Name', auto: false },
    { tag: '{{5}}', label: 'Grand Total (₹)', auto: true },
    { tag: '{{6}}', label: 'Job ID', auto: true },
    { tag: '{{7}}', label: 'Invoice Link', auto: true },
];

// ── Template 4: Delivery / Drop Vehicle ──
const DROP_TEMPLATE = `Hi {{1}}, your car {{2}} ({{3}}) is repaired and out for delivery from {{4}}.

Driver: {{5}}
Driver Contact: {{6}}

For any queries, call us at {{7}}.

Thank you!`;

const DROP_VARS = [
    { tag: '{{1}}', label: 'Customer Name', auto: true },
    { tag: '{{2}}', label: 'Car Model', auto: true },
    { tag: '{{3}}', label: 'Car Number', auto: true },
    { tag: '{{4}}', label: 'Company Name', auto: false },
    { tag: '{{5}}', label: 'Driver Name', auto: false },
    { tag: '{{6}}', label: 'Driver Contact', auto: false },
    { tag: '{{7}}', label: 'Helpline Number', auto: false },
];

// ── Reusable Template Card Component ──
function TemplateSection({
    title,
    templateKey,
    templateBody,
    variables,
    previewFn,
}: {
    title: string;
    templateKey: string;
    templateBody: string;
    variables: { tag: string; label: string; auto: boolean }[];
    previewFn: (company: string, helpline: string) => string;
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyName, setCompanyName] = useState('Luxure');
    const [contactNumber, setContactNumber] = useState('9217099701');
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/notification-settings/${templateKey}`);
                if (data.success && data.data) {
                    setCompanyName(data.data.companyName || 'Luxure');
                    setContactNumber(data.data.contactNumber || '9217099701');
                    setIsEnabled(data.data.isEnabled !== false);
                }
            } catch { /* defaults */ }
            finally { setLoading(false); }
        })();
    }, [templateKey]);

    const handleSave = async () => {
        if (!companyName.trim()) return message.warning('Company Name is required');
        if (!contactNumber.trim()) return message.warning('Helpline Number is required');
        setSaving(true);
        try {
            await api.put('/notification-settings', {
                templateKey,
                templateName: title,
                companyName: companyName.trim(),
                contactNumber: contactNumber.trim(),
                isEnabled,
            });
            message.success(`✅ ${title} settings saved!`);
        } catch { message.error('Failed to save'); }
        finally { setSaving(false); }
    };

    return (
        <Spin spinning={loading}>
            <Card
                title={<><WhatsAppOutlined style={{ color: '#25D366' }} /> Interakt Template — "{templateKey}"</>}
                style={{ borderColor: '#25D366' }}
            >
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#856404', fontWeight: 600, marginBottom: 16 }}>
                    ⚠️ Format FIXED — Interakt pe approved. Sirf Company Name aur Helpline change kar sakte hain.
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#1e293b', lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                    {templateBody}
                </div>

                {/* Variable chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, marginBottom: 20 }}>
                    {variables.map(v => (
                        <span key={v.tag} style={{
                            background: v.auto ? '#f1f5f9' : '#dcfce7',
                            border: `1px solid ${v.auto ? '#e2e8f0' : '#86efac'}`,
                            borderRadius: 6, padding: '3px 10px',
                            color: v.auto ? '#64748b' : '#166534', fontWeight: 600,
                        }}>
                            {v.tag} = {v.label} {v.auto ? '🔒 Auto' : '✏️ Editable'}
                        </span>
                    ))}
                </div>

                <Divider />

                {/* Config */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>⚙️ Settings</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{isEnabled ? '🟢 Active' : '🔴 Disabled'}</span>
                        <Switch checked={isEnabled} onChange={setIsEnabled} checkedChildren="ON" unCheckedChildren="OFF" />
                    </div>
                </div>

                {!isEnabled && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight: 600, marginBottom: 16 }}>
                        ❌ DISABLED — yeh notification nahi jayega
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 14 }}>Company Name</label>
                        <Input size="large" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Luxure" style={{ borderRadius: 10 }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 14 }}>Helpline Number</label>
                        <Input size="large" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. 9217099701" prefix={<span style={{ color: '#94a3b8' }}>+91</span>} style={{ borderRadius: 10 }} />
                    </div>
                </div>

                {/* Live Preview */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#475569' }}>📱 Live Preview:</div>
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#1e293b', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                        {previewFn(companyName || '___', contactNumber || '___')}
                    </div>
                </div>

                <Button type="primary" icon={<SaveOutlined />} size="large" loading={saving} onClick={handleSave} block
                    style={{ marginTop: 24, height: 52, borderRadius: 12, fontSize: 16, fontWeight: 700, background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                    Save "{title}" Settings
                </Button>
            </Card>
        </Spin>
    );
}

// ── Main Page ──
export default function NotificationSettings() {
    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>📲 Auto WhatsApp Notification Settings</h1>
                <p>Configure automatic WhatsApp messages sent to customers at key events</p>
            </div>

            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* ── Template 1: Job Created ── */}
                <TemplateSection
                    title="Job Created"
                    templateKey="job_created"
                    templateBody={JOB_CREATED_TEMPLATE}
                    variables={JOB_CREATED_VARS}
                    previewFn={(company, helpline) => `Hi Sham, your car has been received at ${company}.

Job ID: JOB-2026-001
Car: Swift Dzire (HR26AB1234)
Service Type: Walk-in

We'll keep you updated on the progress.
For any help, call us at ${helpline}.

Thank you! We look forward to serving you.`}
                />

                {/* ── Template 4: Delivery / Drop Vehicle ── */}
                <TemplateSection
                    title="4. Vehicle Out For Delivery / Drop"
                    templateKey="job_drop"
                    templateBody={DROP_TEMPLATE}
                    variables={DROP_VARS}
                    previewFn={(companyName, contactNumber) =>
                        DROP_TEMPLATE
                            .replace('{{1}}', 'Shamshad')
                            .replace('{{2}}', 'Maruti Suzuki Baleno')
                            .replace('{{3}}', 'MH04AB1234')
                            .replace('{{4}}', companyName)
                            .replace('{{5}}', 'Ramesh Kumar')
                            .replace('{{6}}', '9876543210')
                            .replace('{{7}}', contactNumber)
                    }
                />

                {/* ── Template 2: Customer Approval ── */}
                <TemplateSection
                    title="Customer Approval"
                    templateKey="customer_approval"
                    templateBody={APPROVAL_TEMPLATE}
                    variables={APPROVAL_VARS}
                    previewFn={(company) => `Hi Sham, your car Swift Dzire (HR26AB1234) inspection is complete at ${company}.

Issues found: Brake Pad, Oil Filter, AC Compressor

Estimated Cost: ₹8500 (approximate, may vary)

Please review and approve: https://yoursite.com/approve/JOB-2026-001

Thank you! We look forward to serving you again.`}
                />

                {/* ── Template 3: Invoice Ready ── */}
                <TemplateSection
                    title="Invoice Ready"
                    templateKey="invoice_ready"
                    templateBody={INVOICE_TEMPLATE}
                    variables={INVOICE_VARS}
                    previewFn={(company) => `Hi Sham, your car Swift Dzire (HR26AB1234) service is complete at ${company}.

Final Bill: ₹12500
Job ID: JOB-2026-001

View or Download Invoice: https://yoursite.com/invoice-view/JOB-2026-001

Thank you! We look forward to serving you again.`}
                />
            </div>
        </div>
    );
}
