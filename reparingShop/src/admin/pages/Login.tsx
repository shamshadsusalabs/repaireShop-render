import { Form, Input, Button, App, Card, Select } from 'antd';
import {
    MailOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';

const roleOptions = [
    { value: 'admin', label: '👑 Admin', icon: '👑' },
    { value: 'manager', label: '📋 Manager', icon: '📋' },
    { value: 'store', label: '🏪 Store', icon: '🏪' },
    { value: 'accountant', label: '💰 Accountant', icon: '💰' },
    { value: 'receptionist', label: '🛎️ Receptionist', icon: '🛎️' },
];

export default function Login() {
    const { message } = App.useApp();
    const { login, loading, clearError } = useAuthStore();

    const onFinish = async (values: { email: string; password: string; role: string }) => {
        clearError();
        const success = await login(values.email, values.password, values.role);
        if (success) {
            message.success(`Welcome back!`);
        } else {
            // Re-read latest error from the store
            const latestError = useAuthStore.getState().error;
            message.error(latestError || 'Invalid email or password!');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0a3c 0%, #1e1b4b 30%, #312e81 60%, #4f46e5 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: -120,
                right: -120,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
            }} />
            <div style={{
                position: 'absolute',
                bottom: -80,
                left: -80,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
            }} />

            <Card style={{
                width: 420,
                borderRadius: 20,
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                background: 'rgba(255,255,255,0.97)',
                cursor: 'default',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        height: 70,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <img src="/logo1.jpeg" alt="LUXRE" style={{ height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: '#1e1b4b',
                        margin: '0 0 4px 0',
                        letterSpacing: -0.5,
                    }}>
                        LUXRE
                    </h1>
                    <p style={{
                        fontSize: 14,
                        color: '#94a3b8',
                        margin: 0,
                        fontWeight: 500,
                    }}>
                        Car Repair Workshop Management
                    </p>
                </div>

                {/* Login Form */}
                <Form
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                    requiredMark={false}
                    initialValues={{ email: '', password: '', role: 'admin' }}
                >
                    {/* Role Dropdown */}
                    <Form.Item
                        name="role"
                        rules={[{ required: true, message: 'Please select your role' }]}
                    >
                        <Select
                            placeholder="Select Role"
                            options={roleOptions}
                            style={{
                                height: 50,
                            }}
                            classNames={{ popup: { root: 'role-select-popup' } }}
                            suffixIcon={<UserOutlined style={{ color: '#94a3b8', fontSize: 16 }} />}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                            placeholder="Email Address"
                            style={{
                                height: 50,
                                borderRadius: 12,
                                fontSize: 15,
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                            placeholder="Password"
                            iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            style={{
                                height: 50,
                                borderRadius: 12,
                                fontSize: 15,
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                            }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            style={{
                                height: 52,
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
                                border: 'none',
                                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)',
                            }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{
                    textAlign: 'center',
                    marginTop: 20,
                    fontSize: 12,
                    color: '#cbd5e1',
                }}>
                    <div>© 2026 LUXRE. All rights reserved.</div>
                    <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>Powered by SusaLabs</div>
                </div>
            </Card>
        </div>
    );
}
