/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Unit, UnitDisplay, UnitItem } from '../../types';
import { formatDecimal } from '../../utils/data_transformation/utils/number';

export const dataUnits = [
  { symbol: 'b', value: 1 }, // 1 bit
  { symbol: 'B', value: 8 }, // 1 byte = 8 bits
  { symbol: 'kB', value: 8 * 1000 }, // 1 kB = 1000 bytes = 1000*8 bits
  { symbol: 'KiB', value: 8 * 1024 }, // 1 KiB = 1024 bytes = 1024*8 bits
  { symbol: 'MB', value: 8 * 1000 ** 2 }, // 1 MB = 1024^2 bytes
  { symbol: 'MiB', value: 8 * 1024 ** 2 }, // 1 MiB = 1024^2 bytes
  { symbol: 'GB', value: 8 * 1000 ** 3 }, // 1 GB = 1000^3 bytes
  { symbol: 'GiB', value: 8 * 1024 ** 3 }, // 1 GiB = 1024^3 bytes
  { symbol: 'TB', value: 8 * 1000 ** 4 }, // 1 TB = 1000^4 bytes
  { symbol: 'TiB', value: 8 * 1024 ** 4 }, // 1 TiB = 1024^4 bytes
  { symbol: 'PB', value: 8 * 1000 ** 5 }, // 1 PB = 1000^5 bytes
  { symbol: 'PiB', value: 8 * 1024 ** 5 }, // 1 PiB = 1024^5 bytes
];

export const timeUnits = [
  { symbol: 'milliseconds', value: 1 },
  { symbol: 'seconds', value: 1000 }, // 1 second = 1000 milliseconds
  { symbol: 'minutes', value: 60 * 1000 }, // 1 minute = 60 seconds
  { symbol: 'hours', value: 60 * 60 * 1000 }, // 1 hour = 60 minutes
  { symbol: 'days', value: 24 * 60 * 60 * 1000 }, // 1 day = 24 hours
  { symbol: 'weeks', value: 7 * 24 * 60 * 60 * 1000 }, // 1 week = 7 days
  { symbol: 'months', value: 30 * 24 * 60 * 60 * 1000 }, // 1 month = 30 days
  { symbol: 'years', value: 365 * 24 * 60 * 60 * 1000 }, // 1 year = 365 days
];

export const massUnits = [
  { symbol: 'mg', value: 0.001 }, // 1 milligram = 0.001 grams
  { symbol: 'g', value: 1 }, // 1 gram = 1 gram
  { symbol: 'kg', value: 1000 }, // 1 kilogram = 1000 grams
  { symbol: 't', value: 1000000 }, // 1 metric ton = 1,000,000 grams
];

export const lengthUnits = [
  { symbol: 'mm', value: 0.001 }, // 1 millimeter = 0.001 meters
  { symbol: 'in', value: 0.0254 }, // 1 inch = 0.0254 meters
  { symbol: 'ft', value: 0.3048 }, // 1 foot = 0.3048 meters
  { symbol: 'm', value: 1 }, // 1 meter = 1 meter
  { symbol: 'km', value: 1000 }, // 1 kilometer = 1000 meters
  { symbol: 'mi', value: 1609.344 }, // 1 mile = 1609.344 meters
];

export const shortNumber = (num: number, decimals?: number) => {
  const units = ['', 'K', 'M', 'B', 'T', 'Q'];
  let unitIndex = 0;
  let n = num;

  while (Math.abs(n) >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }

  return `${formatDecimal(n, decimals)} ${units[unitIndex]}`;
};

export const currencyFormat = (num: number, symbol?: string, decimals?: number): UnitDisplay => {
  return {
    label: `${symbol ? symbol : ''} ${formatDecimal(num, decimals)}`,
    segments: [
      { type: 'unit', value: symbol || '' },
      { type: 'value', value: formatDecimal(num, decimals) },
    ],
  };
};

