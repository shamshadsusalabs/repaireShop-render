import { useEffect, useState } from 'react';
import { Card, Button, App, Spin, Modal, Radio, InputNumber } from 'antd';
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

    const [labourCgst, setLabourCgst] = useState<number>(9); // Independent CGST
    const [labourSgst, setLabourSgst] = useState<number>(9); // Independent SGST
    const [editableHsn, setEditableHsn] = useState<{ [key: string]: string }>({}); // Editable HSN for parts
    const [invoiceType, setInvoiceType] = useState<'Tax Invoice' | 'Performa'>('Tax Invoice');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);
    const [totalKmDriven, setTotalKmDriven] = useState<number>(0);

    // Add print styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print-input { display: none !important; }
                .print-only { display: inline !important; }
            }
            @media screen {
                .print-only { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        if (jobId) {
            fetchJobById(jobId);
            // Fetch customer KM history to calculate total KM driven
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
                    // Get the latest KM reading (total kilometers driven)
                    const latestKm = Math.max(...data.kmHistory.map((h: any) => h.km));
                    setTotalKmDriven(latestKm);
                }
            }
        } catch (error) {
            console.error('Error fetching customer KM history:', error);
        }
    };

    // Fetch KM history when job is loaded
    useEffect(() => {
        if (job?.mobile) {
            fetchCustomerKmHistory();
        }
    }, [job?.mobile]);

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

    // Get mechanic details
    const mechanic = mechanics.find(m => m._id === job.mechanicId);

    // Calculate totals based on issued parts (if available) or faulty parts
    const partTotal = job.partsIssued && job.partsIssued.length > 0
        ? job.partsIssued.reduce((s, p) => s + (p.unitPrice * p.quantityIssued), 0)
        : job.faultyParts.reduce((s, f) => s + f.actualCost, 0);
    
    const labourTotal = job.faultyParts.reduce((s, f) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s, f) => s + f.discount, 0);
    const subtotal = partTotal + labourTotal - discountTotal;
    
    // Calculate CGST and SGST independently for labour
    const cgst = Math.round(labourTotal * labourCgst / 100);
    const sgst = Math.round(labourTotal * labourSgst / 100);
    const totalGst = cgst + sgst;
    const grandTotal = subtotal + totalGst;

    return (
        <div className="fade-in-up">
            <div className="no-print" style={{ marginBottom: 16 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/job/${jobId}`)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Job</Button>

                <div className="page-header">
                    <h1>Invoice</h1>
                    <p>Generated invoice for <strong>{jobId}</strong></p>
                </div>
            </div>

            <Card id="invoice-content" className="invoice-container" style={{ 
                maxWidth: 850, 
                margin: '0 auto', 
                cursor: 'default',
                background: '#fff',
                padding: '20px 15px',
                border: '1px solid #000'
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
                        <img src="/logo1.jpeg" alt="LUXRE" style={{ 
                            height: 50, 
                            width: 50,
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            padding: 3
                        }} />
                        <div>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: 18, 
                                fontWeight: 700, 
                                color: '#000',
                                marginBottom: 3
                            }}>LUXRE</h2>
                            <div style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>
                                C-8 Ground Floor, Rewari Line, Industrial Area<br />
                                Maya puri, New Delhi – 110064<br />
                                GSTIN: 07AATCM8164B1Z6 | Ph: +91 98765 43210
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: 20, 
                            fontWeight: 700,
                            marginBottom: 6
                        }}>{invoiceType.toUpperCase()}</h1>
                        <div style={{ fontSize: 10, color: '#333' }}>
                            <strong>Invoice #:</strong> {job.jobId}<br />
                            <strong>Date:</strong> {new Date(job.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Customer & Vehicle Info - Simple Table Style */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 15,
                    marginBottom: 18,
                    fontSize: 10
                }}>
                    <div style={{ 
                        border: '1px solid #ddd',
                        padding: 10
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 9, textTransform: 'uppercase' }}>Bill To:</div>
                        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{job.customerName}</div>
                        {job.customerId && <div>Customer ID: {job.customerId}</div>}
                        <div>Mobile: +91 {job.mobile}</div>
                    </div>
                    <div style={{ 
                        border: '1px solid #ddd',
                        padding: 10
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 9, textTransform: 'uppercase' }}>Vehicle:</div>
                        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{job.carModel}</div>
                        <div>Reg: {job.carNumber}</div>
                        <div>Current KM: {job.kmDriven.toLocaleString()} | Total KM: {totalKmDriven > 0 ? totalKmDriven.toLocaleString() : job.kmDriven.toLocaleString()}</div>
                        {mechanic && <div>Mechanic: {mechanic.name}</div>}
                    </div>
                </div>

                {/* Parts & Labour Table - Workshop Style */}
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    marginBottom: 16,
                    fontSize: 9
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                            <th style={{ padding: '5px 2px', textAlign: 'left', fontWeight: 700, width: '20px' }}>#</th>
                            <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: 700 }}>Description</th>
                            <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 700, width: '55px' }}>HSN</th>
                            <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 700, width: '30px' }}>Qty</th>
                            <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '60px' }}>Rate</th>
                            <th style={{ padding: '5px 2px', textAlign: 'center', fontWeight: 700, width: '40px' }}>GST%</th>
                            <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '45px' }}>Disc</th>
                            <th style={{ padding: '5px 2px', textAlign: 'right', fontWeight: 700, width: '70px' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Parts Section - Show Issued Parts */}
                        <tr style={{ backgroundColor: '#fafafa' }}>
                            <td colSpan={8} style={{ padding: '4px 2px', fontWeight: 700, fontSize: 8, borderBottom: '1px solid #ddd' }}>PARTS</td>
                        </tr>
                        {job.partsIssued && job.partsIssued.length > 0 ? (
                            job.partsIssued.map((part, idx) => {
                                const hsnKey = `part-${idx}`;
                                const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : (part.hsnCode || '');
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 4px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 9 }}>{part.partName}</div>
                                            <div style={{ fontSize: 7, color: '#666', marginTop: 1 }}>Part No: {part.partNumber}</div>
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                                            <input
                                                type="text"
                                                value={currentHsn}
                                                onChange={(e) => setEditableHsn({ ...editableHsn, [hsnKey]: e.target.value })}
                                                style={{ 
                                                    width: '50px', 
                                                    fontSize: 8, 
                                                    padding: '2px', 
                                                    textAlign: 'center',
                                                    border: '1px solid #ddd',
                                                    borderRadius: 2
                                                }}
                                                className="no-print-input"
                                            />
                                            <span className="print-only" style={{ fontSize: 8 }}>{currentHsn || 'N/A'}</span>
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: 8 }}>{part.quantityIssued}</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>₹{part.unitPrice.toLocaleString()}</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center', color: '#0369a1', fontWeight: 600, fontSize: 8 }}>{part.gstPercent || 18}%</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontSize: 8 }}>—</td>
                                        <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>
                                            ₹{(part.unitPrice * part.quantityIssued).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            job.faultyParts.map((part, idx) => {
                                const hsnKey = `faulty-${idx}`;
                                const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : (part.hsnCode || '');
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 4px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 9 }}>{part.partName}</div>
                                            <div style={{ fontSize: 7, color: '#666', marginTop: 1 }}>{part.issueDescription}</div>
                                        </td>
                                        <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                                            <input
                                                type="text"
                                                value={currentHsn}
                                                onChange={(e) => setEditableHsn({ ...editableHsn, [hsnKey]: e.target.value })}
                                                style={{ 
                                                    width: '50px', 
                                                    fontSize: 8, 
                                                    padding: '2px', 
                                                    textAlign: 'center',
                                                    border: '1px solid #ddd',
                                                    borderRadius: 2
                                                }}
                                                className="no-print-input"
                                            />
                                            <span className="print-only" style={{ fontSize: 8 }}>{currentHsn || 'N/A'}</span>
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
                                );
                            })
                        )}
                        
                        {/* Labour Section - With HSN column */}
                        <tr style={{ backgroundColor: '#fafafa' }}>
                            <td colSpan={8} style={{ padding: '4px 2px', fontWeight: 700, fontSize: 8, borderTop: '1px solid #ccc', borderBottom: '1px solid #ddd' }}>LABOUR & SERVICES</td>
                        </tr>
                        {job.faultyParts.filter(p => p.labourCharge > 0).map((part, idx) => {
                            const hsnKey = `labour-${idx}`;
                            const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : '';
                            return (
                                <tr key={`labour-${idx}`} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 2px', textAlign: 'left', fontSize: 8 }}>{idx + 1}</td>
                                    <td style={{ padding: '4px 4px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 9 }}>Labour - {part.partName}</div>
                                    </td>
                                    <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                                        <input
                                            type="text"
                                            value={currentHsn}
                                            onChange={(e) => setEditableHsn({ ...editableHsn, [hsnKey]: e.target.value })}
                                            placeholder="HSN"
                                            style={{ 
                                                width: '50px', 
                                                fontSize: 8, 
                                                padding: '2px', 
                                                textAlign: 'center',
                                                border: '1px solid #ddd',
                                                borderRadius: 2
                                            }}
                                            className="no-print-input"
                                        />
                                        <span className="print-only" style={{ fontSize: 8 }}>{currentHsn || '—'}</span>
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
                            );
                        })}
                        
                        {/* Subtotal Row */}
                        <tr style={{ borderTop: '2px solid #000', backgroundColor: '#f9f9f9' }}>
                            <td colSpan={7} style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: 10 }}>
                                Subtotal (Before Tax):
                            </td>
                            <td style={{ padding: '6px 2px', textAlign: 'right', fontWeight: 700, fontSize: 10 }}>
                                ₹{subtotal.toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Total Section - Workshop Style */}
                <div style={{ marginBottom: 16 }}>
                    {/* Labour GST Adjusters - Left Side */}
                    <div className="no-print" data-html2canvas-ignore="true" style={{ 
                        display: 'flex',
                        gap: 10,
                        marginBottom: 10,
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ 
                            background: '#f0f9ff', 
                            padding: '6px 10px', 
                            border: '1px dashed #0ea5e9',
                            fontSize: 10
                        }}>
                            <span style={{ fontWeight: 600 }}>CGST %:</span>
                            <InputNumber
                                min={0}
                                max={100}
                                value={labourCgst}
                                onChange={(val) => setLabourCgst(val || 0)}
                                style={{ width: 55, marginLeft: 6 }}
                                size="small"
                            />
                        </div>
                        <div style={{ 
                            background: '#f0f9ff', 
                            padding: '6px 10px', 
                            border: '1px dashed #0ea5e9',
                            fontSize: 10
                        }}>
                            <span style={{ fontWeight: 600 }}>SGST %:</span>
                            <InputNumber
                                min={0}
                                max={100}
                                value={labourSgst}
                                onChange={(val) => setLabourSgst(val || 0)}
                                style={{ width: 55, marginLeft: 6 }}
                                size="small"
                            />
                        </div>
                    </div>

                    {/* Totals Table - Right Aligned */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <table style={{ 
                            width: '270px',
                            borderCollapse: 'collapse',
                            fontSize: 9,
                            border: '1px solid #ddd'
                        }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '4px 7px', fontWeight: 600 }}>Sub Total</td>
                                    <td style={{ padding: '4px 7px', textAlign: 'right' }}>₹ {subtotal.toLocaleString()}</td>
                                </tr>
                                {discountTotal > 0 && (
                                    <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                        <td style={{ padding: '4px 7px', fontWeight: 600 }}>Discount</td>
                                        <td style={{ padding: '4px 7px', textAlign: 'right', color: '#059669' }}>
                                            -₹ {discountTotal.toLocaleString()}
                                        </td>
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
                                    <td style={{ padding: '7px', textAlign: 'right', fontWeight: 700, fontSize: 12 }}>
                                        ₹ {grandTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Terms & Signature Section */}
                <div style={{ 
                    marginTop: 30,
                    paddingTop: 15,
                    borderTop: '1px solid #ddd',
                    fontSize: 9
                }}>
                    <div style={{ marginBottom: 25 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 10 }}>Terms & Conditions:</div>
                        <div style={{ color: '#555', lineHeight: 1.5 }}>
                            • Warranty: 30 days on parts replaced<br />
                            • Payment terms: Due on receipt<br />
                            • This is a system generated invoice and does not require signature
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: 30
                    }}>
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

                    <div style={{ 
                        textAlign: 'center', 
                        marginTop: 20,
                        paddingTop: 12,
                        borderTop: '1px solid #ddd',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#000',
                        lineHeight: 1.8
                    }}>
                        <div style={{ marginBottom: 8 }}>
                            Vehicle has been received from workshop and work done as per my satisfaction
                        </div>
                        <div>
                            Payment received from customer, vehicle permitted to leave workshop
                        </div>
                    </div>

                    <div style={{ 
                        textAlign: 'center', 
                        marginTop: 6,
                        color: '#888',
                        fontSize: 8
                    }}>
                        Powered by SusaLabs | This is a computer generated invoice
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
