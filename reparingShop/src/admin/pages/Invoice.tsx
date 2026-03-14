import { useEffect, useState } from 'react';
import { Card, Table, Button, Divider, App, Spin, Modal, Radio, InputNumber } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useMechanicStore from '../store/mechanicStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Invoice() {
    const { message } = App.useApp();
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading: jobLoading, fetchJobById } = useJobStore();
    const { mechanics, fetchMechanics } = useMechanicStore();
    const navigate = useNavigate();

    const [gstPercent, setGstPercent] = useState<number>(18);
    const [invoiceType, setInvoiceType] = useState<'Tax Invoice' | 'Performa'>('Tax Invoice');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);

    useEffect(() => {
        if (jobId) fetchJobById(jobId);
        fetchMechanics();
    }, [jobId, fetchJobById, fetchMechanics]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('invoice-content');
        if (!element) return;

        try {
            message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Multi-page support: if content is taller than one A4 page, split into pages
            if (imgHeight <= pageHeight) {
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
            } else {
                let remainingHeight = canvas.height;
                let position = 0;
                const sliceHeight = Math.floor(canvas.height * (pageHeight / imgHeight));

                while (remainingHeight > 0) {
                    const currentSliceHeight = Math.min(sliceHeight, remainingHeight);
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = currentSliceHeight;
                    const ctx = pageCanvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(canvas, 0, position, canvas.width, currentSliceHeight, 0, 0, canvas.width, currentSliceHeight);
                        const pageImgData = pageCanvas.toDataURL('image/png');
                        const sliceImgHeight = (currentSliceHeight * imgWidth) / canvas.width;

                        if (position > 0) pdf.addPage();
                        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, sliceImgHeight);
                    }
                    position += currentSliceHeight;
                    remainingHeight -= currentSliceHeight;
                }
            }

            pdf.save(`Invoice_${job?.jobId || 'LUXRE'}.pdf`);
            message.success({ content: 'PDF downloaded!', key: 'pdf-gen' });
        } catch (error) {
            console.error('PDF Gen Error:', error);
            message.error({ content: 'Failed to generate PDF', key: 'pdf-gen' });
        }
    };

    if (jobLoading || !job) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const mechanic = job.mechanicId ? mechanics.find(m => m.id === job.mechanicId) : null;

    const partTotal = job.faultyParts.reduce((s, f) => s + f.actualCost, 0);
    const labourTotal = job.faultyParts.reduce((s, f) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s, f) => s + f.discount, 0);
    const subtotal = partTotal + labourTotal - discountTotal;
    const gst = Math.round(subtotal * (gstPercent / 100));
    const grandTotal = subtotal + gst;

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 40,
            render: (_: unknown, __: unknown, index: number) => index + 1,
        },
        {
            title: 'Description',
            key: 'desc',
            render: (_: unknown, record: { partName: string; issueDescription: string }) => (
                <div>
                    <div className="part-name" style={{ fontWeight: 700 }}>{record.partName}</div>
                    <div className="part-desc" style={{ fontSize: 12, color: '#94a3b8' }}>{record.issueDescription}</div>
                </div>
            ),
        },
        {
            title: 'Part Cost',
            dataIndex: 'actualCost',
            key: 'actualCost',
            width: 110,
            render: (v: number) => `₹ ${v.toLocaleString()}`,
        },
        {
            title: 'Labour',
            dataIndex: 'labourCharge',
            key: 'labourCharge',
            width: 100,
            render: (v: number) => `₹ ${v.toLocaleString()}`,
        },
        {
            title: 'Discount',
            dataIndex: 'discount',
            key: 'discount',
            width: 100,
            render: (v: number) => v > 0 ? <span style={{ color: '#10b981' }}>-₹ {v.toLocaleString()}</span> : '—',
        },
        {
            title: 'Total',
            key: 'lineTotal',
            width: 120,
            render: (_: unknown, record: { actualCost: number; labourCharge: number; discount: number }) => {
                const total = record.actualCost + record.labourCharge - record.discount;
                return <span style={{ fontWeight: 700 }}>₹ {total.toLocaleString()}</span>;
            },
        },
    ];

    return (
        <div className="fade-in-up">
            <div className="no-print" style={{ marginBottom: 16 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

                <div className="page-header">
                    <h1>Invoice</h1>
                    <p>Generated invoice for <strong>{jobId}</strong></p>
                </div>
            </div>

            <Card id="invoice-content" className="invoice-container" style={{ maxWidth: 900, margin: '0 auto', cursor: 'default' }}>
                {/* Invoice Header */}
                <div className="invoice-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
                    borderRadius: 14,
                    color: '#fff',
                    marginBottom: 28,
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <img src="/logo1.jpeg" alt="LUXRE" style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} />
                            <h2 className="invoice-title" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>MR LUXURY REFLECTIIONS PRIVATE LIMITED</h2>
                        </div>
                        <div className="invoice-addr" style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.8 }}>
                            C-8 Ground Floor, Rewari Line, Industrial Area,<br />
                            Maya puri, Industrial Area Phase 2, New Delhi – 110064.<br />
                            GSTIN No.: 07AATCM8164B1Z6<br />
                            E-mail - mrluxuryreflectiions@gmail.com
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="invoice-title" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{invoiceType.toUpperCase()}</div>
                        <div className="invoice-meta" style={{ opacity: 0.8, fontSize: 13 }}>
                            Invoice #: {job.jobId}<br />
                            Date: {job.date}
                        </div>
                    </div>
                </div>

                {/* Customer & Car Info */}
                <div className="invoice-customer-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 24,
                    marginBottom: 28,
                }}>
                    <div className="invoice-info-box" style={{
                        padding: '16px 20px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                    }}>
                        <div className="info-label" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bill To</div>
                        <div className="info-title" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{job.customerName}</div>
                        <div className="info-detail" style={{ color: '#64748b', fontSize: 13 }}>Mobile: +91 {job.mobile}</div>
                    </div>
                    <div className="invoice-info-box" style={{
                        padding: '16px 20px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                    }}>
                        <div className="info-label" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Vehicle Details</div>
                        <div className="info-title" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{job.carModel}</div>
                        <div className="info-detail" style={{ color: '#64748b', fontSize: 13 }}>
                            Reg: {job.carNumber} • KM: {job.kmDriven.toLocaleString()}
                        </div>
                        {mechanic && (
                            <div className="info-detail" style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                                Mechanic: {mechanic.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Parts & Labour Table */}
                <Table
                    dataSource={job.faultyParts}
                    columns={columns}
                    rowKey="partName"
                    pagination={false}
                    size="small"
                />

                <Divider />

                {/* Total Section */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 28 }}>
                    <div className="no-print" data-html2canvas-ignore="true" style={{ 
                        background: '#f1f5f9', 
                        padding: '12px 16px', 
                        borderRadius: 8, 
                        border: '1px dashed #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>Adjust GST %:</span>
                        <InputNumber
                            min={0}
                            max={100}
                            value={gstPercent}
                            onChange={(val) => setGstPercent(val || 0)}
                            style={{ width: 80 }}
                        />
                    </div>

                    <div className="invoice-totals" style={{ maxWidth: 350, width: '100%', marginLeft: 'auto' }}>
                    {[
                        { label: 'Parts Total', value: partTotal },
                        { label: 'Labour Total', value: labourTotal },
                        { label: 'Discount', value: -discountTotal, color: '#10b981' },
                        { label: 'Subtotal', value: subtotal, bold: true },
                        { label: `GST (${gstPercent}%)`, value: gst },
                    ].map(item => (
                        <div className="total-row" key={item.label} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            fontWeight: item.bold ? 700 : 400,
                            fontSize: item.bold ? 15 : 13,
                            color: item.color || '#475569',
                        }}>
                            <span>{item.label}</span>
                            <span>{item.value < 0 ? '-' : ''}₹ {Math.abs(item.value).toLocaleString()}</span>
                        </div>
                    ))}

                    <div className="grand-total-box" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        marginTop: 12,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
                        borderRadius: 12,
                        color: '#fff',
                    }}>
                        <span className="gt-label" style={{ fontSize: 18, fontWeight: 700 }}>Grand Total</span>
                        <span className="gt-value" style={{ fontSize: 24, fontWeight: 800 }}>₹ {grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

                {/* Footer */}
                <div className="invoice-footer" style={{
                    marginTop: 32,
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <div className="footer-title" style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Thank you for choosing LUXRE!</div>
                    <div className="footer-text" style={{ fontSize: 12, color: '#94a3b8' }}>
                        Warranty: 30 days on parts replaced • Terms & conditions apply<br />
                        <span style={{ fontWeight: 600, color: '#475569', marginTop: 8, display: 'block' }}>Get Passed</span>
                        <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: 'block' }}>Powered by SusaLabs</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="no-print" data-html2canvas-ignore="true" style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        size="large"
                        onClick={() => {
                            setPendingAction('print');
                            setIsModalVisible(true);
                        }}
                        style={{ height: 50, minWidth: 150 }}
                    >
                        Print Invoice
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        size="large"
                        onClick={() => {
                            setPendingAction('download');
                            setIsModalVisible(true);
                        }}
                        style={{ height: 50, minWidth: 150 }}
                    >
                        Download PDF
                    </Button>
                </div>

                <Modal
                    title="Select Invoice Type"
                    open={isModalVisible}
                    onOk={() => {
                        setIsModalVisible(false);
                        setTimeout(() => {
                            if (pendingAction === 'print') {
                                window.print();
                            } else if (pendingAction === 'download') {
                                handleDownloadPDF();
                            }
                            setPendingAction(null);
                        }, 100);
                    }}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setPendingAction(null);
                    }}
                    okText="Confirm"
                >
                    <Radio.Group 
                        value={invoiceType} 
                        onChange={(e) => setInvoiceType(e.target.value)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}
                    >
                        <Radio value="Tax Invoice">Tax Invoice</Radio>
                        <Radio value="Performa">Performa</Radio>
                    </Radio.Group>
                </Modal>
            </Card>
        </div>
    );
}
