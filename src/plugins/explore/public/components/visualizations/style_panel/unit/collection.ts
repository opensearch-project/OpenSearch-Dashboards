/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Unit, UnitItem } from '../../types';

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
  { symbol: 'lb', value: 453.59237 }, // 1 pound = 453.59237 grams
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

export const shortNumber = (num: number) => {
  const units = ['', 'K', 'M', 'B', 'T', 'Q'];
  let unitIndex = 0;
  let n = num;

  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }

  return `${Math.round(n * 100) / 100} ${units[unitIndex]}`;
};

export const currencyFormat = (num: number, symbol?: string) => {
  return `${symbol ? symbol : ''} ${Math.round(num * 100) / 100}`;
};

export const computing = (
  num: number,
  units: Array<{ symbol: string; value: number }>,
  symbol?: string
) => {
  // target the base unit symbol
  const startUnit = symbol && units.find((u) => u.symbol === symbol);
  if (!symbol || !startUnit) return `${Math.round(num * 100) / 100}`;

  const finalNum = num * startUnit.value;
  let i = units.findIndex((u) => u.symbol === symbol);

  while (i < units.length - 1 && finalNum >= units[i + 1].value) {
    i++;
  }
  const displayNum = finalNum / units[i].value;
  return `${Math.round(displayNum * 100) / 100} ${units[i].symbol}`;
};

