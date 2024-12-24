/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { faker } = require('@faker-js/faker');
const { DateTime } = require('luxon');

class TestDataGenerator {
  constructor(startTime, endTime, docCount, includeTimestamp = true) {
    faker.seed(Date.now() + Math.random());
    this.includeTimestamp = includeTimestamp;

    // Fixed ranges for testing
    this.categories = ['Network', 'Database', 'Security', 'Application'];
    this.statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];

    // Country-city mapping for controlled location data
    this.locationMap = {
      USA: ['New York', 'Los Angeles', 'Chicago', 'Seattle'],
      UK: ['London', 'Manchester', 'Birmingham'],
      Germany: ['Berlin', 'Munich', 'Hamburg'],
      France: ['Paris', 'Lyon', 'Marseille'],
      Japan: ['Tokyo', 'Osaka', 'Kyoto'],
      Australia: ['Sydney', 'Melbourne', 'Brisbane'],
      Canada: ['Toronto', 'Vancouver', 'Montreal'],
      Brazil: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'],
      India: ['Mumbai', 'Delhi', 'Bangalore'],
      China: ['Beijing', 'Shanghai', 'Shenzhen'],
    };

    this.countries = Object.keys(this.locationMap);
    this.categoryCount = this.categories.length;

    // Only set time-related properties if includeTimestamp is true
    if (includeTimestamp) {
      this.start = this.toDateTime(startTime);
      this.end = this.toDateTime(endTime);
      const { milliseconds: diffTime } = this.end.diff(this.start).toObject();
      this.delta = Math.floor(diffTime / docCount);
    }
    this.docCount = docCount;

    // Initialize sequence counter for generating large sequential numbers
    this.sequenceCounter = BigInt(Date.now()) * BigInt(1000000); // Start with a large base number
  }

  toDateTime(value) {
    return DateTime.fromISO(value, { zone: 'utc' });
  }

  getRandomLocation() {
    const country = faker.helpers.arrayElement(this.countries);
    const cities = this.locationMap[country];
    const city = faker.helpers.arrayElement(cities);
    return { country, city };
  }

  getLocationWithCoordinates() {
    const location = this.getRandomLocation();
    // Fixed coordinates for each city to ensure consistency
    const coordinatesMap = {
      'New York': { lat: 40.7128, lon: -74.006 },
      'Los Angeles': { lat: 34.0522, lon: -118.2437 },
      Chicago: { lat: 41.8781, lon: -87.6298 },
      Seattle: { lat: 47.6062, lon: -122.3321 },
      London: { lat: 51.5074, lon: -0.1278 },
      Manchester: { lat: 53.4808, lon: -2.2426 },
      Birmingham: { lat: 52.4862, lon: -1.8904 },
      Berlin: { lat: 52.52, lon: 13.405 },
      Munich: { lat: 48.1351, lon: 11.582 },
      Hamburg: { lat: 53.5511, lon: 9.9937 },
      Paris: { lat: 48.8566, lon: 2.3522 },
      Lyon: { lat: 45.764, lon: 4.8357 },
      Marseille: { lat: 43.2965, lon: 5.3698 },
      Tokyo: { lat: 35.6762, lon: 139.6503 },
      Osaka: { lat: 34.6937, lon: 135.5023 },
      Kyoto: { lat: 35.0116, lon: 135.7681 },
      Sydney: { lat: -33.8688, lon: 151.2093 },
      Melbourne: { lat: -37.8136, lon: 144.9631 },
      Brisbane: { lat: -27.4705, lon: 153.026 },
      Toronto: { lat: 43.6532, lon: -79.3832 },
      Vancouver: { lat: 49.2827, lon: -123.1207 },
      Montreal: { lat: 45.5017, lon: -73.5673 },
      'Sao Paulo': { lat: -23.5505, lon: -46.6333 },
      'Rio de Janeiro': { lat: -22.9068, lon: -43.1729 },
      Brasilia: { lat: -15.7975, lon: -47.8919 },
      Mumbai: { lat: 19.076, lon: 72.8777 },
      Delhi: { lat: 28.6139, lon: 77.209 },
      Bangalore: { lat: 12.9716, lon: 77.5946 },
      Beijing: { lat: 39.9042, lon: 116.4074 },
      Shanghai: { lat: 31.2304, lon: 121.4737 },
      Shenzhen: { lat: 22.5431, lon: 114.0579 },
    };

    return {
      ...location,
      coordinates: coordinatesMap[location.city],
    };
  }

  getNextSequenceNumber() {
    const sequenceNumber = this.sequenceCounter;
    this.sequenceCounter = this.sequenceCounter + BigInt(Math.floor(Math.random() * 1000) + 1);
    return Number(sequenceNumber); // Convert back to number for JSON serialization
  }

  createDoc(index) {
    const location = this.getLocationWithCoordinates();
    const doc = {
      category: this.categories[Math.floor((index * this.categoryCount) / this.docCount)],
      status_code: faker.helpers.arrayElement(this.statusCodes),
      response_time: faker.datatype.float({ min: 0.1, max: 5.0, precision: 0.01 }),
      bytes_transferred: faker.datatype.number({ min: 100, max: 10000 }),
      event_sequence_number: this.getNextSequenceNumber(), // New field for large numbers
      request_url: faker.internet.url(),
      service_endpoint: `/api/v${faker.datatype.number({
        min: 1,
        max: 3,
      })}/${faker.helpers.arrayElement(['users', 'orders', 'products', 'auth'])}`,

      personal: {
        user_id: faker.datatype.uuid(),
        name: faker.name.fullName(),
        age: faker.datatype.number({ min: 18, max: 80 }),
        email: faker.internet.email(),
        address: {
          street: faker.address.streetAddress(),
          city: location.city,
          country: location.country,
          coordinates: location.coordinates,
        },
      },
    };

    // Add timestamp fields only if includeTimestamp is true
    if (this.includeTimestamp) {
      const eventTime = this.start.plus({ milliseconds: index * this.delta });
      doc.timestamp = eventTime.toISO();
      doc.event_time = eventTime
        .minus({ hours: faker.datatype.number({ min: 1, max: 24 }) })
        .toISO();
      doc.personal.birthdate = faker.date
        .birthdate({ min: 18, max: 80, mode: 'age' })
        .toISOString();
    }

    return doc;
  }

  createMapping() {
    const mapping = {
      mappings: {
        properties: {
          category: { type: 'keyword' },
          status_code: { type: 'integer' },
          response_time: { type: 'float' },
          bytes_transferred: { type: 'long' },
          event_sequence_number: { type: 'long' }, // New field mapping
          request_url: { type: 'keyword' },
          service_endpoint: { type: 'keyword' },
          personal: {
            type: 'nested',
            properties: {
              user_id: { type: 'keyword' },
              name: { type: 'keyword' },
              age: { type: 'integer' },
              email: { type: 'keyword' },
              address: {
                type: 'nested',
                properties: {
                  street: { type: 'keyword' },
                  city: { type: 'keyword' },
                  country: { type: 'keyword' },
                  coordinates: {
                    type: 'nested',
                    properties: {
                      lat: { type: 'float' },
                      lon: { type: 'float' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Add timestamp fields to mapping only if includeTimestamp is true
    if (this.includeTimestamp) {
      mapping.mappings.properties.timestamp = { type: 'date' };
      mapping.mappings.properties.event_time = { type: 'date' };
      mapping.mappings.properties.personal.properties.birthdate = { type: 'date' };
    }

    return mapping;
  }
}

module.exports = {
  TestDataGenerator,
};
