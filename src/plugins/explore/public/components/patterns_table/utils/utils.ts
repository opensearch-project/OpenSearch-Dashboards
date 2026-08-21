/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { IFieldType, Query } from 'src/plugins/data/common';
import {
  CALCITE_DELIM_CONTENT,
  CALCITE_DELIM_END,
  COUNT_FIELD,
  DELIM_END,
  DELIM_START,
  PATTERNS_FIELD,
  SAMPLE_FIELD,
} from './constants';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';
import { ExploreServices } from '../../../types';
import { setPatternsField } from '../../../application/utils/state_management/slices/tab/tab_slice';
import { resultsCache } from '../../../application/utils/state_management/slices';
import { prepareQueryForLanguage } from '../../../application/utils/languages';
import {
  escapePPLValue,
  escapePplIdentifier,
} from '../../../application/pages/traces/trace_details/server/ppl_request_helpers';

// Small functions returning the two pattern queries
export const regexPatternQuery = (queryBase: string, patternsField: string) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} | stats count() as ${COUNT_FIELD}, take(${escapePplIdentifier(patternsField)}, 1) as ${SAMPLE_FIELD} by patterns_field | sort - ${COUNT_FIELD} | fields ${PATTERNS_FIELD}, ${COUNT_FIELD}, ${SAMPLE_FIELD}`;
};

export const brainPatternQuery = (queryBase: string, patternsField: string) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} method=brain mode=label | stats count() as ${COUNT_FIELD}, take(${escapePplIdentifier(patternsField)}, 1) as ${SAMPLE_FIELD} by patterns_field | sort - ${COUNT_FIELD} | fields ${PATTERNS_FIELD}, ${COUNT_FIELD}, ${SAMPLE_FIELD}`;
};

/**
 * SQL equivalent of the simple (regex) pattern query.
 *
 * OpenSearch SQL has no REGEXP_REPLACE token at any version -- it is a syntax
 * error -- so REPLACE is the only option. It works because the V2 engine
 * implements REPLACE with Java's `String.replaceAll`
 * (sql: core/.../expression/text/TextFunctions.java), which treats `from_str`
 * as a regex. That reproduces PPL's Calcite simple-patterns output exactly:
 * both emit REGEXP_REPLACE(field, '[a-zA-Z0-9]+', '<*>').
 *
 * Caveat, deliberately recorded: this behavior is undocumented and contradicts
 * `docs/user/dql/functions.rst`, which describes REPLACE as literal substring
 * replacement, and no SQL-side integration test pins it. See the tracking issue
 * linked from the PR before relying on it more widely.
 *
 * Columns are left unaliased and read back by position as
 * [pattern, COUNT(*), MIN(sample)]. The engine does return aliases, but OSD
 * drops them: `getFields` keys `_source` by column *name*
 * (src/plugins/data/common/data_frames/utils.ts), so an aliased column would
 * arrive under the raw expression text. Positional access is safe here because
 * the response schema and datarows are built in one pass from the same
 * projection, so schema order == SELECT-list order.
 *
 * The sample uses MIN(field) (a deterministic real log line) in place of PPL's
 * take(field, 1). NOTE: MIN on a keyword field is rejected when the aggregation
 * pushes down ("Field [x] of type [keyword] is not supported for aggregation
 * [min]"); it works here only because the derived table blocks pushdown. Do not
 * "optimize" the subquery nesting away.
 */
export const SQL_PATTERN_TOKEN_REGEX = '[a-zA-Z0-9]+';
export const SQL_PATTERN_PLACEHOLDER = '<*>';

/**
 * The pattern-bearing expression, with a NULL guard.
 *
 * Grouping by a nullable key makes the V2 engine fail the whole request with
 * HTTP 500 "[BUG] Unreachable, Comparing with NULL or MISSING is undefined" --
 * so a single document missing the patterns field breaks the tab, which is the
 * common case on real log indices. IFNULL collapses those documents into an
 * empty-pattern group, matching what Calcite-PPL does via
 * CASE(SEARCH(field, Sarg['';NULL AS TRUE]), '', REGEXP_REPLACE(...)), so the
 * counts reconcile with the PPL tab rather than silently differing.
 */
const sqlPatternExpression = (patternsField: string) =>
  `REPLACE(IFNULL(${escapeSqlIdentifier(patternsField)}, ''), ` +
  `'${SQL_PATTERN_TOKEN_REGEX}', '${SQL_PATTERN_PLACEHOLDER}')`;

