/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiLink, EuiPopover, EuiText } from '@elastic/eui';
import React, { useState } from 'react';
import { AgentError } from '../utils';

interface WarningBadgeProps {
  error: AgentError | undefined;
}

export const WarningBadge: React.FC<WarningBadgeProps> = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  if (!props.error) return null;
  const error = props.error.error.error;
  const status = props.error.error.status;

  return (
    <EuiPopover
      button={
        <EuiBadge
          color="warning"
          iconType="alert"
          onClick={(e) => {
            e.preventDefault();
            setIsPopoverOpen(!isPopoverOpen);
          }}
          onClickAriaLabel="Click to show details"
          data-test-subj="queryAssistErrorBadge"
        >
          Warning
        </EuiBadge>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      className="queryAssist__popover"
    >
      <EuiText size="s" className="queryAssist__popoverText">
        <dl>
          <dd id="queryAssistErrorTitle">
            <b>Error</b>
          </dd>
          <dd>
            <b>Reason</b>: {error.reason}
          </dd>
          {showMore && (
            <>
              <dd>
                <b>Details</b>: {error.details}
              </dd>
              <dd>
                <b>Type</b>: {error.type}
              </dd>
              <dd>
                <b>Status</b>: {status}
              </dd>
            </>
          )}
          <EuiLink onClick={() => setShowMore(!showMore)} data-test-subj="queryAssistErrorMore">
            View {showMore ? 'less' : 'more'}
          </EuiLink>
        </dl>
      </EuiText>
    </EuiPopover>
  );
};
