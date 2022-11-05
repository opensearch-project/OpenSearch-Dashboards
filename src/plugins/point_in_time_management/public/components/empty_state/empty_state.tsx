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

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiPageContent,
  EuiSpacer,
  EuiText,
  EuiPageContentBody,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButton,
} from '@elastic/eui';

export const EmptyState = () => {
  return (
    <>
      <EuiPageContent
        className="pitEmptyState"
        grow={false}
        style={{ minHeight: '70vh' }}
        horizontalPosition="center"
        data-test-subj="pointInTimeEmptyState"
      >
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h1>
                <FormattedMessage
                  id="pointInTimeManagement.pointInTime.header.pointInTimeTitle"
                  defaultMessage="Point in Time"
                />
              </h1>
            </EuiTitle>
          </EuiPageContentHeaderSection>
          <EuiButton fill={true} iconType="plusInCircle">
            Create point in time
          </EuiButton>
        </EuiPageContentHeader>
        <EuiText size="s">
          <p>
            <FormattedMessage
              id="pointInTimeManagement.pointInTime.pointInTimeDescription"
              defaultMessage="Create and manage point in time objects to help you retrieve data from OpenSearch."
            />
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiPageContentBody>
          <EuiFlexGroup
            style={{ minHeight: '50vh' }}
            alignItems="center"
            justifyContent="center"
            direction="column"
          >
            <EuiFlexItem grow={false}>No point in time objects have been created yet.</EuiFlexItem>
            <EuiSpacer />
            <EuiButton>Create point in time</EuiButton>
          </EuiFlexGroup>
        </EuiPageContentBody>
      </EuiPageContent>
    </>
  );
};
