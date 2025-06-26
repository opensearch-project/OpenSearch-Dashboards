/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../monaco';
import { ID } from './constants';
import { registerWorker } from '../worker_store';
import { PPLWorkerProxyService } from './worker_proxy_service';
import { getPPLLanguageAnalyzer } from './ppl_language_analyzer';
// @ts-ignore
import { getPPLDocumentationLink } from './ppl_documentation';
// @ts-ignore
import workerSrc from '!!raw-loader!../../target/public/ppl.editor.worker.js';

const PPL_LANGUAGE_ID = ID;
const OWNER = 'PPL_WORKER';

// Register ppl worker to the worker map first
registerWorker(ID, workerSrc);

// PPL worker proxy service for worker-based syntax highlighting
const pplWorkerProxyService = new PPLWorkerProxyService();

// PPL analyzer for synchronous tokenization (lazy initialization)
let pplAnalyzer: ReturnType<typeof getPPLLanguageAnalyzer> | undefined;

/**
 * Map PPL Language Analyzer tokens to Monaco editor token classes
 * Based on ANTLR-generated token types from OpenSearchPPLLexer
 */
const mapPPLTokenToMonacoTokenType = (tokenType: string): string => {
  const type = tokenType.toUpperCase();

  // PPL Command Keywords - Core query language commands
  if (
    [
      'SEARCH',
      'DESCRIBE',
      'SHOW',
      'FROM',
      'WHERE',
      'FIELDS',
      'RENAME',
      'STATS',
      'DEDUP',
      'SORT',
      'EVAL',
      'HEAD',
      'TOP',
      'RARE',
      'PARSE',
      'METHOD',
      'REGEX',
      'PUNCT',
      'GROK',
      'PATTERN',
      'PATTERNS',
      'NEW_FIELD',
      'KMEANS',
      'AD',
      'ML',
      'SOURCE',
    ].includes(type)
  ) {
    return 'keyword';
  }

  // Command Modifiers - Keywords that assist commands
  if (
    [
      'AS',
      'BY',
      'INDEX',
      'D',
      'DESC',
      'DATASOURCES',
      'SORTBY',
      'KEEPEMPTY',
      'CONSECUTIVE',
      'DEDUP_SPLITVALUES',
      'PARTITIONS',
      'ALLNUM',
      'DELIM',
      'CENTROIDS',
      'ITERATIONS',
      'DISTANCE_TYPE',
      'NUMBER_OF_TREES',
      'SHINGLE_SIZE',
      'SAMPLE_SIZE',
      'OUTPUT_AFTER',
      'TIME_DECAY',
      'ANOMALY_RATE',
      'CATEGORY_FIELD',
      'TIME_FIELD',
      'TIME_ZONE',
      'TRAINING_DATA_SIZE',
      'ANOMALY_SCORE_THRESHOLD',
    ].includes(type)
  ) {
    return 'attribute';
  }

  // Field Type Keywords - Field type specifiers
  if (['AUTO', 'STR', 'IP', 'NUM'].includes(type)) {
    return 'type';
  }

  // Logical & Comparison Keywords - Boolean logic and conditionals
  if (['NOT', 'OR', 'AND', 'XOR', 'TRUE', 'FALSE', 'REGEXP', 'CASE', 'IN'].includes(type)) {
    return 'keyword';
  }

  // Data Type Keywords - Type declarations
  if (['INT', 'INTEGER', 'DOUBLE', 'LONG', 'FLOAT', 'STRING', 'BOOLEAN'].includes(type)) {
    return 'type';
  }

  // Dataset Type Keywords - Special dataset types
  if (['DATAMODEL', 'LOOKUP', 'SAVEDSEARCH'].includes(type)) {
    return 'tag';
  }

  // Time Span Keywords - Time interval specifiers
  if (['SPAN', 'MS', 'S', 'M', 'H', 'W', 'Q', 'Y'].includes(type)) {
    return 'type';
  }

  // DateTime & Interval Keywords - Date/time related keywords
  if (
    [
      'CONVERT_TZ',
      'DATETIME',
      'DAY',
      'DAY_HOUR',
      'DAY_MICROSECOND',
      'DAY_MINUTE',
      'DAY_OF_YEAR',
      'DAY_SECOND',
      'HOUR',
      'HOUR_MICROSECOND',
      'HOUR_MINUTE',
      'HOUR_OF_DAY',
      'HOUR_SECOND',
      'INTERVAL',
      'MICROSECOND',
      'MILLISECOND',
      'MINUTE',
      'MINUTE_MICROSECOND',
      'MINUTE_OF_DAY',
      'MINUTE_OF_HOUR',
      'MINUTE_SECOND',
      'MONTH',
      'MONTH_OF_YEAR',
      'QUARTER',
      'SECOND',
      'SECOND_MICROSECOND',
      'SECOND_OF_MINUTE',
      'WEEK',
      'WEEK_OF_YEAR',
      'YEAR',
      'YEAR_MONTH',
    ].includes(type)
  ) {
    return 'type';
  }

  // Aggregate Functions - Statistical and aggregation functions
  if (
    [
      'AVG',
      'COUNT',
      'DISTINCT_COUNT',
      'ESTDC',
      'ESTDC_ERROR',
      'MAX',
      'MEAN',
      'MEDIAN',
      'MIN',
      'MODE',
      'RANGE',
      'STDEV',
      'STDEVP',
      'SUM',
      'SUMSQ',
      'VAR_SAMP',
      'VAR_POP',
      'STDDEV_SAMP',
      'STDDEV_POP',
      'PERCENTILE',
      'TAKE',
      'FIRST',
      'LAST',
      'LIST',
      'VALUES',
      'EARLIEST',
      'EARLIEST_TIME',
      'LATEST',
      'LATEST_TIME',
      'PER_DAY',
      'PER_HOUR',
      'PER_MINUTE',
      'PER_SECOND',
      'RATE',
      'SPARKLINE',
      'C',
      'DC',
    ].includes(type)
  ) {
    return 'predefined.function';
  }

  // Mathematical Functions - Math and trigonometric functions
  if (
    [
      'ABS',
      'CBRT',
      'CEIL',
      'CEILING',
      'CONV',
      'CRC32',
      'E',
      'EXP',
      'FLOOR',
      'LN',
      'LOG',
      'LOG10',
      'LOG2',
      'MOD',
      'PI',
      'POSITION',
      'POW',
      'POWER',
      'RAND',
      'ROUND',
      'SIGN',
      'SQRT',
      'TRUNCATE',
      'ACOS',
      'ASIN',
      'ATAN',
      'ATAN2',
      'COS',
      'COT',
      'DEGREES',
      'RADIANS',
      'SIN',
      'TAN',
    ].includes(type)
  ) {
    return 'predefined.function';
  }

  // Date/Time Functions - Date and time manipulation functions
  if (
    [
      'ADDDATE',
      'ADDTIME',
      'CURDATE',
      'CURRENT_DATE',
      'CURRENT_TIME',
      'CURRENT_TIMESTAMP',
      'CURTIME',
      'DATE',
      'DATEDIFF',
      'DATE_ADD',
      'DATE_FORMAT',
      'DATE_SUB',
      'DAYNAME',
      'DAYOFMONTH',
      'DAYOFWEEK',
      'DAYOFYEAR',
      'DAY_OF_MONTH',
      'DAY_OF_WEEK',
      'EXTRACT',
      'FROM_DAYS',
      'FROM_UNIXTIME',
      'GET_FORMAT',
      'LAST_DAY',
      'LOCALTIME',
      'LOCALTIMESTAMP',
      'MAKEDATE',
      'MAKETIME',
      'MONTHNAME',
      'NOW',
      'PERIOD_ADD',
      'PERIOD_DIFF',
      'SEC_TO_TIME',
      'STR_TO_DATE',
      'SUBDATE',
      'SUBTIME',
      'SYSDATE',
      'TIME',
      'TIMEDIFF',
      'TIMESTAMP',
      'TIMESTAMPADD',
      'TIMESTAMPDIFF',
      'TIME_FORMAT',
      'TIME_TO_SEC',
      'TO_DAYS',
      'TO_SECONDS',
      'UNIX_TIMESTAMP',
      'UTC_DATE',
      'UTC_TIME',
      'UTC_TIMESTAMP',
      'WEEKDAY',
      'YEARWEEK',
    ].includes(type)
  ) {
    return 'predefined';
  }

  // String Functions - String manipulation functions
  if (
    [
      'SUBSTR',
      'SUBSTRING',
      'LTRIM',
      'RTRIM',
      'TRIM',
      'TO',
      'LOWER',
      'UPPER',
      'CONCAT',
      'CONCAT_WS',
      'LENGTH',
      'STRCMP',
      'RIGHT',
      'LEFT',
      'ASCII',
      'LOCATE',
      'REPLACE',
      'REVERSE',
      'CAST',
    ].includes(type)
  ) {
    return 'predefined';
  }

  // Boolean Functions - Boolean and null checking functions
  if (['LIKE', 'ISNULL', 'ISNOTNULL', 'IFNULL', 'NULLIF', 'IF', 'TYPEOF'].includes(type)) {
    return 'predefined';
  }

  // Relevance Functions - Elasticsearch/OpenSearch search functions
  if (
    [
      'MATCH',
      'MATCH_PHRASE',
      'MATCH_PHRASE_PREFIX',
      'MATCH_BOOL_PREFIX',
      'SIMPLE_QUERY_STRING',
      'MULTI_MATCH',
      'QUERY_STRING',
    ].includes(type)
  ) {
    return 'predefined';
  }

  // Relevance Function Parameters - Parameters for search functions
  if (
    [
      'ALLOW_LEADING_WILDCARD',
      'ANALYZE_WILDCARD',
      'ANALYZER',
      'AUTO_GENERATE_SYNONYMS_PHRASE_QUERY',
      'BOOST',
      'CUTOFF_FREQUENCY',
      'DEFAULT_FIELD',
      'DEFAULT_OPERATOR',
      'ENABLE_POSITION_INCREMENTS',
      'ESCAPE',
      'FLAGS',
      'FUZZY_MAX_EXPANSIONS',
      'FUZZY_PREFIX_LENGTH',
      'FUZZY_TRANSPOSITIONS',
      'FUZZY_REWRITE',
      'FUZZINESS',
      'LENIENT',
      'LOW_FREQ_OPERATOR',
      'MAX_DETERMINIZED_STATES',
      'MAX_EXPANSIONS',
      'MINIMUM_SHOULD_MATCH',
      'OPERATOR',
      'PHRASE_SLOP',
      'PREFIX_LENGTH',
      'QUOTE_ANALYZER',
      'QUOTE_FIELD_SUFFIX',
      'REWRITE',
      'SLOP',
      'TIE_BREAKER',
      'TYPE',
      'ZERO_TERMS_QUERY',
    ].includes(type)
  ) {
    return 'attribute';
  }

  // Operators
  if (
    [
      'PIPE',
      'COMMA',
      'DOT',
      'EQUAL',
      'GREATER',
      'LESS',
      'NOT_GREATER',
      'NOT_LESS',
      'NOT_EQUAL',
      'PLUS',
      'MINUS',
      'STAR',
      'DIVIDE',
      'MODULE',
      'EXCLAMATION_SYMBOL',
      'COLON',
      'BIT_NOT_OP',
      'BIT_AND_OP',
      'BIT_XOR_OP',
    ].includes(type)
  ) {
    return 'operator';
  }

  // Brackets and delimiters
  if (
    [
      'LT_PRTHS',
      'RT_PRTHS',
      'LT_SQR_PRTHS',
      'RT_SQR_PRTHS',
      'SINGLE_QUOTE',
      'DOUBLE_QUOTE',
      'BACKTICK',
    ].includes(type)
  ) {
    return 'delimiter';
  }

  // Field names and identifiers
  if (type === 'ID' || type === 'CLUSTER') {
    return 'variable';
  }

  // String literals
  if (type === 'DQUOTA_STRING' || type === 'SQUOTA_STRING' || type === 'BQUOTA_STRING') {
    return 'string';
  }

  // Numeric literals
  if (type === 'INTEGER_LITERAL' || type === 'DECIMAL_LITERAL') {
    return 'number';
  }

  // Comments
  if (type === 'COMMENT' || type === 'LINE_COMMENT') {
    return 'comment';
  }

  // Whitespace
  if (type === 'SPACE') {
    return 'white';
  }

  // Default case
  return 'identifier';
};

