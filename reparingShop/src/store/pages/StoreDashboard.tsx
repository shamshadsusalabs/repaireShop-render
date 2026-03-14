import { useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Tag, Progress } from 'antd';
import {
    AppstoreOutlined,
    InboxOutlined,
    WarningOutlined,
    StopOutlined,
    DollarOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import usePartStore from '../../admin/store/partStore';

// Format large numbers in Indian style: ₹1.4L, ₹12.5K, ₹85
const formatINR = (val: number): string => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString('en-IN')}`;
};

export default function StoreDashboard() {
    const { stats, fetchStats, loading } = usePartStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const statCards = [
        {
            title: 'Total Parts',
            value: stats?.totalParts || 0,
            icon: <AppstoreOutlined style={{ fontSize: 28, color: '#4f46e5' }} />,
            bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '#c7d2fe',
            onClick: () => navigate('/inventory'),
        },
        {
            title: 'Total Quantity',
            value: stats?.totalQuantity || 0,
            icon: <InboxOutlined style={{ fontSize: 28, color: '#0891b2' }} />,
            bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
            border: '#67e8f9',
        },
        {
            title: 'Low Stock',
            value: stats?.lowStockParts || 0,
            icon: <WarningOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
            bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '#fde68a',
            onClick: () => navigate('/inventory?filter=lowStock'),
        },
        {
            title: 'Out of Stock',
            value: stats?.outOfStock || 0,
            icon: <StopOutlined style={{ fontSize: 28, color: '#ef4444' }} />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: '#fca5a5',
            onClick: () => navigate('/inventory?filter=outOfStock'),
        },
        {
            title: 'Inventory Value (Cost)',
            value: stats?.totalCostValue || 0,
            isCurrency: true,
            icon: <DollarOutlined style={{ fontSize: 28, color: '#10b981' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#6ee7b7',
        },
        {
            title: 'Inventory Value (Sell)',
            value: stats?.totalSellValue || 0,
            isCurrency: true,
            icon: <RiseOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />,
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '#c4b5fd',
        },
    ];

    const categoryColors: Record<string, string> = {
        Engine: '#ef4444',
        Brake: '#f59e0b',
        Suspension: '#10b981',
        Electrical: '#3b82f6',
        Body: '#8b5cf6',
        Transmission: '#ec4899',
        'AC & Cooling': '#06b6d4',
        'Tyre & Wheel': '#84cc16',
        'Oil & Fluids': '#f97316',
        Filter: '#14b8a6',
        Battery: '#fbbf24',
        Lights: '#a855f7',
        Interior: '#6366f1',
        Exhaust: '#78716c',
        Steering: '#e11d48',
        Other: '#94a3b8',
    };

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1>🏪 Store Dashboard</h1>
                <p>Manage your parts inventory — track stock, upload parts, and monitor categories</p>
            </div>

            <Spin spinning={loading}>
                {/* Stats Row */}
                <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
                    {statCards.map((stat, i) => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                            <Card
                                className="stat-card"
                                style={{
                                    background: stat.bg,
                                    borderColor: stat.border,
                                    cursor: stat.onClick ? 'pointer' : 'default',
                                    minWidth: 0,
                                }}
                                onClick={stat.onClick}
                                hoverable={!!stat.onClick}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#475569', fontSize: 13, marginBottom: 6 }}>
                                            {stat.title}
                                        </div>
                                        {stat.isCurrency ? (
                                            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                                {formatINR(stat.value as number)}
                                            </div>
                                        ) : (
                                            <Statistic
                                                value={stat.value}
                                                valueStyle={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}
                                            />
                                        )}
                                    </div>
                                    <div style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 14,
                                        background: 'rgba(255,255,255,0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(10px)',
                                        flexShrink: 0,
                                        marginLeft: 8,
                                    }}>
                                        {stat.icon}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Category Distribution */}
                <Row gutter={[20, 20]}>
                    <Col xs={24} lg={14}>
                        <Card
                            title={
                                <span style={{ fontSize: 18, fontWeight: 700 }}>
                                    <AppstoreOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                                    Category Distribution
                                </span>
                            }
                            style={{ cursor: 'default' }}
                        >
                            {stats?.categoryStats && stats.categoryStats.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {stats.categoryStats.map((cat) => {
                                        const maxCount = Math.max(...stats.categoryStats.map(c => c.count));
                                        const percent = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                                        return (
                                            <div key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 120, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                                                    {cat._id}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <Progress
                                                        percent={Math.round(percent)}
                                                        strokeColor={categoryColors[cat._id] || '#94a3b8'}
                                                        showInfo={false}
                                                        size="small"
                                                    />
                                                </div>
                                                <Tag
                                                    style={{
                                                        borderRadius: 8,
                                                        fontWeight: 700,
                                                        minWidth: 50,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {cat.count} parts
                                                </Tag>
                                                <Tag
                                                    color="blue"
                                                    style={{ borderRadius: 8, fontWeight: 600, minWidth: 60, textAlign: 'center' }}
                                                >
                                                    Qty: {cat.totalQty}
                                                </Tag>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                    <InboxOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                                    <p>No parts in inventory yet. Upload parts to see category distribution.</p>
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card
                            title={
                                <span style={{ fontSize: 18, fontWeight: 700 }}>
                                    📊 Quick Actions
                                </span>
                            }
                            style={{ cursor: 'default' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Card
                                    hoverable
                                    onClick={() => navigate('/parts-requests')}
                                    style={{
                                        background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                                        border: '1px solid #fca5a5',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 14,
                                            background: 'rgba(239,68,68,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24,
                                        }}>🔧</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#991b1b' }}>Parts Requests</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Approved jobs needing parts from inventory</div>
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    hoverable
                                    onClick={() => navigate('/upload')}
                                    style={{
                                        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                        border: '1px solid #93c5fd',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 14,
                                            background: 'rgba(59,130,246,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24,
                                        }}>📤</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a5f' }}>Upload Parts (Excel)</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Bulk upload parts from spreadsheet</div>
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    hoverable
                                    onClick={() => navigate('/inventory')}
                                    style={{
                                        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                        border: '1px solid #6ee7b7',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 14,
                                            background: 'rgba(16,185,129,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24,
                                        }}>📋</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#065f46' }}>View All Inventory</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Search, filter, and manage all parts</div>
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    hoverable
                                    onClick={() => navigate('/inventory?filter=lowStock')}
                                    style={{
                                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                        border: '1px solid #fcd34d',
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 14,
                                            background: 'rgba(245,158,11,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24,
                                        }}>⚠️</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#92400e' }}>Low Stock Alerts</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                                {stats?.lowStockParts || 0} parts below minimum stock level
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
}
