import moment from 'moment-timezone';

export function getMomentWithTz(date: number | Date, timeZone?: string) {
  if (timeZone === 'local' || !timeZone) {
    return moment(date);
  }
  if (timeZone.toLowerCase().startsWith('utc+') || timeZone.toLowerCase().startsWith('utc-')) {
    return moment(date).utcOffset(Number(timeZone.slice(3)));
  }
  return moment.tz(date, timeZone);
}
