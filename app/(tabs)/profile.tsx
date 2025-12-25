
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    RefreshControl,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi, StudentProfileDetails } from '../../services/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { theme, toggleTheme } = useTheme();
    const { i18n, setLanguage, language } = useLanguage();
    const { logout } = useAuth();
    const colors = Colors[theme];

    const [profile, setProfile] = useState<StudentProfileDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [editedFirstName, setEditedFirstName] = useState('');
    const [editedLastName, setEditedLastName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [editedPhone, setEditedPhone] = useState('');

    // Animation values
    const [fadeAnim] = useState(new RNAnimated.Value(0));
    const [slideAnim] = useState(new RNAnimated.Value(20));

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await StudentApi.getProfile();
            setProfile(data);

            // Trigger animation
            RNAnimated.parallel([
                RNAnimated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]).start();
        } catch (e) {
            console.warn('Profile fetch failed', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const [langModalVisible, setLangModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const languages = [
        { code: 'uz', label: 'O\'zbek tili', icon: '🇺🇿' },
        { code: 'ru', label: 'Русский язык', icon: '🇷🇺' },
        { code: 'en', label: 'English', icon: '🇺🇸' },
    ];

    const handleEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (profile) {
            setEditedFirstName(profile.first_name);
            setEditedLastName(profile.last_name);
            setEditedEmail(profile.email);
            setEditedPhone(profile.phone || '');
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedFirstName('');
        setEditedLastName('');
        setEditedEmail('');
        setEditedPhone('');
    };

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Validation
        if (!editedFirstName.trim() || !editedLastName.trim() || !editedEmail.trim()) {
            Alert.alert(i18n.update_error || 'Error', 'Please fill in all required fields');
            return;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedEmail)) {
            Alert.alert(i18n.update_error || 'Error', 'Please enter a valid email address');
            return;
        }

        try {
            setSaving(true);
            const updatedProfile = await StudentApi.updateProfile({
                first_name: editedFirstName,
                last_name: editedLastName,
                email: editedEmail,
                phone: editedPhone || null,
            });

            setProfile({
                ...updatedProfile,
                username: profile?.username || '',
            } as StudentProfileDetails);
            setIsEditing(false);
            Alert.alert(i18n.update_success || 'Success');
        } catch (error) {
            console.error('Profile update failed:', error);
            Alert.alert(i18n.update_error || 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleImagePick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant permission to access your photos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setUploadingPicture(true);
                try {
                    const updatedProfile = await StudentApi.updateProfilePicture(
                        asset.uri,
                        asset.fileName || 'profile.jpg',
                        asset.mimeType || 'image/jpeg'
                    );

                    setProfile({
                        ...updatedProfile,
                        username: profile?.username || '',
                    } as StudentProfileDetails);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert(i18n.picture_update_success || 'Success');
                } catch (error) {
                    console.error('Picture upload failed:', error);
                    Alert.alert(i18n.picture_update_error || 'Error');
                } finally {
                    setUploadingPicture(false);
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(i18n.picture_update_error || 'Error');
        }
    };

    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        await logout();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Banner Header */}
                <View style={[styles.banner, { backgroundColor: colors.primary }]}>
                    <View style={styles.bannerOverlay} />
                </View>

                <RNAnimated.View style={[
                    styles.profileCard,
                    { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarContainer, { borderColor: colors.surface }]}>
                            {uploadingPicture ? (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            ) : (
                                <Image
                                    source={profile?.picture ? { uri: profile.picture } : require('../../assets/images/react-logo.png')}
                                    style={styles.avatar}
                                    contentFit="cover"
                                    transition={200}
                                />
                            )}
                            <TouchableOpacity
                                style={[styles.editBadge, { backgroundColor: colors.primary }]}
                                onPress={handleImagePick}
                                disabled={uploadingPicture}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={[styles.name, { color: colors.text }]}>
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Student'}
                        </Text>
                        <View style={[styles.usernameBadge, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.username, { color: colors.primary }]}>
                                @{profile?.username || 'username'}
                            </Text>
                        </View>
                    </View>

                  
                </RNAnimated.View>

                <RNAnimated.View style={[
                    styles.section,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.profile}</Text>
                        {!isEditing && (
                            <TouchableOpacity
                                style={[styles.editButton, { borderColor: colors.primary }]}
                                onPress={handleEdit}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={18} color={colors.primary} />
                                <Text style={[styles.editButtonText, { color: colors.primary }]}>{i18n.edit_profile}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        {isEditing ? (
                            <View style={styles.editForm}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.placeholder }]}>{i18n.first_name}</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                                        <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            value={editedFirstName}
                                            onChangeText={setEditedFirstName}
                                            placeholder={i18n.first_name}
                                            placeholderTextColor={colors.placeholder}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.placeholder }]}>{i18n.last_name}</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                                        <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            value={editedLastName}
                                            onChangeText={setEditedLastName}
                                            placeholder={i18n.last_name}
                                            placeholderTextColor={colors.placeholder}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.placeholder }]}>{i18n.email}</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            value={editedEmail}
                                            onChangeText={setEditedEmail}
                                            placeholder={i18n.email}
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.placeholder }]}>{i18n.phone}</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                                        <Ionicons name="call-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            value={editedPhone}
                                            onChangeText={setEditedPhone}
                                            placeholder="+998 90 123 45 67"
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>

                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.background }]}
                                        onPress={handleCancel}
                                        disabled={saving}
                                    >
                                        <Text style={[styles.actionButtonText, { color: colors.text }]}>{i18n.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                        onPress={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={[styles.actionButtonText, { color: '#fff' }]}>{i18n.save}</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoList}>
                                <View style={styles.infoItem}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={[styles.infoLabel, { color: colors.placeholder }]}>{i18n.email}</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                                            {profile?.email || 'Not set'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />

                                <View style={styles.infoItem}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
                                        <Ionicons name="call-outline" size={20} color={colors.secondary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={[styles.infoLabel, { color: colors.placeholder }]}>{i18n.phone}</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>
                                            {profile?.phone || 'Not set'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </RNAnimated.View>

                <RNAnimated.View style={[
                    styles.section,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.settings}</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLangModalVisible(true);
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: '#F59E0B20' }]}>
                                    <Ionicons name="language" size={20} color="#F59E0B" />
                                </View>
                                <Text style={[styles.settingText, { color: colors.text }]}>{i18n.language}</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={[styles.settingValue, { color: colors.placeholder }]}>
                                    {language === 'uz' ? 'O\'zbek' : language === 'ru' ? 'Русский' : 'English'}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                toggleTheme();
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme === 'dark' ? '#818CF820' : '#FBBF2420' }]}>
                                    <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={20} color={theme === 'dark' ? '#818CF8' : '#FBBF24'} />
                                </View>
                                <Text style={[styles.settingText, { color: colors.text }]}>{i18n.theme}</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={[styles.settingValue, { color: colors.placeholder }]}>
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                setLogoutModalVisible(true);
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                </View>
                                <Text style={[styles.settingText, { color: colors.error }]}>{i18n.logout}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                        </TouchableOpacity>
                    </View>
                </RNAnimated.View>
            </ScrollView>

            <Modal
                visible={langModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLangModalVisible(false)}
                >
                    <View style={[styles.bottomModal, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.language}</Text>
                        <View style={styles.langList}>
                            {languages.map((item) => (
                                <TouchableOpacity
                                    key={item.code}
                                    style={[
                                        styles.langOption,
                                        language === item.code && { backgroundColor: colors.primary + '10' }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        setLanguage(item.code as any);
                                        setLangModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.langIcon}>{item.icon}</Text>
                                    <Text style={[
                                        styles.langLabel,
                                        { color: colors.text },
                                        language === item.code && { color: colors.primary, fontWeight: 'bold' }
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {language === item.code && (
                                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            <Modal
                visible={logoutModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLogoutModalVisible(false)}
                >
                    <View style={[styles.alertModal, { backgroundColor: colors.surface }]}>
                        <View style={[styles.logoutIconCircle, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="log-out-outline" size={32} color={colors.error} />
                        </View>
                        <Text style={[styles.alertTitle, { color: colors.text }]}>{i18n.logout}</Text>
                        <Text style={[styles.alertDesc, { color: colors.placeholder }]}>
                            {i18n.logout_confirm_desc}
                        </Text>

                        <View style={styles.alertButtons}>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: colors.background }]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={[styles.alertButtonText, { color: colors.text }]}>{i18n.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: colors.error }]}
                                onPress={confirmLogout}
                            >
                                <Text style={[styles.alertButtonText, { color: '#fff' }]}>{i18n.confirm_logout}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    banner: {
        height: 160,
        width: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    profileCard: {
        marginHorizontal: 20,
        marginTop: -60,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarWrapper: {
        marginTop: -70,
        marginBottom: 16,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
    },
    usernameBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '100%',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    infoCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    infoList: {
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    miniDivider: {
        height: 1,
        width: '100%',
        opacity: 0.5,
    },
    divider: {
        height: 1,
        marginHorizontal: 0,
    },
    editForm: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    settingValue: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomModal: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    langList: {
        gap: 10,
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    langIcon: {
        fontSize: 24,
    },
    langLabel: {
        flex: 1,
        fontSize: 16,
    },
    alertModal: {
        alignSelf: 'center',
        width: width * 0.85,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
    },
    logoutIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    alertButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