export const computingDate = (num: number, symbol?: string) => {
  const numDate = new Date(num);
  const utcMillis = Date.now();

  switch (symbol) {
    case 'iso':
      const dateStr = numDate.toUTCString();
      return dateStr;
    case 'fromNow':
      const diff = utcMillis - num;
      const absDiff = Math.abs(diff);
      const suffix = diff > 0 ? 'ago' : 'after';
      for (let i = timeUnits.length - 1; i >= 0; i--) {
        const unit = timeUnits[i];
        const value = Math.floor(absDiff / unit.value);
        if (value >= 1) {
          return `${value} ${unit.symbol} ${suffix}`;
        }
      }
    default:
      return numDate.toUTCString();
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
        display: (val: number) => Math.round(val),
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
        display: (val: number) => shortNumber(val),
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
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'pounds',
        name: i18n.translate('explore.stylePanel.unit.pounds', { defaultMessage: 'Pounds (£)' }),
        symbol: '£',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'euro',
        name: i18n.translate('explore.stylePanel.unit.euro', { defaultMessage: 'Euros (€)' }),
        symbol: '€',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'yuan',
        name: i18n.translate('explore.stylePanel.unit.yuan', {
          defaultMessage: 'Chinese Yuan (¥)',
        }),
        symbol: '¥',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'yen',
        name: i18n.translate('explore.stylePanel.unit.yen', { defaultMessage: 'Yen (¥)' }),
        symbol: '¥',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'rubles',
        name: i18n.translate('explore.stylePanel.unit.rubles', { defaultMessage: 'Rubles (₽)' }),
        symbol: '₽',
        display: (val, sy) => currencyFormat(val, sy),
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
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'bytes',
        name: i18n.translate('explore.stylePanel.unit.bytes', { defaultMessage: 'bytes(B)' }),
        symbol: 'B',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'kilobytes',
        name: i18n.translate('explore.stylePanel.unit.kilobytes', {
          defaultMessage: 'kilobytes(kB)',
        }),
        symbol: 'kB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'kibibytes',
        name: i18n.translate('explore.stylePanel.unit.kibibytes', {
          defaultMessage: 'kibibytes(KiB)',
        }),
        symbol: 'KiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'megabytes',
        name: i18n.translate('explore.stylePanel.unit.megabytes', {
          defaultMessage: 'megabytes(MB)',
        }),
        symbol: 'MB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'mebibytes',
        name: i18n.translate('explore.stylePanel.unit.mebibytes', {
          defaultMessage: 'mebibytes(MiB)',
        }),
        symbol: 'MiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'gigabytes',
        name: i18n.translate('explore.stylePanel.unit.gigabytes', {
          defaultMessage: 'gigabytes(GB)',
        }),
        symbol: 'GB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'gibibytes',
        name: i18n.translate('explore.stylePanel.unit.gibibytes', {
          defaultMessage: 'gibibytes(GiB)',
        }),
        symbol: 'GiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'terabytes',
        name: i18n.translate('explore.stylePanel.unit.terabytes', {
          defaultMessage: 'terabytes(TB)',
        }),
        symbol: 'TB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'tebibytes',
        name: i18n.translate('explore.stylePanel.unit.tebibytes', {
          defaultMessage: 'tebibytes(TiB)',
        }),
        symbol: 'TiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'petabytes',
        name: i18n.translate('explore.stylePanel.unit.petabytes', {
          defaultMessage: 'petabytes(PB)',
        }),
        symbol: 'PB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'pebibytes',
        name: i18n.translate('explore.stylePanel.unit.pebibytes', {
          defaultMessage: 'pebibytes(PiB)',
        }),
        symbol: 'PiB',
        display: (val, sy) => computing(val, dataUnits, sy),
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
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'month',
        name: i18n.translate('explore.stylePanel.unit.month', { defaultMessage: 'Month' }),
        symbol: 'months',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'week',
        name: i18n.translate('explore.stylePanel.unit.week', { defaultMessage: 'Week' }),
        symbol: 'weeks',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'day',
        name: i18n.translate('explore.stylePanel.unit.day', { defaultMessage: 'Day' }),
        symbol: 'days',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'hour',
        name: i18n.translate('explore.stylePanel.unit.hour', { defaultMessage: 'Hour' }),
        symbol: 'hours',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'minute',
        name: i18n.translate('explore.stylePanel.unit.minute', { defaultMessage: 'Minute' }),
        symbol: 'minutes',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'second',
        name: i18n.translate('explore.stylePanel.unit.second', { defaultMessage: 'Second' }),
        symbol: 'seconds',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'millisecond',
        name: i18n.translate('explore.stylePanel.unit.millisecond', {
          defaultMessage: 'Millisecond',
        }),
        symbol: 'milliseconds',
        display: (val, sy) => computing(val, timeUnits, sy),
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
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'gram',
        name: i18n.translate('explore.stylePanel.unit.gram', { defaultMessage: 'gram (g)' }),
        symbol: 'g',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'pound_mass',
        name: i18n.translate('explore.stylePanel.unit.pound', { defaultMessage: 'pound (lb)' }),
        symbol: 'lb',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'kilogram',
        name: i18n.translate('explore.stylePanel.unit.kilogram', {
          defaultMessage: 'kilogram (kg)',
        }),
        symbol: 'kg',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'metric',
        name: i18n.translate('explore.stylePanel.unit.metricTon', {
          defaultMessage: 'metric ton (t)',
        }),
        symbol: 't',
        display: (val, sy) => computing(val, massUnits, sy),
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
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'inch',
        name: i18n.translate('explore.stylePanel.unit.inch', { defaultMessage: 'inch (in)' }),
        symbol: 'in',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'feet',
        name: i18n.translate('explore.stylePanel.unit.feet', { defaultMessage: 'feet (ft)' }),
        symbol: 'ft',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'meter',
        name: i18n.translate('explore.stylePanel.unit.meter', { defaultMessage: 'meter (m)' }),
        symbol: 'm',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'kilometer',
        name: i18n.translate('explore.stylePanel.unit.kilometer', {
          defaultMessage: 'kilometer (km)',
        }),
        symbol: 'km',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'mile',
        name: i18n.translate('explore.stylePanel.unit.mile', { defaultMessage: 'mile (mi)' }),
        symbol: 'mi',
        display: (val, sy) => computing(val, lengthUnits, sy),
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

export function showDisplayValue(
  isValidNumber: boolean,
  selectedUnit: UnitItem | undefined,
  calculatedValue: number | undefined
) {
  const displayValue =
    isValidNumber && calculatedValue
      ? selectedUnit && selectedUnit?.display
        ? selectedUnit?.display(calculatedValue, selectedUnit?.symbol)
        : `${Math.round(calculatedValue * 100) / 100} ${selectedUnit?.symbol ?? ''}`
      : '-';

  return displayValue;
}
