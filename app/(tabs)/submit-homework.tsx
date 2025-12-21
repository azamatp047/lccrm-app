import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';

export default function SubmitHomeworkScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const params = useLocalSearchParams();

    const [answer, setAnswer] = useState('');

    const handleFileUpload = () => {
        // Just visual for now
        console.log('Upload file clicked');
    };

    const handleSubmit = () => {
        console.log('Submit clicked with answer:', answer);
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Submit Homework</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Written Answer</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
                        Type your answer or add comments for the teacher.
                    </Text>

                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: colors.border
                            }
                        ]}
                        placeholder="Write your answer here..."
                        placeholderTextColor={colors.placeholder}
                        multiline
                        textAlignVertical="top"
                        value={answer}
                        onChangeText={setAnswer}
                    />

                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                        Attach Files
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.uploadArea,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            }
                        ]}
                        onPress={handleFileUpload}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.uploadTitle, { color: colors.text }]}>
                            Tap to Upload File
                        </Text>
                        <Text style={[styles.uploadSubtitle, { color: colors.placeholder }]}>
                            Max file size: 100MB
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Submit Homework</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    textArea: {
        height: 150,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    uploadArea: {
        borderWidth: 2,
        borderColor: '#e5e5e5',
        borderStyle: 'dashed',
        borderRadius: 20,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    uploadIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontSize: 12,
    },
    submitButton: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
