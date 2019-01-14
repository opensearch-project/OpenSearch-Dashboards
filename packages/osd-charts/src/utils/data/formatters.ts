import { DateTime, Duration } from 'luxon';

type Formatter = (value: any) => string;

export function timeFormatter(format: string): Formatter {
  return (value: any): string => {
    return DateTime.fromISO(value).toFormat(format);
  };
}

export function niceTimeFormatter(domain: [number, number]): Formatter {
  const minDate = domain[0];
  const maxDate = domain[1];
  const diff = maxDate - minDate;
  const format = niceTimeFormat(diff);
  return timeFormatter(format);
}

function niceTimeFormat(millis: number) {
  const duration = Duration.fromMillis(millis);
  const { days } = duration;
  if (days > 30) {
    return 'YYYY-MM-DD';
  }
  if (days > 7 && days <= 30) {
    return 'MMM-DD';
  }
  if (days > 1 && days <= 7) {
    return 'MMM-DD HH:mm';
  }
  return 'HH:mm:ss';
}
