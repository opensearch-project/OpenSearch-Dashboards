/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const program = require('commander');
const { createWriteStream } = require('fs');
const { join } = require('path');
const { TestDataGenerator } = require('./test_data_generator');

// Need to update different path for multiple clusters
const DEFAULT_PATH =
  './cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/data_logs_1';

// Helper function to parse integer
function parseInteger(value) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

program
  .name('node cypress/scripts/generate_data/index.js')
  .arguments('<index>', 'Index name for the test data')
  .arguments('[path]', 'Path to save the test data')
  .option('-n, --doc-count <number>', 'Number of documents to generate', parseInteger, 10000)
  .option('-st, --start-time <date>', 'Start time for generating docs', '2021-01-01T00:00:00.000')
  .option('-et, --end-time <date>', 'End time for generating docs', '2022-12-31T23:59:59.999')
  .option('--no-timestamp', 'Generate data without timestamp fields')
  .action(async (indexName, path, options) => {
    try {
      const { docCount, startTime, endTime, timestamp } = options;

      console.log('Generating data with options:', {
        indexName,
        docCount,
        startTime: timestamp ? startTime : 'N/A',
        endTime: timestamp ? endTime : 'N/A',
        includeTimestamp: timestamp,
        path: path || DEFAULT_PATH,
      });

      // Create generator
      const generator = new TestDataGenerator(startTime, endTime, docCount, timestamp);

      // Create files for both data and mapping
      const filePath = path || DEFAULT_PATH;

      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      const dataWriter = createWriteStream(join(filePath, `${indexName}.data.ndjson`));
      const mappingWriter = createWriteStream(join(filePath, `${indexName}.mapping.json`));

      // Write mapping
      mappingWriter.write(JSON.stringify(generator.createMapping(), null, 2));
      mappingWriter.end();

      // Create documents
      for (let i = 0; i < docCount; i++) {
        const indexLine = JSON.stringify({ index: { _index: indexName, _id: i } });
        const docLine = JSON.stringify(generator.createDoc(i));

        dataWriter.write(indexLine + '\n');
        dataWriter.write(docLine + '\n');
      }

      dataWriter.end();

      // Wait for files to be written
      await new Promise((resolve) => {
        dataWriter.on('finish', () => {
          console.log(`Successfully created ${docCount} documents for index ${indexName}`);
          console.log(`Data file: ${join(filePath, indexName)}.data.ndjson`);
          console.log(`Mapping file: ${join(filePath, indexName)}.mapping.json`);
          resolve();
        });
      });
    } catch (error) {
      console.error('Error generating data:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
