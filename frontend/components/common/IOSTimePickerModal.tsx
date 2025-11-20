import DateTimePicker, {
  type DateTimePickerEvent,
  type IOSNativeProps,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type IOSTimePickerModalProps = {
  visible: boolean;
  initialTime: Date;
  title?: string;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  onCancel: () => void;
  onConfirm: (time: Date) => void;
};

const ORANGE = "#F99F7C";

const clampToInterval = (time: Date, interval: number) => {
  const sanitized = new Date(time);
  sanitized.setSeconds(0, 0);
  if (interval > 1) {
    const minutes = sanitized.getMinutes();
    sanitized.setMinutes(minutes - (minutes % interval));
  }
  return sanitized;
};

const pad = (value: number) => String(value).padStart(2, "0");

const IOSTimePickerModal: React.FC<IOSTimePickerModalProps> = ({
  visible,
  initialTime,
  title = "Selecciona la hora",
  minuteInterval = 1,
  onCancel,
  onConfirm,
}) => {
  const [selectedTime, setSelectedTime] = useState(() =>
    clampToInterval(initialTime, minuteInterval)
  );

  const formattedTime = useMemo(
    () =>
      selectedTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [selectedTime]
  );

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);

  const minuteOptions = useMemo(() => {
    const values: number[] = [];
    for (let minute = 0; minute < 60; minute += minuteInterval) {
      values.push(minute);
    }
    return values;
  }, [minuteInterval]);

  useEffect(() => {
    if (visible) {
      const synced = clampToInterval(initialTime, minuteInterval);
      setSelectedTime(synced);
    }
  }, [initialTime, minuteInterval, visible]);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const sanitized = new Date(date);
      sanitized.setSeconds(0, 0);
      setSelectedTime(sanitized);
    }
  };

  const handleSelectHour = (hour: number) => {
    setSelectedTime((prev) => {
      const updated = new Date(prev);
      updated.setHours(hour);
      return updated;
    });
  };

  const handleSelectMinute = (minute: number) => {
    setSelectedTime((prev) => {
      const updated = new Date(prev);
      updated.setMinutes(minute);
      return updated;
    });
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

  const renderWebPicker = () => (
    <View style={styles.webPickerContainer}>
      <Text style={styles.webPickerLabel}>Ajusta manualmente</Text>
      <View style={styles.webPickerRow}>
        <WebPickerColumn
          label="Hora"
          options={hourOptions}
          selectedValue={selectedTime.getHours()}
          onSelect={handleSelectHour}
        />
        <Text style={styles.webPickerSeparator}>:</Text>
        <WebPickerColumn
          label="Minutos"
          options={minuteOptions}
          selectedValue={selectedTime.getMinutes()}
          onSelect={handleSelectMinute}
        />
      </View>
    </View>
  );

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Hora seleccionada</Text>
            <Text style={styles.previewValue}>{formattedTime}</Text>
          </View>
          {Platform.OS === "web" ? renderWebPicker() : <DateTimePicker {...pickerProps} />}
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

type WebPickerColumnProps = {
  label: string;
  options: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
};

const WebPickerColumn = ({
  label,
  options,
  selectedValue,
  onSelect,
}: WebPickerColumnProps) => (
  <View style={styles.webColumn}>
    <Text style={styles.webColumnLabel}>{label}</Text>
    <ScrollView
      style={styles.webColumnScroll}
      contentContainerStyle={styles.webColumnContent}
      showsVerticalScrollIndicator={false}
    >
      {options.map((value) => {
        const isSelected = selectedValue === value;
        return (
          <TouchableOpacity
            key={`${label}-${value}`}
            style={[styles.webOption, isSelected && styles.webOptionSelected]}
            onPress={() => onSelect(value)}
            accessibilityRole="button"
          >
            <Text
              style={[styles.webOptionText, isSelected && styles.webOptionTextSelected]}
            >
              {pad(value)}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.webBottomSpacer} />
    </ScrollView>
  </View>
);

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
  webPickerContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE2D4",
    backgroundColor: "#FFF7F2",
    padding: 16,
    marginBottom: 16,
  },
  webPickerLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "700",
    color: "#F99F7C",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  webPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  webPickerSeparator: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 32,
    fontWeight: "700",
    color: "#F99F7C",
    marginHorizontal: 8,
  },
  webColumn: {
    width: 96,
  },
  webColumnLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
  },
  webColumnScroll: {
    maxHeight: 200,
  },
  webColumnContent: {
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  webOption: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  webOptionSelected: {
    borderColor: ORANGE,
    backgroundColor: "#FFECE2",
  },
  webOptionText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  webOptionTextSelected: {
    color: ORANGE,
  },
  webBottomSpacer: {
    height: 4,
  },
});
