/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { escape, keys } from 'lodash';
import { shortenDottedString } from '../../utils';
import { OSD_FIELD_TYPES } from '../../osd_field_types/types';
import { FieldFormat } from '../field_format';
import { TextContextTypeConvert, HtmlContextTypeConvert, FIELD_FORMAT_IDS } from '../types';
import { UI_SETTINGS } from '../../constants';

export class SourceFormat extends FieldFormat {
  static id = FIELD_FORMAT_IDS._SOURCE;
  static title = '_source';
  static fieldType = OSD_FIELD_TYPES._SOURCE;

  textConvert: TextContextTypeConvert = (value) => JSON.stringify(value);

  htmlConvert: HtmlContextTypeConvert = (value, options = {}) => {
    const { field, hit, indexPattern } = options;

    if (!field) {
      const converter = this.getConverterFor('text') as Function;

      return escape(converter(value));
    }

    const highlights = (hit && hit.highlight) || {};
    const formatted = indexPattern.formatHit(hit);
    const highlightPairs: any[] = [];
    const sourcePairs: any[] = [];
    const isShortDots = this.getConfig!(UI_SETTINGS.SHORT_DOTS_ENABLE);

    keys(formatted).forEach((key) => {
      const pairs = highlights[key] ? highlightPairs : sourcePairs;
      const newField = isShortDots ? shortenDottedString(key) : key;
      const val = formatted[key];
      pairs.push([newField, val]);
    }, []);

    const defPairs = highlightPairs.concat(sourcePairs);
    /**
     * Build HTML without whitespace between tags to prevent extra spacing.
     *
     * If you have inline elements (span, a, em, etc.) and any amount of
     * whitespace around them in your markup, then the browser will push
     * them apart. This is ugly in certain scenarios and is only fixed by
     * removing the whitespace from the html in the first place (or ugly css hacks).
     *
     * Note: The space after </dd> is intentional to provide proper spacing between
     * definition pairs.
     */
    const pairHtml = defPairs
      .map((def) => `<dt>${escape(def[0])}:</dt><dd>${def[1]}</dd> `)
      .join('');
    return `<dl class="source truncate-by-height">${pairHtml}</dl>`;
  };
}
