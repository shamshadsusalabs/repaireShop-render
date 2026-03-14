import { useState } from 'react';
import { Form, Input, Button, App, Card, Tabs } from 'antd';
import {
    MailOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    PhoneOutlined,
    BankOutlined,
    HomeOutlined,
    UserOutlined,
} from '@ant-design/icons';
import useVendorAuthStore from '../store/vendorAuthStore';

export default function VendorLogin() {
    const { message } = App.useApp();
    const { login, register, loading, clearError } = useVendorAuthStore();
    const [activeTab, setActiveTab] = useState('login');

    const onLoginFinish = async (values: { email: string; password: string }) => {
        clearError();
        const success = await login(values.email, values.password);
        if (success) {
            message.success('Welcome back!');
        } else {
            const latestError = useVendorAuthStore.getState().error;
            message.error(latestError || 'Invalid email or password!');
        }
    };

    const onRegisterFinish = async (values: any) => {
        clearError();
        const success = await register({
            name: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone,
            gstNumber: values.gstNumber,
            companyName: values.companyName,
            address: values.address,
        });
        if (success) {
            message.success('Registration successful! Welcome!');
        } else {
            const latestError = useVendorAuthStore.getState().error;
            message.error(latestError || 'Registration failed!');
        }
    };

    const inputStyle = {
        height: 48,
        borderRadius: 12,
        fontSize: 14,
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0c2a1a 0%, #14532d 30%, #166534 60%, #059669 100%)',
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
                background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
            }} />
            <div style={{
                position: 'absolute',
                bottom: -80,
                left: -80,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)',
            }} />

            <Card style={{
                width: 460,
                borderRadius: 20,
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                background: 'rgba(255,255,255,0.97)',
                cursor: 'default',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        fontSize: 48,
                        marginBottom: 12,
                    }}>🚚</div>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: '#14532d',
                        margin: '0 0 4px 0',
                        letterSpacing: -0.5,
                    }}>
                        Vendor Portal
                    </h1>
                    <p style={{
                        fontSize: 13,
                        color: '#94a3b8',
                        margin: 0,
                        fontWeight: 500,
                    }}>
                        LUXRE — Parts Supplier Management
                    </p>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    centered
                    items={[
                        {
                            key: 'login',
                            label: 'Sign In',
                            children: (
                                <Form
                                    layout="vertical"
                                    onFinish={onLoginFinish}
                                    size="large"
                                    requiredMark={false}
                                    initialValues={{ email: '', password: '' }}
                                >
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
                                            style={inputStyle}
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
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            style={{
                                                height: 50,
                                                borderRadius: 12,
                                                fontSize: 16,
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #14532d 0%, #059669 100%)',
                                                border: 'none',
                                                boxShadow: '0 6px 20px rgba(5, 150, 105, 0.4)',
                                            }}
                                        >
                                            {loading ? 'Signing In...' : 'Sign In'}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: 'register',
                            label: 'Sign Up',
                            children: (
                                <Form
                                    layout="vertical"
                                    onFinish={onRegisterFinish}
                                    size="large"
                                    requiredMark={false}
                                >
                                    <Form.Item
                                        name="name"
                                        rules={[{ required: true, message: 'Please enter your name' }]}
                                    >
                                        <Input
                                            prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="Full Name"
                                            style={inputStyle}
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
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            { required: true, message: 'Please enter a password' },
                                            { min: 6, message: 'Password must be at least 6 characters' },
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="Password"
                                            iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item name="phone">
                                        <Input
                                            prefix={<PhoneOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="Phone Number"
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item name="gstNumber">
                                        <Input
                                            prefix={<BankOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="GST Number"
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item name="companyName">
                                        <Input
                                            prefix={<BankOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="Company Name"
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item name="address">
                                        <Input
                                            prefix={<HomeOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                                            placeholder="Address"
                                            style={inputStyle}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            style={{
                                                height: 50,
                                                borderRadius: 12,
                                                fontSize: 16,
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #14532d 0%, #059669 100%)',
                                                border: 'none',
                                                boxShadow: '0 6px 20px rgba(5, 150, 105, 0.4)',
                                            }}
                                        >
                                            {loading ? 'Registering...' : 'Create Account'}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                    ]}
                />

                <div style={{
                    textAlign: 'center',
                    marginTop: 16,
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
