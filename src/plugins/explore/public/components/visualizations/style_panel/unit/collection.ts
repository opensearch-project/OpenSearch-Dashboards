/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Unit, UnitItem } from '../../types';

const dataUnits = [
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

const timeUnits = [
  { symbol: 'milliseconds', value: 1 },
  { symbol: 'seconds', value: 1000 }, // 1 second = 1000 milliseconds
  { symbol: 'minutes', value: 60 * 1000 }, // 1 minute = 60 seconds
  { symbol: 'hours', value: 60 * 60 * 1000 }, // 1 hour = 60 minutes
  { symbol: 'days', value: 24 * 60 * 60 * 1000 }, // 1 day = 24 hours
  { symbol: 'weeks', value: 7 * 24 * 60 * 60 * 1000 }, // 1 week = 7 days
  { symbol: 'months', value: 30 * 24 * 60 * 60 * 1000 }, // 1 month = 30 days
  { symbol: 'years', value: 365 * 24 * 60 * 60 * 1000 }, // 1 year = 365 days
];

const massUnits = [
  { symbol: 'mg', value: 0.001 }, // 1 milligram = 0.001 grams
  { symbol: 'g', value: 1 }, // 1 gram = 1 gram
  { symbol: 'lb', value: 453.59237 }, // 1 pound = 453.59237 grams
  { symbol: 'kg', value: 1000 }, // 1 kilogram = 1000 grams
  { symbol: 't', value: 1000000 }, // 1 metric ton = 1,000,000 grams
];

const lengthUnits = [
  { symbol: 'mm', value: 0.001 }, // 1 millimeter = 0.001 meters
  { symbol: 'in', value: 0.0254 }, // 1 inch = 0.0254 meters
  { symbol: 'ft', value: 0.3048 }, // 1 foot = 0.3048 meters
  { symbol: 'm', value: 1 }, // 1 meter = 1 meter
  { symbol: 'km', value: 1000 }, // 1 kilometer = 1000 meters
  { symbol: 'mi', value: 1609.344 }, // 1 mile = 1609.344 meters
];

const transformi18n = (name: string) => {
  return i18n.translate(`explore.stylePanel.unit.${name}`, {
    defaultMessage: name,
  });
};

const shortNumber = (num: number) => {
  const units = ['', 'K', 'M', 'B', 'T', 'Q'];
  let unitIndex = 0;
  let n = num;

  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }

  return `${Math.round(n * 100) / 100} ${units[unitIndex]}`;
};

const currencyFormat = (num: number, symbol?: string) => {
  return `${symbol ? symbol : ''} ${Math.round(num * 100) / 100}`;
};

const computing = (
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

const computingDate = (num: number, symbol?: string) => {
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
      return '0ms ago';
    default:
      return numDate.toUTCString();
  }
};

