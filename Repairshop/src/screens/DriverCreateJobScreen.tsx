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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useJobStore from '../store/jobStore';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';
import { carModels } from '../data/carModels';

const { width } = Dimensions.get('window');

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
    const [carImages, setCarImages] = useState<Array<{ uri: string; type: string; name: string }>>([]);

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
        setCarImages([]);
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
            carImages: carImages.length > 0 ? carImages : undefined,
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
            
            {/* Premium Header */}
            <View style={styles.headerGradient}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.iconEmoji}>🚛</Text>
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Driver Portal</Text>
                                <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'Driver'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {/* Stats Badge */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statsBadge}>
                            <View style={styles.statsIcon}>
                                <Text style={styles.statsIconText}>🚛</Text>
                            </View>
                            <View style={styles.statsContent}>
                                <Text style={styles.statsLabel}>Job Type</Text>
                                <Text style={styles.statsValue}>Pickup Service Only</Text>
                            </View>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderIcon}>
                                <Text style={styles.cardHeaderEmoji}>📝</Text>
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>Create New Job</Text>
                                <Text style={styles.cardSubtitle}>Fill in vehicle details</Text>
                            </View>
                        </View>

                        {/* Customer Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>👤 </Text>
                                Customer Name
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#94a3b8"
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                />
                            </View>
                        </View>

                        {/* Mobile */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>📱 </Text>
                                Mobile Number
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <View style={styles.inputPrefix}>
                                    <Text style={styles.inputPrefixText}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.inputWithPrefix]}
                                    placeholder="10-digit mobile"
                                    placeholderTextColor="#94a3b8"
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        {/* Car Model Selector */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>🚗 </Text>
                                Car Model
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setShowCarModal(true)}
                                activeOpacity={0.7}>
                                <Text style={carModel ? styles.selectText : styles.selectPlaceholder}>
                                    {carModel || 'Select car model'}
                                </Text>
                                <Text style={styles.selectArrow}>▼</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Car Number */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>🔢 </Text>
                                Registration Number
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, { textTransform: 'uppercase' }]}
                                    placeholder="e.g. JH-01-AB-1234"
                                    placeholderTextColor="#94a3b8"
                                    value={carNumber}
                                    onChangeText={setCarNumber}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        {/* KM Driven */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>📏 </Text>
                                Odometer Reading
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Current kilometer reading"
                                    placeholderTextColor="#94a3b8"
                                    value={kmDriven}
                                    onChangeText={setKmDriven}
                                    keyboardType="numeric"
                                />
                                <View style={styles.inputSuffix}>
                                    <Text style={styles.inputSuffixText}>KM</Text>
                                </View>
                            </View>
                        </View>

                        {/* Car Images */}
                        <View style={styles.formGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>
                                    <Text style={styles.labelIcon}>📸 </Text>
                                    Vehicle Photos
                                </Text>
                                <View style={styles.imageCountBadge}>
                                    <Text style={styles.imageCountText}>{carImages.length}/10</Text>
                                </View>
                            </View>
                            
                            {/* Image Grid */}
                            {carImages.length > 0 && (
                                <View style={styles.imageGrid}>
                                    {carImages.map((image, index) => (
                                        <View key={index} style={styles.imageCard}>
                                            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                                            <TouchableOpacity
                                                style={styles.removeImageBtn}
                                                onPress={() => setCarImages(prev => prev.filter((_, i) => i !== index))}
                                                activeOpacity={0.8}>
                                                <Text style={styles.removeImageText}>✕</Text>
                                            </TouchableOpacity>
                                            <View style={styles.imageNumber}>
                                                <Text style={styles.imageNumberText}>{index + 1}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                            
                            {/* Add Image Buttons */}
                            {carImages.length < 10 && (
                                <View style={styles.imagePickerRow}>
                                    <TouchableOpacity
                                        style={styles.imagePickerBtn}
                                        onPress={() => {
                                            launchCamera(
                                                { mediaType: 'photo', quality: 0.7, maxWidth: 1200, maxHeight: 1200 },
                                                (response) => {
                                                    if (response.assets && response.assets[0]) {
                                                        const asset = response.assets[0];
                                                        setCarImages(prev => [...prev, {
                                                            uri: asset.uri!,
                                                            type: asset.type || 'image/jpeg',
                                                            name: asset.fileName || `car_photo_${Date.now()}.jpg`,
                                                        }]);
                                                    }
                                                },
                                            );
                                        }}
                                        activeOpacity={0.7}>
                                        <View style={styles.imagePickerGradient}>
                                            <View style={styles.imagePickerIcon}>
                                                <Text style={styles.imagePickerEmoji}>📷</Text>
                                            </View>
                                            <Text style={styles.imagePickerText}>Camera</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.imagePickerBtn}
                                        onPress={() => {
                                            launchImageLibrary(
                                                { 
                                                    mediaType: 'photo', 
                                                    quality: 0.7, 
                                                    maxWidth: 1200, 
                                                    maxHeight: 1200,
                                                    selectionLimit: 10 - carImages.length,
                                                },
                                                (response) => {
                                                    if (response.assets) {
                                                        const newImages = response.assets.map((asset, idx) => ({
                                                            uri: asset.uri!,
                                                            type: asset.type || 'image/jpeg',
                                                            name: asset.fileName || `car_photo_${Date.now()}_${idx}.jpg`,
                                                        }));
                                                        setCarImages(prev => [...prev, ...newImages].slice(0, 10));
                                                    }
                                                },
                                            );
                                        }}
                                        activeOpacity={0.7}>
                                        <View style={[styles.imagePickerGradient, styles.imagePickerGradient2]}>
                                            <View style={styles.imagePickerIcon}>
                                                <Text style={styles.imagePickerEmoji}>🖼️</Text>
                                            </View>
                                            <Text style={styles.imagePickerText}>Gallery</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Pickup Location */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>📍 </Text>
                                Pickup Location
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.locationCard}>
                                <TextInput
                                    style={styles.locationInput}
                                    placeholder="Enter complete pickup address with landmarks"
                                    placeholderTextColor="#94a3b8"
                                    value={location}
                                    onChangeText={setLocation}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleCreateJob}
                            disabled={loading}
                            activeOpacity={0.8}>
                            <View style={[styles.submitGradient, loading && styles.submitDisabled]}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.submitIcon}>✓</Text>
                                        <Text style={styles.submitText}>Create Pickup Job</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recently Created Jobs */}
                    {createdJobs.length > 0 && (
                        <View style={styles.recentCard}>
                            <View style={styles.recentHeader}>
                                <View style={styles.recentHeaderIcon}>
                                    <Text style={styles.recentHeaderEmoji}>✅</Text>
                                </View>
                                <View>
                                    <Text style={styles.recentTitle}>Today's Jobs</Text>
                                    <Text style={styles.recentSubtitle}>{createdJobs.length} jobs created</Text>
                                </View>
                            </View>
                            {createdJobs.map((j, i) => (
                                <View key={i} style={styles.recentRow}>
                                    <View style={styles.recentJobBadge}>
                                        <Text style={styles.recentJobId}>{j.jobId}</Text>
                                    </View>
                                    <Text style={styles.recentCustomer}>{j.customer}</Text>
                                    <View style={styles.recentCheck}>
                                        <Text style={styles.recentCheckIcon}>✓</Text>
                                    </View>
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
                            <View style={styles.modalHeaderLeft}>
                                <View style={styles.modalHeaderIcon}>
                                    <Text style={styles.modalHeaderEmoji}>🚗</Text>
                                </View>
                                <Text style={styles.modalTitle}>Select Car Model</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.modalCloseBtn}
                                onPress={() => setShowCarModal(false)}
                                activeOpacity={0.7}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearch}>
                            <Text style={styles.searchIcon}>🔍</Text>
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
                                    }}
                                    activeOpacity={0.7}>
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            item === carModel && styles.modalItemTextActive,
                                        ]}>
                                        {item}
                                    </Text>
                                    {item === carModel && (
                                        <View style={styles.modalCheckIcon}>
                                            <Text style={styles.modalCheckText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.modalEmptyContainer}>
                                    <Text style={styles.modalEmptyIcon}>🔍</Text>
                                    <Text style={styles.modalEmpty}>No car models found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    // ─── Premium Header ─────────────────────────────────────────
    headerGradient: {
        paddingBottom: 20,
        backgroundColor: '#0ea5e9',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconEmoji: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoutText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    // ─── Content ────────────────────────────────────────────────
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    // ─── Stats Badge ────────────────────────────────────────────
    statsContainer: {
        marginBottom: 20,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: '#a7f3d0',
        backgroundColor: '#ecfdf5',
    },
    statsIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsIconText: {
        fontSize: 22,
    },
    statsContent: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#047857',
        marginTop: 2,
    },
    // ─── Card ───────────────────────────────────────────────────
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    cardHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeaderEmoji: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: 0.2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '500',
    },
    // ─── Form Groups ────────────────────────────────────────────
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    labelIcon: {
        fontSize: 14,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    required: {
        color: '#ef4444',
        fontWeight: '800',
    },
    // ─── Inputs ─────────────────────────────────────────────────
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontWeight: '500',
    },
    inputWithPrefix: {
        paddingLeft: 0,
    },
    inputPrefix: {
        paddingLeft: 16,
        paddingRight: 12,
        borderRightWidth: 2,
        borderRightColor: '#e2e8f0',
    },
    inputPrefixText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
    },
    inputSuffix: {
        paddingRight: 16,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#e2e8f0',
    },
    inputSuffixText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    // ─── Select Button ──────────────────────────────────────────
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectText: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '600',
    },
    selectPlaceholder: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
    },
    selectArrow: {
        fontSize: 12,
        color: '#64748b',
    },
    // ─── Location ───────────────────────────────────────────────
    locationCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    locationInput: {
        fontSize: 14,
        color: '#0f172a',
        padding: 16,
        minHeight: 100,
        fontWeight: '500',
    },
    // ─── Image Picker ───────────────────────────────────────────
    imageCountBadge: {
        backgroundColor: '#0ea5e9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    imageCountText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    imageCard: {
        position: 'relative',
        width: (width - 88) / 2,
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    removeImageText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '700',
    },
    imageNumber: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageNumberText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    imagePickerBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    imagePickerGradient: {
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        backgroundColor: '#f0f9ff',
    },
    imagePickerGradient2: {
        backgroundColor: '#faf5ff',
    },
    imagePickerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePickerEmoji: {
        fontSize: 20,
    },
    imagePickerText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: 0.3,
    },
    // ─── Submit Button ──────────────────────────────────────────
    submitButton: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
        backgroundColor: '#0ea5e9',
    },
    submitDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitIcon: {
        fontSize: 20,
        color: '#fff',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // ─── Recent Jobs ────────────────────────────────────────────
    recentCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    recentHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentHeaderEmoji: {
        fontSize: 18,
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    recentSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '500',
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    recentJobBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    recentJobId: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0ea5e9',
    },
    recentCustomer: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
    },
    recentCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentCheckIcon: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    // ─── Modal ──────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeaderEmoji: {
        fontSize: 18,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalClose: {
        fontSize: 20,
        color: '#64748b',
        fontWeight: '600',
    },
    modalSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 10,
    },
    searchIcon: {
        fontSize: 16,
        position: 'absolute',
        left: 36,
        zIndex: 1,
    },
    modalSearchInput: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingLeft: 40,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0f172a',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        fontWeight: '500',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    modalItemActive: {
        backgroundColor: '#eff6ff',
    },
    modalItemText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    modalItemTextActive: {
        fontWeight: '700',
        color: '#0ea5e9',
    },
    modalCheckIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCheckText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    modalEmptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    modalEmptyIcon: {
        fontSize: 48,
        marginBottom: 12,
        opacity: 0.5,
    },
    modalEmpty: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});
