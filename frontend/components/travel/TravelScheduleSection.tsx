import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TravelScheduleSectionProps = {
    title?: string;
    dateLabel?: string;
    timeLabel?: string;
    dateValue: string;
    timeValue: string;
    onPressDate: () => void;
    onPressTime: () => void;
    dateError?: string;
    timeError?: string;
    helperText?: string;
};

export default function TravelScheduleSection({
    title = '🗓️ Fecha y hora',
    dateLabel = 'Fecha del viaje *',
    timeLabel = 'Hora de partida *',
    dateValue,
    timeValue,
    onPressDate,
    onPressTime,
    dateError,
    timeError,
    helperText,
}: TravelScheduleSectionProps) {
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{dateLabel}</Text>
                <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={onPressDate}>
                    <Text style={styles.dateText}>{dateValue}</Text>
                </TouchableOpacity>
                {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
            </View>

            <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>{timeLabel}</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dateInput, timeError ? styles.inputError : null]}
                        onPress={onPressTime}
                    >
                        <Text style={styles.dateText}>{timeValue}</Text>
                    </TouchableOpacity>
                    {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}
                </View>
            </View>

            {helperText ? (
                <View style={styles.helperContainer}>
                    <Text style={styles.helperText}>{helperText}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 16,
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 18,
        fontWeight: '700',
        color: '#121417',
    },
    inputContainer: {
        gap: 8,
        flex: 1,
    },
    label: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    input: {
        height: 52,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FDF8F5',
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    dateInput: {
        borderColor: '#E5E7EB',
    },
    dateText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        color: '#121417',
    },
    rowContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    halfWidth: {
        flex: 1,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        color: '#EF4444',
    },
    helperContainer: {
        backgroundColor: '#FFF1F2',
        borderRadius: 8,
        padding: 12,
    },
    helperText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 13,
        color: '#BE123C',
    },
});

