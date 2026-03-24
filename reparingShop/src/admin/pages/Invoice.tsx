import { useEffect, useState } from 'react';
import { Button, App, Spin, Modal, Radio, InputNumber } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useJobStore from '../store/jobStore';
import useMechanicStore from '../store/mechanicStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

/* ─── Shared cell style helper ──────────────────────────────── */
const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '4px 6px',
    fontSize: 9,
    borderBottom: '1px solid #bbb',
    borderRight: '1px solid #bbb',
    verticalAlign: 'top',
    ...extra,
});

const headerCell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...cell(extra),
    fontWeight: 700,
    backgroundColor: '#f2f2f2',
    textAlign: 'center',
    fontSize: 8,
    padding: '5px 4px',
});

/* ─── Label : Value row inside info grid ────────────────────── */
const InfoRow = ({ label, value, bold }: { label: string; value: string | number | undefined; bold?: boolean }) => (
    <tr>
        <td style={{ padding: '2px 6px', fontSize: 9, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd', width: '40%' }}>{label}</td>
        <td style={{ padding: '2px 6px', fontSize: 9, fontWeight: bold ? 700 : 400, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>{value || '—'}</td>
    </tr>
);

export default function Invoice() {
    const { message } = App.useApp();
    const { jobId } = useParams<{ jobId: string }>();
    const { currentJob: job, loading: jobLoading, fetchJobById } = useJobStore();
    const { mechanics, fetchMechanics } = useMechanicStore();
    const navigate = useNavigate();

    const [labourCgst, setLabourCgst] = useState<number>(9);
    const [labourSgst, setLabourSgst] = useState<number>(9);

    const [invoiceType, setInvoiceType] = useState<'Tax Invoice' | 'Performa'>('Tax Invoice');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);
    const [totalKmDriven, setTotalKmDriven] = useState<number>(0);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .no-print-input { display: none !important; }
                .print-only { display: inline !important; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            @media screen {
                .print-only { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    useEffect(() => {
        if (jobId) {
            fetchJobById(jobId);
            fetchCustomerKmHistory();
        }
        fetchMechanics();
    }, [jobId, fetchJobById, fetchMechanics]);

    const fetchCustomerKmHistory = async () => {
        if (!job?.mobile) return;
        try {
            const response = await fetch(`http://localhost:5000/api/customers/history/${job.mobile}`);
            if (response.ok) {
                const data = await response.json();
                if (data.kmHistory && data.kmHistory.length > 0) {
                    const latestKm = Math.max(...data.kmHistory.map((h: any) => h.km));
                    setTotalKmDriven(latestKm);
                }
            }
        } catch (error) {
            console.error('Error fetching customer KM history:', error);
        }
    };

    useEffect(() => {
        if (job?.mobile) fetchCustomerKmHistory();
    }, [job?.mobile]);

    /* ─── PDF download ──────────────────────────────────────── */
    const handleDownloadPDF = async () => {
        const element = document.getElementById('invoice-content');
        if (!element) return;

        try {
            message.loading({ content: 'Generating PDF...', key: 'pdf-gen' });

            const canvas = await html2canvas(element, {
                scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
            });

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = 210;
            const pageHeight = 297;
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

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
                        const sliceImgHeight = (currentSliceHeight * imgWidth) / canvas.width;
                        if (position > 0) pdf.addPage();
                        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, sliceImgHeight);
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

    /* ─── Derived values ────────────────────────────────────── */
    const mechanic = mechanics.find(m => m._id === job.mechanicId);
    const invoiceDate = new Date(job.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

    // Parts total
    const hasIssuedParts = job.partsIssued && job.partsIssued.length > 0;
    const partsData = hasIssuedParts
        ? job.partsIssued!.map(p => ({
            name: p.partName,
            partNumber: p.partNumber || '',
            hsn: p.hsnCode || '',
            qty: p.quantityIssued,
            rate: p.unitPrice,
            gst: p.gstPercent || 0,
            discount: 0,
            amount: p.unitPrice * p.quantityIssued,
        }))
        : job.faultyParts.map(f => ({
            name: f.partName,
            partNumber: '',
            hsn: '',
            qty: 1,
            rate: f.actualCost,
            gst: 0,
            discount: f.discount,
            amount: f.actualCost - f.discount,
        }));

    const partTotal = partsData.reduce((s, p) => s + p.amount, 0);

    // Parts GST calculation
    const partsGstTotal = hasIssuedParts
        ? job.partsIssued!.reduce((s, p) => {
            const base = p.unitPrice * p.quantityIssued;
            return s + (base * (p.gstPercent || 0) / 100);
        }, 0)
        : 0;
    const partsCgst = Math.round(partsGstTotal / 2);
    const partsSgst = Math.round(partsGstTotal / 2);

    // Labour
    const labourParts = job.faultyParts.filter(p => p.labourCharge > 0);
    const labourTotal = labourParts.reduce((s, f) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s, f) => s + f.discount, 0);

    // Labour GST
    const labourCgstAmt = Math.round(labourTotal * labourCgst / 100);
    const labourSgstAmt = Math.round(labourTotal * labourSgst / 100);

    // Grand totals
    const totalLabourWithGst = labourTotal + labourCgstAmt + labourSgstAmt;
    const totalPartsWithGst = partTotal + partsCgst + partsSgst;
    const grandTotal = totalLabourWithGst + totalPartsWithGst - discountTotal;

    return (
        <div className="fade-in-up">
            {/* ─── Action Bar (no print) ──────────────────────── */}
            <div className="no-print" style={{ marginBottom: 16 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

                <div className="page-header">
                    <h1>Invoice</h1>
                    <p>Generated invoice for <strong>{jobId}</strong></p>
                </div>

                {/* Labour GST Adjusters */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: '#f0f9ff', padding: '6px 10px', border: '1px dashed #0ea5e9', fontSize: 10, borderRadius: 6 }}>
                        <span style={{ fontWeight: 600 }}>Labour CGST %:</span>
                        <InputNumber min={0} max={100} value={labourCgst} onChange={(val) => setLabourCgst(val || 0)} style={{ width: 55, marginLeft: 6 }} size="small" />
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '6px 10px', border: '1px dashed #0ea5e9', fontSize: 10, borderRadius: 6 }}>
                        <span style={{ fontWeight: 600 }}>Labour SGST %:</span>
                        <InputNumber min={0} max={100} value={labourSgst} onChange={(val) => setLabourSgst(val || 0)} style={{ width: 55, marginLeft: 6 }} size="small" />
                    </div>
                </div>
            </div>

            {/* ═══════════════ INVOICE CONTENT ═══════════════ */}
            <div
                id="invoice-content"
                style={{
                    maxWidth: 850,
                    margin: '0 auto',
                    background: '#fff',
                    padding: 0,
                    border: '2px solid #000',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000',
                }}
            >
                {/* ─── HEADER ────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #000',
                    padding: '12px 16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <img src="/logo1.jpeg" alt="LUXRE" style={{
                            height: 55, width: 55, objectFit: 'contain',
                            border: '1px solid #ccc', padding: 2, borderRadius: 4,
                        }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>LUXRE</h2>
                            <div style={{ fontSize: 9, color: '#333', lineHeight: 1.6, marginTop: 2 }}>
                                C-8 Ground Floor, Rewari Line, Industrial Area<br />
                                Maya Puri, New Delhi – 110064
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                        <table style={{ fontSize: 9, marginLeft: 'auto', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="E-Mail" value="service@luxre.in" />
                                <InfoRow label="Phone No." value="+91 98765 43210" />
                                <InfoRow label="State Code" value="DELHI/ DL/ 07" />
                                <InfoRow label="GST Regst. No." value="07AATCM8164B1Z6" />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── INVOICE TITLE BAR ─────────────────────── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #000',
                    padding: '6px 16px',
                    backgroundColor: '#f5f5f5',
                }}>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
                        {invoiceType}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>
                        Duplicate
                    </div>
                </div>

                {/* ─── CUSTOMER + VEHICLE INFO GRID ──────────── */}
                <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                    {/* Left: Customer Details */}
                    <div style={{ flex: 1, borderRight: '2px solid #000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Customer Name" value={job.customerName} bold />
                                <InfoRow label="Customer State" value="DELHI/ DL/ 07" />
                                <InfoRow label="Mobile No." value={`+91 ${job.mobile}`} />
                                <InfoRow label="Customer ID" value={job.customerId || '—'} />
                                <InfoRow label="Regn. No." value={job.carNumber} bold />
                            </tbody>
                        </table>
                    </div>
                    {/* Right: Repair / Invoice Details */}
                    <div style={{ flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Repair Order No." value={job.jobId} bold />
                                <InfoRow label="Repair Order Date" value={invoiceDate} />
                                <InfoRow label="Invoice Number" value={job.jobId} bold />
                                <InfoRow label="Invoice Date" value={invoiceDate} />
                                <InfoRow label="Model" value={job.carModel} bold />
                                <InfoRow label="Kms In" value={job.kmDriven?.toLocaleString()} />
                                <InfoRow label="Kms Out" value={(totalKmDriven > 0 ? totalKmDriven : job.kmDriven)?.toLocaleString()} />
                                {mechanic && <InfoRow label="Service Advisor" value={mechanic.name} />}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── CUSTOMER VOICE ─────────────────────────── */}
                <div style={{ borderBottom: '2px solid #000', padding: '6px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Customer Voice / Demanded Repair</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th style={headerCell({ width: '30px', textAlign: 'center' })}>S.No.</th>
                                <th style={headerCell({ textAlign: 'left' })}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {job.faultyParts.map((part, idx) => (
                                <tr key={idx}>
                                    <td style={cell({ textAlign: 'center' })}>{idx + 1}</td>
                                    <td style={cell()}>{part.issueDescription || part.partName}</td>
                                </tr>
                            ))}
                            {job.faultyParts.length === 0 && (
                                <tr>
                                    <td style={cell({ textAlign: 'center' })}>1</td>
                                    <td style={cell()}>General Service</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── LABOUR DETAILS TABLE ───────────────────── */}
                <div style={{ borderBottom: '2px solid #000', padding: '6px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Requested Jobs — Labour Details</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, border: '1px solid #bbb' }}>
                        <thead>
                            <tr>
                                <th style={headerCell({ width: '28px' })}>S.No.</th>
                                <th style={headerCell({ textAlign: 'left', minWidth: '140px' })}>Description</th>
                                <th style={headerCell({ width: '65px' })}>SAC</th>
                                <th style={headerCell({ width: '35px' })}>Qty</th>
                                <th style={headerCell({ width: '70px' })}>GST Base Amount</th>
                                <th style={headerCell({ width: '55px' })}>Total GST</th>
                                <th style={headerCell({ width: '55px' })}>Discount</th>
                                <th style={headerCell({ width: '80px' })}>Amount Incl. Tax</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labourParts.length > 0 ? labourParts.map((part, idx) => {
                                const cAmt = Math.round(part.labourCharge * labourCgst / 100);
                                const sAmt = Math.round(part.labourCharge * labourSgst / 100);
                                const amtInclTax = part.labourCharge + cAmt + sAmt;
                                return (
                                    <tr key={idx}>
                                        <td style={cell({ textAlign: 'center' })}>{idx + 1}</td>
                                        <td style={cell({ fontWeight: 600 })}>
                                            {part.partName}
                                            <div style={{ fontSize: 7, color: '#666', fontWeight: 400, marginTop: 1 }}>{part.issueDescription}</div>
                                        </td>
                                        <td style={cell({ textAlign: 'center', fontFamily: 'monospace' })}>998729</td>
                                        <td style={cell({ textAlign: 'center' })}>1</td>
                                        <td style={cell({ textAlign: 'right', fontWeight: 600 })}>₹{part.labourCharge.toLocaleString()}</td>
                                        <td style={cell({ textAlign: 'right', color: '#0369a1' })}>₹{(cAmt + sAmt).toLocaleString()}</td>
                                        <td style={cell({ textAlign: 'right', color: '#059669' })}>—</td>
                                        <td style={cell({ textAlign: 'right', fontWeight: 700 })}>₹{amtInclTax.toLocaleString()}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={8} style={cell({ textAlign: 'center', color: '#999', padding: '8px' })}>No labour charges</td>
                                </tr>
                            )}
                        </tbody>
                        {labourParts.length > 0 && (
                            <tfoot>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <td colSpan={4} style={{ ...cell(), fontSize: 8, color: '#0369a1', fontWeight: 600, borderTop: '1px solid #999' }}>
                                        CGST - {labourCgst}% = ₹{labourCgstAmt.toLocaleString()}, &nbsp; SGST - {labourSgst}% = ₹{labourSgstAmt.toLocaleString()}
                                    </td>
                                    <td colSpan={3} style={{ ...cell(), textAlign: 'right', fontWeight: 700, borderTop: '1px solid #999', fontSize: 10 }}>
                                        Total Labour
                                    </td>
                                    <td style={{ ...cell(), textAlign: 'right', fontWeight: 800, borderTop: '1px solid #999', fontSize: 10 }}>
                                        ₹{totalLabourWithGst.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* ─── PARTS DETAILS TABLE ────────────────────── */}
                <div style={{ borderBottom: '2px solid #000', padding: '6px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Parts Details</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, border: '1px solid #bbb' }}>
                        <thead>
                            <tr>
                                <th style={headerCell({ width: '28px' })}>S.No.</th>
                                <th style={headerCell({ textAlign: 'left', minWidth: '130px' })}>Description</th>
                                <th style={headerCell({ width: '65px' })}>HSN</th>
                                <th style={headerCell({ width: '35px' })}>Qty</th>
                                <th style={headerCell({ width: '60px' })}>Rate</th>
                                <th style={headerCell({ width: '40px' })}>GST%</th>
                                <th style={headerCell({ width: '70px' })}>GST Base Amount</th>
                                <th style={headerCell({ width: '55px' })}>Total GST</th>
                                <th style={headerCell({ width: '55px' })}>Discount</th>
                                <th style={headerCell({ width: '80px' })}>Amount Incl. Tax</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partsData.length > 0 ? partsData.map((part, idx) => {
                                const gstAmt = Math.round(part.amount * part.gst / 100);
                                const amtInclTax = part.amount + gstAmt - part.discount;
                                return (
                                    <tr key={idx}>
                                        <td style={cell({ textAlign: 'center' })}>{idx + 1}</td>
                                        <td style={cell({ fontWeight: 600 })}>
                                            {part.name}
                                            {part.partNumber && <div style={{ fontSize: 7, color: '#666', fontWeight: 400, fontFamily: 'monospace', marginTop: 1 }}>Part No: {part.partNumber}</div>}
                                        </td>
                                        <td style={cell({ textAlign: 'center', fontFamily: 'monospace', fontSize: 8 })}>{part.hsn || '—'}</td>
                                        <td style={cell({ textAlign: 'center' })}>{part.qty}</td>
                                        <td style={cell({ textAlign: 'right' })}>₹{part.rate.toLocaleString()}</td>
                                        <td style={cell({ textAlign: 'center', color: '#0369a1', fontWeight: 600 })}>{part.gst}%</td>
                                        <td style={cell({ textAlign: 'right', fontWeight: 600 })}>₹{part.amount.toLocaleString()}</td>
                                        <td style={cell({ textAlign: 'right', color: '#0369a1' })}>{gstAmt > 0 ? gstAmt.toLocaleString() : '—'}</td>
                                        <td style={cell({ textAlign: 'right', color: '#059669' })}>
                                            {part.discount > 0 ? `-₹${part.discount.toLocaleString()}` : '—'}
                                        </td>
                                        <td style={cell({ textAlign: 'right', fontWeight: 700 })}>₹{amtInclTax.toLocaleString()}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={10} style={cell({ textAlign: 'center', color: '#999', padding: '8px' })}>No parts issued</td>
                                </tr>
                            )}
                        </tbody>
                        {partsData.length > 0 && hasIssuedParts && (
                            <tfoot>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <td colSpan={5} style={{ ...cell(), fontSize: 8, color: '#0369a1', fontWeight: 600, borderTop: '1px solid #999' }}>
                                        CGST = ₹{partsCgst.toLocaleString()}, &nbsp; SGST = ₹{partsSgst.toLocaleString()}
                                    </td>
                                    <td colSpan={4} style={{ ...cell(), textAlign: 'right', fontWeight: 700, borderTop: '1px solid #999', fontSize: 10 }}>
                                        Total Parts
                                    </td>
                                    <td style={{ ...cell(), textAlign: 'right', fontWeight: 800, borderTop: '1px solid #999', fontSize: 10 }}>
                                        ₹{totalPartsWithGst.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* ─── TOTALS SUMMARY ─────────────────────────── */}
                <div style={{ padding: '8px 16px', borderBottom: '2px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: 10, border: '1px solid #999', minWidth: 300 }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #ccc' }}>
                                    <td style={{ padding: '4px 10px', fontWeight: 600 }}>Total Labour (Incl. Tax)</td>
                                    <td style={{ padding: '4px 10px', textAlign: 'right' }}>₹{totalLabourWithGst.toLocaleString()}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #ccc' }}>
                                    <td style={{ padding: '4px 10px', fontWeight: 600 }}>Total Parts (Incl. Tax)</td>
                                    <td style={{ padding: '4px 10px', textAlign: 'right' }}>₹{totalPartsWithGst.toLocaleString()}</td>
                                </tr>
                                {discountTotal > 0 && (
                                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                                        <td style={{ padding: '4px 10px', fontWeight: 600 }}>Total Discount</td>
                                        <td style={{ padding: '4px 10px', textAlign: 'right', color: '#059669' }}>-₹{discountTotal.toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr style={{ backgroundColor: '#f2f2f2', borderTop: '2px solid #000' }}>
                                    <td style={{ padding: '6px 10px', fontWeight: 800, fontSize: 12 }}>GRAND TOTAL</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, fontSize: 13 }}>₹{grandTotal.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── TERMS & SIGNATURES ─────────────────────── */}
                <div style={{ padding: '10px 16px' }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 10 }}>Terms & Conditions:</div>
                        <div style={{ color: '#555', lineHeight: 1.6, fontSize: 8 }}>
                            • Warranty: 30 days on parts replaced<br />
                            • Payment terms: Due on receipt<br />
                            • This is a system generated invoice and does not require signature
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 30 }}>
                        <div style={{ textAlign: 'center', minWidth: 180 }}>
                            <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontWeight: 600, fontSize: 10 }}>
                                Customer Signature
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 180 }}>
                            <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontWeight: 600, fontSize: 10 }}>
                                Authorized Signatory<br />
                                <span style={{ fontSize: 9, fontWeight: 400 }}>For LUXRE</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 10, borderTop: '1px solid #ddd', fontSize: 9, fontWeight: 600, lineHeight: 1.8 }}>
                        <div style={{ marginBottom: 6 }}>Vehicle has been received from workshop and work done as per my satisfaction</div>
                        <div>Payment received from customer, vehicle permitted to leave workshop</div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 6, color: '#888', fontSize: 7 }}>
                        Powered by SusaLabs | This is a computer generated invoice
                    </div>
                </div>
            </div>

            {/* ─── Action Buttons (no print) ──────────────────── */}
            <div className="no-print" data-html2canvas-ignore="true" style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', maxWidth: 850, margin: '24px auto 0' }}>
                <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    size="large"
                    onClick={() => { setPendingAction('print'); setIsModalVisible(true); }}
                    style={{ height: 50, minWidth: 180, fontWeight: 700, fontSize: 15 }}
                >
                    Print Invoice
                </Button>
                <Button
                    icon={<DownloadOutlined />}
                    size="large"
                    onClick={() => { setPendingAction('download'); setIsModalVisible(true); }}
                    style={{ height: 50, minWidth: 180, fontWeight: 700, fontSize: 15 }}
                >
                    Download PDF
                </Button>
            </div>

            <Modal
                title="Select Invoice Type"
                open={isModalVisible}
                onOk={async () => {
                    setIsModalVisible(false);

                    try {
                        await api.post(`/jobs/${jobId}/send-invoice-whatsapp`, { grandTotal });
                    } catch (err) {
                        console.error('Failed to send invoice WhatsApp:', err);
                    }

                    setTimeout(() => {
                        if (pendingAction === 'print') {
                            window.print();
                        } else if (pendingAction === 'download') {
                            handleDownloadPDF();
                        }
                        setPendingAction(null);
                    }, 100);
                }}
                onCancel={() => { setIsModalVisible(false); setPendingAction(null); }}
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
        </div>
    );
}
