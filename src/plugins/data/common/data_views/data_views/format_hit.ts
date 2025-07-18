/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DataView } from './data_view';
import { FieldFormatsContentType } from '../../../common';

const formattedCache = new WeakMap();
const partialFormattedCache = new WeakMap();

// Takes a hit, merges it with any stored/scripted fields, and with the metaFields
// returns a formatted version
export function formatHitProvider(dataView: DataView, defaultFormat: any) {
  function convert(
    hit: Record<string, any>,
    val: any,
    fieldName: string,
    type: FieldFormatsContentType
  ) {
    const field = dataView.fields.getByName(fieldName);
    const format = field ? dataView.getFormatterForField(field) : defaultFormat;

    return format.convert(val, type, { field, hit, dataView });
  }

  function formatHit(hit: Record<string, any>, type: FieldFormatsContentType = 'html') {
    // Cache is only used for formatType === 'html' (default)
    if (type === 'text') {
      const flattened = dataView.flattenHit(hit);
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(flattened)) {
        result[key] = convert(hit, value, key, type);
      }
      return result;
    }

    const cached = formattedCache.get(hit);
    if (cached) {
      return cached;
    }

    // use and update the partial cache, but don't rewrite it.
    // _source is stored in partialFormattedCache but not formattedCache
    const partials = partialFormattedCache.get(hit) || {};
    partialFormattedCache.set(hit, partials);

    const cache: Record<string, any> = {};
    formattedCache.set(hit, cache);

    _.forOwn(dataView.flattenHit(hit), function (val: any, fieldName?: string) {
      // sync the formatted and partial cache
      if (!fieldName) {
        return;
      }
      const formatted =
        partials[fieldName] == null ? convert(hit, val, fieldName, type) : partials[fieldName];
      cache[fieldName] = partials[fieldName] = formatted;
    });

    return cache;
  }

  formatHit.formatField = function (
    hit: Record<string, any>,
    fieldName: string,
    type: FieldFormatsContentType = 'html'
  ) {
    // Cache is only used for formatType === 'html' (default)
    if (type === 'html') {
      let partials = partialFormattedCache.get(hit);
      if (partials && partials[fieldName] != null) {
        return partials[fieldName];
      }

      if (!partials) {
        partials = {};
        partialFormattedCache.set(hit, partials);
      }
    }

    const val = fieldName === '_source' ? hit._source : dataView.flattenHit(hit)[fieldName];
    return convert(hit, val, fieldName, type);
  };

  return formatHit;
}
