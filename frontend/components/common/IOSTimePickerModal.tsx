import DateTimePicker, {
    type DateTimePickerEvent,
    type IOSNativeProps,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type IOSTimePickerModalProps = {
  visible: boolean;
  initialTime: Date;
  title?: string;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  onCancel: () => void;
  onConfirm: (time: Date) => void;
};

const ORANGE = "#F99F7C";

const IOSTimePickerModal: React.FC<IOSTimePickerModalProps> = ({
  visible,
  initialTime,
  title = "Selecciona la hora",
  minuteInterval = 1,
  onCancel,
  onConfirm,
}) => {
  const [selectedTime, setSelectedTime] = useState(new Date(initialTime));

  const formattedTime = useMemo(
    () =>
      selectedTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [selectedTime]
  );

  useEffect(() => {
    if (visible) {
      const synced = new Date(initialTime);
      synced.setSeconds(0, 0);
      setSelectedTime(synced);
    }
  }, [initialTime, visible]);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const sanitized = new Date(date);
      sanitized.setSeconds(0, 0);
      setSelectedTime(sanitized);
    }
  };

  const handleConfirm = () => {
    onConfirm(new Date(selectedTime));
  };

  const pickerProps = {
    value: selectedTime,
    onChange: handleChange,
    mode: "time" as const,
    locale: "es-CL",
    minuteInterval,
    display: "spinner" as const,
    textColor: ORANGE,
    themeVariant: "light" as const,
  } satisfies IOSNativeProps;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Hora seleccionada</Text>
            <Text style={styles.previewValue}>{formattedTime}</Text>
          </View>
          <DateTimePicker {...pickerProps} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
              <Text style={styles.secondaryLabel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
              <Text style={styles.primaryLabel}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default IOSTimePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: 16,
    color: "#121417",
    marginBottom: 16,
    textAlign: "center",
  },
  previewCard: {
    borderRadius: 14,
    backgroundColor: "#FFF3EC",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE2D4",
  },
  previewLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  previewValue: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 36,
    fontWeight: "700",
    color: ORANGE,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    color: "#4B5563",
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F99F7C",
    borderWidth: 1,
    borderColor: "#F99F7C",
  },
  primaryLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
