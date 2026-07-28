/** @returns {{ hour: number, minute: number }} */
export function getLocalHourMinute(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  return {
    hour: Number(parts.find((p) => p.type === 'hour').value),
    minute: Number(parts.find((p) => p.type === 'minute').value),
  };
}

/** @param {Date} [now] */
export function isMonitorWindow(now = new Date()) {
  const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';
  const raw = process.env.MONITOR_HOURS || '10,18';
  const hours = raw.split(',').map((h) => Number(h.trim()));

  const { hour, minute } = getLocalHourMinute(now, tz);
  return minute === 0 && hours.includes(hour);
}
