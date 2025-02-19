/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { START_TIME, END_TIME, QueryLanguages } from './constants';

const formatDateForUrl = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * Verifies share URL parameters based on query language
 * @param {string} url Share URL to verify
 * @param {Object} config Test configuration
 * @param {Object} testData Data that should be in columns
 * @param {string} datasourceName Expected datasource name
 */
export const verifyShareUrl = (url, config, testData, datasourceName, queryString) => {
  const hashPart = url.split('#')[1];
  if (!hashPart) {
    throw new Error('No hash part in URL');
  }

  const searchParams = new URLSearchParams(hashPart);
  const q = searchParams.get('_q');
  const a = searchParams.get('_a');
  const g = searchParams.get('_g');

  // Query param checks
  expect(q).to.include(datasourceName);
  expect(q).to.include(config.dataset);
  expect(q).to.include(config.datasetType);
  expect(q).to.include(queryString);
  if (config.language === QueryLanguages.SQL.name) {
    // Not OpenSearch SQL
    expect(q).to.include('language:SQL');
  } else if (config.language === QueryLanguages.PPL.name) {
    expect(q).to.include(`language:${config.language}`);
  } else {
    const expectedLanguage = config.language === QueryLanguages.DQL.name ? 'kuery' : 'lucene';
    expect(q).to.include(`language:${expectedLanguage}`);
    expect(q).to.include(`${testData.filter[0]}:${testData.filter[1]}`);
  }

  // App state checks
  testData.fields.forEach((field, i) => {
    expect(a).to.include(field);
    if ([QueryLanguages.DQL.name, QueryLanguages.Lucene.name].includes(config.language)) {
      expect(a).to.include(`${field},${testData.sort[i]}`);
      expect(a).to.include(`interval:${testData.interval}`);
    }
  });

  // Global state check
  if (config.language !== QueryLanguages.SQL.name) {
    expect(g).to.include(`from:'${formatDateForUrl(START_TIME)}'`);
    expect(g).to.include(`to:'${formatDateForUrl(END_TIME)}'`);
  }
};
