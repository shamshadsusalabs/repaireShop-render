import { useEffect, useState } from 'react';
import { Card, Button, Spin, Result } from 'antd';
import { PrinterOutlined, DownloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Use direct axios for public route to avoid auth interceptors
const API_URL = import.meta.env.VITE_API_URL || 'https://repaireshop.onrender.com/api';

export default function PublicInvoice() {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Add print styles
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await axios.get(`${API_URL}/public/invoice/${jobId}`);
                if (res.data.success) {
                    setJob(res.data.data);
                }
            } catch (err) {
                setError('Invalid link or invoice not found.');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) fetchJob();
    }, [jobId]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('invoice-content');
        if (!element) return;

        try {
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
        } catch (error) {
            console.error('PDF Gen Error:', error);
            alert('Failed to generate PDF');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <Spin size="large" tip="Loading Invoice..." />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
                <Result status="error" title="Invoice Not Found" subTitle={error || "This link may have expired or is invalid."} />
            </div>
        );
    }

    // Default calculations for public view (since HSN/GST edits are not available here)
    const partTotal = job.partsIssued && job.partsIssued.length > 0
        ? job.partsIssued.reduce((s: any, p: any) => s + (p.unitPrice * p.quantityIssued), 0)
        : job.faultyParts.reduce((s: any, f: any) => s + f.actualCost, 0);

    const labourTotal = job.faultyParts.reduce((s: any, f: any) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s: any, f: any) => s + f.discount, 0);
    const subtotal = partTotal + labourTotal - discountTotal;

    const labourCgst = 9;
    const labourSgst = 9;
    const cgst = Math.round(labourTotal * labourCgst / 100);
    const sgst = Math.round(labourTotal * labourSgst / 100);
    const totalGst = cgst + sgst;
    const grandTotal = subtotal + totalGst;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px 12px' }}>
            <div style={{ maxWidth: 850, margin: '0 auto' }}>
                <div className="no-print" style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', borderRadius: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 16 }}>
                        <SafetyCertificateOutlined style={{ color: '#4f46e5', fontSize: 18 }} />
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>LUXRE Official Invoice</span>
                    </div>
                </div>

                <Card id="invoice-content" style={{
                    cursor: 'default',
                    background: '#fff',
                    padding: '20px 15px',
                    border: '1px solid #000',
                    borderRadius: 0,
                    boxShadow: 'none'
                }}>
                    {/* Simple Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 20,
                        paddingBottom: 15,
                        borderBottom: '2px solid #000'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src="/logo1.jpeg" alt="LUXRE" style={{ height: 50, width: 50, objectFit: 'contain', border: '1px solid #ddd', padding: 3 }} />
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#000', marginBottom: 3 }}>LUXRE</h2>
                                <div style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>
                                    C-8 Ground Floor, Rewari Line, Industrial Area<br />
                                    Maya puri, New Delhi – 110064<br />
                                    GSTIN: 07AATCM8164B1Z6 | Ph: +91 98765 43210
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, marginBottom: 6 }}>TAX INVOICE</h1>
                            <div style={{ fontSize: 10, color: '#333' }}>
                                <strong>Invoice #:</strong> {job.jobId}<br />
                                <strong>Date:</strong> {new Date(job.date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 18, fontSize: 10 }}>
                        <div style={{ border: '1px solid #ddd', padding: 10 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 9, textTransform: 'uppercase' }}>Bill To:</div>
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{job.customerName}</div>
                            {job.customerId && <div>Customer ID: {job.customerId}</div>}
                            <div>Mobile: +91 {job.mobile}</div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: 10 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 9, textTransform: 'uppercase' }}>Vehicle:</div>
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{job.carModel}</div>
                            <div>Reg: {job.carNumber}</div>
                            <div>Current KM: {job.kmDriven.toLocaleString()}</div>
                            {job.mechanicName && <div>Mechanic: {job.mechanicName}</div>}
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 9 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                                <th style={{ padding: '5px 2px', textAlign: 'left', fontWeight: 700, width: '20px' }}>#</th>
                                <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: 700 }}>Description</th>
                                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 700, width: '30px' }}>Qty</th>
                                <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '60px' }}>Rate</th>
                                <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 700, width: '40px' }}>GST%</th>
                                <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '45px' }}>Disc</th>
                                <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '70px' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ backgroundColor: '#fafafa' }}>
                                <td colSpan={7} style={{ padding: '4px 2px', fontWeight: 700, fontSize: 8, borderBottom: '1px solid #ddd' }}>PARTS</td>
                            </tr>
                            {job.partsIssued && job.partsIssued.length > 0 ? (
                                job.partsIssued.map((part: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 4px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 9 }}>{part.partName}</div>
                                            <div style={{ fontSize: 7, color: '#666', marginTop: 1 }}>Part No: {part.partNumber}</div>
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: 8 }}>{part.quantityIssued}</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>₹{part.unitPrice.toLocaleString()}</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', color: '#0369a1', fontWeight: 600, fontSize: 8 }}>{part.gstPercent || 18}%</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>—</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>
                                            ₹{(part.unitPrice * part.quantityIssued).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                job.faultyParts.map((part: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 4px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 9 }}>{part.partName}</div>
                                            <div style={{ fontSize: 7, color: '#666', marginTop: 1 }}>{part.issueDescription}</div>
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: 8 }}>1</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>₹{part.actualCost.toLocaleString()}</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', color: '#0369a1', fontWeight: 600, fontSize: 8 }}>{part.procurementGST || 18}%</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', color: part.discount > 0 ? '#059669' : '#000', fontSize: 8 }}>
                                            {part.discount > 0 ? `-₹${part.discount}` : '—'}
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>
                                            ₹{(part.actualCost - part.discount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}

                            <tr style={{ backgroundColor: '#fafafa' }}>
                                <td colSpan={7} style={{ padding: '4px 2px', fontWeight: 700, fontSize: 8, borderTop: '1px solid #ccc', borderBottom: '1px solid #ddd' }}>LABOUR & SERVICES</td>
                            </tr>
                            {job.faultyParts.filter((p: any) => p.labourCharge > 0).map((part: any, idx: number) => (
                                <tr key={`labour-${idx}`} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                    <td style={{ padding: '4px 4px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 9 }}>Labour - {part.partName}</div>
                                    </td>
                                    <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: 8 }}>1</td>
                                    <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>₹{part.labourCharge.toLocaleString()}</td>
                                    <td style={{ padding: '4px 2px', textAlign: 'center', color: '#0369a1', fontWeight: 600, fontSize: 7, lineHeight: 1.3 }}>
                                        <div>C{labourCgst}%</div>
                                        <div>S{labourSgst}%</div>
                                    </td>
                                    <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>—</td>
                                    <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>
                                        ₹{part.labourCharge.toLocaleString()}
                                    </td>
                                </tr>
                            ))}

                            <tr style={{ borderTop: '2px solid #000', backgroundColor: '#f9f9f9' }}>
                                <td colSpan={6} style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 10 }}>Subtotal (Before Tax):</td>
                                <td style={{ padding: '6px 2px', textAlign: 'right', fontWeight: 700, fontSize: 10 }}>₹{subtotal.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totals Box */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <table style={{ width: '270px', borderCollapse: 'collapse', fontSize: 9, border: '1px solid #ddd' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 7px', fontWeight: 600 }}>Sub Total</td>
                                    <td style={{ padding: '4px 7px', textAlign: 'right' }}>₹ {subtotal.toLocaleString()}</td>
                                </tr>
                                {discountTotal > 0 && (
                                    <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 7px', fontWeight: 600 }}>Discount</td>
                                        <td style={{ padding: '4px 7px', textAlign: 'right', color: '#059669' }}>-₹ {discountTotal.toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 7px', fontWeight: 600 }}>CGST ({labourCgst}%)</td>
                                    <td style={{ padding: '4px 7px', textAlign: 'right' }}>₹ {cgst.toLocaleString()}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 7px', fontWeight: 600 }}>SGST ({labourSgst}%)</td>
                                    <td style={{ padding: '4px 7px', textAlign: 'right' }}>₹ {sgst.toLocaleString()}</td>
                                </tr>
                                <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000' }}>
                                    <td style={{ padding: '7px', fontWeight: 700, fontSize: 11 }}>GRAND TOTAL</td>
                                    <td style={{ padding: '7px', textAlign: 'right', fontWeight: 700, fontSize: 12 }}>₹ {grandTotal.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Signature */}
                    <div style={{ marginTop: 30, paddingTop: 15, borderTop: '1px solid #ddd', fontSize: 9 }}>
                        <div style={{ marginBottom: 25 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 10 }}>Terms & Conditions:</div>
                            <div style={{ color: '#555', lineHeight: 1.5 }}>
                                • Warranty: 30 days on parts replaced<br />
                                • Payment terms: Due on receipt<br />
                                • This is a system generated invoice and does not require signature
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 30 }}>
                            <div style={{ textAlign: 'center', minWidth: 180 }}>
                                <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontWeight: 600, fontSize: 10 }}>Customer Signature</div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 180 }}>
                                <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontWeight: 600, fontSize: 10 }}>
                                    Authorized Signatory<br /><span style={{ fontSize: 9, fontWeight: 400 }}>For LUXRE</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: 10, fontWeight: 600, color: '#000', lineHeight: 1.8 }}>
                            <div style={{ marginBottom: 8 }}>Vehicle has been received from workshop and work done as per my satisfaction</div>
                            <div>Payment received from customer, vehicle permitted to leave workshop</div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 6, color: '#888', fontSize: 8 }}>
                            Powered by SusaLabs | This is a computer generated invoice
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px dashed #ddd', paddingTop: 24 }}>
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            size="large"
                            onClick={() => window.print()}
                            style={{ height: 50, minWidth: 150 }}
                        >
                            Print Invoice
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            size="large"
                            onClick={handleDownloadPDF}
                            style={{ height: 50, minWidth: 150 }}
                        >
                            Download PDF
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
