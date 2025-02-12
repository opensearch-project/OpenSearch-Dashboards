/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiButton,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { ApplicationStart, NotificationsStart, HttpStart } from 'opensearch-dashboards/public';
import {
  queryWorkbenchPluginCheck,
  queryWorkbenchPluginID,
} from '../../../../../framework/utils/shared';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { formValidator, hasError } from '../create/utils';
import { accelerationQueryBuilder } from '../visual_editors/query_builder';

interface PreviewSQLDefinitionProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  resetFlyout: () => void;
  notifications: NotificationsStart;
  application: ApplicationStart;
  http: HttpStart;
}

export const PreviewSQLDefinition = ({
  accelerationFormData,
  setAccelerationFormData,
  resetFlyout,
  notifications,
  application,
  http,
}: PreviewSQLDefinitionProps) => {
  const [isPreviewStale, setIsPreviewStale] = useState(false);
  const [isPreviewTriggered, setIsPreviewTriggered] = useState(false);
  const [sqlCode, setSQLcode] = useState('');
  const [sqlWorkbenchPLuginExists, setSQLWorkbenchPluginExists] = useState(false);

  const checkForErrors = () => {
    const errors = formValidator(accelerationFormData);
    if (hasError(errors)) {
      setAccelerationFormData({ ...accelerationFormData, formErrors: errors });
      return true;
    } else return false;
  };

  const onClickPreview = () => {
    if (checkForErrors()) {
      return;
    }
    setSQLcode(accelerationQueryBuilder(accelerationFormData));
    setIsPreviewStale(false);
    setIsPreviewTriggered(true);
  };

  const checkIfSQLWorkbenchPluginIsInstalled = () => {
    http
      .get('/api/status')
      .then((data) => {
        for (let i = 0; i < data.status.statuses.length; ++i) {
          if (data.status.statuses[i].id.includes(queryWorkbenchPluginCheck)) {
            setSQLWorkbenchPluginExists(true);
          }
        }
      })
      .catch((error) => {
        notifications.toasts.addDanger(
          'Error checking Query Workbench Plugin Installation status.'
        );
        // eslint-disable-next-line no-console
        console.error(error);
      });
  };

  const openInWorkbench = () => {
    if (!checkForErrors()) {
      application!.navigateToApp(queryWorkbenchPluginID, {
        path: `#/${accelerationFormData.dataSource}`,
        state: {
          language: 'sql',
          queryToRun: accelerationQueryBuilder(accelerationFormData),
        },
      });
      resetFlyout();
    }
  };

  const queryWorkbenchButton = sqlWorkbenchPLuginExists ? (
    <EuiButton iconSide="right" onClick={openInWorkbench} data-test-subj="workbenchButton">
      Edit in Query Workbench
    </EuiButton>
  ) : (
    <></>
  );

  useEffect(() => {
    setIsPreviewStale(true);
  }, [accelerationFormData]);

  useEffect(() => {
    checkIfSQLWorkbenchPluginIsInstalled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <EuiAccordion
        id="accordion1"
        buttonContent={
          <EuiText data-test-subj="preview-sql-header">
            <h3>Preview SQL definition</h3>
          </EuiText>
        }
        paddingSize="l"
      >
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            {isPreviewStale && isPreviewTriggered ? (
              <EuiButton
                iconType="kqlFunction"
                iconSide="left"
                color="success"
                onClick={onClickPreview}
              >
                Update preview
              </EuiButton>
            ) : (
              <EuiButton color="success" onClick={onClickPreview}>
                Generate preview
              </EuiButton>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{queryWorkbenchButton}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiCodeBlock language="sql" fontSize="m" paddingSize="m" isCopyable>
          {sqlCode}
        </EuiCodeBlock>
      </EuiAccordion>
    </>
  );
};
