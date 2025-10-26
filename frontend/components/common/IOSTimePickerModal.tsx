import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
  type IOSNativeProps,
} from "@react-native-community/datetimepicker";

type IOSTimePickerModalProps = {
  visible: boolean;
  initialTime: Date;
  title?: string;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  onCancel: () => void;
  onConfirm: (time: Date) => void;
};

const IOSTimePickerModal: React.FC<IOSTimePickerModalProps> = ({
  visible,
  initialTime,
  title = "Selecciona la hora",
  minuteInterval = 1,
  onCancel,
  onConfirm,
}) => {
  const [selectedTime, setSelectedTime] = useState(new Date(initialTime));

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
  } satisfies IOSNativeProps;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
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
    marginBottom: 12,
    textAlign: "center",
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
