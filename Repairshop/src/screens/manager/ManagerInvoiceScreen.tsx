import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Share,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import { colors, commonStyles } from '../../theme';
import { API_BASE_URL } from '../../services/api';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerInvoiceScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { currentJob: job, loading, fetchJobById } = useJobStore();

    const [labourCgst, setLabourCgst] = useState<number>(9);
    const [labourSgst, setLabourSgst] = useState<number>(9);
    const [editableHsn, setEditableHsn] = useState<{ [key: string]: string }>({});
    const [invoiceType, setInvoiceType] = useState<'Tax Invoice' | 'Performa'>('Tax Invoice');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [totalKmDriven, setTotalKmDriven] = useState<number>(0);

    useEffect(() => {
        fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    // Fetch KM history
    const fetchCustomerKmHistory = async () => {
        if (!job?.mobile) return;
        try {
            const response = await fetch(`${API_BASE_URL}/customers/history/${job.mobile}`);
            if (response.ok) {
                const data = await response.json();
                if (data.kmHistory && data.kmHistory.length > 0) {
                    const latestKm = Math.max(...data.kmHistory.map((h: any) => h.km));
                    setTotalKmDriven(latestKm);
                }
            }
        } catch (error) {
            console.error('Error fetching KM history:', error);
        }
    };

    useEffect(() => {
        if (job?.mobile) {
            fetchCustomerKmHistory();
        }
    }, [job?.mobile]);

    if (loading || !job) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const mechanic = job.mechanicId && typeof job.mechanicId === 'object' ? job.mechanicId : null;

    // Calculate totals — partsIssued priority, fallback to faultyParts
    const partTotal = job.partsIssued && job.partsIssued.length > 0
        ? job.partsIssued.reduce((s, p) => s + (p.unitPrice * p.quantityIssued), 0)
        : job.faultyParts.reduce((s, f) => s + f.actualCost, 0);

    const labourTotal = job.faultyParts.reduce((s, f) => s + f.labourCharge, 0);
    const discountTotal = job.faultyParts.reduce((s, f) => s + f.discount, 0);
    const subtotal = partTotal + labourTotal - discountTotal;

    // CGST and SGST independently on labour
    const cgst = Math.round(labourTotal * labourCgst / 100);
    const sgst = Math.round(labourTotal * labourSgst / 100);
    const totalGst = cgst + sgst;
    const grandTotal = subtotal + totalGst;

    const handleShare = async () => {
        try {
            let text = `🔧 LUXRE ${invoiceType}\n`;
            text += `Invoice #: ${job.jobId}\n`;
            text += `Date: ${new Date(job.date).toLocaleDateString('en-IN')}\n\n`;
            text += `Customer: ${job.customerName}\n`;
            text += `Mobile: +91 ${job.mobile}\n`;
            text += `Vehicle: ${job.carModel} (${job.carNumber})\n`;
            text += `KM: ${job.kmDriven?.toLocaleString()}\n\n`;

            text += `--- PARTS ---\n`;
            if (job.partsIssued && job.partsIssued.length > 0) {
                job.partsIssued.forEach((p, i) => {
                    text += `${i + 1}. ${p.partName}: ₹${(p.unitPrice * p.quantityIssued).toLocaleString()}\n`;
                });
            } else {
                job.faultyParts.forEach((p, i) => {
                    text += `${i + 1}. ${p.partName}: ₹${(p.actualCost - p.discount).toLocaleString()}\n`;
                });
            }

            text += `\n--- LABOUR ---\n`;
            job.faultyParts.filter(p => p.labourCharge > 0).forEach((p, i) => {
                text += `${i + 1}. Labour - ${p.partName}: ₹${p.labourCharge.toLocaleString()}\n`;
            });

            text += `\nSubtotal: ₹${subtotal.toLocaleString()}\n`;
            if (discountTotal > 0) text += `Discount: -₹${discountTotal.toLocaleString()}\n`;
            text += `CGST (${labourCgst}%): ₹${cgst.toLocaleString()}\n`;
            text += `SGST (${labourSgst}%): ₹${sgst.toLocaleString()}\n`;
            text += `\n💰 Grand Total: ₹${grandTotal.toLocaleString()}\n`;
            text += `\nGSTIN: 07AATCM8164B1Z6\n`;
            text += `Thank you for choosing LUXRE!\nPowered by SusaLabs`;

            await Share.share({ message: text });
        } catch {
            // User cancelled
        }
    };

    const updateHsn = (key: string, value: string) => {
        setEditableHsn(prev => ({ ...prev, [key]: value }));
    };

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>

            {/* ─── Invoice Header with Logo ─── */}
            <View style={styles.invoiceCard}>
                <View style={styles.headerRow}>
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../../public/logo1.jpeg')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.companyName}>LUXRE</Text>
                            <Text style={styles.companyInfo}>
                                C-8 Ground Floor, Rewari Line{'\n'}
                                Industrial Area, Maya puri{'\n'}
                                New Delhi – 110064{'\n'}
                                GSTIN: 07AATCM8164B1Z6{'\n'}
                                Ph: +91 98765 43210
                            </Text>
                        </View>
                    </View>
                    <View style={styles.invoiceRight}>
                        <Text style={styles.invoiceTitle}>{invoiceType.toUpperCase()}</Text>
                        <Text style={styles.invoiceId}>#{job.jobId}</Text>
                        <Text style={styles.invoiceDate}>
                            {new Date(job.date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </Text>
                    </View>
                </View>

                {/* Invoice Type Toggle */}
                <View style={styles.invoiceTypeRow}>
                    {(['Tax Invoice', 'Performa'] as const).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.invoiceTypeBtn, invoiceType === type && styles.invoiceTypeBtnActive]}
                            onPress={() => setInvoiceType(type)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.invoiceTypeBtnText, invoiceType === type && styles.invoiceTypeBtnTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ─── Customer & Vehicle Info ─── */}
            <View style={styles.infoCards}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>BILL TO</Text>
                    <Text style={styles.infoCardName}>{job.customerName}</Text>
                    <Text style={styles.infoCardSub}>+91 {job.mobile}</Text>
                </View>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>VEHICLE</Text>
                    <Text style={styles.infoCardName}>{job.carModel}</Text>
                    <Text style={styles.infoCardSub}>Reg: {job.carNumber}</Text>
                    <Text style={styles.infoCardSub}>
                        Current KM: {job.kmDriven?.toLocaleString()} | Total: {totalKmDriven > 0 ? totalKmDriven.toLocaleString() : job.kmDriven?.toLocaleString()}
                    </Text>
                    {mechanic && (
                        <Text style={styles.infoCardSub}>Mechanic: {mechanic.name}</Text>
                    )}
                </View>
            </View>

            {/* ─── PARTS TABLE ─── */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>PARTS</Text>
            </View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 22 }]}>#</Text>
                <Text style={[styles.th, { flex: 2 }]}>Description</Text>
                <Text style={[styles.th, { width: 56, textAlign: 'center' }]}>HSN</Text>
                <Text style={[styles.th, { width: 30, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { width: 56, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.th, { width: 50, textAlign: 'right' }]}>Amt</Text>
            </View>

            {/* Parts Rows */}
            {job.partsIssued && job.partsIssued.length > 0 ? (
                job.partsIssued.map((part, idx) => {
                    const hsnKey = `part-${idx}`;
                    const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : (part.hsnCode || '');
                    return (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.td, { width: 22 }]}>{idx + 1}</Text>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.tdBold}>{part.partName}</Text>
                                <Text style={styles.tdSub}>Part No: {part.partNumber}</Text>
                            </View>
                            <TextInput
                                style={[styles.hsnInput, { width: 56 }]}
                                value={currentHsn}
                                onChangeText={v => updateHsn(hsnKey, v)}
                                placeholder="HSN"
                                placeholderTextColor="#bbb"
                            />
                            <Text style={[styles.td, { width: 30, textAlign: 'center' }]}>{part.quantityIssued}</Text>
                            <Text style={[styles.td, { width: 56, textAlign: 'right' }]}>₹{part.unitPrice.toLocaleString()}</Text>
                            <Text style={[styles.tdBold, { width: 50, textAlign: 'right' }]}>
                                ₹{(part.unitPrice * part.quantityIssued).toLocaleString()}
                            </Text>
                        </View>
                    );
                })
            ) : (
                job.faultyParts.map((part, idx) => {
                    const hsnKey = `faulty-${idx}`;
                    const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : (part.hsnCode || '');
                    return (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.td, { width: 22 }]}>{idx + 1}</Text>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.tdBold}>{part.partName}</Text>
                                <Text style={styles.tdSub}>{part.issueDescription}</Text>
                            </View>
                            <TextInput
                                style={[styles.hsnInput, { width: 56 }]}
                                value={currentHsn}
                                onChangeText={v => updateHsn(hsnKey, v)}
                                placeholder="HSN"
                                placeholderTextColor="#bbb"
                            />
                            <Text style={[styles.td, { width: 30, textAlign: 'center' }]}>1</Text>
                            <Text style={[styles.td, { width: 56, textAlign: 'right' }]}>₹{part.actualCost.toLocaleString()}</Text>
                            <Text style={[styles.tdBold, { width: 50, textAlign: 'right' }]}>
                                ₹{(part.actualCost - part.discount).toLocaleString()}
                            </Text>
                        </View>
                    );
                })
            )}

            {/* ─── LABOUR TABLE ─── */}
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                <Text style={styles.sectionHeaderText}>LABOUR & SERVICES</Text>
            </View>
            <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 22 }]}>#</Text>
                <Text style={[styles.th, { flex: 2 }]}>Description</Text>
                <Text style={[styles.th, { width: 56, textAlign: 'center' }]}>HSN</Text>
                <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>GST</Text>
                <Text style={[styles.th, { width: 60, textAlign: 'right' }]}>Amount</Text>
            </View>
            {job.faultyParts.filter(p => p.labourCharge > 0).map((part, idx) => {
                const hsnKey = `labour-${idx}`;
                const currentHsn = editableHsn[hsnKey] !== undefined ? editableHsn[hsnKey] : '';
                return (
                    <View key={`l-${idx}`} style={styles.tableRow}>
                        <Text style={[styles.td, { width: 22 }]}>{idx + 1}</Text>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.tdBold}>Labour - {part.partName}</Text>
                        </View>
                        <TextInput
                            style={[styles.hsnInput, { width: 56 }]}
                            value={currentHsn}
                            onChangeText={v => updateHsn(hsnKey, v)}
                            placeholder="HSN"
                            placeholderTextColor="#bbb"
                        />
                        <View style={{ width: 50, alignItems: 'center' }}>
                            <Text style={[styles.td, { color: '#0369a1', fontWeight: '600' }]}>C{labourCgst}%</Text>
                            <Text style={[styles.td, { color: '#0369a1', fontWeight: '600' }]}>S{labourSgst}%</Text>
                        </View>
                        <Text style={[styles.tdBold, { width: 60, textAlign: 'right' }]}>
                            ₹{part.labourCharge.toLocaleString()}
                        </Text>
                    </View>
                );
            })}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Subtotal (Before Tax):</Text>
                <Text style={styles.subtotalValue}>₹{subtotal.toLocaleString()}</Text>
            </View>

            {/* ─── CGST / SGST Adjusters ─── */}
            <View style={styles.gstAdjusterRow}>
                <View style={styles.gstBox}>
                    <Text style={styles.gstBoxLabel}>CGST %</Text>
                    <View style={styles.gstControls}>
                        <TouchableOpacity style={styles.gstBtn} onPress={() => setLabourCgst(Math.max(0, labourCgst - 1))}>
                            <Text style={styles.gstBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.gstValueBox}>
                            <Text style={styles.gstValue}>{labourCgst}%</Text>
                        </View>
                        <TouchableOpacity style={styles.gstBtn} onPress={() => setLabourCgst(Math.min(100, labourCgst + 1))}>
                            <Text style={styles.gstBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.gstBox}>
                    <Text style={styles.gstBoxLabel}>SGST %</Text>
                    <View style={styles.gstControls}>
                        <TouchableOpacity style={styles.gstBtn} onPress={() => setLabourSgst(Math.max(0, labourSgst - 1))}>
                            <Text style={styles.gstBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.gstValueBox}>
                            <Text style={styles.gstValue}>{labourSgst}%</Text>
                        </View>
                        <TouchableOpacity style={styles.gstBtn} onPress={() => setLabourSgst(Math.min(100, labourSgst + 1))}>
                            <Text style={styles.gstBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ─── Totals Card ─── */}
            <View style={styles.totalsCard}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sub Total</Text>
                    <Text style={styles.totalValue}>₹ {subtotal.toLocaleString()}</Text>
                </View>
                {discountTotal > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Discount</Text>
                        <Text style={[styles.totalValue, { color: '#059669' }]}>-₹ {discountTotal.toLocaleString()}</Text>
                    </View>
                )}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>CGST ({labourCgst}%)</Text>
                    <Text style={styles.totalValue}>₹ {cgst.toLocaleString()}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>SGST ({labourSgst}%)</Text>
                    <Text style={styles.totalValue}>₹ {sgst.toLocaleString()}</Text>
                </View>
                <View style={styles.grandTotalBox}>
                    <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                    <Text style={styles.grandTotalValue}>₹ {grandTotal.toLocaleString()}</Text>
                </View>
            </View>

            {/* ─── Terms & Conditions ─── */}
            <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>Terms & Conditions:</Text>
                <Text style={styles.termsText}>• Warranty: 30 days on parts replaced</Text>
                <Text style={styles.termsText}>• Payment terms: Due on receipt</Text>
                <Text style={styles.termsText}>• This is a system generated invoice</Text>
            </View>

            {/* ─── Signature Section ─── */}
            <View style={styles.signatureRow}>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Customer Signature</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                    <Text style={styles.signatureSub}>For LUXRE</Text>
                </View>
            </View>

            {/* ─── Satisfaction & Payment Text ─── */}
            <View style={styles.declarationBox}>
                <Text style={styles.declarationText}>
                    Vehicle has been received from workshop and work done as per my satisfaction
                </Text>
                <Text style={styles.declarationText}>
                    Payment received from customer, vehicle permitted to leave workshop
                </Text>
            </View>

            <Text style={styles.poweredBy}>Powered by SusaLabs | This is a computer generated invoice</Text>

            {/* ─── Action Buttons ─── */}
            <TouchableOpacity
                style={[commonStyles.buttonPrimary, { marginTop: 24, flexDirection: 'row', gap: 8 }]}
                onPress={() => setIsModalVisible(true)}
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

            {/* ─── Invoice Type Modal ─── */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Invoice Type & Share</Text>

                        {(['Tax Invoice', 'Performa'] as const).map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.modalOption, invoiceType === type && styles.modalOptionActive]}
                                onPress={() => setInvoiceType(type)}
                            >
                                <View style={[styles.radioOuter, invoiceType === type && styles.radioOuterActive]}>
                                    {invoiceType === type && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.modalOptionText, invoiceType === type && { fontWeight: '700', color: '#1e293b' }]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={() => {
                                    setIsModalVisible(false);
                                    setTimeout(handleShare, 100);
                                }}
                            >
                                <Text style={styles.modalConfirmText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        padding: 16,
    },

    // ─── Invoice Card (Header) ────────────────
    invoiceCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#000',
        padding: 16,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
    },
    headerLogo: {
        width: 42,
        height: 42,
        borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    companyName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
        marginBottom: 3,
    },
    companyInfo: {
        fontSize: 9,
        color: '#333',
        lineHeight: 14,
    },
    invoiceRight: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    invoiceId: {
        fontSize: 10,
        color: '#333',
        marginTop: 3,
    },
    invoiceDate: {
        fontSize: 10,
        color: '#333',
        marginTop: 2,
    },
    invoiceTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        justifyContent: 'center',
    },
    invoiceTypeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    invoiceTypeBtnActive: {
        borderColor: '#4f46e5',
        backgroundColor: '#eef2ff',
    },
    invoiceTypeBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    invoiceTypeBtnTextActive: {
        color: '#4f46e5',
    },

    // ─── Customer / Vehicle Info ─────────────
    infoCards: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    infoCardLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    infoCardName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    infoCardSub: {
        fontSize: 10,
        color: colors.textSecondary,
        lineHeight: 15,
    },

    // ─── Section Headers ─────────────────────
    sectionHeader: {
        backgroundColor: '#fafafa',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    sectionHeaderText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#333',
        letterSpacing: 0.5,
    },

    // ─── Table ───────────────────────────────
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        paddingVertical: 5,
        paddingHorizontal: 4,
        borderTopWidth: 2,
        borderTopColor: '#000',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        alignItems: 'center',
    },
    th: {
        fontSize: 8,
        fontWeight: '700',
        color: '#333',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        alignItems: 'center',
    },
    td: {
        fontSize: 9,
        color: '#333',
    },
    tdBold: {
        fontSize: 9,
        fontWeight: '600',
        color: '#000',
    },
    tdSub: {
        fontSize: 7,
        color: '#666',
        marginTop: 1,
    },
    hsnInput: {
        fontSize: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 3,
        textAlign: 'center',
        paddingVertical: 2,
        paddingHorizontal: 3,
        color: '#333',
        backgroundColor: '#fff',
        height: 24,
    },

    // ─── Subtotal Row ────────────────────────
    subtotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderTopWidth: 2,
        borderTopColor: '#000',
        backgroundColor: '#f9f9f9',
        gap: 12,
    },
    subtotalLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
    },
    subtotalValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
    },

    // ─── CGST / SGST Adjusters ───────────────
    gstAdjusterRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        marginBottom: 14,
    },
    gstBox: {
        flex: 1,
        backgroundColor: '#f0f9ff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#bae6fd',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    gstBoxLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0369a1',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gstControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gstBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    gstBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 22,
    },
    gstValueBox: {
        minWidth: 50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gstValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0369a1',
    },

    // ─── Totals Card ─────────────────────────
    totalsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 11,
        fontWeight: '500',
        color: '#000',
    },
    grandTotalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#000',
    },
    grandTotalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
    },
    grandTotalValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#000',
    },

    // ─── Terms & Conditions ──────────────────
    termsSection: {
        marginTop: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    termsTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
        marginBottom: 6,
    },
    termsText: {
        fontSize: 10,
        color: '#555',
        lineHeight: 16,
    },

    // ─── Signatures ──────────────────────────
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    signatureBlock: {
        alignItems: 'center',
        minWidth: 130,
    },
    signatureLine: {
        width: 130,
        height: 1,
        backgroundColor: '#000',
        marginBottom: 6,
    },
    signatureLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#000',
    },
    signatureSub: {
        fontSize: 9,
        color: '#555',
        marginTop: 1,
    },

    // ─── Declaration ─────────────────────────
    declarationBox: {
        marginTop: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        alignItems: 'center',
    },
    declarationText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 4,
    },
    poweredBy: {
        fontSize: 8,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
    },

    // ─── Action Buttons ──────────────────────
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

    // ─── Modal ───────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    modalOptionActive: {
        borderColor: '#4f46e5',
        backgroundColor: '#eef2ff',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: {
        borderColor: '#4f46e5',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4f46e5',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalCancelBtn: {
        flex: 1,
        height: 46,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    modalConfirmBtn: {
        flex: 1,
        height: 46,
        borderRadius: 10,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
