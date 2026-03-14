import { Layout, Menu, Tag } from 'antd';
import {
    SearchOutlined,
    LogoutOutlined,
    WhatsAppOutlined,
    TeamOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../admin/store/authStore';

const { Sider, Content } = Layout;

export default function ReceptionistLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const handleLogout = async () => {
        await logout();
    };

    const menuItems = [
        {
            key: '/',
            icon: <SearchOutlined />,
            label: 'Search Records',
        },
        {
            key: '/send-notification',
            icon: <WhatsAppOutlined />,
            label: 'Send Notification',
        },
        {
            key: '/whatsapp-groups',
            icon: <TeamOutlined />,
            label: 'WhatsApp Groups',
        },
        {
            key: '/whatsapp-templates',
            icon: <FileTextOutlined />,
            label: 'WA Templates',
        },
    ];

    const getSelectedKey = () => {
        if (location.pathname === '/send-notification') return '/send-notification';
        if (location.pathname === '/whatsapp-groups') return '/whatsapp-groups';
        if (location.pathname === '/whatsapp-templates') return '/whatsapp-templates';
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
                        <span>Reception</span>
                    </div>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    onClick={({ key }) => {
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
                        }}>🛎️</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{user?.name || 'Receptionist'}</div>
                            <div style={{ fontSize: 11 }}>{user?.email || ''}</div>
                        </div>
                        <Tag color="magenta" style={{ marginRight: 0, borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            RECEPTION
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
