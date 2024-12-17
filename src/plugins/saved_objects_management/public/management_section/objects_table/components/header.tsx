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

import React, { Fragment } from 'react';
import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiButtonEmpty,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ApplicationStart } from 'src/core/public';
import { i18n } from '@osd/i18n';
import {
  NavigationPublicPluginStart,
  TopNavControlButtonData,
} from '../../../../../navigation/public';

export const Header = ({
  onExportAll,
  onImport,
  onDuplicate,
  onRefresh,
  objectCount,
  showDuplicateAll = false,
  useUpdatedUX,
  navigationUI: { HeaderControl },
  applications,
  currentWorkspaceName,
  showImportButton,
}: {
  onExportAll: () => void;
  onImport: () => void;
  onDuplicate: () => void;
  onRefresh: () => void;
  objectCount: number;
  showDuplicateAll: boolean;
  useUpdatedUX: boolean;
  navigationUI: NavigationPublicPluginStart['ui'];
  applications: ApplicationStart;
  currentWorkspaceName: string;
  showImportButton: boolean;
}) => {
  const title = useUpdatedUX ? null : (
    <EuiFlexItem grow={false}>
      <EuiText size="s">
        <h1>
          <FormattedMessage
            id="savedObjectsManagement.objectsTable.header.savedObjectsTitle"
            defaultMessage="Saved Objects"
          />
        </h1>
      </EuiText>
    </EuiFlexItem>
  );
  const description = useUpdatedUX ? (
    <HeaderControl
      controls={[
        currentWorkspaceName
          ? {
              description: i18n.translate(
                'savedObjectsManagement.workspace.objectsTable.table.description',
                {
                  defaultMessage: 'Manage and share assets for {workspace}.',
                  values: {
                    workspace: currentWorkspaceName,
                  },
                }
              ),
            }
          : {
              description: i18n.translate('savedObjectsManagement.objectsTable.table.description', {
                defaultMessage: 'Manage and share your assets.',
              }),
            },
      ]}
      setMountPoint={applications.setAppDescriptionControls}
    />
  ) : (
    <EuiText size="s">
      <p>
        <EuiTextColor color="subdued">
          <FormattedMessage
            id="savedObjectsManagement.objectsTable.howToDeleteSavedObjectsDescription"
            defaultMessage="Manage and share your saved objects. To edit the underlying data of an object, go to its associated application."
          />
        </EuiTextColor>
      </p>
    </EuiText>
  );

  const rightControls = useUpdatedUX ? (
    <HeaderControl
      controls={[
        ...(showDuplicateAll
          ? [
              {
                testId: 'duplicateObjects',
                run: onDuplicate,
                controlType: 'button',
                isDisabled: objectCount === 0,
                iconType: 'copy',
                label: i18n.translate(
                  'savedObjectsManagement.objectsTable.header.duplicateAllAssetsButtonLabel',
                  { defaultMessage: 'Copy all assets to...' }
                ),
              } as TopNavControlButtonData,
            ]
          : []),
        {
          testId: 'exportAllObjects',
          run: onExportAll,
          controlType: 'button',
          iconType: 'exportAction',
          label: i18n.translate(
            'savedObjectsManagement.objectsTable.header.exportAssetsButtonLabel',
            {
              defaultMessage: 'Export all assets',
            }
          ),
        } as TopNavControlButtonData,
        ...(showImportButton
          ? [
              {
                testId: 'importObjects',
                run: onImport,
                controlType: 'button',
                iconType: 'importAction',
                label: i18n.translate(
                  'savedObjectsManagement.objectsTable.header.importButtonLabel',
                  {
                    defaultMessage: 'Import',
                  }
                ),
              } as TopNavControlButtonData,
            ]
          : []),
      ]}
      setMountPoint={applications.setAppRightControls}
    />
  ) : (
    <EuiFlexItem grow={false}>
      <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
        {showDuplicateAll && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              data-test-subj="duplicateObjects"
              onClick={onDuplicate}
              disabled={objectCount === 0}
              iconType="copy"
            >
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.header.duplicateAllButtonLabel"
                defaultMessage="Copy all objects to..."
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="s"
            iconType="exportAction"
            data-test-subj="exportAllObjects"
            onClick={onExportAll}
          >
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.header.exportButtonLabel"
              defaultMessage="Export all objects"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
        {showImportButton && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="importAction"
              data-test-subj="importObjects"
              onClick={onImport}
            >
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.header.importButtonLabel"
                defaultMessage="Import"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" iconType="refresh" onClick={onRefresh}>
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.header.refreshButtonLabel"
              defaultMessage="Refresh"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  );

  return (
    <Fragment>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="baseline">
        {title}
        {rightControls}
      </EuiFlexGroup>
      {!useUpdatedUX ? <EuiSpacer size="m" /> : <EuiSpacer size="l" />}
      {description}
      {!useUpdatedUX && <EuiSpacer size="m" />}
    </Fragment>
  );
};
