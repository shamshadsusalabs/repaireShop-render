import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useJobStore from '../../store/jobStore';
import { colors, commonStyles } from '../../theme';
import { carModels } from '../../data/carModels';

type Nav = NativeStackNavigationProp<any>;

export default function ManagerCreateJobScreen() {
    const navigation = useNavigation<Nav>();
    const { createJob, searchHistory, customerHistory, loading } = useJobStore();

    const [mobile, setMobile] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [carNumber, setCarNumber] = useState('');
    const [carModel, setCarModel] = useState('');
    const [kmDriven, setKmDriven] = useState('');
    const [jobType, setJobType] = useState<'Walk-in' | 'Pickup'>('Walk-in');
    const [location, setLocation] = useState('');
    const [showCarModels, setShowCarModels] = useState(false);
    const [filteredModels, setFilteredModels] = useState(carModels);
    const [carImages, setCarImages] = useState<Array<{ uri: string; type: string; name: string }>>([]);

    // Auto-fill when history found
    useEffect(() => {
        if (customerHistory.customer) {
            const c = customerHistory.customer;
            setCustomerName(c.customerName);
            setMobile(c.mobile);
            setCarModel(c.carModel);
            setCarNumber(c.carNumber);
            setKmDriven(String(c.kmDriven));
            Alert.alert('Found!', `Existing customer: ${c.customerName}`);
        }
    }, [customerHistory]);

    const handleSearch = (value: string) => {
        if (value.length >= 4) {
            searchHistory(value);
        }
    };

    const handleCarModelSearch = (text: string) => {
        setCarModel(text);
        const filtered = carModels.filter(m =>
            m.toLowerCase().includes(text.toLowerCase()),
        );
        setFilteredModels(filtered);
        setShowCarModels(text.length > 0 && filtered.length > 0);
    };

    const handleSubmit = async () => {
        // Validation
        if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
            Alert.alert('Error', 'Enter a valid 10-digit mobile number');
            return;
        }
        if (!customerName.trim()) {
            Alert.alert('Error', 'Customer name is required');
            return;
        }
        if (!carNumber.trim()) {
            Alert.alert('Error', 'Car number is required');
            return;
        }
        if (!carModel.trim()) {
            Alert.alert('Error', 'Car model is required');
            return;
        }
        if (!kmDriven || isNaN(Number(kmDriven))) {
            Alert.alert('Error', 'Valid KM driven is required');
            return;
        }
        if (jobType === 'Pickup' && !location.trim()) {
            Alert.alert('Error', 'Pickup location is required');
            return;
        }

        const job = await createJob({
            customerName: customerName.trim(),
            mobile,
            carModel,
            carNumber: carNumber.toUpperCase(),
            kmDriven: Number(kmDriven),
            jobType,
            location: location.trim(),
            carImages: carImages.length > 0 ? carImages : undefined,
        });

        if (job) {
            Alert.alert('Success', `Job ${job.jobId} created!`);
            navigation.replace('ManagerJobDetails', { jobId: job.jobId });
        }
    };

    return (
        <KeyboardAvoidingView
            style={commonStyles.screenContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* Auto-generated info */}
                <View style={styles.infoBox}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>JOB ID</Text>
                        <Text style={styles.infoValue}>Auto Generated</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>DATE & TIME</Text>
                        <Text style={styles.infoValue}>
                            {new Date().toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Text>
                    </View>
                </View>

                {/* Mobile */}
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputRow}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                        style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                        placeholder="Enter mobile"
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onBlur={() => handleSearch(mobile)}
                        placeholderTextColor={colors.textMuted}
                    />
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={() => handleSearch(mobile)}
                    >
                        <Icon name="magnify" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Customer Name */}
                <Text style={styles.label}>Customer Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter customer name"
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholderTextColor={colors.textMuted}
                />

                {/* Car Number */}
                <Text style={styles.label}>Car Number</Text>
                <TextInput
                    style={[styles.input, { textTransform: 'uppercase' }]}
                    placeholder="e.g. MH-12-AB-1234"
                    value={carNumber}
                    onChangeText={setCarNumber}
                    autoCapitalize="characters"
                    onBlur={() => handleSearch(carNumber)}
                    placeholderTextColor={colors.textMuted}
                />

                {/* Car Model */}
                <Text style={styles.label}>Car Model</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search car model..."
                    value={carModel}
                    onChangeText={handleCarModelSearch}
                    onFocus={() => setShowCarModels(filteredModels.length > 0)}
                    placeholderTextColor={colors.textMuted}
                />
                {showCarModels && (
                    <View style={styles.dropdown}>
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                            {filteredModels.map((model, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setCarModel(model);
                                        setShowCarModels(false);
                                    }}
                                >
                                    <Text style={styles.dropdownText}>{model}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* KM Driven */}
                <Text style={styles.label}>Kilometer Driven</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter current odometer reading"
                    value={kmDriven}
                    onChangeText={setKmDriven}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                />

                {/* Job Type */}

                {/* Car Images */}
                <Text style={styles.label}>Car Images (Max 10)</Text>
                <Text style={styles.imageCount}>{carImages.length}/10 images</Text>
                
                {/* Image Grid */}
                {carImages.length > 0 && (
                    <View style={styles.imageGrid}>
                        {carImages.map((image, index) => (
                            <View key={index} style={styles.imagePreviewWrap}>
                                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setCarImages(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <Icon name="close-circle" size={26} color={colors.danger} />
                                </TouchableOpacity>
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
                        >
                            <Icon name="camera" size={24} color={colors.primary} />
                            <Text style={styles.imagePickerText}>Camera</Text>
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
                        >
                            <Icon name="image" size={24} color={colors.primary} />
                            <Text style={styles.imagePickerText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Job Type */}
                <Text style={styles.label}>Job Type</Text>
                <View style={styles.jobTypeRow}>
                    <TouchableOpacity
                        style={[
                            styles.jobTypeBtn,
                            jobType === 'Walk-in' && styles.jobTypeBtnActive,
                        ]}
                        onPress={() => setJobType('Walk-in')}
                    >
                        <Text style={styles.jobTypeIcon}>🚗</Text>
                        <Text
                            style={[
                                styles.jobTypeText,
                                jobType === 'Walk-in' && styles.jobTypeTextActive,
                            ]}
                        >
                            Walk-in
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.jobTypeBtn,
                            jobType === 'Pickup' && styles.jobTypeBtnActive,
                        ]}
                        onPress={() => setJobType('Pickup')}
                    >
                        <Text style={styles.jobTypeIcon}>🚛</Text>
                        <Text
                            style={[
                                styles.jobTypeText,
                                jobType === 'Pickup' && styles.jobTypeTextActive,
                            ]}
                        >
                            Pickup
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Location (if Pickup) */}
                {jobType === 'Pickup' && (
                    <>
                        <Text style={styles.label}>📍 Pickup Location</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Enter full pickup address"
                            value={location}
                            onChangeText={setLocation}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={colors.textMuted}
                        />
                    </>
                )}

                {/* History Panel */}
                {customerHistory.history.length > 0 && (
                    <View style={styles.historyPanel}>
                        <View style={styles.historyHeader}>
                            <Icon name="history" size={18} color={colors.primary} />
                            <Text style={styles.historyTitle}>
                                Service History ({customerHistory.history.length})
                            </Text>
                        </View>
                        {customerHistory.history.map((h, i) => (
                            <View key={i} style={styles.historyItem}>
                                <Text style={styles.historyJobId}>{h.jobId}</Text>
                                <Text style={styles.historyDate}>
                                    {new Date(h.date).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}
                                </Text>
                                <Text style={styles.historyTotal}>₹{h.grandTotal?.toLocaleString() || 0}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                    style={[commonStyles.buttonPrimary, { marginTop: 24 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={commonStyles.buttonText}>Save & Continue</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#eef2ff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#c7d2fe',
        alignItems: 'center',
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6366f1',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e1b4b',
        marginTop: 4,
    },
    infoDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#c7d2fe',
        marginHorizontal: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        ...commonStyles.input,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prefix: {
        height: 52,
        lineHeight: 52,
        paddingHorizontal: 14,
        backgroundColor: '#f1f5f9',
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        borderRightWidth: 0,
        fontWeight: '600',
        color: colors.textSecondary,
        fontSize: 15,
    },
    searchBtn: {
        height: 52,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2ff',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        borderLeftWidth: 0,
    },
    dropdown: {
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    dropdownText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    jobTypeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    jobTypeBtn: {
        flex: 1,
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.white,
    },
    jobTypeBtnActive: {
        borderColor: colors.primary,
        backgroundColor: '#eef2ff',
    },
    jobTypeIcon: {
        fontSize: 20,
    },
    jobTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    jobTypeTextActive: {
        color: colors.primary,
    },
    historyPanel: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    historyJobId: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
        flex: 1,
    },
    historyDate: {
        fontSize: 12,
        color: colors.textMuted,
        flex: 1,
        textAlign: 'center',
    },
    historyTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    imagePickerBtn: {
        flex: 1,
        height: 80,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        borderStyle: 'dashed',
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    imagePickerText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    imageCount: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 8,
        fontWeight: '600',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    imagePreviewWrap: {
        position: 'relative',
        width: '48%',
        aspectRatio: 1,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 14,
    },
});
