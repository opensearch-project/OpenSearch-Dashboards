/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiLink, EuiPopover, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { SyntheticEvent, useState } from 'react';
import { AgentError } from '../utils';

interface WarningBadgeProps {
  error: AgentError | undefined;
}

export const WarningBadge: React.FC<WarningBadgeProps> = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  if (!props.error) return null;
  const {
    error: { error, status },
  } = props.error;

  return (
    <EuiPopover
      button={
        <EuiBadge
          color="warning"
          // @ts-ignore this is needed to avoid enter key triggering warning badge instead of submit button
          type="button"
          iconType="alert"
          onClick={(e: SyntheticEvent) => {
            e.preventDefault();
            setIsPopoverOpen(!isPopoverOpen);
          }}
          onClickAriaLabel="Click to show details"
          data-test-subj="queryAssistErrorBadge"
        >
          <FormattedMessage
            id="queryEnhancements.queryAssist.badge.title"
            defaultMessage="Warning"
          />
        </EuiBadge>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      className="queryAssist__popover"
    >
      <EuiText size="s" className="queryAssist__popoverText">
        <dl>
          <dd id="queryAssistErrorTitle">
            <b>
              <FormattedMessage
                id="queryEnhancements.queryAssist.error.title"
                defaultMessage="Error"
              />
            </b>
          </dd>
          <dd>
            <b>
              <FormattedMessage
                id="queryEnhancements.queryAssist.error.reason"
                defaultMessage="Reason"
              />
            </b>
            : {error.reason}
          </dd>
          {showMore && (
            <>
              <dd>
                <b>
                  <FormattedMessage
                    id="queryEnhancements.queryAssist.error.details"
                    defaultMessage="Details"
                  />
                </b>
                : {error.details}
              </dd>
              <dd>
                <b>
                  <FormattedMessage
                    id="queryEnhancements.queryAssist.error.type"
                    defaultMessage="Type"
                  />
                </b>
                : {error.type}
              </dd>
              <dd>
                <b>
                  <FormattedMessage
                    id="queryEnhancements.queryAssist.error.status"
                    defaultMessage="Status"
                  />
                </b>
                : {status}
              </dd>
            </>
          )}
          <EuiLink onClick={() => setShowMore(!showMore)} data-test-subj="queryAssistErrorMore">
            {showMore ? (
              <FormattedMessage
                id="queryEnhancements.queryAssist.error.viewLess"
                defaultMessage="View Less"
              />
            ) : (
              <FormattedMessage
                id="queryEnhancements.queryAssist.error.viewMore"
                defaultMessage="View More"
              />
            )}
          </EuiLink>
        </dl>
      </EuiText>
    </EuiPopover>
  );
};
