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
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiToolTip, EuiFlexItem, EuiSmallButtonIcon, EuiText } from '@elastic/eui';
import { IIndexPattern } from 'src/plugins/data/public';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { IndexPatternManagmentContext } from '../../../types';
import { TopNavControlButtonData, TopNavControlIconData } from '../../../../../navigation/public';

interface IndexHeaderProps {
  indexPattern: IIndexPattern;
  defaultIndex?: string;
  setDefault?: () => void;
  refreshFields?: () => void;
  deleteIndexPatternClick?: () => void;
}

const setDefaultAriaLabel = i18n.translate(
  'indexPatternManagement.editIndexPattern.setDefaultAria',
  {
    defaultMessage: 'Set as default index.',
  }
);

const setDefaultTooltip = i18n.translate(
  'indexPatternManagement.editIndexPattern.setDefaultTooltip',
  {
    defaultMessage: 'Set as default index.',
  }
);

const refreshAriaLabel = i18n.translate('indexPatternManagement.editIndexPattern.refreshAria', {
  defaultMessage: 'Reload field list.',
});

const refreshTooltip = i18n.translate('indexPatternManagement.editIndexPattern.refreshTooltip', {
  defaultMessage: 'Refresh field list.',
});

const removeAriaLabel = i18n.translate('indexPatternManagement.editIndexPattern.removeAria', {
  defaultMessage: 'Remove index pattern.',
});

const removeTooltip = i18n.translate('indexPatternManagement.editIndexPattern.removeTooltip', {
  defaultMessage: 'Remove index pattern.',
});

export function IndexHeader({
  defaultIndex,
  indexPattern,
  setDefault,
  refreshFields,
  deleteIndexPatternClick,
}: IndexHeaderProps) {
  const {
    uiSettings,
    navigationUI: { HeaderControl },
    application,
    workspaces,
  } = useOpenSearchDashboards<IndexPatternManagmentContext>().services;

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const hideSetDefaultIndexPatternButton =
    application.capabilities.workspaces?.enabled && !currentWorkspace;

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  return useUpdatedUX ? (
    <HeaderControl
      controls={[
        ...(deleteIndexPatternClick
          ? [
              {
                color: 'danger',
                run: deleteIndexPatternClick,
                iconType: 'trash',
                ariaLabel: removeAriaLabel,
                testId: 'deleteIndexPatternButton',
                display: 'base',
                controlType: 'icon',
                tooltip: removeTooltip,
              } as TopNavControlIconData,
            ]
          : []),
        ...(defaultIndex !== indexPattern.id && setDefault && !hideSetDefaultIndexPatternButton
          ? [
              {
                run: setDefault,
                ariaLabel: setDefaultAriaLabel,
                testId: 'setDefaultIndexPatternButton',
                label: i18n.translate(
                  'indexPatternManagement.editIndexPattern.setDefaultButton.text',
                  {
                    defaultMessage: 'Set as default index',
                  }
                ),
                controlType: 'button',
              } as TopNavControlButtonData,
            ]
          : []),
        ...(refreshFields
          ? [
              {
                run: refreshFields,
                iconType: 'refresh',
                ariaLabel: refreshAriaLabel,
                testId: 'refreshFieldsIndexPatternButton',
                fill: true,
                label: i18n.translate(
                  'indexPatternManagement.editIndexPattern.refreshFieldsButton.text',
                  {
                    defaultMessage: 'Refresh field list',
                  }
                ),
                controlType: 'button',
              } as TopNavControlButtonData,
            ]
          : []),
      ]}
      setMountPoint={application.setAppRightControls}
    />
  ) : (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem>
        <EuiText size="s">
          <h1 data-test-subj="indexPatternTitle">{indexPattern.title}</h1>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup responsive={false}>
          {defaultIndex !== indexPattern.id && setDefault && (
            <EuiFlexItem>
              <EuiToolTip content={setDefaultTooltip}>
                <EuiSmallButtonIcon
                  color="text"
                  onClick={setDefault}
                  iconType="starFilled"
                  aria-label={setDefaultAriaLabel}
                  data-test-subj="setDefaultIndexPatternButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}

          {refreshFields && (
            <EuiFlexItem>
              <EuiToolTip content={refreshTooltip}>
                <EuiSmallButtonIcon
                  color="text"
                  onClick={refreshFields}
                  iconType="refresh"
                  aria-label={refreshAriaLabel}
                  data-test-subj="refreshFieldsIndexPatternButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}

          {deleteIndexPatternClick && (
            <EuiFlexItem>
              <EuiToolTip content={removeTooltip}>
                <EuiSmallButtonIcon
                  color="danger"
                  onClick={deleteIndexPatternClick}
                  iconType="trash"
                  aria-label={removeAriaLabel}
                  data-test-subj="deleteIndexPatternButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
