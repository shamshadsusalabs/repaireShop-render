import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Share,
    TouchableOpacity,
    Alert,
    Image,
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
    const [gstPercent, setGstPercent] = useState<number>(18);

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
    const gst = Math.round(subtotal * (gstPercent / 100));
    const grandTotal = subtotal + gst;

    const handleShare = async () => {
        try {
            let text = `🔧 LUXRE Invoice\n`;
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
            text += `GST (${gstPercent}%): ₹${gst.toLocaleString()}\n`;
            text += `\n💰 Grand Total: ₹${grandTotal.toLocaleString()}\n`;
            text += `\nThank you for choosing LUXRE!\nPowered by SusaLabs`;

            await Share.share({ message: text });
        } catch {
            // User cancelled
        }
    };

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
                <View style={styles.logoSection}>
                    <Image 
                        source={require('../../../public/logo1.jpeg')} 
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.companyName}>LUXRE</Text>
                        <Text style={styles.companyInfo}>
                            Workshop Lane, Industrial Area{'\n'}
                            New Delhi • +91 98765 43210
                        </Text>
                    </View>
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
                {/* GST Adjuster */}
                <View style={styles.gstAdjuster}>
                    <Text style={styles.gstLabel}>Adjust GST %</Text>
                    <View style={styles.gstControls}>
                        <TouchableOpacity
                            style={styles.gstButton}
                            onPress={() => setGstPercent(Math.max(0, gstPercent - 1))}
                            activeOpacity={0.7}>
                            <Text style={styles.gstButtonText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.gstValueBox}>
                            <Text style={styles.gstValue}>{gstPercent}%</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.gstButton}
                            onPress={() => setGstPercent(Math.min(100, gstPercent + 1))}
                            activeOpacity={0.7}>
                            <Text style={styles.gstButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {[
                    { label: 'Parts Total', value: partTotal },
                    { label: 'Labour Total', value: labourTotal },
                    { label: 'Discount', value: -discountTotal, color: colors.success },
                    { label: 'Subtotal', value: subtotal, bold: true },
                    { label: `GST (${gstPercent}%)`, value: gst },
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
                <Text style={styles.footerTitle}>Thank you for choosing LUXRE!</Text>
                <Text style={styles.footerSub}>
                    Warranty: 30 days on parts replaced • T&C apply
                </Text>
                <Text style={styles.footerPowered}>Powered by SusaLabs</Text>
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
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    headerLogo: {
        width: 45,
        height: 45,
        borderRadius: 8,
        backgroundColor: '#fff',
        padding: 3,
    },
    companyName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
    },
    companyInfo: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 16,
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
    gstAdjuster: {
        backgroundColor: '#f0f9ff',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#bae6fd',
        borderStyle: 'dashed',
    },
    gstLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0369a1',
        marginBottom: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gstControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    gstButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    gstButtonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 24,
    },
    gstValueBox: {
        minWidth: 60,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gstValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0369a1',
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
    footerPowered: {
        fontSize: 10,
        color: colors.textLight,
        marginTop: 8,
        fontWeight: '600',
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
