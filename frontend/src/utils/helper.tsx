export const formatTimeRange = (time: string): string => {
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
  
    if (isNaN(hour)) return time; // fallback if invalid
  
    // Calculate next hour (wraps around 23 → 00)
    const nextHour = (hour + 1) % 24;
  
    const format = (h: number) => h.toString().padStart(2, "0") + ":" + minuteStr;
  
    return `${format(hour)} - ${format(nextHour)}`;
  };