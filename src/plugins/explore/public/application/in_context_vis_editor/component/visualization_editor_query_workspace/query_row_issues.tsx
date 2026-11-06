/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { QueryExecutionStatus } from '../../../utils/state_management/types';
import { QueryEditorState } from '../../query_builder/query_builder';
import './query_workspace.scss';

const defaultTitle = i18n.translate('explore.visEditor.queryRowIssues.defaultTitle', {
  defaultMessage: 'Query failed',
});

/**
 * Shows the selected query row's error above its editor, like TransformationStepIssues for a step.
 */
export const QueryRowIssues = ({
  queryEditorState$,
}: {
  queryEditorState$: BehaviorSubject<QueryEditorState>;
}) => {
  const { queryStatus } = useObservable(queryEditorState$, queryEditorState$.getValue());

  const error = queryStatus.status === QueryExecutionStatus.ERROR ? queryStatus.error : undefined;
  const details = error?.message?.details ?? '';

  if (queryStatus.status !== QueryExecutionStatus.ERROR) return null;

  return (
    <>
      <EuiCallOut
        size="s"
        color="danger"
        iconType="alert"
        title={error?.message?.reason || defaultTitle}
        data-test-subj="queryRowIssues"
      >
        {details && (
          <EuiText
            size="xs"
            className="queryWorkspaceQueryIssues__details"
            data-test-subj="queryRowIssuesDetails"
          >
            {details}
          </EuiText>
        )}
      </EuiCallOut>
      <EuiSpacer size="s" />
    </>
  );
};
