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

export default function ManagerRepairCostScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { currentJob: job, loading, fetchJobById, saveRepairCost, completeJob } = useJobStore();

    const [costs, setCosts] = useState<FaultyPart[]>([]);

    useEffect(() => {
        fetchJobById(jobId);
    }, [jobId, fetchJobById]);

    useEffect(() => {
        if (job) {
            setCosts(
                job.faultyParts.map(f => ({
                    ...f,
                    actualCost: f.actualCost || f.estimatedCost,
                    labourCharge: f.labourCharge || 0,
                    discount: f.discount || 0,
                })),
            );
        }
    }, [job]);

    const updateCost = (index: number, field: keyof FaultyPart, value: number) => {
        setCosts(prev =>
            prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
        );
    };

    const totals = useMemo(() => {
        const partTotal = costs.reduce((s, c) => s + c.actualCost, 0);
        const labourTotal = costs.reduce((s, c) => s + c.labourCharge, 0);
        const discountTotal = costs.reduce((s, c) => s + c.discount, 0);
        const subtotal = partTotal + labourTotal - discountTotal;
        const gst = Math.round(subtotal * 0.18);
        const grandTotal = subtotal + gst;
        return { partTotal, labourTotal, discountTotal, subtotal, gst, grandTotal };
    }, [costs]);

    const handleGenerate = async () => {
        Alert.alert(
            'Generate Invoice',
            `Complete job and generate invoice?\nGrand Total: ₹${totals.grandTotal.toLocaleString()}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        try {
                            await saveRepairCost(jobId, costs);
                            await completeJob(jobId);
                            Alert.alert('Success', 'Job completed & Invoice generated!');
                            navigation.navigate('ManagerInvoice', { jobId });
                        } catch {
                            Alert.alert('Error', 'Failed to update job');
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

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            <Text style={styles.subtitle}>Final cost breakdown for {jobId}</Text>

            {costs.map((cost, index) => (
                <View key={index} style={styles.costCard}>
                    <Text style={styles.partName}>{cost.partName}</Text>

                    <View style={styles.inputsRow}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Part Cost (₹)</Text>
                            <TextInput
                                style={styles.costInput}
                                value={String(cost.actualCost || '')}
                                onChangeText={t => updateCost(index, 'actualCost', Number(t) || 0)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Labour (₹)</Text>
                            <TextInput
                                style={styles.costInput}
                                value={String(cost.labourCharge || '')}
                                onChangeText={t => updateCost(index, 'labourCharge', Number(t) || 0)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Discount (₹)</Text>
                            <TextInput
                                style={styles.costInput}
                                value={String(cost.discount || '')}
                                onChangeText={t => updateCost(index, 'discount', Number(t) || 0)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.lineTotalRow}>
                        <Text style={styles.lineTotalLabel}>Line Total</Text>
                        <Text style={styles.lineTotalValue}>
                            ₹ {(cost.actualCost + cost.labourCharge - cost.discount).toLocaleString()}
                        </Text>
                    </View>
                </View>
            ))}

            {/* Summary */}
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
                    <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                        -₹ {totals.discountTotal.toLocaleString()}
                    </Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
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

            {/* Generate Invoice */}
            <TouchableOpacity
                style={[commonStyles.buttonPrimary, { marginTop: 24, flexDirection: 'row', gap: 8 }]}
                onPress={handleGenerate}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <>
                        <Icon name="receipt" size={18} color={colors.white} />
                        <Text style={commonStyles.buttonText}>Generate Invoice</Text>
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
    costCard: {
        ...commonStyles.card,
        marginBottom: 12,
    },
    partName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
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
        paddingHorizontal: 10,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    lineTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    lineTotalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    lineTotalValue: {
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
});
