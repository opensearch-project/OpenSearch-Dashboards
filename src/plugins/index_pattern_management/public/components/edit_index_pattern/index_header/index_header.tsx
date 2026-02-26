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

import React, { useState, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiToolTip,
  EuiFlexItem,
  EuiSmallButtonIcon,
  EuiText,
  EuiFieldText,
  EuiFormRow,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
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
  onSave?: (indexPattern: IIndexPattern) => Promise<void>;
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
  onSave,
}: IndexHeaderProps) {
  const {
    uiSettings,
    navigationUI: { HeaderControl },
    application,
    workspaces,
    notifications,
    data,
  } = useOpenSearchDashboards<IndexPatternManagmentContext>().services;

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const hideSetDefaultIndexPatternButton =
    application.capabilities.workspaces?.enabled && !currentWorkspace;

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState(indexPattern.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDisplayName = useCallback(async () => {
    setIsSaving(true);
    try {
      // Update the index pattern with the new display name
      indexPattern.displayName = displayNameValue || undefined;

      // Use dataViews (new) or indexPatterns (legacy) depending on what's available
      const service = (data as any).dataViews || data.indexPatterns;
      await service.updateSavedObject(indexPattern);

      setIsEditingDisplayName(false);

      notifications?.toasts.addSuccess({
        title: i18n.translate('indexPatternManagement.editIndexPattern.displayNameSaved', {
          defaultMessage: 'Display name saved successfully',
        }),
      });
    } catch (error: any) {
      notifications?.toasts.addDanger({
        title: i18n.translate('indexPatternManagement.editIndexPattern.displayNameSaveError', {
          defaultMessage: 'Error saving display name',
        }),
        text: error.message || 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [displayNameValue, indexPattern, data, notifications]);

  const handleCancelEdit = useCallback(() => {
    setDisplayNameValue(indexPattern.displayName || '');
    setIsEditingDisplayName(false);
  }, [indexPattern.displayName]);

  // Display name editor for new UX
  const displayNameEditorNewUX = useUpdatedUX && (
    <div style={{ padding: '16px 0' }}>
      <EuiFormRow
        label={i18n.translate('indexPatternManagement.editIndexPattern.displayNameLabel', {
          defaultMessage: 'Display name (optional)',
        })}
        helpText={i18n.translate('indexPatternManagement.editIndexPattern.displayNameHelp', {
          defaultMessage:
            'A friendly name to display instead of the pattern. The pattern "{title}" is still used for queries.',
          values: { title: indexPattern.title },
        })}
        fullWidth
      >
        {isEditingDisplayName ? (
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem>
              <EuiFieldText
                value={displayNameValue}
                onChange={(e) => setDisplayNameValue(e.target.value)}
                placeholder={indexPattern.title}
                data-test-subj="indexPatternDisplayNameInput"
                fullWidth
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                onClick={handleSaveDisplayName}
                isLoading={isSaving}
                data-test-subj="saveDisplayNameButton"
              >
                {i18n.translate('indexPatternManagement.editIndexPattern.saveButton', {
                  defaultMessage: 'Save',
                })}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={handleCancelEdit}
                data-test-subj="cancelDisplayNameButton"
              >
                {i18n.translate('indexPatternManagement.editIndexPattern.cancelButton', {
                  defaultMessage: 'Cancel',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>{indexPattern.getDisplayName()}</strong>
                {indexPattern.displayName && (
                  <span style={{ color: '#69707D', marginLeft: '8px' }}>
                    (Pattern: {indexPattern.title})
                  </span>
                )}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="xs"
                onClick={() => setIsEditingDisplayName(true)}
                iconType="pencil"
                data-test-subj="editDisplayNameButton"
              >
                {i18n.translate('indexPatternManagement.editIndexPattern.editButton', {
                  defaultMessage: 'Edit',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiFormRow>
    </div>
  );

  return useUpdatedUX ? (
    <>
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
      {displayNameEditorNewUX}
    </>
  ) : (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem>
          {isEditingDisplayName ? (
            <EuiFlexGroup gutterSize="s" alignItems="center">
              <EuiFlexItem grow={false} style={{ minWidth: '300px' }}>
                <EuiFieldText
                  value={displayNameValue}
                  onChange={(e) => setDisplayNameValue(e.target.value)}
                  placeholder={indexPattern.title}
                  data-test-subj="indexPatternDisplayNameInput"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  onClick={handleSaveDisplayName}
                  isLoading={isSaving}
                  data-test-subj="saveDisplayNameButton"
                >
                  Save
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="s"
                  onClick={handleCancelEdit}
                  data-test-subj="cancelDisplayNameButton"
                >
                  Cancel
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <h1 data-test-subj="indexPatternTitle">{indexPattern.getDisplayName()}</h1>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content="Edit display name">
                    <EuiSmallButtonIcon
                      iconType="pencil"
                      onClick={() => setIsEditingDisplayName(true)}
                      aria-label="Edit display name"
                      data-test-subj="editDisplayNameButton"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">
                <strong>Index Pattern:</strong> {indexPattern.title}
              </EuiText>
            </>
          )}
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
    </>
  );
}
