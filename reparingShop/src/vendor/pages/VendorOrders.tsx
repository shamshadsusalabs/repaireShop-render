import { useState, useEffect } from 'react';
import { Table, Tag, message, Typography, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import vendorApi from '../services/vendorApi';
import type { PurchaseOrder } from '../../types';

const { Title, Text } = Typography;

export default function VendorOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await vendorApi.get('/vendor/orders');
            setOrders(res.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);


    const columns = [
        {
            title: 'Order ID',
            dataIndex: '_id',
            key: '_id',
            width: 100,
            render: (text: string) => <Tag>{text.substring(text.length - 6).toUpperCase()}</Tag>,
        },
        {
            title: 'Store',
            dataIndex: ['storeId', 'name'],
            key: 'store',
        },
        {
            title: 'Part',
            dataIndex: 'partName',
            key: 'partName',
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 60,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            render: (v: number) => `₹${v.toLocaleString()}`,
        },
        {
            title: 'GST%',
            dataIndex: 'gstPercent',
            key: 'gstPercent',
            width: 70,
            render: (v: number) => `${v || 18}%`,
        },
        {
            title: 'Total (₹)',
            dataIndex: 'totalCost',
            key: 'totalCost',
            render: (cost: number) => <Text strong>₹{cost.toFixed(2)}</Text>,
        },

        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: PurchaseOrder) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/vendor/order-invoice/${record._id}`)}
                    size="small"
                >
                    Invoice
                </Button>
            ),
        },
    ];

    return (
        <div>
            <Title level={2} style={{ marginBottom: 24 }}>Purchase Orders</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                View all purchase orders placed by stores
            </Text>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                loading={loading}
                style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            />
        </div>
    );
}
