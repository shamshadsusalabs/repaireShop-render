import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Spin, Alert } from 'antd';
import { ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import vendorApi from '../services/vendorApi';

const { Title } = Typography;

export default function VendorDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        orders: 0,
        revenue: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const ordersRes = await vendorApi.get('/vendor/orders');

                const orders = ordersRes.data.data;
                const revenue = orders.reduce((sum: number, o: any) => sum + o.totalCost, 0);

                setStats({
                    orders: ordersRes.data.count,
                    revenue,
                });
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load dashboard metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

    return (
        <div>
            <Title level={2}>Vendor Dashboard</Title>

            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 20 }} />}

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Orders"
                            value={stats.orders}
                            prefix={<ShoppingCartOutlined style={{ color: '#059669' }} />}
                            valueStyle={{ color: '#059669', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title="Total Revenue"
                            value={`₹${stats.revenue.toFixed(2)}`}
                            prefix={<DollarOutlined style={{ color: '#d97706' }} />}
                            valueStyle={{ color: '#d97706', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>

            </Row>
        </div>
    );
}