/**
 * The editor accepts a trailing statement terminator, but a subquery cannot carry
 * one: `FROM (SELECT * FROM idx;) sub` makes the engine read `idx;` as the index
 * name and fail with IndexNotFoundException. Only trailing terminators are removed,
 * so a `;` inside a string literal is left alone.
 */
export const asSqlSubquery = (queryBase: string) => String(queryBase).replace(/[\s;]+$/, '');

export const sqlPatternQuery = (queryBase: string, patternsField: string) => {
  const field = escapeSqlIdentifier(patternsField);
  // The sample column is projected RAW and the null-guard is applied to the
  // aggregate instead. IFNULL(field, '') on a `text` field returns a value that
  // keeps OpenSearchTextType while the '' literal does not, so MIN over a group
  // containing both a missing document and an empty-string document throws
  // "compare expected value have same type" (HTTP 400). Guarding the aggregate
  // instead of its input avoids mixing the two types inside the comparison.
  //
  // MAX(doc_total) carries the number of documents the user's query matched.
  // The engine caps the response at `plugins.query.size_limit` (10,000 by
  // default), so on a high-cardinality field the returned groups are only part
  // of the result -- summing their counts would normalize that subset to 100%
  // and overstate every ratio. COUNT(*) OVER () is evaluated on the inner
  // relation, before grouping and before the cap, so it survives truncation and
  // also reveals it: the returned counts sum to less than this total.
  return (
    `SELECT pattern, COUNT(*), IFNULL(MIN(sample), ''), MAX(doc_total) ` +
    `FROM (SELECT ${sqlPatternExpression(patternsField)} AS pattern, ` +
    `${field} AS sample, COUNT(*) OVER () AS doc_total ` +
    `FROM (${asSqlSubquery(queryBase)}) sub_inner) sub ` +
    `GROUP BY pattern ORDER BY COUNT(*) DESC`
  );
};

export const regexUpdateSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} | where patterns_field = ${escapePPLValue(
    patternString
  )}`;
};

export const brainUpdateSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} method=brain mode=label | where patterns_field = ${escapePPLValue(
    patternString
  )}`;
};

export const regexExcludeSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} | where patterns_field != ${escapePPLValue(
    patternString
  )}`;
};

export const brainExcludeSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `${queryBase} | patterns ${escapePplIdentifier(patternsField)} method=brain mode=label | where patterns_field != ${escapePPLValue(
    patternString
  )}`;
};

/**
 * Wrap a value as a single-quoted SQL string literal.
 *
 * The lexer rule is
 *   SQUOTA_STRING: '\'' ( '\\'. | '\'\'' | ~('\''|'\\') )* '\''
 * so it honors both `''` and backslash escapes. Doubling the quotes alone is
 * therefore not enough: a value containing `\` immediately before a `'` (or a
 * trailing `\`) terminates the literal early and spills into the statement.
 * Backslashes must be escaped first, then quotes.
 *
 * This is reachable from indexed document content -- Windows paths, escaped
 * JSON and stack traces all produce patterns containing `\'`.
 */
export const escapeSqlValue = (value: string) =>
  `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

/**
 * Quote a field name as a backtick-delimited SQL identifier.
 *
 * BQUOTA_STRING has the same backslash rule plus '``' doubling. patternsField
 * is restored verbatim from the `_a` URL parameter, so interpolating it raw
 * lets a crafted field name close the identifier and append arbitrary SQL.
 */
export const escapeSqlIdentifier = (identifier: string) =>
  `\`${String(identifier).replace(/\\/g, '\\\\').replace(/`/g, '``')}\``;

// SQL filter-for: keep only rows whose simple pattern matches patternString.
export const sqlUpdateSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `SELECT * FROM (${asSqlSubquery(queryBase)}) sub WHERE ${sqlPatternExpression(
    patternsField
  )} = ${escapeSqlValue(patternString)}`;
};

// SQL filter-out: exclude rows whose simple pattern matches patternString.
export const sqlExcludeSearchPatternQuery = (
  queryBase: string,
  patternsField: string,
  patternString: string
) => {
  return `SELECT * FROM (${asSqlSubquery(queryBase)}) sub WHERE ${sqlPatternExpression(
    patternsField
  )} <> ${escapeSqlValue(patternString)}`;
};

