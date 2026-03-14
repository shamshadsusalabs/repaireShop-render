import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import { colors, statusColors, statusBgColors, commonStyles } from '../../theme';
import type { JobStatus } from '../../types';

type Nav = NativeStackNavigationProp<any>;

const stepLabels = ['Registered', 'Assigned', 'Inspection', 'Approval', 'Approved', 'Parts', 'Repairing', 'Done'];
const stepIcons = ['car', 'account-group', 'magnify', 'check-circle', 'file-document', 'package-variant', 'wrench', 'flag-checkered'];

const statusStepMap: Record<JobStatus, number> = {
    Pending: 0,
    Assigned: 1,
    Inspection: 2,
    Approval: 3,
    Approved: 4,
    Rejected: 3,
    'Parts Requested': 5,
    Repairing: 6,
    Completed: 7,
};

export default function ManagerJobDetailsScreen() {
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

    const currentStep = statusStepMap[job.status];

    const getNextAction = () => {
        switch (job.status) {
            case 'Pending':
                return { label: 'Assign Mechanic', screen: 'ManagerAssignMechanic', icon: 'account-group' };
            case 'Assigned':
                return null; // Mechanic does inspection
            case 'Inspection':
                return { label: 'View Faults', screen: 'ManagerFaultList', icon: 'file-document' };
            case 'Approval':
                return { label: 'Customer Approval', screen: 'ManagerCustomerApproval', icon: 'check-decagram' };
            case 'Approved':
            case 'Parts Requested':
                return null; // Store must issue parts
            case 'Repairing':
                return { label: 'Repair & Cost', screen: 'ManagerRepairCost', icon: 'wrench' };
            case 'Completed':
                return { label: 'View Invoice', screen: 'ManagerInvoice', icon: 'receipt' };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

    return (
        <ScrollView style={commonStyles.screenContainer} contentContainerStyle={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.jobIdText}>{job.jobId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBgColors[job.status] }]}>
                        <Text style={[styles.statusText, { color: statusColors[job.status] }]}>
                            {job.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.dateText}>
                    {new Date(job.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </Text>
            </View>

            {/* Progress Steps */}
            <View style={styles.stepsCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {stepLabels.map((label, i) => (
                        <View key={i} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    i <= currentStep ? styles.stepCircleActive : {},
                                    i === currentStep ? styles.stepCircleCurrent : {},
                                ]}
                            >
                                <Icon
                                    name={stepIcons[i]}
                                    size={16}
                                    color={i <= currentStep ? colors.white : colors.textMuted}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.stepLabel,
                                    i <= currentStep ? styles.stepLabelActive : {},
                                ]}
                            >
                                {label}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Customer Details */}
            <View style={styles.card}>
                <View style={styles.cardTitle}>
                    <Icon name="account" size={18} color={colors.primary} />
                    <Text style={styles.cardTitleText}>Customer Details</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{job.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile</Text>
                    <Text style={styles.infoValue}>+91 {job.mobile}</Text>
                </View>
            </View>

            {/* Car Details */}
            <View style={styles.card}>
                <View style={styles.cardTitle}>
                    <Icon name="car" size={18} color={colors.primary} />
                    <Text style={styles.cardTitleText}>Car Details</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Model</Text>
                    <Text style={styles.infoValue}>{job.carModel}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Number</Text>
                    <Text style={styles.infoValue}>{job.carNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>KM Driven</Text>
                    <Text style={styles.infoValue}>{job.kmDriven?.toLocaleString()} km</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>
                        {job.jobType === 'Pickup' ? '🚛 Pickup' : '🚗 Walk-in'}
                    </Text>
                </View>
                {job.location ? (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>📍 Location</Text>
                        <Text style={[styles.infoValue, { flex: 1 }]}>{job.location}</Text>
                    </View>
                ) : null}
            </View>

            {/* Mechanic Info */}
            {job.mechanicId && typeof job.mechanicId === 'object' && (
                <View style={styles.card}>
                    <View style={styles.cardTitle}>
                        <Icon name="wrench" size={18} color={colors.primary} />
                        <Text style={styles.cardTitleText}>Assigned Mechanic</Text>
                    </View>
                    <View style={styles.mechanicInfo}>
                        <View style={styles.mechanicAvatar}>
                            <Text style={styles.mechanicAvatarText}>{job.mechanicId.avatar}</Text>
                        </View>
                        <View>
                            <Text style={styles.mechanicName}>{job.mechanicId.name}</Text>
                            <Text style={styles.mechanicSpecialty}>{job.mechanicId.specialty}</Text>
                            {job.mechanicId.experience && (
                                <Text style={styles.mechanicExp}>{job.mechanicId.experience} Experience</Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Faulty Parts */}
            {job.faultyParts.length > 0 && (
                <View style={styles.card}>
                    <View style={styles.cardTitle}>
                        <Icon name="alert-circle" size={18} color={colors.danger} />
                        <Text style={styles.cardTitleText}>Issues Found ({job.faultyParts.length})</Text>
                    </View>
                    {job.faultyParts.map((part, i) => (
                        <View key={i} style={styles.faultRow}>
                            <Text style={styles.faultName}>{part.partName}</Text>
                            <Text style={styles.faultCost}>₹{part.estimatedCost?.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Waiting for Store */}
            {(job.status === 'Approved' || job.status === 'Parts Requested') && (
                <View style={styles.warningCard}>
                    <Text style={styles.warningIcon}>📦</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.warningTitle}>
                            {job.status === 'Approved'
                                ? '⏳ Waiting for Store to Issue Parts'
                                : '✅ Parts Issued — Waiting for Store'}
                        </Text>
                        <Text style={styles.warningSubtitle}>
                            {job.status === 'Approved'
                                ? 'Store user needs to issue parts from inventory.'
                                : 'Store has issued parts. Repair will begin soon.'}
                        </Text>
                        {job.partsIssued && job.partsIssued.length > 0 && (
                            <View style={styles.issuedPartsRow}>
                                {job.partsIssued.map((ip, i) => (
                                    <View key={i} style={styles.issuedPartBadge}>
                                        <Text style={styles.issuedPartText}>
                                            {ip.partName} × {ip.quantityIssued}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Assigned — Waiting for Mechanic */}
            {job.status === 'Assigned' && (
                <View style={[styles.warningCard, { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }]}>
                    <Text style={styles.warningIcon}>🔧</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.warningTitle, { color: '#1e40af' }]}>
                            Waiting for Mechanic Inspection
                        </Text>
                        <Text style={[styles.warningSubtitle, { color: '#3b82f6' }]}>
                            Mechanic will complete the inspection from their app.
                        </Text>
                    </View>
                </View>
            )}

            {/* Action Button */}
            {nextAction && (
                <TouchableOpacity
                    style={[commonStyles.buttonPrimary, { marginTop: 20, flexDirection: 'row', gap: 8 }]}
                    onPress={() => navigation.navigate(nextAction.screen, { jobId: job.jobId })}
                >
                    <Icon name={nextAction.icon} size={20} color={colors.white} />
                    <Text style={commonStyles.buttonText}>{nextAction.label}</Text>
                </TouchableOpacity>
            )}

            {/* View Invoice for completed jobs */}
            {job.status === 'Completed' && (
                <TouchableOpacity
                    style={[styles.secondaryBtn, { marginTop: 12 }]}
                    onPress={() => navigation.navigate('ManagerInvoice', { jobId: job.jobId })}
                >
                    <Icon name="receipt" size={18} color={colors.primary} />
                    <Text style={styles.secondaryBtnText}>View Invoice</Text>
                </TouchableOpacity>
            )}

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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    jobIdText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    stepsCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    stepItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 55,
    },
    stepCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepCircleActive: {
        backgroundColor: colors.primary,
    },
    stepCircleCurrent: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    stepLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: colors.textMuted,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: colors.primary,
    },
    card: {
        ...commonStyles.card,
        marginBottom: 12,
    },
    cardTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardTitleText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    mechanicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    mechanicAvatar: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mechanicAvatarText: {
        fontSize: 24,
    },
    mechanicName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mechanicSpecialty: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    mechanicExp: {
        fontSize: 12,
        color: colors.textMuted,
    },
    faultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
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
    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        backgroundColor: '#fefce8',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    warningIcon: {
        fontSize: 28,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400e',
        marginBottom: 4,
    },
    warningSubtitle: {
        fontSize: 12,
        color: '#78716c',
    },
    issuedPartsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    issuedPartBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    issuedPartText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1e40af',
    },
    secondaryBtn: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryBtnText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
});
