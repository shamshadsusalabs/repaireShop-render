import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import useAuthStore from '../../store/authStore';
import { colors, statusColors, statusBgColors, commonStyles } from '../../theme';
import type { Job, JobStatus } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<any>;

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

const statIcons: Record<string, string> = {
    total: 'car-multiple',
    pending: 'clock-outline',
    inProgress: 'sync',
    completed: 'check-circle-outline',
};

export default function ManagerDashboardScreen() {
    const { jobs, loading, fetchJobs } = useJobStore();
    const { user, logout } = useAuthStore();
    const navigation = useNavigation<Nav>();
    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobs();
        setRefreshing(false);
    }, [fetchJobs]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const totalCars = jobs.length;
    const pending = jobs.filter(j => j.status === 'Pending').length;
    const inProgress = jobs.filter(j =>
        ['Assigned', 'Inspection', 'Approval', 'Approved', 'Parts Requested', 'Repairing'].includes(j.status),
    ).length;
    const completed = jobs.filter(j => j.status === 'Completed').length;

    const stats = [
        { label: 'Total', value: totalCars, icon: statIcons.total, color: colors.primary, bg: '#eef2ff' },
        { label: 'Pending', value: pending, icon: statIcons.pending, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'In Progress', value: inProgress, icon: statIcons.inProgress, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Completed', value: completed, icon: statIcons.completed, color: '#10b981', bg: '#ecfdf5' },
    ];

    const renderJobCard = ({ item }: { item: Job }) => (
        <TouchableOpacity
            style={styles.jobCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ManagerJobDetails', { jobId: item.jobId })}
        >
            <View style={styles.jobCardHeader}>
                <Text style={styles.jobId}>{item.jobId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBgColors[item.status] || '#f1f5f9' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status] || '#64748b' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.jobCardBody}>
                <View style={styles.jobInfoRow}>
                    <Icon name="account" size={16} color={colors.textMuted} />
                    <Text style={styles.jobInfoText}>{item.customerName}</Text>
                </View>
                <View style={styles.jobInfoRow}>
                    <Icon name="car" size={16} color={colors.textMuted} />
                    <Text style={styles.jobInfoText}>
                        {item.carModel} <Text style={styles.carNumber}>({item.carNumber})</Text>
                    </Text>
                </View>
                <View style={styles.jobInfoRow}>
                    <Icon name="calendar" size={16} color={colors.textMuted} />
                    <Text style={styles.jobInfoText}>
                        {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
            </View>
            <View style={styles.jobCardFooter}>
                <Text style={styles.viewDetails}>View Details →</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && jobs.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={commonStyles.screenContainer}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back 👋</Text>
                    <Text style={styles.userName}>{user?.name || 'Manager'}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => navigation.navigate('ManagerCreateJob')}
                    >
                        <Icon name="plus" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Icon name="logout" size={22} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                {stats.map((stat, i) => (
                    <View key={i} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                        <Icon name={stat.icon} size={22} color={stat.color} />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* Jobs List */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Recent Jobs</Text>
                <Text style={styles.listCount}>{jobs.length} jobs</Text>
            </View>

            <FlatList
                data={jobs}
                keyExtractor={item => item.jobId || item._id}
                renderItem={renderJobCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="car-off" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No jobs found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    greeting: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    createBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
        marginTop: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    listCount: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    jobCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    jobCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 10,
    },
    jobId: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    jobCardBody: {
        paddingHorizontal: 16,
        gap: 6,
    },
    jobInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    jobInfoText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    carNumber: {
        color: colors.textMuted,
        fontSize: 12,
    },
    jobCardFooter: {
        padding: 16,
        paddingTop: 12,
        alignItems: 'flex-end',
    },
    viewDetails: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
});
