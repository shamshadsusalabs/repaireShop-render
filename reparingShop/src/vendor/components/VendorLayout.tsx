import React from 'react';
import { Layout, Menu, Button, Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    ShoppingCartOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import useVendorAuthStore from '../store/vendorAuthStore';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function VendorLayout() {
    const [collapsed, setCollapsed] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useVendorAuthStore();

    const handleMenuClick = (info: any) => {
        navigate(info.key);
    };

    const menuItems = [
        {
            key: '/vendor',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/vendor/orders',
            icon: <ShoppingCartOutlined />,
            label: 'Purchase Orders',
        },
    ];

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: async () => {
                await logout();
                navigate('/');
            },
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                breakpoint="lg"
                onBreakpoint={(broken) => {
                    setCollapsed(broken);
                }}
                style={{
                    background: '#0f172a',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                    zIndex: 10,
                }}
                width={250}
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Title level={4} style={{ color: 'white', margin: 0 }}>
                        {collapsed ? 'VR' : 'Vendor Portal'}
                    </Title>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={menuItems}
                    style={{ background: 'transparent', borderRight: 0 }}
                />
            </Sider>

            <Layout style={{ background: '#f8fafc' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 9,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: '16px', width: 64, height: 64 }}
                        />
                        <Title level={4} style={{ margin: 0 }}>
                            LUXRE
                        </Title>
                    </div>

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                                <Text strong>{user?.name}</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Vendor
                                </Text>
                            </div>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#e0e7ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    color: '#4f46e5',
                                }}
                            >
                                {user?.avatar || '👤'}
                            </div>
                        </div>
                    </Dropdown>
                </Header>

                <Content style={{ margin: '24px', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
