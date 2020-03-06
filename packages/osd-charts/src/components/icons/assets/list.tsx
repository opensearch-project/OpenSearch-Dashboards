/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import React from 'react';
import { Props } from '../icon';

// tslint:disable:max-line-length
export function ListIcon(extraProps: Props) {
  return (
    <svg width={16} height={16} xmlns="http://www.w3.org/2000/svg" {...extraProps}>
      <path d="M2 4V3h2v1H2zm4 0V3h8v1H6zm0 3V6h8v1H6zm0 3V9h8v1H6zM2 7V6h2v1H2zm0 3V9h2v1H2zm4 3v-1h8v1H6zm-4 0v-1h2v1H2z" />
    </svg>
  );
}
