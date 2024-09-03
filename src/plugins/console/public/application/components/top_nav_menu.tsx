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

import React, { FunctionComponent } from 'react';
import { EuiTabs, EuiTab, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';

interface CommonProps {
  disabled: boolean;
  onClick: () => void;
  ['data-test-subj']: string;
}

export interface TopNavMenuItem {
  id: string;
  label: string;
  description: string;
  onClick: () => void;
  testId: string;
  render?: (commonProps: CommonProps) => React.JSX.Element;
}

interface Props {
  disabled?: boolean;
  items: TopNavMenuItem[];
  useUpdatedUX?: boolean;
}

export const TopNavMenu: FunctionComponent<Props> = ({ items, disabled, useUpdatedUX }) => {
  if (useUpdatedUX) {
    return (
      <>
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          {items.map((item, idx) => {
            const commonProps: CommonProps = {
              disabled: !!disabled,
              onClick: item.onClick,
              ['data-test-subj']: item.testId,
            };

            return (
              <EuiFlexItem grow={false} key={idx}>
                {item.render?.(commonProps) || null}
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
        <EuiSpacer />
      </>
    );
  }

  return (
    <EuiTabs size="s">
      {items.map((item, idx) => {
        return (
          <EuiTab
            key={idx}
            disabled={disabled}
            onClick={item.onClick}
            title={item.label}
            data-test-subj={item.testId}
          >
            {item.label}
          </EuiTab>
        );
      })}
    </EuiTabs>
  );
};
