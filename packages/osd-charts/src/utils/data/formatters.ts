import { DateTime, Interval } from 'luxon';
import { TickFormatter, TickFormatterOptions } from '../../chart_types/xy_chart/utils/specs';

export function timeFormatter(format: string): TickFormatter {
  return (value: number, options?: TickFormatterOptions): string => {
    const dateTimeOptions = options && options.timeZone ? { zone: options.timeZone } : undefined;
    return DateTime.fromMillis(value, dateTimeOptions).toFormat(format);
  };
}

export function niceTimeFormatter(domain: [number, number]): TickFormatter {
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
