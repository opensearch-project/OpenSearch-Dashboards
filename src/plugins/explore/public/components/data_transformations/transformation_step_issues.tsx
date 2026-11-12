/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformationIssueCode, TransformationStepResult } from './types';

const statusTitles: Record<TransformationStepResult['status'], string> = {
  applied: i18n.translate('explore.transformations.stepIssues.appliedTitle', {
    defaultMessage: 'Applied with issues',
  }),
  partially_applied: i18n.translate('explore.transformations.stepIssues.partiallyAppliedTitle', {
    defaultMessage: 'Partially applied',
  }),
  skipped: i18n.translate('explore.transformations.stepIssues.skippedTitle', {
    defaultMessage: 'Skipped',
  }),
  failed: i18n.translate('explore.transformations.stepIssues.failedTitle', {
    defaultMessage: 'Failed',
  }),
};

const issueCodeLabels: Record<TransformationIssueCode, string> = {
  invalid_config: i18n.translate('explore.transformations.stepIssues.invalidConfigLabel', {
    defaultMessage: 'Invalid config',
  }),
  missing_fields: i18n.translate('explore.transformations.stepIssues.missingFieldsLabel', {
    defaultMessage: 'Missing fields',
  }),
  execution_error: i18n.translate('explore.transformations.stepIssues.executionErrorLabel', {
    defaultMessage: 'Execution error',
  }),
  missing_series: i18n.translate('explore.transformations.stepIssues.missingSeriesLabel', {
    defaultMessage: 'Missing series',
  }),
};

/**
 * Show warning for skiped or failed step
 */
export const TransformationStepIssues = ({ step }: { step?: TransformationStepResult }) => {
  // invalid_config (a newly added, unconfigured step) isn't an issue.
  const issues = step?.issues.filter((issue) => issue.code !== 'invalid_config') ?? [];
  if (!step || issues.length === 0) return null;

  const isError = step.status === 'failed';

  return (
    <>
      <EuiCallOut
        size="s"
        color={isError ? 'danger' : 'warning'}
        iconType="alert"
        title={statusTitles[step.status]}
        data-test-subj="transformationStepIssues"
      >
        {issues.map((issue, index) => (
          <EuiText size="xs" key={index}>
            <strong>{issueCodeLabels[issue.code]}</strong>: {issue.message}
          </EuiText>
        ))}
      </EuiCallOut>
      <EuiSpacer size="s" />
    </>
  );
};
