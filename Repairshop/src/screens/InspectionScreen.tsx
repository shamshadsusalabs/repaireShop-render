import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import jobService from '../services/jobService';
import { inspectionItems } from '../data/inspectionItems';
import { colors, commonStyles } from '../theme';
import type { InspectionResult } from '../types';

type RootStackParamList = {
    AssignedJobs: undefined;
    JobDetails: { jobId: string };
    Inspection: { jobId: string };
};

export default function InspectionScreen() {
    const route = useRoute<NativeStackScreenProps<RootStackParamList, 'Inspection'>['route']>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { jobId } = route.params;
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<InspectionResult[]>(
        inspectionItems.map(item => ({
            partName: item.name,
            status: 'Pending' as const,
            comment: '',
        })),
    );

    // Load existing inspection results if any
    useEffect(() => {
        const loadExisting = async () => {
            try {
                const { data: res } = await jobService.getById(jobId);
                if (res.data.inspectionResults && res.data.inspectionResults.length > 0) {
                    setResults(res.data.inspectionResults);
                }
            } catch {
                // Ignore, use defaults
            }
        };
        loadExisting();
    }, [jobId]);

    const updateResult = (index: number, field: 'status' | 'comment', value: string) => {
        setResults(prev =>
            prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
        );
    };

    const completedCount = results.filter(r => r.status !== 'Pending').length;
    const allCompleted = completedCount === results.length;

    const handleSubmit = async () => {
        if (!allCompleted) {
            Alert.alert('Warning', 'Please inspect all items before submitting');
            return;
        }

        setLoading(true);
        try {
            await jobService.saveInspection(jobId, results);
            Alert.alert('Success', 'Inspection completed!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('AssignedJobs'),
                },
            ]);
        } catch (err: any) {
            Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to save inspection',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={commonStyles.screenContainer}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.pageTitle}>Inspection Checklist</Text>
                    <Text style={styles.pageSubtitle}>
                        Inspect each component for{' '}
                        <Text style={styles.jobIdHighlight}>{jobId}</Text>
                    </Text>
                </View>
                <View
                    style={[
                        styles.progressBadge,
                        allCompleted ? styles.progressComplete : styles.progressPending,
                    ]}>
                    <Text style={styles.progressText}>
                        {completedCount}/{results.length}
                    </Text>
                </View>
            </View>

            {/* Inspection Items */}
            {results.map((result, index) => {
                const item = inspectionItems[index];
                const borderColor =
                    result.status === 'OK'
                        ? colors.success
                        : result.status === 'Not OK'
                            ? colors.danger
                            : colors.border;

                return (
                    <View
                        key={index}
                        style={[styles.inspectionCard, { borderLeftColor: borderColor }]}>
                        {/* Part Header */}
                        <View style={styles.partHeader}>
                            <View style={styles.partInfo}>
                                <Text style={styles.partIcon}>{item.icon}</Text>
                                <View>
                                    <Text style={styles.partName}>{result.partName}</Text>
                                    <Text style={styles.partStatus}>
                                        {result.status === 'Pending'
                                            ? 'Not inspected yet'
                                            : result.status === 'OK'
                                                ? '✅ Working fine'
                                                : '❌ Issue found'}
                                    </Text>
                                </View>
                            </View>

                            {/* OK / Not OK Buttons */}
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        result.status === 'OK' && styles.toggleButtonOk,
                                    ]}
                                    onPress={() => updateResult(index, 'status', 'OK')}
                                    activeOpacity={0.7}>
                                    <Text
                                        style={[
                                            styles.toggleText,
                                            result.status === 'OK' && styles.toggleTextActive,
                                        ]}>
                                        ✓ OK
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        result.status === 'Not OK' && styles.toggleButtonNotOk,
                                    ]}
                                    onPress={() => updateResult(index, 'status', 'Not OK')}
                                    activeOpacity={0.7}>
                                    <Text
                                        style={[
                                            styles.toggleText,
                                            result.status === 'Not OK' && styles.toggleTextActive,
                                        ]}>
                                        ✗ Not OK
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Comment Input */}
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add comment (optional)..."
                            placeholderTextColor={colors.textMuted}
                            value={result.comment}
                            onChangeText={value => updateResult(index, 'comment', value)}
                            multiline={false}
                        />
                    </View>
                );
            })}

            {/* Submit Button */}
            <TouchableOpacity
                style={[
                    styles.submitButton,
                    !allCompleted && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!allCompleted || loading}
                activeOpacity={0.8}>
                {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <>
                        <Text style={styles.submitIcon}>✅</Text>
                        <Text style={styles.submitText}>Submit Inspection</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingTop: 8,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    jobIdHighlight: {
        fontWeight: '700',
        color: colors.primary,
    },
    progressBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    progressPending: {
        backgroundColor: '#fef3c7',
    },
    progressComplete: {
        backgroundColor: '#d1fae5',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    inspectionCard: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    partHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    partInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    partIcon: {
        fontSize: 28,
    },
    partName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    partStatus: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 6,
    },
    toggleButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.borderLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleButtonOk: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    toggleButtonNotOk: {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: colors.white,
    },
    commentInput: {
        marginTop: 12,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        fontSize: 13,
        color: colors.textPrimary,
        backgroundColor: colors.inputBg,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.primary,
        marginTop: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonDisabled: {
        backgroundColor: colors.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitIcon: {
        fontSize: 18,
    },
    submitText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
