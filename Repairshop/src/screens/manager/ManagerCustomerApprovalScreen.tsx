import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking,
    Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import { colors, commonStyles } from '../../theme';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerCustomerApprovalScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { currentJob: job, loading, fetchJobById, customerApproval } = useJobStore();
    const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null);

    useEffect(() => {
        fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    useEffect(() => {
        if (job) {
            if (job.approved === true) setDecided('approved');
            else if (job.approved === false) setDecided('rejected');
        }
    }, [job]);

    const totals = useMemo(() => {
        if (!job) return { partTotal: 0, labourTotal: 0, subtotal: 0, gst: 0, grandTotal: 0 };
        const partTotal = job.faultyParts.reduce((sum, f) => sum + f.estimatedCost, 0);
        const labourTotal = job.faultyParts.reduce((sum, f) => sum + f.labourCharge, 0);
        const subtotal = partTotal + labourTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, subtotal, gst, grandTotal };
    }, [job]);

    const handleWhatsAppShare = () => {
        if (!job) return;
        const messageText = `Hello ${job.customerName}, please review the repair estimate for your vehicle (${job.carNumber}). Total: ₹${totals.grandTotal.toLocaleString()} (incl. GST).`;
        const whatsappUrl = `https://wa.me/91${job.mobile}?text=${encodeURIComponent(messageText)}`;
        Linking.openURL(whatsappUrl);
    };

    const handleShareLink = async () => {
        if (!job) return;
        try {
            await Share.share({
                message: `Repair estimate for ${job.carModel} (${job.carNumber})\nCustomer: ${job.customerName}\nTotal: ₹${totals.grandTotal.toLocaleString()}\n\nJob ID: ${job.jobId}`,
            });
        } catch {
            // User cancelled
        }
    };

    const handleApprove = () => {
        Alert.alert(
            'Approve Repair',
            `Approve repair for ${jobId}? Grand Total: ₹${totals.grandTotal.toLocaleString()}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await customerApproval(jobId, true);
                            setDecided('approved');
                            Alert.alert('Success', 'Customer approved! Store will now issue parts.');
                        } catch {
                            Alert.alert('Error', 'Failed to update approval');
                        }
                    },
                },
            ],
        );
    };

    const handleReject = () => {
        Alert.alert(
            'Reject Repair',
            `Are you sure to reject repair for ${jobId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await customerApproval(jobId, false);
                            setDecided('rejected');
                            Alert.alert('Rejected', 'Customer rejected the repair.');
                        } catch {
                            Alert.alert('Error', 'Failed to update approval');
                        }
                    },
                },
            ],
        );
    };

    if (loading || !job) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Result screens
    if (decided === 'approved') {
        return (
            <View style={[styles.center, { padding: 30 }]}>
                <View style={styles.resultIcon}>
                    <Icon name="check-circle" size={64} color={colors.success} />
                </View>
                <Text style={styles.resultTitle}>Customer Approved! ✅</Text>
                <Text style={styles.resultSubtitle}>
                    Grand Total: ₹{totals.grandTotal.toLocaleString()} (incl. GST){'\n'}
                    Store will now issue parts.
                </Text>
                <TouchableOpacity
                    style={[commonStyles.buttonPrimary, { marginTop: 24, width: '100%' }]}
                    onPress={() => navigation.navigate('ManagerJobDetails', { jobId })}
                >
                    <Text style={commonStyles.buttonText}>View Job</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.secondaryBtn, { marginTop: 12, width: '100%' }]}
                    onPress={() => navigation.navigate('ManagerDashboard')}
                >
                    <Text style={styles.secondaryBtnText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (decided === 'rejected') {
        return (
            <View style={[styles.center, { padding: 30 }]}>
                <View style={styles.resultIcon}>
                    <Icon name="close-circle" size={64} color={colors.danger} />
                </View>
                <Text style={[styles.resultTitle, { color: colors.danger }]}>Customer Rejected ❌</Text>
                <Text style={styles.resultSubtitle}>
                    The customer has declined the repair for {jobId}.
                </Text>
                <TouchableOpacity
                    style={[commonStyles.buttonPrimary, { marginTop: 24, width: '100%' }]}
                    onPress={() => navigation.navigate('ManagerDashboard')}
                >
                    <Text style={commonStyles.buttonText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            {/* Customer & Car Info */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Icon name="account" size={18} color={colors.primary} />
                    <View>
                        <Text style={styles.infoSmall}>CUSTOMER</Text>
                        <Text style={styles.infoName}>{job.customerName}</Text>
                    </View>
                </View>
                <View style={styles.infoItem}>
                    <Icon name="car" size={18} color={colors.primary} />
                    <View>
                        <Text style={styles.infoSmall}>VEHICLE</Text>
                        <Text style={styles.infoName}>{job.carModel}</Text>
                    </View>
                </View>
            </View>

            {/* Parts Table */}
            {job.faultyParts.map((part, i) => (
                <View key={i} style={styles.partRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.partName}>{part.partName}</Text>
                        <Text style={styles.partIssue}>{part.issueDescription}</Text>
                    </View>
                    <View style={styles.partCosts}>
                        <Text style={styles.partCostLabel}>Part: ₹{part.estimatedCost.toLocaleString()}</Text>
                        <Text style={styles.partCostLabel}>Labour: ₹{part.labourCharge.toLocaleString()}</Text>
                        <Text style={styles.partTotal}>
                            ₹{(part.estimatedCost + part.labourCharge).toLocaleString()}
                        </Text>
                    </View>
                </View>
            ))}

            {/* Cost Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Parts Total</Text>
                    <Text style={styles.summaryValue}>₹ {totals.partTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Labour Total</Text>
                    <Text style={styles.summaryValue}>₹ {totals.labourTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GST (18%)</Text>
                    <Text style={styles.summaryValue}>₹ {totals.gst.toLocaleString()}</Text>
                </View>
                <View style={styles.grandTotalBox}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹ {totals.grandTotal.toLocaleString()}</Text>
                </View>
            </View>

            {/* Share Section */}
            <View style={styles.shareSection}>
                <View style={styles.shareHeader}>
                    <Icon name="share-variant" size={18} color="#16a34a" />
                    <Text style={styles.shareTitle}>Share with Customer</Text>
                </View>
                <View style={styles.shareButtons}>
                    <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
                        <Icon name="whatsapp" size={18} color="#fff" />
                        <Text style={styles.whatsappText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink}>
                        <Icon name="share" size={18} color={colors.primary} />
                        <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={handleApprove}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Icon name="check" size={20} color={colors.white} />
                            <Text style={styles.approveBtnText}>✓ Approve</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={handleReject}
                    disabled={loading}
                >
                    <Icon name="close" size={20} color={colors.danger} />
                    <Text style={styles.rejectBtnText}>✗ Reject</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    container: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    infoItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
    },
    infoSmall: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.5,
    },
    infoName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    partRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    partName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    partIssue: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    partCosts: {
        alignItems: 'flex-end',
    },
    partCostLabel: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    partTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 2,
    },
    summaryCard: {
        ...commonStyles.card,
        marginTop: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    grandTotalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e1b4b',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
    },
    shareSection: {
        backgroundColor: '#f0fdf4',
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    shareTitle: {
        fontWeight: '600',
        color: '#15803d',
        fontSize: 14,
    },
    shareButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    whatsappBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    whatsappText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    shareBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    shareBtnText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    approveBtn: {
        flex: 1,
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    approveBtnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    rejectBtn: {
        flex: 1,
        height: 54,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.danger,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    rejectBtnText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: '700',
    },
    resultIcon: {
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    resultSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    secondaryBtn: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
