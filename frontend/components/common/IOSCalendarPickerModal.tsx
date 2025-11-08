import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

type IOSCalendarPickerModalProps = {
  visible: boolean;
  initialDate: Date;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

const ORANGE = "#F99F7C";

const calendarTheme = {
  calendarBackground: "#FFFFFF",
  todayTextColor: ORANGE,
  selectedDayBackgroundColor: ORANGE,
  selectedDayTextColor: "#FFFFFF",
  dayTextColor: ORANGE,
  arrowColor: ORANGE,
  textMonthFontFamily: "Plus Jakarta Sans",
  textMonthFontWeight: "700" as const,
  textDayFontFamily: "Plus Jakarta Sans",
  textDayFontWeight: "600" as const,
  textDayHeaderFontFamily: "Plus Jakarta Sans",
  textDayHeaderFontWeight: "600" as const,
  textDayHeaderColor: "#61758A",
};

const formatToCalendarString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseCalendarDate = (value: string) => {
  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  return new Date(year, month - 1, day);
};

const IOSCalendarPickerModal: React.FC<IOSCalendarPickerModalProps> = ({
  visible,
  initialDate,
  minDate,
  maxDate,
  title = "Selecciona la fecha",
  onCancel,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState(formatToCalendarString(initialDate));

  useEffect(() => {
    if (visible) {
      setSelectedDate(formatToCalendarString(initialDate));
    }
  }, [initialDate, visible]);

  const markedDates = useMemo(
    () => ({
      [selectedDate]: {
        selected: true,
        selectedColor: ORANGE,
        selectedTextColor: "#FFFFFF",
      },
    }),
    [selectedDate]
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleConfirm = () => {
    onConfirm(parseCalendarDate(selectedDate));
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={calendarTheme}
            minDate={minDate ? formatToCalendarString(minDate) : undefined}
            maxDate={maxDate ? formatToCalendarString(maxDate) : undefined}
          />
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

export default IOSCalendarPickerModal;

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
    backgroundColor: ORANGE,
    borderWidth: 1,
    borderColor: ORANGE,
  },
  primaryLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
