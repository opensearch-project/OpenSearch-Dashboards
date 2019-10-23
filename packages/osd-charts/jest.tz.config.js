const baseConfig = require('./jest.config');

const TIMEZONES = {
  'Asia/Tokyo': {
    extension: 'jp',
    name: 'America/Tokyo',
    color: 'blue',
  },
  'America/New_York': {
    extension: 'ny',
    name: 'America/Tokyo',
    color: 'blue',
  },
  UTC: {
    extension: 'utc',
    name: 'UTC',
    color: 'blue',
  },
};

const { extension, name, color = 'blue' } = TIMEZONES[process.env.TZ] || {};

if (!extension || !name) {
  throw new Error('Invalid time zone provided to jest.tz.config.js');
}

module.exports = Object.assign(baseConfig, {
  testMatch: [`**/?(*.)tz.+(spec|test)?(.${extension}).[jt]s?(x)`],
  displayName: {
    name: `TIMEZONE: ${name}`,
    color,
  },
});
