import { DateTime, Interval } from 'luxon';

type TimeFormatter = (value: number) => string;

export function timeFormatter(format: string): TimeFormatter {
  return (value: number): string => {
    return DateTime.fromMillis(value).toFormat(format);
  };
}

export function niceTimeFormatter(domain: [number, number]): TimeFormatter {
  const minDate = DateTime.fromMillis(domain[0]);
  const maxDate = DateTime.fromMillis(domain[1]);
  const diff = Interval.fromDateTimes(minDate, maxDate);
  const format = niceTimeFormat(diff);
  return timeFormatter(format);
}

export function niceTimeFormat(interval: Interval) {
  const days = interval.count('days');
  return niceTimeFormatByDay(days);
}

export function niceTimeFormatByDay(days: number) {
  if (days > 30) {
    return 'yyyy-MM-dd';
  }
  if (days > 7 && days <= 30) {
    return 'MMMM dd';
  }
  if (days > 1 && days <= 7) {
    return 'MM-dd HH:mm';
  }
  return 'HH:mm:ss';
}
