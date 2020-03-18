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
import { deepEqual } from '../../../utils/fast_deep_equal';
import { IconComponentProps } from '../icon';

/** @internal */
export class DotIcon extends React.Component<IconComponentProps> {
  shouldComponentUpdate(nextProps: IconComponentProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" {...this.props}>
        <defs>
          <circle id="dot-a" cx="8" cy="8" r="4" />
        </defs>
        <g>
          <use xlinkHref="#dot-a" />
        </g>
      </svg>
    );
  }
}
