import { StyleSheet } from 'react-native';

// ─── Color Palette (matching web admin panel) ────────────────
export const colors = {
    primary: '#4f46e5',
    primaryDark: '#1e1b4b',
    primaryLight: '#eef2ff',

    // Gradient endpoints
    gradientStart: '#0f0a3c',
    gradientMid: '#1e1b4b',
    gradientEnd: '#4f46e5',

    // Neutrals
    white: '#ffffff',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Text
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textLight: '#cbd5e1',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',

    // Input
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
};

// ─── Status Color Map (matching web) ─────────────────────────
export const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    Assigned: '#3b82f6',
    Inspection: '#6366f1',
    Approval: '#a855f7',
    Approved: '#06b6d4',
    Rejected: '#ef4444',
    Repairing: '#3b82f6',
    Completed: '#10b981',
};

export const statusBgColors: Record<string, string> = {
    Pending: '#fef3c7',
    Assigned: '#dbeafe',
    Inspection: '#e0e7ff',
    Approval: '#f3e8ff',
    Approved: '#cffafe',
    Rejected: '#fee2e2',
    Repairing: '#dbeafe',
    Completed: '#d1fae5',
};

// ─── Common Styles ───────────────────────────────────────────
export const commonStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    input: {
        height: 52,
        borderRadius: 12,
        fontSize: 15,
        backgroundColor: colors.inputBg,
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        paddingHorizontal: 16,
        color: colors.textPrimary,
    },
    buttonPrimary: {
        height: 52,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    pageHeader: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        fontWeight: '500' as const,
    },
});
