import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';

type AppRole = 'mechanic' | 'driver' | 'manager';

export default function LoginScreen() {
    const { login, loading, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<AppRole>('mechanic');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        clearError();
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        const success = await login(email.trim(), password, selectedRole);
        if (!success) {
            const latestError = useAuthStore.getState().error;
            Alert.alert('Login Failed', latestError || 'Invalid email or password');
        }
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <View style={styles.bgGradient}>
                <View style={[styles.bgCircle, styles.bgCircleTopRight]} />
                <View style={[styles.bgCircle, styles.bgCircleBottomLeft]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {/* Login Card */}
                    <View style={styles.card}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                <Image 
                                    source={require('../../public/logo1.jpeg')} 
                                    style={styles.logoImage}
                                />
                            </View>
                            <Text style={styles.brandName}>LUXRE</Text>
                            <Text style={styles.brandSubtitle}>
                                Auto Repair Management
                            </Text>
                        </View>

                        {/* Role Selector */}
                        <Text style={styles.roleHeading}>Login as</Text>

                        {/* Role Selector */}
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    selectedRole === 'mechanic' && styles.roleButtonActive,
                                ]}
                                onPress={() => setSelectedRole('mechanic')}
                                activeOpacity={0.8}>
                                <Text style={styles.roleEmoji}>🔧</Text>
                                <Text
                                    style={[
                                        styles.roleText,
                                        selectedRole === 'mechanic' && styles.roleTextActive,
                                    ]}>
                                    Mechanic
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    selectedRole === 'driver' && styles.roleButtonActiveDriver,
                                ]}
                                onPress={() => setSelectedRole('driver')}
                                activeOpacity={0.8}>
                                <Text style={styles.roleEmoji}>🚛</Text>
                                <Text
                                    style={[
                                        styles.roleText,
                                        selectedRole === 'driver' && styles.roleTextActive,
                                    ]}>
                                    Driver
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    selectedRole === 'manager' && styles.roleButtonActiveManager,
                                ]}
                                onPress={() => setSelectedRole('manager')}
                                activeOpacity={0.8}>
                                <Text style={styles.roleEmoji}>👔</Text>
                                <Text
                                    style={[
                                        styles.roleText,
                                        selectedRole === 'manager' && styles.roleTextActive,
                                    ]}>
                                    Manager
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputIcon}>✉️</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Password"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}>
                                <Text style={styles.eyeIcon}>
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[
                                styles.signInButton,
                                selectedRole === 'driver' && styles.signInButtonDriver,
                                selectedRole === 'manager' && styles.signInButtonManager,
                                loading && styles.signInButtonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}>
                            {loading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.signInText}>
                                    Sign In as {selectedRole === 'mechanic' ? 'Mechanic' : selectedRole === 'manager' ? 'Manager' : 'Driver'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <Text style={styles.footer}>Powered by SusaLabs</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gradientStart,
    },
    bgGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.primaryDark,
    },
    bgCircle: {
        position: 'absolute',
        borderRadius: 200,
    },
    bgCircleTopRight: {
        top: -120,
        right: -120,
        width: 400,
        height: 400,
        backgroundColor: 'rgba(99,102,241,0.2)',
    },
    bgCircleBottomLeft: {
        bottom: -80,
        left: -80,
        width: 300,
        height: 300,
        backgroundColor: 'rgba(16,185,129,0.15)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
        overflow: 'hidden',
        padding: 8,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    logoEmoji: {
        fontSize: 36,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primaryDark,
        letterSpacing: -0.5,
    },
    brandSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    roleHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    // ─── Role Selector ──────────────────
    roleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    roleButtonActive: {
        backgroundColor: '#eef2ff',
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    roleButtonActiveDriver: {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    roleButtonActiveManager: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    roleEmoji: {
        fontSize: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
    },
    roleTextActive: {
        color: colors.textPrimary,
    },
    // ─── Inputs ─────────────────────────
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        paddingHorizontal: 14,
        marginBottom: 16,
        height: 52,
    },
    inputIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        height: '100%',
    },
    eyeButton: {
        padding: 4,
    },
    eyeIcon: {
        fontSize: 18,
    },
    signInButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    signInButtonDriver: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
    },
    signInButtonManager: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
    },
    signInButtonDisabled: {
        opacity: 0.7,
    },
    signInText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 12,
        color: colors.textLight,
    },
});
