/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiButtonIcon, EuiFlexItem } from '@elastic/eui';
import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { useQueryAssist } from '../hooks';
import collapsedIcon from '../../assets/sparkle_solid.svg';
import expandIcon from '../../assets/sparkle_mark.svg';
import { QueryEditorExtensionDependencies } from '../../../../data/public';

interface QueryAssistButtonProps {
  dependencies: QueryEditorExtensionDependencies;
}

export const QueryAssistButton: React.FC<QueryAssistButtonProps> = (props) => {
  const { isQueryAssistCollapsed, updateIsQueryAssistCollapsed } = useQueryAssist();

  const onClick = useCallback(() => {
    if (props.dependencies.isCollapsed) {
      props.dependencies.setIsCollapsed(false);
      updateIsQueryAssistCollapsed(false);
    } else {
      updateIsQueryAssistCollapsed(!isQueryAssistCollapsed);
    }
  }, [props.dependencies, isQueryAssistCollapsed, updateIsQueryAssistCollapsed]);

  return (
    <EuiFlexItem grow={false}>
      <EuiButtonIcon
        iconType={
          !props.dependencies.isCollapsed && !isQueryAssistCollapsed ? expandIcon : collapsedIcon
        }
        aria-label={i18n.translate('queryEnhancements.queryAssist.button.ariaLabel', {
          defaultMessage: `Query Assist Toggle`,
        })}
        onClick={onClick}
        data-test-subj="queryAssist_summary_button"
      />
    </EuiFlexItem>
  );
};
