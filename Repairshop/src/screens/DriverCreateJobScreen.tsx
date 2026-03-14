import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useJobStore from '../store/jobStore';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';
import { carModels } from '../data/carModels';

export default function DriverCreateJobScreen() {
    const { createJob, loading } = useJobStore();
    const { logout } = useAuthStore();
    const user = useAuthStore((s) => s.user);

    const [customerName, setCustomerName] = useState('');
    const [mobile, setMobile] = useState('');
    const [carModel, setCarModel] = useState('');
    const [carNumber, setCarNumber] = useState('');
    const [kmDriven, setKmDriven] = useState('');
    const [location, setLocation] = useState('');
    const [showCarModal, setShowCarModal] = useState(false);
    const [carSearchText, setCarSearchText] = useState('');
    const [createdJobs, setCreatedJobs] = useState<{ jobId: string; customer: string }[]>([]);
    const [carImage, setCarImage] = useState<{ uri: string; type: string; name: string } | null>(null);

    const filteredCars = carModels.filter((m) =>
        m.toLowerCase().includes(carSearchText.toLowerCase()),
    );

    const resetForm = () => {
        setCustomerName('');
        setMobile('');
        setCarModel('');
        setCarNumber('');
        setKmDriven('');
        setLocation('');
        setCarImage(null);
    };

    const handleCreateJob = async () => {
        if (!customerName.trim()) {
            Alert.alert('Error', 'Customer name is required');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            Alert.alert('Error', 'Enter a valid 10-digit mobile number');
            return;
        }
        if (!carModel) {
            Alert.alert('Error', 'Please select a car model');
            return;
        }
        if (!carNumber.trim()) {
            Alert.alert('Error', 'Car number is required');
            return;
        }
        if (!kmDriven || parseInt(kmDriven) <= 0) {
            Alert.alert('Error', 'Enter valid kilometer reading');
            return;
        }
        if (!location.trim()) {
            Alert.alert('Error', 'Pickup location is required');
            return;
        }

        const job = await createJob({
            customerName: customerName.trim(),
            mobile: mobile.trim(),
            carModel,
            carNumber: carNumber.trim().toUpperCase(),
            kmDriven: parseInt(kmDriven),
            jobType: 'Pickup',
            location: location.trim(),
            carImage: carImage || undefined,
        });

        if (job) {
            setCreatedJobs((prev) => [{ jobId: job.jobId, customer: customerName }, ...prev]);
            Alert.alert('Success ✅', `Job ${job.jobId} created!\nPickup from: ${location}`, [
                { text: 'Create Another', onPress: resetForm },
            ]);
            resetForm();
        } else {
            const errMsg = useJobStore.getState().error;
            Alert.alert('Error', errMsg || 'Failed to create job');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#10b981" />
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🚛 Driver Portal</Text>
                    <Text style={styles.headerSubtitle}>Hello, {user?.name || 'Driver'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {/* Pickup Badge */}
                    <View style={styles.pickupBadge}>
                        <Text style={styles.pickupBadgeText}>🚛 PICKUP JOB ONLY</Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Create Pickup Job</Text>
                        <Text style={styles.cardSubtitle}>
                            Register vehicle for pickup service
                        </Text>

                        {/* Customer Name */}
                        <Text style={styles.label}>Customer Name *</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputIcon}>👤</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter customer name"
                                placeholderTextColor="#94a3b8"
                                value={customerName}
                                onChangeText={setCustomerName}
                            />
                        </View>

                        {/* Mobile */}
                        <Text style={styles.label}>Mobile Number *</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputPrefix}>+91</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="10-digit mobile"
                                placeholderTextColor="#94a3b8"
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>

                        {/* Car Model Selector */}
                        <Text style={styles.label}>Car Model *</Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setShowCarModal(true)}>
                            <Text style={carModel ? styles.selectText : styles.selectPlaceholder}>
                                {carModel || 'Select car model'}
                            </Text>
                            <Text style={{ fontSize: 16 }}>▼</Text>
                        </TouchableOpacity>

                        {/* Car Number */}
                        <Text style={styles.label}>Car Number *</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputIcon}>🚗</Text>
                            <TextInput
                                style={[styles.input, { textTransform: 'uppercase' }]}
                                placeholder="e.g. JH-01-AB-1234"
                                placeholderTextColor="#94a3b8"
                                value={carNumber}
                                onChangeText={setCarNumber}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* KM Driven */}
                        <Text style={styles.label}>Kilometer Driven *</Text>
                        <View style={styles.inputWrap}>
                            <Text style={styles.inputIcon}>📏</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Odometer reading"
                                placeholderTextColor="#94a3b8"
                                value={kmDriven}
                                onChangeText={setKmDriven}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Car Image */}
                        <Text style={styles.label}>Car Photo (Optional)</Text>
                        {carImage ? (
                            <View style={styles.imagePreviewWrap}>
                                <Image source={{ uri: carImage.uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setCarImage(null)}
                                >
                                    <Text style={{ fontSize: 18, color: '#dc2626', fontWeight: '700' }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.imagePickerRow}>
                                <TouchableOpacity
                                    style={styles.imagePickerBtn}
                                    onPress={() => {
                                        launchCamera(
                                            { mediaType: 'photo', quality: 0.7, maxWidth: 1200, maxHeight: 1200 },
                                            (response) => {
                                                if (response.assets && response.assets[0]) {
                                                    const asset = response.assets[0];
                                                    setCarImage({
                                                        uri: asset.uri!,
                                                        type: asset.type || 'image/jpeg',
                                                        name: asset.fileName || 'car_photo.jpg',
                                                    });
                                                }
                                            },
                                        );
                                    }}
                                >
                                    <Text style={{ fontSize: 24 }}>📷</Text>
                                    <Text style={styles.imagePickerText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.imagePickerBtn}
                                    onPress={() => {
                                        launchImageLibrary(
                                            { mediaType: 'photo', quality: 0.7, maxWidth: 1200, maxHeight: 1200 },
                                            (response) => {
                                                if (response.assets && response.assets[0]) {
                                                    const asset = response.assets[0];
                                                    setCarImage({
                                                        uri: asset.uri!,
                                                        type: asset.type || 'image/jpeg',
                                                        name: asset.fileName || 'car_photo.jpg',
                                                    });
                                                }
                                            },
                                        );
                                    }}
                                >
                                    <Text style={{ fontSize: 24 }}>🖼️</Text>
                                    <Text style={styles.imagePickerText}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Pickup Location */}
                        <View style={styles.locationSection}>
                            <Text style={styles.locationLabel}>📍 Pickup Location *</Text>
                            <TextInput
                                style={styles.locationInput}
                                placeholder="Enter full pickup address (e.g. 123, Main Road, Ranchi, Jharkhand)"
                                placeholderTextColor="#94a3b8"
                                value={location}
                                onChangeText={setLocation}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && { opacity: 0.7 }]}
                            onPress={handleCreateJob}
                            disabled={loading}
                            activeOpacity={0.8}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>🚛 Create Pickup Job</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Recently Created Jobs */}
                    {createdJobs.length > 0 && (
                        <View style={styles.recentCard}>
                            <Text style={styles.recentTitle}>
                                ✅ Created Today ({createdJobs.length})
                            </Text>
                            {createdJobs.map((j, i) => (
                                <View key={i} style={styles.recentRow}>
                                    <Text style={styles.recentJobId}>{j.jobId}</Text>
                                    <Text style={styles.recentCustomer}>{j.customer}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Car Model Picker Modal */}
            <Modal visible={showCarModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Car Model</Text>
                            <TouchableOpacity onPress={() => setShowCarModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearch}>
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search car model..."
                                placeholderTextColor="#94a3b8"
                                value={carSearchText}
                                onChangeText={setCarSearchText}
                            />
                        </View>
                        <FlatList
                            data={filteredCars}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        item === carModel && styles.modalItemActive,
                                    ]}
                                    onPress={() => {
                                        setCarModel(item);
                                        setShowCarModal(false);
                                        setCarSearchText('');
                                    }}>
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            item === carModel && styles.modalItemTextActive,
                                        ]}>
                                        {item}
                                    </Text>
                                    {item === carModel && (
                                        <Text style={{ color: '#10b981', fontSize: 18 }}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.modalEmpty}>No car models found</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: '#10b981',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    pickupBadge: {
        backgroundColor: '#ecfdf5',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    pickupBadgeText: {
        color: '#059669',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 6,
        marginTop: 12,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    inputPrefix: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        height: '100%',
    },
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        paddingHorizontal: 14,
        height: 50,
    },
    selectText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    selectPlaceholder: {
        fontSize: 15,
        color: '#94a3b8',
    },
    locationSection: {
        marginTop: 16,
        backgroundColor: '#ecfdf5',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 8,
    },
    locationInput: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1fae5',
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
        minHeight: 80,
    },
    submitButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    submitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    // ─── Recent Jobs ────────────
    recentCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    recentTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 12,
    },
    recentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    recentJobId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    recentCustomer: {
        fontSize: 14,
        color: '#64748b',
    },
    // ─── Car Modal ──────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    modalClose: {
        fontSize: 22,
        color: '#94a3b8',
        fontWeight: '600',
    },
    modalSearch: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    modalSearchInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1e293b',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    modalItemActive: {
        backgroundColor: '#ecfdf5',
    },
    modalItemText: {
        fontSize: 15,
        color: '#334155',
    },
    modalItemTextActive: {
        fontWeight: '700',
        color: '#10b981',
    },
    modalEmpty: {
        textAlign: 'center',
        padding: 24,
        color: '#94a3b8',
        fontSize: 14,
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    imagePickerBtn: {
        flex: 1,
        height: 80,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#d1fae5',
        borderStyle: 'dashed',
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    imagePickerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },
    imagePreviewWrap: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    imagePreview: {
        width: '100%',
        height: 160,
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