export const UnitsCollection: Record<string, Unit> = {
  misc: {
    name: transformi18n('Misc'),
    units: [
      {
        id: 'number',
        name: transformi18n('Number'),
      },
      {
        id: 'integer',
        name: transformi18n('Integer'),
        display: (val: number) => Math.round(val),
      },
      {
        id: 'percentage',
        name: transformi18n('Percentage'),
        symbol: '%',
      },
      { id: 'short', name: transformi18n('Short'), display: (val: number) => shortNumber(val) },
    ],
  },

  // align with grafana
  acceleration: {
    name: transformi18n('Acceleration'),
    units: [
      {
        id: 'meters',
        name: transformi18n('Meters/sec²'),
        symbol: 'm/sec²',
      },
      {
        id: 'feet',
        name: transformi18n('Feet/sec²'),
        symbol: 'f/sec²',
      },
      {
        id: 'g_unit',
        name: transformi18n('G unit'),
        symbol: 'g',
      },
    ],
  },
  // align with grafana
  angle: {
    name: transformi18n('Angle'),
    units: [
      {
        id: 'degree',
        name: transformi18n('Degrees (°)'),
        symbol: '°',
      },
      {
        id: 'radian',
        name: transformi18n('Radians'),
        symbol: 'rad',
      },
      {
        id: 'grad',
        name: transformi18n('Gradian'),
        symbol: 'grad',
      },
      {
        id: 'arcmin',
        name: transformi18n('Arc Minutes'),
        symbol: 'arcmin',
      },
      {
        id: 'arcsec',
        name: transformi18n('Arc Seconds'),
        symbol: 'arcsec',
      },
    ],
  },

  // align with grafana
  area: {
    name: transformi18n('Area'),
    units: [
      {
        id: 'square_meters',
        name: transformi18n('Square Meters (m²)'),
        symbol: 'm2',
      },
      {
        id: 'square_feet',
        name: transformi18n('Square Feet (ft²)'),
        symbol: 'ft2',
      },
      {
        id: 'square_miles',
        name: transformi18n('Square Miles (mi²)'),
        symbol: 'mi2',
      },
      {
        id: 'acres',
        name: transformi18n('Acres (ac)'),
        symbol: 'ac',
      },
      {
        id: 'hectares',
        name: transformi18n('Hectares (ha)'),
        symbol: 'ha',
      },
    ],
  },
  currency: {
    name: transformi18n('Currency'),
    units: [
      {
        id: 'dollars',
        name: transformi18n('Dollars ($)'),
        symbol: '$',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'pounds',
        name: transformi18n('Pounds (£)'),
        symbol: '£',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'euro',
        name: transformi18n('Euros (€)'),
        symbol: '€',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'yuan',
        name: transformi18n('Chinese Yuan (¥)'),
        symbol: '¥',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'yen',
        name: transformi18n('Yen (¥)'),
        symbol: '¥',
        display: (val, sy) => currencyFormat(val, sy),
      },
      {
        id: 'rubles',
        name: transformi18n('Rubles (₽)'),
        symbol: '₽',
        display: (val, sy) => currencyFormat(val, sy),
      },
    ],
  },

  temperature: {
    name: transformi18n('Temperature'),
    units: [
      {
        id: 'celsius',
        name: transformi18n('Celsius (°C)'),
        symbol: '°C',
      },
      {
        id: 'fahrenheit',
        name: transformi18n('Fahrenheit (°F)'),
        symbol: '°F',
      },
      {
        id: 'kelvin',
        name: transformi18n('Kelvin (K)'),
        symbol: 'K',
      },
    ],
  },

  data: {
    name: transformi18n('Data'),
    units: [
      {
        id: 'bits',
        name: transformi18n('bits(b)'),
        symbol: 'b',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'bytes',
        name: transformi18n('bytes(B)'),
        symbol: 'B',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'kilobytes',
        name: transformi18n('kilobytes(kB)'),
        symbol: 'kB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'kibibytes',
        name: transformi18n('kibibytes(KiB)'),
        symbol: 'KiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'megabytes',
        name: transformi18n('megabytes(MB)'),
        symbol: 'MB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'mebibytes',
        name: transformi18n('mebibytes(MiB)'),
        symbol: 'MiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'gigabytes',
        name: transformi18n('gigabytes(GB)'),
        symbol: 'GB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'gibibytes',
        name: transformi18n('gibibytes(GiB)'),
        symbol: 'GiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'terabytes',
        name: transformi18n('terabytes(TB)'),
        symbol: 'TB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'tebibytes',
        name: transformi18n('tebibytes(TiB)'),
        symbol: 'TiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'petabytes',
        name: transformi18n('petabytes(PB)'),
        symbol: 'PB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
      {
        id: 'pebibytes',
        name: transformi18n('pebibytes(PiB)'),
        symbol: 'PiB',
        display: (val, sy) => computing(val, dataUnits, sy),
      },
    ],
  },

  time: {
    name: transformi18n('Time'),
    units: [
      {
        id: 'year',
        name: transformi18n('Year'),
        symbol: 'years',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'month',
        name: transformi18n('Month'),
        symbol: 'months',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'week',
        name: transformi18n('Week'),
        symbol: 'weeks',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'day',
        name: transformi18n('Day'),
        symbol: 'days',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'hour',
        name: transformi18n('Hour'),
        symbol: 'hours',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'minute',
        name: transformi18n('Minute'),
        symbol: 'minutes',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'second',
        name: transformi18n('Second'),
        symbol: 'seconds',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
      {
        id: 'millisecond',
        name: transformi18n('Millisecond'),
        symbol: 'milliseconds',
        display: (val, sy) => computing(val, timeUnits, sy),
      },
    ],
  },

  date: {
    name: transformi18n('Date & time'),
    units: [
      {
        id: 'dateTimeAsIso',
        symbol: 'iso',
        name: transformi18n('Datetime ISO'),
        display: (val, sy) => computingDate(val, sy),
        fontScale: 0.5,
      },
      {
        id: 'dateTimeFromNow',
        symbol: 'fromNow',
        name: transformi18n('From Now'),
        display: (val, sy) => computingDate(val, sy),
      },
    ],
  },

  mass: {
    name: transformi18n('Mass'),
    units: [
      {
        id: 'milligram',
        name: transformi18n('milligram (mg)'),
        symbol: 'mg',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'gram',
        name: transformi18n('gram (g)'),
        symbol: 'g',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'pound_mass',
        name: transformi18n('pound (lb)'),
        symbol: 'lb',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'kilogram',
        name: transformi18n('kilogram (kg)'),
        symbol: 'kg',
        display: (val, sy) => computing(val, massUnits, sy),
      },
      {
        id: 'metric',
        name: transformi18n('metric ton (t)'),
        symbol: 't',
        display: (val, sy) => computing(val, massUnits, sy),
      },
    ],
  },
  length: {
    name: transformi18n('Length'),
    units: [
      {
        id: 'millimeter',
        name: transformi18n('millimeter (mm)'),
        symbol: 'mm',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'inch',
        name: transformi18n('inch (in)'),
        symbol: 'in',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'feet',
        name: transformi18n('feet (ft)'),
        symbol: 'ft',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'meter',
        name: transformi18n('meter (m)'),
        symbol: 'm',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'kilometer',
        name: transformi18n('kilometer (km)'),
        symbol: 'km',
        display: (val, sy) => computing(val, lengthUnits, sy),
      },
      {
        id: 'mile',
        name: transformi18n('mile (mi)'),
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
