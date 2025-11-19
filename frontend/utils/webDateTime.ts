const toInputDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toInputTimeValue = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

type DatePickerOptions = {
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
};

type TimePickerOptions = {
  initialTime?: Date;
};

export const openWebDatePicker = async (
  options: DatePickerOptions = {}
): Promise<Date | null> => {
  if (typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "date";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.top = "-1000px";
    input.style.left = "-1000px";

    const initialDate = options.initialDate ?? new Date();
    input.value = toInputDateValue(initialDate);

    if (options.minDate) {
      input.min = toInputDateValue(options.minDate);
    }
    if (options.maxDate) {
      input.max = toInputDateValue(options.maxDate);
    }

    input.onchange = () => {
      if (input.value) {
        const [year, month, day] = input.value.split("-").map(Number);
        const selected = new Date(initialDate);
        selected.setFullYear(year, month - 1, day);
        selected.setHours(0, 0, 0, 0);
        resolve(selected);
      } else {
        resolve(null);
      }
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    if (input.showPicker) {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  });
};

export const openWebTimePicker = async (
  options: TimePickerOptions = {}
): Promise<Date | null> => {
  if (typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "time";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.top = "-1000px";
    input.style.left = "-1000px";

    const baseTime = options.initialTime ?? new Date();
    input.value = toInputTimeValue(baseTime);

    input.onchange = () => {
      if (input.value) {
        const [hours, minutes] = input.value.split(":").map(Number);
        const selected = new Date(baseTime);
        selected.setHours(hours, minutes, 0, 0);
        resolve(selected);
      } else {
        resolve(null);
      }
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    if (input.showPicker) {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  });
};
