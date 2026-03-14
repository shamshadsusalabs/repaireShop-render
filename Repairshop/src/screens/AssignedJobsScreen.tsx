import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';
import useJobStore from '../store/jobStore';
import { colors, statusColors, statusBgColors, commonStyles } from '../theme';
import type { Job } from '../types';

type RootStackParamList = {
    AssignedJobs: undefined;
    JobDetails: { jobId: string };
    Inspection: { jobId: string };
};

export default function AssignedJobsScreen() {
    const { user, logout } = useAuthStore();
    const { jobs: allJobs, loading: storeLoading, fetchJobs: storeFetchJobs } = useJobStore();
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [refreshing, setRefreshing] = useState(false);

    // Filter jobs assigned to this mechanic
    const jobs = allJobs.filter(
        (job: Job) => job.mechanicId?._id === user?.id,
    );
    const loading = storeLoading;

    const fetchJobs = useCallback(async () => {
        await storeFetchJobs();
        setRefreshing(false);
    }, [storeFetchJobs]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchJobs();
    }, [fetchJobs]);

    // Stats
    const assignedCount = jobs.filter(j =>
        ['Assigned'].includes(j.status),
    ).length;
    const inProgressCount = jobs.filter(j =>
        ['Inspection', 'Approval', 'Approved', 'Repairing'].includes(j.status),
    ).length;
    const completedCount = jobs.filter(j => j.status === 'Completed').length;

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderJobCard = ({ item }: { item: Job }) => (
        <TouchableOpacity
            style={styles.jobCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('JobDetails', { jobId: item.jobId })}>
            <View style={styles.jobCardHeader}>
                <Text style={styles.jobId}>{item.jobId}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: statusBgColors[item.status] || '#f1f5f9' },
                    ]}>
                    <Text
                        style={[
                            styles.statusText,
                            { color: statusColors[item.status] || colors.textSecondary },
                        ]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.jobCardBody}>
                <View style={styles.jobRow}>
                    <Text style={styles.jobLabel}>👤</Text>
                    <Text style={styles.jobValue}>{item.customerName}</Text>
                </View>
                <View style={styles.jobRow}>
                    <Text style={styles.jobLabel}>🚗</Text>
                    <Text style={styles.jobValue}>
                        {item.carModel}{' '}
                        <Text style={styles.carNumber}>({item.carNumber})</Text>
                    </Text>
                </View>
                <View style={styles.jobRow}>
                    <Text style={styles.jobLabel}>📅</Text>
                    <Text style={styles.jobDate}>{formatDate(item.date)}</Text>
                </View>
            </View>

            <View style={styles.jobCardFooter}>
                <Text style={styles.viewDetails}>View Details →</Text>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name || 'Mechanic'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutIcon}>🚪</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
                    <Text style={styles.statValue}>{assignedCount}</Text>
                    <Text style={styles.statLabel}>Assigned</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
                    <Text style={styles.statValue}>{inProgressCount}</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.statValue}>{completedCount}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Jobs</Text>
                <Text style={styles.jobCount}>{jobs.length} total</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={commonStyles.screenContainer}>
            <FlatList
                data={jobs}
                renderItem={renderJobCard}
                keyExtractor={item => item.jobId}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>No Jobs Assigned</Text>
                        <Text style={styles.emptySubtitle}>
                            When admin assigns you a job, it will appear here.
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 8,
    },
    greeting: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    logoutIcon: {
        fontSize: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    jobCount: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    jobCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: 'hidden',
    },
    jobCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    jobId: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    jobCardBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    jobLabel: {
        fontSize: 16,
        width: 24,
    },
    jobValue: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
        flex: 1,
    },
    carNumber: {
        color: colors.textMuted,
        fontSize: 12,
    },
    jobDate: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    jobCardFooter: {
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'flex-end',
    },
    viewDetails: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});
