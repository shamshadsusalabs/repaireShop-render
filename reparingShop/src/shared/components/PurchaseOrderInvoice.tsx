import { useEffect, useState } from 'react';
import { Card, Table, Button, Divider, App, Spin } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../admin/services/api';
import vendorApi from '../../vendor/services/vendorApi';
import type { PurchaseOrder } from '../../types';

interface PurchaseOrderInvoiceProps {
    role: 'store' | 'vendor';
}

export default function PurchaseOrderInvoice({ role }: PurchaseOrderInvoiceProps) {
    const { message } = App.useApp();
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                setLoading(true);
                // Call the respective endpoint based on the logged-in role
                const endpoint = role === 'store' ? `/store/orders/${orderId}` : `/vendor/orders/${orderId}`;
                const apiInstance = role === 'vendor' ? vendorApi : api;
                const res = await apiInstance.get(endpoint);
                setOrder(res.data.data);
            } catch (error: any) {
                message.error(error.response?.data?.message || 'Failed to fetch order details');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, role, navigate, message]);

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

            pdf.save(`PO_Invoice_${orderId || 'LUXRE'}.pdf`);
            message.success({ content: 'PDF downloaded!', key: 'pdf-gen' });
        } catch (error) {
            console.error('PDF Gen Error:', error);
            message.error({ content: 'Failed to generate PDF', key: 'pdf-gen' });
        }
    };

    if (loading || !order) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const BackPath = role === 'store' ? '/store/orders' : '/vendor/orders';

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
            render: () => (
                <div>
                    <div className="part-name" style={{ fontWeight: 700 }}>{order.partName}</div>
                    <div className="part-desc" style={{ fontSize: 12, color: '#94a3b8' }}>Part No: {order.partNumber || 'N/A'}</div>
                </div>
            ),
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 90,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: 120,
            render: (v: number) => `₹ ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Discount',
            dataIndex: 'discount',
            key: 'discount',
            width: 100,
            render: (v: number) => v > 0 ? <span style={{ color: '#10b981' }}>{v}%</span> : '—',
        },
        {
            title: 'GST',
            dataIndex: 'gstPercent',
            key: 'gstPercent',
            width: 80,
            render: (v: number) => `${v != null ? v : 18}%`,
        },
        {
            title: 'Total Line Cost',
            dataIndex: 'totalCost',
            key: 'totalCost',
            width: 130,
            render: (v: number) => <span style={{ fontWeight: 700 }}>₹ {v.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
        },
    ];

    const storeDetails = order.storeId as any;
    const actualVendorDetails = order.vendorId as any;

    const subtotal = order.unitPrice * order.quantity;
    const discountAmt = subtotal * ((order.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const gstPercent = order.gstPercent != null ? order.gstPercent : 18;
    const gstAmt = afterDiscount * (gstPercent / 100);

    return (
        <div className="fade-in-up">
            <div className="no-print">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(BackPath)} style={{ fontWeight: 600, marginBottom: 8 }}>Back to Orders</Button>

                <div className="page-header">
                    <h1>Purchase Order Invoice</h1>
                    <p>Generated invoice for Order <strong>#{order._id.substring(order._id.length - 8).toUpperCase()}</strong></p>
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
                            <h2 className="invoice-title" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>LUXRE Platform</h2>
                        </div>
                        <div className="invoice-addr" style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.8 }}>
                            B2B Parts Marketplace<br />
                            Generated on: {new Date().toLocaleDateString()}<br />
                        </div>
                    </div>

                    <div className="header-right" style={{ textAlign: 'right' }}>
                        <h1 style={{ margin: 0, color: '#ffffff', fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>PO INVOICE</h1>
                        <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                            <div>Order: <strong style={{ color: '#ffffff' }}>{order.orderNumber || order._id.substring(order._id.length - 8).toUpperCase()}</strong></div>
                            <div>Date: <strong style={{ color: '#ffffff' }}>{new Date(order.createdAt).toLocaleDateString()}</strong></div>
                        </div>
                    </div>
                </div>

                {/* Vendor & Store Info */}
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
                        <div className="info-label" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Supplier (Vendor)</div>
                        <div className="info-title" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{actualVendorDetails?.name}</div>
                        <div className="info-detail" style={{ color: '#64748b', fontSize: 13 }}>
                            Email: {actualVendorDetails?.email}<br />
                            Phone: {actualVendorDetails?.phone || 'N/A'}<br />
                            {actualVendorDetails?.address && <span>Address: {actualVendorDetails.address}</span>}
                        </div>
                    </div>
                    <div className="invoice-info-box" style={{
                        padding: '16px 20px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                    }}>
                        <div className="info-label" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bill To (Store)</div>
                        <div className="info-title" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{storeDetails?.name}</div>
                        <div className="info-detail" style={{ color: '#64748b', fontSize: 13 }}>
                            Email: {storeDetails?.email}<br />
                            Phone: {storeDetails?.phone || 'N/A'}<br />
                            {storeDetails?.address && <span>Address: {storeDetails.address}</span>}
                        </div>
                    </div>
                </div>

                {/* Parts Table */}
                <Table
                    dataSource={[order]}
                    columns={columns}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                />

                <Divider />

                {/* Total Section */}
                <div className="invoice-totals" style={{ maxWidth: 350, marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', color: '#64748b', fontSize: 13 }}>
                        <span>Subtotal</span>
                        <span>₹ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {order.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', color: '#10b981', fontSize: 13 }}>
                            <span>Discount ({order.discount}%)</span>
                            <span>-₹ {discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 13 }}>
                        <span>GST ({gstPercent}%)</span>
                        <span>₹ {gstAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grand-total-box" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        marginTop: 12,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
                        borderRadius: 12,
                        color: '#fff',
                    }}>
                        <span className="gt-label" style={{ fontSize: 18, fontWeight: 700 }}>Total Cost</span>
                        <span className="gt-value" style={{ fontSize: 24, fontWeight: 800 }}>₹ {order.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                    <div className="footer-title" style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Thank you for using the LUXRE Platform!</div>
                    <div className="footer-text" style={{ fontSize: 12, color: '#94a3b8' }}>
                        This is a computer generated invoice and does not require a physical signature.<br />
                        <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: 'block' }}>Powered by SusaLabs</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="no-print" data-html2canvas-ignore="true" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        size="large"
                        onClick={() => window.print()}
                        style={{ flex: 1, height: 50 }}
                    >
                        Print Invoice
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        size="large"
                        onClick={handleDownloadPDF}
                        style={{ flex: 1, height: 50 }}
                    >
                        Download PDF
                    </Button>
                </div>
            </Card>
        </div>
    );
}
