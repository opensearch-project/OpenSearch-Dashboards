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

import { getBucketSize } from '../../helpers/get_bucket_size';
import { getTimerange } from '../../helpers/get_timerange';
import { opensearchQuery } from '../../../../../../data/server';

export function query(req, panel, annotation, opensearchQueryConfig, indexPattern, capabilities) {
  return (next) => (doc) => {
    const timeField = annotation.time_field;
    const { bucketSize } = getBucketSize(req, 'auto', capabilities);
    const { from, to } = getTimerange(req);

    doc.size = 0;
    const queries = !annotation.ignore_global_filters ? req.payload.query : [];
    const filters = !annotation.ignore_global_filters ? req.payload.filters : [];
    doc.query = opensearchQuery.buildOpenSearchQuery(
      indexPattern,
      queries,
      filters,
      opensearchQueryConfig
    );
    const timerange = {
      range: {
        [timeField]: {
          gte: from.toISOString(),
          lte: to.subtract(bucketSize, 'seconds').toISOString(),
          format: 'strict_date_optional_time',
        },
      },
    };
    doc.query.bool.must.push(timerange);

    if (annotation.query_string) {
      doc.query.bool.must.push(
        opensearchQuery.buildOpenSearchQuery(
          indexPattern,
          [annotation.query_string],
          [],
          opensearchQueryConfig
        )
      );
    }

    if (!annotation.ignore_panel_filters && panel.filter) {
      doc.query.bool.must.push(
        opensearchQuery.buildOpenSearchQuery(
          indexPattern,
          [panel.filter],
          [],
          opensearchQueryConfig
        )
      );
    }

    if (annotation.fields) {
      const fields = annotation.fields.split(/[,\s]+/) || [];
      fields.forEach((field) => {
        doc.query.bool.must.push({ exists: { field } });
      });
    }

    return next(doc);
  };
}
