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

import React, { FC } from 'react';
import type { Logos } from 'opensearch-dashboards/public';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiToken,
  EuiTitle,
  EuiText,
  EuiIcon,
  IconType,
} from '@elastic/eui';
import { HomePluginBranding } from '../../../plugin';

interface Props {
  /**
   * @deprecated
   * Title will be deprecated because we will use title config from branding
   */
  title: string;
  subtitle: string;
  /**
   * @deprecated
   * IconType will be deprecated because we will make rendering custom dashboard logo logic consistent with other logos' logic
   */
  iconType: IconType;
  branding: HomePluginBranding;
  logos: Logos;
}

/**
 * The component <EuiFlexGroup> that renders the blue dashboard card on home page.
 * `title` and `iconType` are deprecated because SolutionTitle component will only be rendered once
 * as the home dashboard card.
 */
export const SolutionTitle: FC<Props> = ({ subtitle, branding, logos }) => (
  <EuiFlexGroup gutterSize="none" alignItems="center">
    <EuiFlexItem className="eui-textCenter">
      {logos.Mark.type === 'custom' ? (
        <div className="homSolutionPanel__customIcon">
          <img
            className="homSolutionPanel__customIconContainer"
            data-test-subj="dashboardCustomLogo"
            data-test-image-url={logos.Mark.url}
            alt={branding.applicationTitle + ' logo'}
            src={logos.Mark.url}
          />
        </div>
      ) : (
        <EuiToken
          iconType={logos.Mark.url}
          shape="circle"
          fill="light"
          size="l"
          className="homSolutionPanel__icon"
        />
      )}

      <EuiTitle
        className="homSolutionPanel__title eui-textInheritColor"
        size="s"
        data-test-subj="dashboardCustomTitle"
        data-test-title={branding.applicationTitle}
      >
        <h3>{branding.applicationTitle}</h3>
      </EuiTitle>

      <EuiText size="s">
        <p className="homSolutionPanel__subtitle">
          {subtitle} <EuiIcon type="sortRight" />
        </p>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);
