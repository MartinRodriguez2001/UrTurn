import React from 'react';
import { Text, View } from 'react-native';
import type { PassengerMapProps } from './PassengerMap.types';

const PassengerMap: React.FC<PassengerMapProps> = ({ style }) => {
    return (
        <View style={style}>
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#E5E7EB',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: 16,
                }}
            >
                <Text
                    style={{
                        fontFamily: 'Plus Jakarta Sans',
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 22,
                        color: '#121417',
                        textAlign: 'center',
                    }}
                >
                    Mapa no disponible en web
                </Text>
                <Text
                    style={{
                        marginTop: 4,
                        fontFamily: 'Plus Jakarta Sans',
                        fontSize: 13,
                        lineHeight: 18,
                        color: '#61758A',
                        textAlign: 'center',
                    }}
                >
                    Usa la app móvil para ver Google Maps.
                </Text>
            </View>
        </View>
    );
};

export default PassengerMap;