/**
 * Create Monaco language configuration for PPL
 */
const createPPLLanguageConfiguration = (): monaco.languages.LanguageConfiguration => ({
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
});

/**
 * Set up synchronous tokenization for PPL
 */
const setupPPLTokenization = () => {
  monaco.languages.setTokensProvider(PPL_LANGUAGE_ID, {
    getInitialState: () => {
      const state = {
        clone: () => state,
        equals: () => true,
      };
      return state;
    },
    tokenize: (line: string, state: any) => {
      // Use PPL Language Analyzer for accurate tokenization
      const tokens: monaco.languages.IToken[] = [];

      try {
        // Only process if line contains potential PPL content
        if (line.trim()) {
          // Lazy initialize the PPL analyzer only when needed
          if (!pplAnalyzer) {
            pplAnalyzer = getPPLLanguageAnalyzer();
          }

          const pplTokens = pplAnalyzer.tokenize(line);

          for (const pplToken of pplTokens) {
            const tokenType = mapPPLTokenToMonacoTokenType(pplToken.type);
            tokens.push({
              startIndex: pplToken.startIndex,
              scopes: tokenType,
            });
          }
        }
      } catch (error) {
        // If ANTLR fails, return empty tokens (no fallback)
        // eslint-disable-next-line no-console
        console.warn('PPL tokenization failed for line:', line, error);
      }

      return {
        tokens,
        endState: state,
      };
    },
  });
};

