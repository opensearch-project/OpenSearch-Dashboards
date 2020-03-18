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

/** tslint:disable:max-line-length  */
import React from 'react';
import { IconComponentProps } from '../icon';

/** @internal */
export function AlertIcon(extraProps: IconComponentProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...extraProps}>
      <path
        fillRule="evenodd"
        d="M8.378 1.496l6.695 10.984A1 1 0 0 1 14.22 14H1.667a1 1 0 0 1-.883-1.47L6.642 1.545a1 1 0 0 1 1.736-.05zm-.853.52L1.667 13h12.552L7.525 2.016zM7.14 10.06L6.9 5.18h1.3l-.25 4.878h-.81zm.394 1.901a.61.61 0 0 1-.448-.186.606.606 0 0 1-.186-.444c0-.174.062-.323.186-.446a.614.614 0 0 1 .448-.184c.169 0 .315.06.44.182.124.122.186.27.186.448a.6.6 0 0 1-.189.446.607.607 0 0 1-.437.184z"
      />
    </svg>
  );
}
