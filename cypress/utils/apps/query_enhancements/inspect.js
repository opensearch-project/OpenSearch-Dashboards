/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryLanguages } from './constants';

const visualizationTitlesWithNoInspectOptions = [
  '[Flights]Controls',
  '[Flights]MarkdownInstructions',
  '[Flights]Delays&Cancellations',
];

const visualizationTitlesWithInspectOptions = [
  '[Flights]AirlineCarrier',
  '[Flights]FlightCountandAverageTicketPrice',
  '[Flights]TotalFlights',
  '[Flights]AverageTicketPrice',
];

/**
 * Gets Date and returns string of date in format Jan 24, 2025 @ 16:20:08.000
 * @param {Date} date - date to format
 * @returns {string} - in the format e.g. Jan 24, 2025 @ 16:20:08.000
 */
function formatDate(date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = months[date.getMonth()];
  const day = date.getDate().toString();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

  return `${month} ${day}, ${year} @ ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Format value to the corresponding string expected in the UI.
 * Formats commas in numbers, and dates.
 * @param {string} value - field value to be formatted.
 * @returns {string}
 */
const formatValue = (value) => {
  switch (typeof value) {
    case 'number':
      return value.toLocaleString();
    case 'string':
      // SQL and PPL date string uses format YYYY-MM-DD HH:MM:SS.SSS, we want to convert to ISO date.
      const potentialDate = new Date(value.replace(' ', 'T'));
      if (potentialDate instanceof Date && !isNaN(potentialDate)) {
        return formatDate(potentialDate);
      }
    default:
      return value;
  }
};

/**
 * Returns the SavedSearchTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {InspectTestConfig}
 */
export const generateInspectTestConfiguration = (dataset, datasetType, language) => {
  return {
    dataset,
    datasetType,
    language: language.name,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};

/**
 * Flatten the object in the format e.g. {
                        "FlightNum": "SYS76NQ",
                        "DistanceKilometers": 7030.318886915258,
                        "timestamp": "2025-01-27T16:06:01",
                        "DestLocation": {
                            "lat": "38.94449997",
                            "lon": "-77.45580292"
                        },
                    } and format the values.
 * @param {object} obj - Object to be flattened.
 * @param {string?} parentKey - Starting prefix which will be prepended to all properties. Leave blank if not needed.
 * @param {object?} properties - Object to be modified.
 * @returns {object}
 */

const flattenObjectAndFormatValues = (obj, parentKey, properties = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const property = parentKey ? `${parentKey}.${key}` : key;
    if (Array.isArray(value)) {
      // SQL and PPL arrays put objects into their own arrays with no other objects in the array.
      flattenObjectAndFormatValues(value[0], property, properties);
    } else if (typeof value === 'object' && value !== null) {
      // Assume that the value will never be a function.
      flattenObjectAndFormatValues(value, property, properties);
    } else {
      properties[property] = formatValue(value);
    }
  }
  return properties;
};

/**
 * Flatten the array in the format e.g. [
    {
        "name": "FlightNum",
        "type": "string",
        "values": [
            "9HY9SWR",
            "X98CCZO"
        ]
    },
    {
        "name": "personal",
        "type": "nested",
        "values": [
            [
                {
                    "address": [
                        {
                            "country": "USA",
                            "coordinates": [
                                {
                                    "lon": -87.6298,
                                    "lat": 41.8781
                                }
                            ]
                        }
                    ],
                    "email": "Lula_Bartell65@hotmail.com"
                }
            ],
            [
                {
                    "address": [
                        {
                            "country": "USA",
                            "coordinates": [
                                {
                                    "lon": -118.2437,
                                    "lat": 34.0522
                                }
                            ]
                        }
                    ],
                    "email": "Carolyne43@yahoo.com"
                }
            ]
        ]
    }
] and format the values.
 * @param {object} arr - Array to be flattened (contains objects).
 * @param {number} rowNumber - The rowNumberth row to get all values from. (Starts from 0.)
 * @returns {object}
 */
const flattenArrayAndFormatValues = (arr, rowNumber) => {
  const properties = {};
  arr.forEach((field) => {
    if (field.type === 'nested' || field.type === 'array') {
      flattenObjectAndFormatValues(field.values[rowNumber][0], field.name, properties);
    } else {
      cy.log(field.values[rowNumber], typeof field.values[rowNumber]);
      properties[field.name] = formatValue(field.values[rowNumber]);
    }
  });
  return properties;
};

/**
 * Get an object with flattened fields and values from the first row of the intercepted response body.
 * @param {object} interceptedRequest - The intercepted request to parse.
 * @param {string} language - Query language.
 * @returns {object} Flattened fields and values from the first row.
 */
export const getFlattenedFieldsWithValue = (interceptedRequest, language) => {
  // SQL and PPL uses a different api schema
  if (language !== QueryLanguages.SQL.name && language !== QueryLanguages.PPL.name) {
    const responseQueryHits = interceptedRequest.response.body.rawResponse.hits.hits;
    // Fail fast if there are no results
    cy.wrap(responseQueryHits).should('have.length.above', 0);

    return flattenObjectAndFormatValues(responseQueryHits[0]._source);
  } else {
    const responseQueryHits = interceptedRequest.response.body.body.size;
    // Fail fast if there are no results
    cy.wrap(responseQueryHits).should('be.gt', 0);

    return flattenArrayAndFormatValues(interceptedRequest.response.body.body.fields, 0);
  }
};

/**
 * In the Flights dashboard, verify that the visualizations identified as not having an inspect option do not have the option.
 */
export const verifyVisualizationsWithNoInspectOption = () => {
  visualizationTitlesWithNoInspectOptions.forEach((visualizationTitle) => {
    cy.log(visualizationTitle);
    const title = cy.getElementByTestIdLike(`embeddablePanelHeading-${visualizationTitle}`);
    const icon = title.parent().findElementByTestId('embeddablePanelToggleMenuIcon');

    cy.log(title, icon);
    cy.getElementByTestIdLike(`embeddablePanelHeading-${visualizationTitle}`)
      .parent()
      .findElementByTestId('embeddablePanelToggleMenuIcon')
      .click();

    cy.getElementByTestId('embeddablePanelAction-openInspector').should('not.exist');
  });
};

/**
 * In the Flights dashboard, verify that the visualizations identified as having an inspect option have the option.
 */
export const verifyVisualizationsWithInspectOption = () => {
  visualizationTitlesWithInspectOptions.forEach((visualizationTitle) => {
    cy.getElementByTestIdLike(`embeddablePanelHeading-${visualizationTitle}`)
      .parent()
      .findElementByTestId('embeddablePanelToggleMenuIcon')
      .click();

    cy.getElementByTestId('embeddablePanelAction-openInspector').should('exist').click();
    cy.getElementByTestId('inspectorPanel').findElementByTestId('inspectorTable').should('exist');
    cy.getElementByTestId('inspectorPanel')
      .findElementByTestId('inspectorViewChooser')
      .should('exist')
      .click();
    cy.getElementByTestId('inspectorViewChooserRequests').click();
    cy.getElementByTestId('inspectorRequestDetailStatistics').should('exist');
    cy.getElementByTestId('euiFlyoutCloseButton').click();
  });
};
