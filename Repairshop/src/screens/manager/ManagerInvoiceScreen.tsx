import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Share,
    TouchableOpacity,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import { colors, commonStyles } from '../../theme';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerInvoiceScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { currentJob: job, loading, fetchJobById } = useJobStore();

    useEffect(() => {
        fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    if (loading || !job) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const mechanic = job.mechanicId && typeof job.mechanicId === 'object' ? job.mechanicId : null;

    const partTotal = job.faultyParts.reduce((s, f) => s + f.actualCost, 0);
    const labourTotal = job.faultyParts.reduce((s, f) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s, f) => s + f.discount, 0);
    const subtotal = partTotal + labourTotal - discountTotal;
    const gst = Math.round(subtotal * (job.gstPercent || 18) / 100);
    const grandTotal = subtotal + gst;

    const handleShare = async () => {
        try {
            let text = `🔧 SusaLabs Invoice\n`;
            text += `Invoice #: ${job.jobId}\n`;
            text += `Date: ${new Date(job.date).toLocaleDateString('en-IN')}\n\n`;
            text += `Customer: ${job.customerName}\n`;
            text += `Mobile: +91 ${job.mobile}\n`;
            text += `Vehicle: ${job.carModel} (${job.carNumber})\n`;
            text += `KM: ${job.kmDriven?.toLocaleString()}\n\n`;
            text += `--- Items ---\n`;
            job.faultyParts.forEach((p, i) => {
                const lineTotal = p.actualCost + p.labourCharge - p.discount;
                text += `${i + 1}. ${p.partName}: ₹${lineTotal.toLocaleString()}\n`;
            });
            text += `\nParts: ₹${partTotal.toLocaleString()}\n`;
            text += `Labour: ₹${labourTotal.toLocaleString()}\n`;
            if (discountTotal > 0) text += `Discount: -₹${discountTotal.toLocaleString()}\n`;
            text += `GST (${job.gstPercent || 18}%): ₹${gst.toLocaleString()}\n`;
            text += `\n💰 Grand Total: ₹${grandTotal.toLocaleString()}\n`;
            text += `\nThank you for choosing SusaLabs!`;

            await Share.share({ message: text });
        } catch {
            // User cancelled
        }
    };

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
                <View>
                    <Text style={styles.companyName}>🔧 SusaLabs</Text>
                    <Text style={styles.companyInfo}>
                        123, Workshop Lane{'\n'}Industrial Area, New Delhi{'\n'}
                        +91 98765 43210
                    </Text>
                </View>
                <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <Text style={styles.invoiceId}>#{job.jobId}</Text>
                    <Text style={styles.invoiceDate}>
                        {new Date(job.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
            </View>

            {/* Customer & Car Info */}
            <View style={styles.infoCards}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>BILL TO</Text>
                    <Text style={styles.infoCardName}>{job.customerName}</Text>
                    <Text style={styles.infoCardSub}>+91 {job.mobile}</Text>
                </View>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>VEHICLE</Text>
                    <Text style={styles.infoCardName}>{job.carModel}</Text>
                    <Text style={styles.infoCardSub}>
                        {job.carNumber} • {job.kmDriven?.toLocaleString()} km
                    </Text>
                    {mechanic && (
                        <Text style={styles.infoCardSub}>Mechanic: {mechanic.name}</Text>
                    )}
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Cost</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Labour</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
            </View>
            {job.faultyParts.map((part, i) => {
                const lineTotal = part.actualCost + part.labourCharge - part.discount;
                return (
                    <View key={i} style={styles.tableRow}>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.itemName}>{part.partName}</Text>
                            <Text style={styles.itemDesc}>{part.issueDescription}</Text>
                            {part.discount > 0 && (
                                <Text style={styles.itemDiscount}>Disc: -₹{part.discount.toLocaleString()}</Text>
                            )}
                        </View>
                        <Text style={[styles.itemValue, { flex: 1, textAlign: 'right' }]}>
                            ₹{part.actualCost.toLocaleString()}
                        </Text>
                        <Text style={[styles.itemValue, { flex: 1, textAlign: 'right' }]}>
                            ₹{part.labourCharge.toLocaleString()}
                        </Text>
                        <Text style={[styles.itemTotal, { flex: 1, textAlign: 'right' }]}>
                            ₹{lineTotal.toLocaleString()}
                        </Text>
                    </View>
                );
            })}

            {/* Totals */}
            <View style={styles.totalsCard}>
                {[
                    { label: 'Parts Total', value: partTotal },
                    { label: 'Labour Total', value: labourTotal },
                    { label: 'Discount', value: -discountTotal, color: colors.success },
                    { label: 'Subtotal', value: subtotal, bold: true },
                    { label: `GST (${job.gstPercent || 18}%)`, value: gst },
                ].map((item, i) => (
                    <View key={i} style={styles.totalRow}>
                        <Text style={[styles.totalLabel, item.bold && { fontWeight: '700' }]}>
                            {item.label}
                        </Text>
                        <Text
                            style={[
                                styles.totalValue,
                                item.bold && { fontWeight: '700', fontSize: 15 },
                                item.color ? { color: item.color } : {},
                            ]}
                        >
                            {item.value < 0 ? '-' : ''}₹ {Math.abs(item.value).toLocaleString()}
                        </Text>
                    </View>
                ))}
                <View style={styles.grandTotalBox}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹ {grandTotal.toLocaleString()}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerTitle}>Thank you for choosing SusaLabs!</Text>
                <Text style={styles.footerSub}>
                    Warranty: 30 days on parts replaced • T&C apply
                </Text>
            </View>

            {/* Share Button */}
            <TouchableOpacity
                style={[commonStyles.buttonPrimary, { marginTop: 20, flexDirection: 'row', gap: 8 }]}
                onPress={handleShare}
            >
                <Icon name="share-variant" size={18} color={colors.white} />
                <Text style={commonStyles.buttonText}>Share Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.secondaryBtn, { marginTop: 12 }]}
                onPress={() => navigation.navigate('ManagerDashboard')}
            >
                <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>

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
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1e1b4b',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    companyName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    companyInfo: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 18,
    },
    invoiceRight: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    invoiceId: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    invoiceDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    infoCards: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoCardLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: 6,
    },
    infoCardName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    infoCardSub: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 10,
        marginBottom: 4,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    itemDesc: {
        fontSize: 11,
        color: colors.textMuted,
    },
    itemDiscount: {
        fontSize: 11,
        color: colors.success,
        fontWeight: '600',
    },
    itemValue: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    itemTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    totalsCard: {
        ...commonStyles.card,
        marginTop: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    totalLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    totalValue: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    grandTotalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1e1b4b',
        borderRadius: 12,
        padding: 14,
        marginTop: 10,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    footer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    footerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    footerSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 4,
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
