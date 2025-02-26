/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryLanguages } from './constants';
import { formatValue } from './shared';

export const visualizationTitlesWithNoInspectOptions = [
  '[Flights]Controls',
  '[Flights]MarkdownInstructions',
  '[Flights]Delays&Cancellations',
];

export const visualizationTitlesWithInspectOptions = [
  '[Flights]AirlineCarrier',
  '[Flights]FlightCountandAverageTicketPrice',
  '[Flights]TotalFlights',
  '[Flights]AverageTicketPrice',
];

/**
 * Returns the query string to use for a given dataset+language
 * @param {string} dataset - the dataset name to use
 * @param {QueryEnhancementLanguage} language - the name of query language
 * @returns {string}
 */
export const getQueryString = (dataset, language) => {
  switch (language) {
    case QueryLanguages.DQL.name:
      return '';
    case QueryLanguages.Lucene.name:
      return '';
    case QueryLanguages.SQL.name:
      return `SELECT * FROM ${dataset} ORDER BY timestamp`;
    case QueryLanguages.PPL.name:
      return `source = ${dataset} | sort timestamp`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
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
    queryString: getQueryString(dataset, language.name),
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};

/**
 * Recursively flattens a nested object structure into dot notation and formats all values
 * @param {object} obj - Object to be flattened
 * @param {string} [parentKey] - Key prefix for nested properties
 * @param {object} [properties={}] - Accumulator for flattened properties
 * @returns {object} Flattened object with formatted values
 * @example
 * const input = {
 *   FlightNum: "SYS76NQ",
 *   DestLocation: { lat: "38.94449997", lon: "-77.45580292" }
 * };
 * flattenObjectAndFormatValues(input)
 * // Returns: {
 * //   FlightNum: "SYS76NQ",
 * //   "DestLocation.lat": "38.94449997",
 * //   "DestLocation.lon": "-77.45580292"
 * // }
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
 * Flattens an array of field definitions and extracts values for a specific row
 * @param {[object]} arr - Array of field definitions to be flattened
 * @param {number} rowNumber - Number for the specific row to be extracted.
 * @returns {object} Flattened object with formatted values
 * @example
 * const input = [{
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
        ]
    }
];
 * flattenObjectAndFormatValues(input)
 * // Returns: {
 * //   FlightNum: "9HY9SWR",
 * //   "personal.address.country": "USA",
 * //   "personal.address.coordinates.lon": "-87.6298",
 * //   "personal.address.coordinates.lat": "41.8781",
 * //   "personal.email": "Lula_Bartell65@hotmail.com"
 * // }
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
 * Verifies that specified visualizations in a dashboard do not have inspect options
 * Tests each visualization in visualizationTitlesWithNoInspectOptions array
 * @param {[string]} visualizationTitlesWithNoInspectOptions - array of titles of visualizations to check.
 */
export const verifyVisualizationsWithNoInspectOption = (
  visualizationTitlesWithNoInspectOptions
) => {
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
 * Verifies that specified visualizations in a dashboard has inspect options and the corresponding data and request tables
 * Tests each visualization in visualizationTitlesWithInspectOptions array
 * @param {[string]} visualizationTitlesWithInspectOptions - array of titles of visualizations to check.
 */
export const verifyVisualizationsWithInspectOption = (visualizationTitlesWithInspectOptions) => {
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
