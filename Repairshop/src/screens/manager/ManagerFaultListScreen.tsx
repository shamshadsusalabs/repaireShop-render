import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import { colors, commonStyles } from '../../theme';
import type { FaultyPart } from '../../types';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerFaultListScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { currentJob: job, loading, fetchJobById, saveFaultyParts } = useJobStore();

    const [faults, setFaults] = useState<FaultyPart[]>([]);

    useEffect(() => {
        fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    useEffect(() => {
        if (job) {
            if (job.faultyParts.length) {
                setFaults(job.faultyParts);
            } else {
                const notOk = job.inspectionResults.filter(r => r.status === 'Not OK');
                setFaults(
                    notOk.map(item => ({
                        partName: item.partName,
                        issueDescription: item.comment || 'Needs repair',
                        estimatedCost: 0,
                        actualCost: 0,
                        labourCharge: 0,
                        discount: 0,
                    })),
                );
            }
        }
    }, [job]);

    const updateFault = (index: number, field: keyof FaultyPart, value: number) => {
        setFaults(prev =>
            prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
        );
    };

    const totals = useMemo(() => {
        const partTotal = faults.reduce((sum, f) => sum + f.estimatedCost, 0);
        const labourTotal = faults.reduce((sum, f) => sum + f.labourCharge, 0);
        const subtotal = partTotal + labourTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, subtotal, gst, grandTotal };
    }, [faults]);

    const handleSend = async () => {
        if (faults.some(f => f.estimatedCost === 0)) {
            Alert.alert('Warning', 'Please add estimated cost for all parts');
            return;
        }
        if (faults.some(f => f.labourCharge === 0)) {
            Alert.alert('Warning', 'Please add labour/machine cost for all parts');
            return;
        }

        try {
            await saveFaultyParts(jobId, faults);
            Alert.alert('Success', 'Sent for customer approval!');
            navigation.navigate('ManagerCustomerApproval', { jobId });
        } catch {
            Alert.alert('Error', 'Failed to save faulty parts');
        }
    };

    if (loading || !job) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (faults.length === 0) {
        return (
            <View style={[styles.center, { gap: 16 }]}>
                <Icon name="check-circle" size={48} color={colors.success} />
                <Text style={styles.emptyText}>All inspection items are OK!</Text>
                <TouchableOpacity
                    style={commonStyles.buttonPrimary}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={commonStyles.buttonText}>Back to Job</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            <Text style={styles.subtitle}>
                Auto-generated from inspection ({faults.length} issues)
            </Text>

            {faults.map((fault, index) => (
                <View key={index} style={styles.faultCard}>
                    <View style={styles.faultHeader}>
                        <Text style={styles.faultIndex}>#{index + 1}</Text>
                        <Text style={styles.faultName}>{fault.partName}</Text>
                    </View>
                    <Text style={styles.faultIssue}>{fault.issueDescription}</Text>

                    <View style={styles.inputsRow}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Part Cost (₹)</Text>
                            <TextInput
                                style={styles.costInput}
                                value={String(fault.estimatedCost || '')}
                                onChangeText={t => updateFault(index, 'estimatedCost', Number(t) || 0)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Labour (₹)</Text>
                            <TextInput
                                style={styles.costInput}
                                value={String(fault.labourCharge || '')}
                                onChangeText={t => updateFault(index, 'labourCharge', Number(t) || 0)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Total</Text>
                            <View style={styles.totalBox}>
                                <Text style={styles.totalText}>
                                    ₹{(fault.estimatedCost + fault.labourCharge).toLocaleString()}
                                </Text>
                            </View>
                        </View>
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
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={[styles.summaryLabel, { fontWeight: '600' }]}>Subtotal</Text>
                    <Text style={[styles.summaryValue, { fontWeight: '700' }]}>₹ {totals.subtotal.toLocaleString()}</Text>
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

            {/* Submit */}
            <TouchableOpacity
                style={[commonStyles.buttonPrimary, { marginTop: 20, flexDirection: 'row', gap: 8 }]}
                onPress={handleSend}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <>
                        <Icon name="send" size={18} color={colors.white} />
                        <Text style={commonStyles.buttonText}>Send for Customer Approval</Text>
                    </>
                )}
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
        padding: 20,
    },
    container: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
        marginBottom: 16,
    },
    faultCard: {
        ...commonStyles.card,
        marginBottom: 12,
    },
    faultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    faultIndex: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    faultName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    faultIssue: {
        fontSize: 13,
        color: colors.danger,
        marginBottom: 12,
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: 4,
    },
    costInput: {
        height: 42,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        backgroundColor: colors.inputBg,
        paddingHorizontal: 12,
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    totalBox: {
        height: 42,
        borderRadius: 10,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    totalText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
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
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
});