export const computing = (
  num: number,
  units: Array<{ symbol: string; value: number }>,
  symbol?: string,
  decimals?: number
): UnitDisplay => {
  // target the base unit symbol
  const startUnit = symbol && units.find((u) => u.symbol === symbol);
  if (!symbol || !startUnit) return { label: formatDecimal(num, decimals) };

  const finalNum = num * startUnit.value;
  let i = units.findIndex((u) => u.symbol === symbol);

  while (i < units.length - 1 && Math.abs(finalNum) >= units[i + 1].value) {
    i++;
  }
  const displayNum = finalNum / units[i].value;
  return {
    label: `${formatDecimal(displayNum, decimals)} ${units[i].symbol}`,
    segments: [
      { type: 'value', value: formatDecimal(displayNum, decimals) },
      { type: 'unit', value: units[i].symbol },
    ],
  };
};

export const computingDate = (num: number, symbol?: string): UnitDisplay => {
  const numDate = new Date(num);
  const utcMillis = Date.now();

  switch (symbol) {
    case 'iso':
      const dateStr = numDate.toUTCString();
      return { label: dateStr };
    case 'fromNow':
      const diff = utcMillis - num;
      const absDiff = Math.abs(diff);
      const suffix = diff > 0 ? 'ago' : 'after';
      for (let i = timeUnits.length - 1; i >= 0; i--) {
        const unit = timeUnits[i];
        const value = Math.floor(absDiff / unit.value);
        if (value >= 1) {
          return { label: `${value} ${unit.symbol} ${suffix}` };
        }
      }
    default:
      return { label: numDate.toUTCString() };
  }
};

