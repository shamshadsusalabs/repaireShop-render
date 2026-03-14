import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobStore from '../../store/jobStore';
import useMechanicStore from '../../store/mechanicStore';
import { colors, commonStyles } from '../../theme';
import type { Mechanic } from '../../types';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerAssignMechanicScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute();
    const { jobId } = route.params as { jobId: string };
    const { assignMechanic, loading: jobLoading } = useJobStore();
    const { mechanics, loading: mechLoading, fetchMechanics } = useMechanicStore();

    useEffect(() => {
        fetchMechanics();
    }, [fetchMechanics]);

    const handleAssign = async (mech: Mechanic) => {
        Alert.alert(
            'Assign Mechanic',
            `Assign ${mech.name} to ${jobId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Assign',
                    onPress: async () => {
                        try {
                            await assignMechanic(jobId, mech._id);
                            Alert.alert('Success', `${mech.name} assigned to ${jobId}`);
                            navigation.goBack();
                        } catch {
                            Alert.alert('Error', 'Failed to assign mechanic');
                        }
                    },
                },
            ],
        );
    };

    const loading = jobLoading || mechLoading;

    const renderMechanic = ({ item }: { item: Mechanic }) => (
        <TouchableOpacity
            style={[styles.mechCard, !item.available && styles.mechCardDisabled]}
            activeOpacity={item.available ? 0.7 : 1}
            onPress={() => item.available && handleAssign(item)}
        >
            <View style={styles.mechAvatar}>
                <Text style={styles.mechAvatarText}>{item.avatar}</Text>
            </View>
            <View style={styles.mechInfo}>
                <Text style={styles.mechName}>{item.name}</Text>
                <View style={styles.mechMeta}>
                    <Icon name="clock-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.mechMetaText}>{item.experience}</Text>
                </View>
                <View style={styles.mechMeta}>
                    <Icon name="star" size={13} color="#f59e0b" />
                    <Text style={styles.mechMetaText}>{item.specialty}</Text>
                </View>
            </View>
            <View style={styles.mechRight}>
                <View style={[styles.availBadge, { backgroundColor: item.available ? '#d1fae5' : '#fee2e2' }]}>
                    <Text style={[styles.availText, { color: item.available ? '#059669' : '#dc2626' }]}>
                        {item.available ? 'Available' : 'Busy'}
                    </Text>
                </View>
                {item.available && (
                    <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssign(item)}>
                        <Icon name="check" size={18} color={colors.white} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading && mechanics.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={commonStyles.screenContainer}>
            <View style={styles.header}>
                <Text style={styles.subtitle}>Select a mechanic for</Text>
                <Text style={styles.jobIdText}>{jobId}</Text>
            </View>
            <FlatList
                data={mechanics}
                keyExtractor={item => item._id}
                renderItem={renderMechanic}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="account-off" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No mechanics found</Text>
                    </View>
                }
            />
        </View>
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
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    jobIdText: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
        marginTop: 2,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mechCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    mechCardDisabled: {
        opacity: 0.5,
    },
    mechAvatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mechAvatarText: {
        fontSize: 28,
    },
    mechInfo: {
        flex: 1,
        marginLeft: 14,
        gap: 3,
    },
    mechName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mechMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    mechMetaText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    mechRight: {
        alignItems: 'center',
        gap: 8,
    },
    availBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    availText: {
        fontSize: 10,
        fontWeight: '700',
    },
    assignBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
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
