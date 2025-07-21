/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter, getFilterField } from '../../../../data/common';
import { FilterUtils } from './filter_utils';

export class NaturalLanguageFilterUtils extends FilterUtils {
  public static toPredicate(filter: Filter): string | undefined {
    const meta = filter.meta;
    const field = getFilterField(filter)?.replace(/.keyword$/, '');
    if (!field) return;
    if (!meta.negate) {
      switch (meta.type) {
        case 'phrase':
          return `${field} is ${NaturalLanguageFilterUtils.quote(meta.params.query)}`;
        case 'phrases':
          return meta.params
            .map((query: string) => `${field} is ${NaturalLanguageFilterUtils.quote(query)}`)
            .join(' or ');
        case 'range':
          const ranges = [];
          if (meta.params.gte != null) ranges.push(`${field} >= ${meta.params.gte}`);
          if (meta.params.lt != null) ranges.push(`${field} < ${meta.params.lt}`);
          return ranges.join(' and ');
        case 'exists':
          return `${field} should exist`;
      }
      if (filter.query) {
        if (filter.query.match_phrase && field in filter.query.match_phrase) {
          return `${field} is ${NaturalLanguageFilterUtils.quote(
            filter.query.match_phrase[field]
          )}`;
        }
      }
    } else {
      switch (meta.type) {
        case 'phrase':
          return `${field} is not ${NaturalLanguageFilterUtils.quote(meta.params.query)}`;
        case 'phrases':
          return meta.params
            .map((query: string) => `${field} is not ${NaturalLanguageFilterUtils.quote(query)}`)
            .join(' and ');
        case 'range':
          const ranges = [];
          if (meta.params.gte != null) ranges.push(`${field} < ${meta.params.gte}`);
          if (meta.params.lt != null) ranges.push(`${field} >= ${meta.params.lt}`);
          return ranges.join(' or ');
        case 'exists':
          return `${field} should not exist`;
      }
      if (filter.query) {
        if (filter.query.match_phrase && field in filter.query.match_phrase) {
          return `${field} is not ${NaturalLanguageFilterUtils.quote(
            filter.query.match_phrase[field]
          )}`;
        }
      }
    }
  }

  private static addFilterToPrompt(prompt: string, filter: Filter): string {
    const predicate = NaturalLanguageFilterUtils.toPredicate(filter);
    if (!predicate) return prompt;
    if (!prompt.trim()) return predicate;
    if (prompt.includes(predicate)) return prompt;

    const negatedPredicate = NaturalLanguageFilterUtils.toPredicate({
      ...filter,
      meta: { ...filter.meta, negate: !filter.meta.negate },
    });

    if (negatedPredicate && prompt.includes(negatedPredicate)) {
      return prompt.replace(negatedPredicate, predicate);
    }

    return `${prompt}, ${predicate}`;
  }

  /**
   * Append filters as natural language to the natural language prompt. If a
   * matching filter already exists, it won't be added again. If a negated
   * version exists, it will be replaced.
   *
   * @param prompt - The natural language prompt
   * @param filter - The Filter objects to insert into the prompt
   * @returns A new prompt with the filters applied
   */
  public static addFiltersToPrompt(prompt: string, filters: Filter[]): string {
    return filters.reduce(NaturalLanguageFilterUtils.addFilterToPrompt, prompt);
  }

  protected static quote(value: unknown) {
    if (typeof value !== 'string') return value;
    if (value.includes("'")) {
      if (value.includes('"')) return `\`${value}\``;
      return `"${value}"`;
    }
    return `'${value}'`;
  }
}