export const UnitsCollection: Record<string, Unit> = {
  misc: {
    name: i18n.translate('explore.stylePanel.unit.misc', { defaultMessage: 'Misc' }),
    units: [
      {
        id: 'number',
        name: i18n.translate('explore.stylePanel.unit.number', { defaultMessage: 'Number' }),
      },
      {
        id: 'integer',
        name: i18n.translate('explore.stylePanel.unit.integer', { defaultMessage: 'Integer' }),
        display: (val: number) => ({ label: Math.round(val) }),
      },
      {
        id: 'percentage',
        name: i18n.translate('explore.stylePanel.unit.percentage', {
          defaultMessage: 'Percentage',
        }),
        symbol: '%',
      },
      {
        id: 'short',
        name: i18n.translate('explore.stylePanel.unit.short', { defaultMessage: 'Short' }),
        display: (val: number, sy?: string, decimals?: number) => ({
          label: shortNumber(val, decimals),
        }),
      },
    ],
  },
  acceleration: {
    name: i18n.translate('explore.stylePanel.unit.acceleration', {
      defaultMessage: 'Acceleration',
    }),
    units: [
      {
        id: 'meters',
        name: i18n.translate('explore.stylePanel.unit.metersPerSec', {
          defaultMessage: 'Meters/sec²',
        }),
        symbol: 'm/sec²',
        fontScale: 0.8,
      },
      {
        id: 'feet',
        name: i18n.translate('explore.stylePanel.unit.feetPerSec', { defaultMessage: 'Feet/sec²' }),
        symbol: 'f/sec²',
        fontScale: 0.8,
      },
      {
        id: 'g_unit',
        name: i18n.translate('explore.stylePanel.unit.gUnit', { defaultMessage: 'G unit' }),
        symbol: 'g',
      },
    ],
  },

  angle: {
    name: i18n.translate('explore.stylePanel.unit.angle', { defaultMessage: 'Angle' }),
    units: [
      {
        id: 'degree',
        name: i18n.translate('explore.stylePanel.unit.degrees', { defaultMessage: 'Degrees (°)' }),
        symbol: '°',
      },
      {
        id: 'radian',
        name: i18n.translate('explore.stylePanel.unit.radians', { defaultMessage: 'Radians' }),
        symbol: 'rad',
      },
      {
        id: 'grad',
        name: i18n.translate('explore.stylePanel.unit.gradian', { defaultMessage: 'Gradian' }),
        symbol: 'grad',
      },
      {
        id: 'arcmin',
        name: i18n.translate('explore.stylePanel.unit.arcMinutes', {
          defaultMessage: 'Arc Minutes',
        }),
        symbol: 'arcmin',
        fontScale: 0.8,
      },
      {
        id: 'arcsec',
        name: i18n.translate('explore.stylePanel.unit.arcSeconds', {
          defaultMessage: 'Arc Seconds',
        }),
        symbol: 'arcsec',
        fontScale: 0.8,
      },
    ],
  },

  area: {
    name: i18n.translate('explore.stylePanel.unit.area', { defaultMessage: 'Area' }),
    units: [
      {
        id: 'square_meters',
        name: i18n.translate('explore.stylePanel.unit.squareMeters', {
          defaultMessage: 'Square Meters (m²)',
        }),
        symbol: 'm2',
      },
      {
        id: 'square_feet',
        name: i18n.translate('explore.stylePanel.unit.squareFeet', {
          defaultMessage: 'Square Feet (ft²)',
        }),
        symbol: 'ft2',
      },
      {
        id: 'square_miles',
        name: i18n.translate('explore.stylePanel.unit.squareMiles', {
          defaultMessage: 'Square Miles (mi²)',
        }),
        symbol: 'mi2',
      },
      {
        id: 'acres',
        name: i18n.translate('explore.stylePanel.unit.acres', { defaultMessage: 'Acres (ac)' }),
        symbol: 'ac',
      },
      {
        id: 'hectares',
        name: i18n.translate('explore.stylePanel.unit.hectares', {
          defaultMessage: 'Hectares (ha)',
        }),
        symbol: 'ha',
      },
    ],
  },
  currency: {
    name: i18n.translate('explore.stylePanel.unit.currency', { defaultMessage: 'Currency' }),
    units: [
      {
        id: 'dollars',
        name: i18n.translate('explore.stylePanel.unit.dollars', { defaultMessage: 'Dollars ($)' }),
        symbol: '$',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
      {
        id: 'pounds',
        name: i18n.translate('explore.stylePanel.unit.pounds', { defaultMessage: 'Pounds (£)' }),
        symbol: '£',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
      {
        id: 'euro',
        name: i18n.translate('explore.stylePanel.unit.euro', { defaultMessage: 'Euros (€)' }),
        symbol: '€',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
      {
        id: 'yuan',
        name: i18n.translate('explore.stylePanel.unit.yuan', {
          defaultMessage: 'Chinese Yuan (¥)',
        }),
        symbol: '¥',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
      {
        id: 'yen',
        name: i18n.translate('explore.stylePanel.unit.yen', { defaultMessage: 'Yen (¥)' }),
        symbol: '¥',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
      {
        id: 'rubles',
        name: i18n.translate('explore.stylePanel.unit.rubles', { defaultMessage: 'Rubles (₽)' }),
        symbol: '₽',
        display: (val, sy, decimals) => currencyFormat(val, sy, decimals),
      },
    ],
  },

  temperature: {
    name: i18n.translate('explore.stylePanel.unit.temperature', { defaultMessage: 'Temperature' }),
    units: [
      {
        id: 'celsius',
        name: i18n.translate('explore.stylePanel.unit.celsius', { defaultMessage: 'Celsius (°C)' }),
        symbol: '°C',
      },
      {
        id: 'fahrenheit',
        name: i18n.translate('explore.stylePanel.unit.fahrenheit', {
          defaultMessage: 'Fahrenheit (°F)',
        }),
        symbol: '°F',
      },
      {
        id: 'kelvin',
        name: i18n.translate('explore.stylePanel.unit.kelvin', { defaultMessage: 'Kelvin (K)' }),
        symbol: 'K',
      },
    ],
  },

  data: {
    name: i18n.translate('explore.stylePanel.unit.data', { defaultMessage: 'Data' }),
    units: [
      {
        id: 'bits',
        name: i18n.translate('explore.stylePanel.unit.bits', { defaultMessage: 'bits(b)' }),
        symbol: 'b',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'bytes',
        name: i18n.translate('explore.stylePanel.unit.bytes', { defaultMessage: 'bytes(B)' }),
        symbol: 'B',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'kilobytes',
        name: i18n.translate('explore.stylePanel.unit.kilobytes', {
          defaultMessage: 'kilobytes(kB)',
        }),
        symbol: 'kB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'kibibytes',
        name: i18n.translate('explore.stylePanel.unit.kibibytes', {
          defaultMessage: 'kibibytes(KiB)',
        }),
        symbol: 'KiB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'megabytes',
        name: i18n.translate('explore.stylePanel.unit.megabytes', {
          defaultMessage: 'megabytes(MB)',
        }),
        symbol: 'MB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'mebibytes',
        name: i18n.translate('explore.stylePanel.unit.mebibytes', {
          defaultMessage: 'mebibytes(MiB)',
        }),
        symbol: 'MiB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'gigabytes',
        name: i18n.translate('explore.stylePanel.unit.gigabytes', {
          defaultMessage: 'gigabytes(GB)',
        }),
        symbol: 'GB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'gibibytes',
        name: i18n.translate('explore.stylePanel.unit.gibibytes', {
          defaultMessage: 'gibibytes(GiB)',
        }),
        symbol: 'GiB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'terabytes',
        name: i18n.translate('explore.stylePanel.unit.terabytes', {
          defaultMessage: 'terabytes(TB)',
        }),
        symbol: 'TB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'tebibytes',
        name: i18n.translate('explore.stylePanel.unit.tebibytes', {
          defaultMessage: 'tebibytes(TiB)',
        }),
        symbol: 'TiB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'petabytes',
        name: i18n.translate('explore.stylePanel.unit.petabytes', {
          defaultMessage: 'petabytes(PB)',
        }),
        symbol: 'PB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
      {
        id: 'pebibytes',
        name: i18n.translate('explore.stylePanel.unit.pebibytes', {
          defaultMessage: 'pebibytes(PiB)',
        }),
        symbol: 'PiB',
        display: (val, sy, decimals) => computing(val, dataUnits, sy, decimals),
      },
    ],
  },

  time: {
    name: i18n.translate('explore.stylePanel.unit.time', { defaultMessage: 'Time' }),
    units: [
      {
        id: 'year',
        name: i18n.translate('explore.stylePanel.unit.year', { defaultMessage: 'Year' }),
        symbol: 'years',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'month',
        name: i18n.translate('explore.stylePanel.unit.month', { defaultMessage: 'Month' }),
        symbol: 'months',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'week',
        name: i18n.translate('explore.stylePanel.unit.week', { defaultMessage: 'Week' }),
        symbol: 'weeks',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'day',
        name: i18n.translate('explore.stylePanel.unit.day', { defaultMessage: 'Day' }),
        symbol: 'days',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'hour',
        name: i18n.translate('explore.stylePanel.unit.hour', { defaultMessage: 'Hour' }),
        symbol: 'hours',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'minute',
        name: i18n.translate('explore.stylePanel.unit.minute', { defaultMessage: 'Minute' }),
        symbol: 'minutes',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'second',
        name: i18n.translate('explore.stylePanel.unit.second', { defaultMessage: 'Second' }),
        symbol: 'seconds',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
      {
        id: 'millisecond',
        name: i18n.translate('explore.stylePanel.unit.millisecond', {
          defaultMessage: 'Millisecond',
        }),
        symbol: 'milliseconds',
        display: (val, sy, decimals) => computing(val, timeUnits, sy, decimals),
      },
    ],
  },

  date: {
    name: i18n.translate('explore.stylePanel.unit.dateTime', { defaultMessage: 'Date & time' }),
    units: [
      {
        id: 'dateTimeAsIso',
        symbol: 'iso',
        name: i18n.translate('explore.stylePanel.unit.datetimeIso', {
          defaultMessage: 'Datetime ISO',
        }),
        display: (val, sy) => computingDate(val, sy),
        fontScale: 0.4,
      },
      {
        id: 'dateTimeFromNow',
        symbol: 'fromNow',
        name: i18n.translate('explore.stylePanel.unit.fromNow', { defaultMessage: 'From Now' }),
        display: (val, sy) => computingDate(val, sy),
      },
    ],
  },

  mass: {
    name: i18n.translate('explore.stylePanel.unit.mass', { defaultMessage: 'Mass' }),
    units: [
      {
        id: 'milligram',
        name: i18n.translate('explore.stylePanel.unit.milligram', {
          defaultMessage: 'milligram (mg)',
        }),
        symbol: 'mg',
        display: (val, sy, decimals) => computing(val, massUnits, sy, decimals),
      },
      {
        id: 'gram',
        name: i18n.translate('explore.stylePanel.unit.gram', { defaultMessage: 'gram (g)' }),
        symbol: 'g',
        display: (val, sy, decimals) => computing(val, massUnits, sy, decimals),
      },
      {
        id: 'kilogram',
        name: i18n.translate('explore.stylePanel.unit.kilogram', {
          defaultMessage: 'kilogram (kg)',
        }),
        symbol: 'kg',
        display: (val, sy, decimals) => computing(val, massUnits, sy, decimals),
      },
      {
        id: 'metric',
        name: i18n.translate('explore.stylePanel.unit.metricTon', {
          defaultMessage: 'metric ton (t)',
        }),
        symbol: 't',
        display: (val, sy, decimals) => computing(val, massUnits, sy, decimals),
      },
    ],
  },
  length: {
    name: i18n.translate('explore.stylePanel.unit.length', { defaultMessage: 'Length' }),
    units: [
      {
        id: 'millimeter',
        name: i18n.translate('explore.stylePanel.unit.millimeter', {
          defaultMessage: 'millimeter (mm)',
        }),
        symbol: 'mm',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
      {
        id: 'inch',
        name: i18n.translate('explore.stylePanel.unit.inch', { defaultMessage: 'inch (in)' }),
        symbol: 'in',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
      {
        id: 'feet',
        name: i18n.translate('explore.stylePanel.unit.feet', { defaultMessage: 'feet (ft)' }),
        symbol: 'ft',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
      {
        id: 'meter',
        name: i18n.translate('explore.stylePanel.unit.meter', { defaultMessage: 'meter (m)' }),
        symbol: 'm',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
      {
        id: 'kilometer',
        name: i18n.translate('explore.stylePanel.unit.kilometer', {
          defaultMessage: 'kilometer (km)',
        }),
        symbol: 'km',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
      {
        id: 'mile',
        name: i18n.translate('explore.stylePanel.unit.mile', { defaultMessage: 'mile (mi)' }),
        symbol: 'mi',
        display: (val, sy, decimals) => computing(val, lengthUnits, sy, decimals),
      },
    ],
  },
};

export const UnitsLookup: Record<string, UnitItem> = {};

// a quick unit look-up
Object.values(UnitsCollection).forEach((category) => {
  category.units.forEach((unit) => {
    if (unit.id) {
      UnitsLookup[unit.id] = unit;
    }
  });
});

// get unit by ID
export const getUnitById = (id?: string) => (id ? UnitsLookup[id] : undefined);

/**
 * Appends a user-defined unit suffix
 * A rate-style suffix ("/sec") appends directly (100 b/sec)
 * anything else gets a separating space (100 meter)
 */
export const appendUnitSuffix = (text: string | number, suffix?: string): string => {
  const base = String(text);
  if (!suffix) return base;
  return suffix.startsWith('/') ? `${base}${suffix}` : `${base} ${suffix}`;
};

export function showDisplayValue(
  isValidNumber: boolean,
  selectedUnit: UnitItem | undefined,
  calculatedValue: number | undefined,
  decimals?: number,
  suffix?: string
) {
  if (!isValidNumber || calculatedValue == null) return '-';
  const base =
    selectedUnit && selectedUnit?.display
      ? selectedUnit?.display(calculatedValue, selectedUnit?.symbol, decimals).label
      : `${formatDecimal(calculatedValue, decimals)} ${selectedUnit?.symbol ?? ''}`;

  return appendUnitSuffix(base, suffix);
}

/**
 * Formats a numeric value into unit + decimals + optional suffix
 */
export const formatUnitValue = (
  value: number,
  unitId?: string,
  decimals?: number,
  suffix?: string
): string => {
  if (!Number.isFinite(value)) return String(value);
  const unit = getUnitById(unitId);
  const base = unit?.display
    ? String(unit.display(value, unit.symbol, decimals).label)
    : `${formatDecimal(value, decimals)}${unit?.symbol ? ` ${unit.symbol}` : ''}`;
  return appendUnitSuffix(base, suffix);
};
