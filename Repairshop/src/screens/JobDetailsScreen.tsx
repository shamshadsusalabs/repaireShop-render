import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import jobService from '../services/jobService';
import { colors, statusColors, statusBgColors, commonStyles } from '../theme';
import type { Job, JobStatus } from '../types';

type RootStackParamList = {
    AssignedJobs: undefined;
    JobDetails: { jobId: string };
    Inspection: { jobId: string };
};

const STEPS = [
    { title: 'Registered', icon: '🚗' },
    { title: 'Assigned', icon: '👷' },
    { title: 'Inspection', icon: '🔍' },
    { title: 'Approval', icon: '✅' },
    { title: 'Approved', icon: '📋' },
    { title: 'Repairing', icon: '🔧' },
    { title: 'Completed', icon: '✅' },
];

const statusStepMap: Record<JobStatus, number> = {
    Pending: 0,
    Assigned: 1,
    Inspection: 2,
    Approval: 3,
    Approved: 4,
    Rejected: 3,
    'Parts Requested': 5,
    Repairing: 5,
    Completed: 6,
};

export default function JobDetailsScreen() {
    const route = useRoute<NativeStackScreenProps<RootStackParamList, 'JobDetails'>['route']>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { jobId } = route.params;
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const { data: res } = await jobService.getById(jobId);
                setJob(res.data);
            } catch (err: any) {
                Alert.alert('Error', err.response?.data?.message || 'Failed to fetch job');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!job) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Job not found</Text>
            </View>
        );
    }

    const currentStep = statusStepMap[job.status];

    const getNextAction = () => {
        switch (job.status) {
            case 'Assigned':
                return { label: 'Start Inspection', icon: '🔍' };
            case 'Inspection':
                return { label: 'Continue Inspection', icon: '🔍' };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <ScrollView
            style={commonStyles.screenContainer}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {/* Header with Job ID + Status */}
            <View style={styles.headerRow}>
                <Text style={styles.jobIdText}>{job.jobId}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: statusBgColors[job.status] || '#f1f5f9' },
                    ]}>
                    <Text
                        style={[
                            styles.statusText,
                            { color: statusColors[job.status] || colors.textSecondary },
                        ]}>
                        {job.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.pageSubtitle}>Job overview and progress tracking</Text>

            {/* Progress Stepper */}
            <View style={styles.stepperCard}>
                <View style={styles.stepperContainer}>
                    {STEPS.map((step, index) => {
                        const isActive = index <= currentStep;
                        const isCurrent = index === currentStep;
                        return (
                            <View key={index} style={styles.stepItem}>
                                <View
                                    style={[
                                        styles.stepDot,
                                        isActive && styles.stepDotActive,
                                        isCurrent && styles.stepDotCurrent,
                                    ]}>
                                    <Text style={styles.stepIcon}>
                                        {isActive ? step.icon : '○'}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        isActive && styles.stepLabelActive,
                                    ]}
                                    numberOfLines={1}>
                                    {step.title}
                                </Text>
                                {index < STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.stepLine,
                                            isActive && styles.stepLineActive,
                                        ]}
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Customer Details */}
            <View style={styles.detailCard}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardIcon}>👤</Text>
                    <Text style={styles.cardTitle}>Customer Details</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{job.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile</Text>
                    <Text style={styles.detailValue}>+91 {job.mobile}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(job.date)}</Text>
                </View>
            </View>

            {/* Car Details */}
            <View style={styles.detailCard}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardIcon}>🚗</Text>
                    <Text style={styles.cardTitle}>Car Details</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Model</Text>
                    <Text style={styles.detailValue}>{job.carModel}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Number</Text>
                    <Text style={styles.detailValue}>{job.carNumber}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>KM Driven</Text>
                    <Text style={styles.detailValue}>
                        {job.kmDriven.toLocaleString()} km
                    </Text>
                </View>
            </View>

            {/* Mechanic Info */}
            {job.mechanicId && (
                <View style={styles.detailCard}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardIcon}>🔧</Text>
                        <Text style={styles.cardTitle}>Assigned Mechanic</Text>
                    </View>
                    <View style={styles.mechanicRow}>
                        <View style={styles.mechanicAvatar}>
                            <Text style={styles.mechanicAvatarText}>
                                {job.mechanicId.avatar || '🔧'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.mechanicName}>{job.mechanicId.name}</Text>
                            <Text style={styles.mechanicSpecialty}>
                                {job.mechanicId.specialty}
                            </Text>
                            {job.mechanicId.experience && (
                                <Text style={styles.mechanicExperience}>
                                    {job.mechanicId.experience} Experience
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Faulty Parts Summary */}
            {job.faultyParts.length > 0 && (
                <View style={styles.detailCard}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardIcon}>⚠️</Text>
                        <Text style={styles.cardTitle}>
                            Issues Found ({job.faultyParts.length})
                        </Text>
                    </View>
                    {job.faultyParts.map((part, i) => (
                        <View
                            key={i}
                            style={[
                                styles.faultRow,
                                i === job.faultyParts.length - 1 && { borderBottomWidth: 0 },
                            ]}>
                            <Text style={styles.faultName}>{part.partName}</Text>
                            <Text style={styles.faultCost}>
                                ₹{part.estimatedCost.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Action Button */}
            {nextAction && (
                <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Inspection', { jobId: job.jobId })}>
                    <Text style={styles.actionIcon}>{nextAction.icon}</Text>
                    <Text style={styles.actionText}>{nextAction.label}</Text>
                </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingTop: 8,
    },
    jobIdText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    pageSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
        marginBottom: 20,
    },
    stepperCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepDotActive: {
        backgroundColor: '#e0e7ff',
    },
    stepDotCurrent: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    stepIcon: {
        fontSize: 16,
    },
    stepLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: colors.textMuted,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    stepLine: {
        position: 'absolute',
        top: 18,
        right: -14,
        width: 28,
        height: 2,
        backgroundColor: colors.borderLight,
    },
    stepLineActive: {
        backgroundColor: colors.primary,
    },
    detailCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardIcon: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    mechanicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    mechanicAvatar: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mechanicAvatarText: {
        fontSize: 28,
    },
    mechanicName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mechanicSpecialty: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    mechanicExperience: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    faultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    faultName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    faultCost: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.danger,
    },
    actionButton: {
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
    actionIcon: {
        fontSize: 20,
    },
    actionText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
