import { Layout, Menu, Tag } from 'antd';
import {
    DashboardOutlined,
    CloudUploadOutlined,
    AppstoreOutlined,
    LogoutOutlined,
    DownloadOutlined,
    ToolOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../admin/store/authStore';

const { Sider, Content } = Layout;

export default function StoreLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const handleLogout = async () => {
        await logout();
    };

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/parts-requests',
            icon: <ToolOutlined />,
            label: 'Parts Requests',
        },
        {
            key: '/inventory',
            icon: <AppstoreOutlined />,
            label: 'All Inventory',
        },
        {
            key: '/upload',
            icon: <CloudUploadOutlined />,
            label: 'Upload Parts',
        },
        // {
        //     key: '/browse-vendors',
        //     icon: <ShopOutlined />,
        //     label: 'Browse Vendors',
        // },
        {
            key: '/store-orders',
            icon: <ShoppingCartOutlined />,
            label: 'Purchase Orders',
        },
        {
            key: '/template',
            icon: <DownloadOutlined />,
            label: 'Download Template',
        },
    ];

    const getSelectedKey = () => {
        if (location.pathname === '/' || location.pathname === '/dashboard') return '/';
        if (location.pathname === '/parts-requests') return '/parts-requests';
        if (location.pathname === '/inventory') return '/inventory';
        if (location.pathname === '/upload') return '/upload';
        if (location.pathname === '/browse-vendors') return '/browse-vendors';
        if (location.pathname === '/store-orders') return '/store-orders';
        return '/';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={260}
                breakpoint="lg"
                collapsedWidth="0"
                style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
            >
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <img src="/logo1.jpeg" alt="LUXRE" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                    </div>
                    <div className="sidebar-logo-text">
                        <h3>LUXRE</h3>
                        <span>Store Panel</span>
                    </div>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    onClick={({ key }) => {
                        if (key === '/template') {
                            // Will be handled by the dashboard
                            navigate('/upload');
                            return;
                        }
                        navigate(key);
                    }}
                    style={{ marginTop: 8 }}
                />

                <div style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 0,
                    right: 0,
                    padding: '0 20px',
                }}>
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                        }}>🏪</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{user?.name || 'Store'}</div>
                            <div style={{ fontSize: 11 }}>{user?.email || ''}</div>
                        </div>
                        <Tag color="cyan" style={{ marginRight: 0, borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            STORE
                        </Tag>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 10,
                            color: '#fca5a5',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                        }}
                    >
                        <LogoutOutlined /> Logout
                    </button>
                </div>
            </Sider>

            <Layout style={{ marginLeft: 260 }}>
                <Content style={{ padding: '28px 32px', minHeight: '100vh' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