export const createSearchPatternQuery = (
  query: Query,
  patternsField: string,
  usingRegexPatterns: boolean,
  patternString: string
) => {
  const queryString = typeof query.query === 'string' ? query.query : '';
  if (query.language === 'SQL') {
    return sqlUpdateSearchPatternQuery(queryString, patternsField, patternString);
  }
  return usingRegexPatterns
    ? regexUpdateSearchPatternQuery(queryString, patternsField, patternString)
    : brainUpdateSearchPatternQuery(queryString, patternsField, patternString);
};

export const createExcludeSearchPatternQuery = (
  query: Query,
  patternsField: string,
  usingRegexPatterns: boolean,
  patternString: string
) => {
  const queryString = typeof query.query === 'string' ? query.query : '';
  if (query.language === 'SQL') {
    return sqlExcludeSearchPatternQuery(queryString, patternsField, patternString);
  }
  return usingRegexPatterns
    ? regexExcludeSearchPatternQuery(queryString, patternsField, patternString)
    : brainExcludeSearchPatternQuery(queryString, patternsField, patternString);
};

export const createSearchPatternQueryWithSlice = (
  query: Query,
  patternsField: string,
  usingRegexPatterns: boolean,
  patternString: string,
  timeField: string | undefined,
  pageSize: number,
  pageOffset: number
) => {
  // TODO: switch this logic back to adding onto the createSearchPatternQuery
  // when we don't need a patterns clause to lock in the pattern type

  const preparedQuery = prepareQueryForLanguage(query);
  const sortClause = timeField ? ` | sort - ${timeField}` : '';

  if (query.language === 'SQL') {
    const sqlSort = timeField ? ` ORDER BY ${escapeSqlIdentifier(timeField)} DESC` : '';
    return `${sqlUpdateSearchPatternQuery(
      preparedQuery.query,
      patternsField,
      patternString
    )}${sqlSort} LIMIT ${pageSize} OFFSET ${pageOffset}`;
  }

  return usingRegexPatterns
    ? `${regexUpdateSearchPatternQuery(
        preparedQuery.query,
        patternsField,
        patternString
      )}${sortClause} | head ${pageSize} from ${pageOffset}`
    : `${
        preparedQuery.query
      } | patterns ${escapePplIdentifier(patternsField)} method=brain mode=label | fields patterns_field${
        timeField ? `, ${timeField}` : ''
      }, ${patternsField} | where patterns_field = ${escapePPLValue(
        patternString
      )}${sortClause} | head ${pageSize} from ${pageOffset}`;
};

// Checks if the value is a valid, finite number. Used for patterns table
export const isValidFiniteNumber = (val: number) => {
  return !isNaN(val) && isFinite(val);
};

const getHighlightColor = (isDarkMode: boolean): string =>
  isDarkMode ? euiThemeVars.ouiColorVis0 : euiThemeVars.ouiColorVis13;

/**
 * Highlights dynamic elements in a log string based on a pattern string.
 *
 * This function takes a log string and a pattern string containing delimiters (e.g., <*>) that mark
 * where dynamic content appears. It identifies the dynamic parts of the log by comparing it with the pattern,
 * and wraps those dynamic elements with highlighted React span elements for visual highlighting in the UI.
 *
 * The strategy uses a two-pointer approach that traverses both the log and pattern strings simultaneously.
 * It identifies static text in the pattern, locates that same text in the log using a sliding window, and
 * marks everything in between as dynamic content. The algorithm handles both standard delimiters (<*>)
 * and specialized delimiters (e.g., <*IP*>, <*DATETIME*>) to accommodate different types of dynamic content.
 */
