import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type TravelRouteSectionProps = {
    title?: string;
    originLabel?: string;
    destinationLabel?: string;
    originPlaceholder?: string;
    destinationPlaceholder?: string;
    originValue: string;
    destinationValue: string;
    onChangeOrigin: (value: string) => void;
    onChangeDestination: (value: string) => void;
    originError?: string;
    destinationError?: string;
};

export default function TravelRouteSection({
    title = '🧭 Ruta del viaje',
    originLabel = 'Origen *',
    destinationLabel = 'Destino *',
    originPlaceholder = 'Ej: Universidad de Chile, Facultad de Ingeniería',
    destinationPlaceholder = 'Ej: Mall Plaza Vespucio, Metro San Joaquín',
    originValue,
    destinationValue,
    onChangeOrigin,
    onChangeDestination,
    originError,
    destinationError,
}: TravelRouteSectionProps) {
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{originLabel}</Text>
                <TextInput
                    style={[styles.input, originError ? styles.inputError : null]}
                    placeholder={originPlaceholder}
                    placeholderTextColor="#876363"
                    value={originValue}
                    onChangeText={onChangeOrigin}
                />
                {originError ? <Text style={styles.errorText}>{originError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{destinationLabel}</Text>
                <TextInput
                    style={[styles.input, destinationError ? styles.inputError : null]}
                    placeholder={destinationPlaceholder}
                    placeholderTextColor="#876363"
                    value={destinationValue}
                    onChangeText={onChangeDestination}
                />
                {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
            </View>
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
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        color: '#121417',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        color: '#EF4444',
    },
});

