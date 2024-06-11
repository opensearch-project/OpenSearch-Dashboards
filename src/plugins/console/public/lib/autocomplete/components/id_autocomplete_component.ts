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

import _ from 'lodash';
import { SharedComponent } from './shared_component';
import { AutoCompleteContext } from '../types';
import { CoreEditor } from '../../../types';

export class IdAutocompleteComponent extends SharedComponent {
  multi_match: boolean;

  constructor(name: string, parent: SharedComponent, multi = false) {
    super(name, parent);
    this.multi_match = multi;
  }
  match(token: string | string[], context: AutoCompleteContext, editor: CoreEditor) {
    if (!token) {
      return null;
    }
    if (!this.multi_match && Array.isArray(token)) {
      return null;
    }
    token = Array.isArray(token) ? token : [token];
    if (
      _.find(token, function (t) {
        return t.match(/[\/,]/);
      })
    ) {
      return null;
    }
    const r = super.match(token, context, editor);
    if (r) {
      r.context_values = r.context_values || {};
      r.context_values.id = token;
    }

    return r;
  }
}
