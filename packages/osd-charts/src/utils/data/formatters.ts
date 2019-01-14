import { DateTime, Duration, Interval } from 'luxon';

type Formatter = (value: any) => string;

export function timeFormatter(format: string): Formatter {
  return (value: any): string => {
    return DateTime.fromMillis(value).toFormat(format);
  };
}

export function niceTimeFormatter(domain: [number, number]): Formatter {
  const minDate = DateTime.fromMillis(domain[0]);
  const maxDate = DateTime.fromMillis(domain[1]);
  const diff = Interval.fromDateTimes(minDate, maxDate);
  const format = niceTimeFormat(diff);
  return timeFormatter(format);
}

function niceTimeFormat(interval: Interval) {
  const days = interval.count('days');
  if (days > 30) {
    return 'yyyy-MM-DD';
  }
  if (days > 7 && days <= 30) {
    return 'MMM-DD';
  }
  if (days > 1 && days <= 7) {
    return 'MMM-DD HH:mm';
  }
  return 'HH:mm:ss';
}
