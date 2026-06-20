export const STATION_TIME_ZONE = 'Australia/Perth';

export function stationToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: STATION_TIME_ZONE }).slice(0, 10);
}

export function stationNowDateTime(): string {
  return new Date()
    .toLocaleString('en-CA', { timeZone: STATION_TIME_ZONE, hour12: false })
    .replace(',', '');
}

export function shiftStationDate(dateValue: string, days: number): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toLocaleDateString('en-CA', { timeZone: STATION_TIME_ZONE }).slice(0, 10);
}