/**
 * Set up syntax highlighting using PPL worker
 */
const setupPPLSyntaxHighlighting = () => {
  // Set up the worker
  pplWorkerProxyService.setup(workerSrc);

  const allDisposables: monaco.IDisposable[] = [];
  const modelHandlers = new Map<monaco.editor.IModel, monaco.IDisposable[]>();

  const processSyntaxHighlighting = async (model: monaco.editor.IModel) => {
    // Only process if the model is still set to PPL language
    if (model.getLanguageId() !== PPL_LANGUAGE_ID) {
      // Clear any existing PPL markers if language changed
      monaco.editor.setModelMarkers(model, OWNER, []);
      return;
    }

    try {
      const content = model.getValue();

      // Get validation result from worker
      const validationResult = await pplWorkerProxyService.validate(content);

      if (validationResult.errors.length > 0) {
        // Convert errors to Monaco markers
        const markers: monaco.editor.IMarkerData[] = validationResult.errors.map((error) => {
          // Handle different error types with safe property access
          const startLineNumber = (error as any).startLineNumber || (error as any).line || 1;
          const endLineNumber =
            (error as any).endLineNumber || (error as any).endLine || startLineNumber;
          const startColumn = (error as any).startColumn || (error as any).column || 1;
          const endColumn = (error as any).endColumn || startColumn + 1;

          const safeStartLine = Math.max(1, startLineNumber);
          const safeEndLine = Math.max(safeStartLine, endLineNumber);
          const safeStartColumn = Math.max(1, startColumn);
          const safeEndColumn = Math.max(safeStartColumn, endColumn);

          const docLink = getPPLDocumentationLink(error.message);
          return {
            severity: monaco.MarkerSeverity.Error,
            message: error.message,
            startLineNumber: safeStartLine,
            startColumn: safeStartColumn,
            endLineNumber: safeEndLine,
            endColumn: safeEndColumn,
            // Add error code for better categorization
            code: {
              value: 'View Documentation',
              target: monaco.Uri.parse(docLink.url),
            },
          };
        });

        monaco.editor.setModelMarkers(model, OWNER, markers);
      } else {
        // Clear markers if no errors
        monaco.editor.setModelMarkers(model, OWNER, []);
      }
    } catch (error) {
      // Silent error handling - continue without worker-based highlighting
      // eslint-disable-next-line no-console
      console.warn('PPL Worker Syntax Highlighting Error:', error);
    }
  };

  const addModelHandlers = (model: monaco.editor.IModel) => {
    if (model.getLanguageId() === PPL_LANGUAGE_ID) {
      const disposables: monaco.IDisposable[] = [];

      // Set up content change listener for syntax highlighting
      disposables.push(
        model.onDidChangeContent(async () => {
          await processSyntaxHighlighting(model);
        })
      );

      // Listen to language changes to clean up PPL-specific handling
      disposables.push(
        model.onDidChangeLanguage(() => {
          const currentLanguage = model.getLanguageId();
          if (currentLanguage !== PPL_LANGUAGE_ID) {
            // Language changed away from PPL, clean up
            monaco.editor.setModelMarkers(model, OWNER, []);
            removeModelHandlers(model);
          }
        })
      );

      // Store handlers for this model
      modelHandlers.set(model, disposables);

      // Process initial syntax highlighting
      processSyntaxHighlighting(model);
    }
  };

  const removeModelHandlers = (model: monaco.editor.IModel) => {
    const disposables = modelHandlers.get(model);
    if (disposables) {
      disposables.forEach((d) => d.dispose());
      modelHandlers.delete(model);
    }
  };

  const onModelAdd = (model: monaco.editor.IModel) => {
    addModelHandlers(model);
  };

  const onModelRemove = (model: monaco.editor.IModel) => {
    removeModelHandlers(model);
    // Clear any PPL markers when model is removed
    monaco.editor.setModelMarkers(model, OWNER, []);
  };

  // Handle newly created models
  allDisposables.push(monaco.editor.onDidCreateModel(onModelAdd));

  // Handle model disposal
  allDisposables.push(monaco.editor.onWillDisposeModel(onModelRemove));

  // Handle existing models
  const existingModels = monaco.editor.getModels();
  existingModels.forEach(onModelAdd);

  return () => {
    // Clean up all model handlers
    modelHandlers.forEach((disposables, model) => {
      disposables.forEach((d) => d.dispose());
      monaco.editor.setModelMarkers(model, OWNER, []);
    });
    modelHandlers.clear();

    // Clean up global disposables
    allDisposables.forEach((d) => d.dispose());
    pplWorkerProxyService.stop();
  };
};

/**
 * Register PPL language support with Monaco Editor
 */
export const registerPPLLanguage = () => {
  // Register the PPL language
  monaco.languages.register({
    id: PPL_LANGUAGE_ID,
    extensions: ['.ppl'],
    aliases: ['PPL', 'ppl', 'Piped Processing Language'],
    mimetypes: ['application/ppl', 'text/ppl'],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(PPL_LANGUAGE_ID, createPPLLanguageConfiguration());

  // Set up synchronous tokenization
  setupPPLTokenization();

  // Set up syntax highlighting with worker
  const disposeSyntaxHighlighting = setupPPLSyntaxHighlighting();

  return {
    dispose: () => {
      disposeSyntaxHighlighting();
    },
  };
};

// Auto-register PPL language support
registerPPLLanguage();