export const highlightLogUsingPattern = (
  log: string,
  pattern: string,
  isDarkMode: boolean
): React.ReactNode => {
  // two pointers for the sample log string and the pattern string
  let currSampleLogPos = 0;
  let currPatternPos = 0;

  const highlightColor = getHighlightColor(isDarkMode);
  const segments: React.ReactNode[] = [];
  let keyIdx = 0;

  try {
    while (currPatternPos < pattern.length) {
      // on a new cycle, in the pattern we have a big static element, in the sample we have dynamic then static
      // move down pattern until we reach a new delim, add everything until then to the static

      // below loop checks for the delim start
      const prevPatternPos = currPatternPos;
      for (; currPatternPos < pattern.length; currPatternPos++) {
        // don't need to worry about currPatternPos + 2 going over pattern length, slice will handle it
        const potentialDelim = pattern.slice(currPatternPos, currPatternPos + 1);

        if (potentialDelim === DELIM_START) {
          break;
        }
      }

      // grab the window of chars in the pattern before the delim. this will be a static element
      const preDelimWindow = pattern.slice(prevPatternPos, currPatternPos);
      currPatternPos += 1; // found the delim start, stop right in the middle

      // move down sample string, and check if the window matches at all
      const prevSampleLogPos = currSampleLogPos;
      for (; currSampleLogPos < log.length; currSampleLogPos++) {
        const potentialWindowMatch = log.slice(
          currSampleLogPos,
          currSampleLogPos + preDelimWindow.length
        );

        if (potentialWindowMatch === preDelimWindow) {
          break;
        }
      }

      const dynamicElement = log.slice(prevSampleLogPos, currSampleLogPos);

      // below statement moves the patternPos up to the end of the delim
      if (pattern.slice(currPatternPos, currPatternPos + 5) === CALCITE_DELIM_CONTENT) {
        currPatternPos += 5;
        // move currPatternPos up until we hit '>'
        while (currPatternPos < pattern.length && pattern[currPatternPos] !== CALCITE_DELIM_END) {
          currPatternPos++;
        }
        currPatternPos += 1;
      } else {
        // moves up to account for special delimiters, such as <*IP*> or <*DATETIME*>
        while (
          currPatternPos < pattern.length &&
          pattern.slice(currPatternPos, currPatternPos + 2) !== DELIM_END
        ) {
          currPatternPos++;
        }
        currPatternPos += 2; // move up one for the slice above being true, another to start on next char
      }

      // move samplePos up past preDelimWindow
      currSampleLogPos += preDelimWindow.length;

      if (dynamicElement.length !== 0) {
        segments.push(
          React.createElement(
            'span',
            { key: keyIdx++, style: { color: highlightColor } },
            dynamicElement
          )
        );
      }
      if (preDelimWindow) {
        segments.push(preDelimWindow);
      }
    }

    // check to see if our currSampleLogPos is at the length of the log.length
    // if it is, we know that the preDelimWindow is the last section of the sample log.
    // otherwise, there must be another delimiter at the end of the log.
    // simply mark the last section.
    if (currSampleLogPos !== log.length) {
      segments.push(
        React.createElement(
          'span',
          { key: keyIdx++, style: { color: highlightColor } },
          log.slice(currSampleLogPos)
        )
      );
    }

    return React.createElement(React.Fragment, null, ...segments);
  } catch {
    return log;
  }
};

// `fieldSchema` carries the backend's own type names. PPL and the analytics engine
// report `string`; SQL on the V2 engine reports the OpenSearch mapping type instead.
const STRING_FIELD_TYPES = ['string', 'text', 'keyword'];

/**
 * Selects the most likely patterns field by finding the string field with the longest value.
 * This function identifies the field most suitable for pattern analysis by comparing the length
 * of string values in the first hit.
 */
export const findDefaultPatternsField = (services: ExploreServices): string => {
  if (!services.store || !services.store.getState) {
    throw new Error('Store is unexpectedly empty');
  }

  // set the value for patterns field
  const state = services.store.getState();

  if (!state) {
    throw new Error('State is unexpectedly empty');
  }

  // Get the log tab's results from the state
  const query = state.query;

  // Get the logs tab to find its cache key
  const logsTab = services.tabRegistry.getTab('logs');
  if (!logsTab) throw new Error('Logs tab is unexpectedly uninitialized');

  // Get the cache key for logs tab results
  const logsCacheKey = defaultPrepareQueryString(query);
  const logResults = resultsCache.get(logsCacheKey);

  // Get fields
  const filteredFields = logResults?.fieldSchema?.filter((field: Partial<IFieldType>) => {
    return STRING_FIELD_TYPES.includes(field.type as string);
  });

  if (!logResults?.hits?.hits?.[0]) {
    throw new Error('Cannot access hits from logs tab');
  }

  // Get the first hit if available
  const firstHit = logResults.hits.hits[0];

  if (firstHit && firstHit._source && filteredFields) {
    // Find the field with the longest value
    const { longestField } = Object.entries(firstHit._source).reduce(
      (acc, [field, value]) => {
        // Check if the field exists in options
        if (filteredFields.some((option) => option.name === field)) {
          const valueLength = typeof value === 'string' ? value.length : 0;

          if (valueLength > acc.maxLength) {
            return { maxLength: valueLength, longestField: field };
          }
        }
        return acc;
      },
      { maxLength: 0, longestField: '' }
    );

    if (longestField) {
      services.store.dispatch(setPatternsField(longestField));
      return longestField;
    }
  }

  throw new Error('Unexpectedly cannot find a longest default patterns field');
};
