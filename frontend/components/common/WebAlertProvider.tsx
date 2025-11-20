import React, { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  Alert,
  type AlertButton,
  type AlertOptions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AlertPayload = {
  title?: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

const normalizeButtons = (buttons?: AlertButton[]): AlertButton[] => {
  if (!buttons || buttons.length === 0) {
    return [{ text: "Aceptar", style: "default" }];
  }

  return buttons.map((button, index) => ({
    text:
      button.text ??
      (button.style === "cancel"
        ? "Cancelar"
        : button.style === "destructive"
          ? "Eliminar"
          : "Aceptar"),
    onPress: button.onPress,
    style: button.style ?? (index === 0 ? "default" : undefined),
    isPreferred: button.isPreferred,
  }));
};

const buttonStyle = (style?: AlertButton["style"]) => {
  switch (style) {
    case "destructive":
      return styles.destructiveButton;
    case "cancel":
      return styles.cancelButton;
    default:
      return styles.primaryButton;
  }
};

const buttonLabelStyle = (style?: AlertButton["style"]) => {
  switch (style) {
    case "destructive":
      return styles.destructiveLabel;
    case "cancel":
      return styles.cancelLabel;
    default:
      return styles.primaryLabel;
  }
};

const WebAlertProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [queue, setQueue] = useState<AlertPayload[]>([]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const originalAlert = Alert.alert;
    Alert.alert = (title?, message?, buttons?, options?) => {
      setQueue((prev) => [
        ...prev,
        {
          title,
          message: typeof message === "string" ? message : undefined,
          buttons: normalizeButtons(buttons),
          options,
        },
      ]);
      return true;
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

  const currentAlert = queue.length > 0 ? queue[0] : null;

  const dismissCurrent = () => {
    setQueue((prev) => prev.slice(1));
  };

  const handlePress = (button: AlertButton) => {
    dismissCurrent();
    button.onPress?.();
  };

  const isCancelable = currentAlert?.options?.cancelable ?? true;

  const renderButtons = useMemo(() => {
    if (!currentAlert) {
      return null;
    }
    return currentAlert.buttons.map((button, index) => (
      <TouchableOpacity
        key={`${button.text ?? "action"}-${index}`}
        style={[styles.buttonBase, buttonStyle(button.style)]}
        onPress={() => handlePress(button)}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonLabelBase, buttonLabelStyle(button.style)]}>
          {button.text}
        </Text>
      </TouchableOpacity>
    ));
  }, [currentAlert]);

  return (
    <>
      {children}
      {Platform.OS === "web" && currentAlert ? (
        <Modal
          animationType="fade"
          transparent
          visible
          onRequestClose={() => {
            if (isCancelable) {
              dismissCurrent();
            }
          }}
        >
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => {
                if (isCancelable) {
                  dismissCurrent();
                }
              }}
            />
            <View style={styles.card}>
              {currentAlert.title ? (
                <Text style={styles.titleText}>{currentAlert.title}</Text>
              ) : null}
              {currentAlert.message ? (
                <Text style={styles.messageText}>{currentAlert.message}</Text>
              ) : null}
              <View style={styles.buttonsContainer}>{renderButtons}</View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

export default WebAlertProvider;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  titleText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  messageText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonBase: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonLabelBase: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#F99F7C",
    borderColor: "#F99F7C",
  },
  primaryLabel: {
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  cancelLabel: {
    color: "#111827",
  },
  destructiveButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  destructiveLabel: {
    color: "#DC2626",
  },
});
