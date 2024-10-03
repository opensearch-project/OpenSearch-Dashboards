/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import { AgentError } from '../utils';

interface WarningBadgeProps {
  error: AgentError | undefined;
}

export const WarningBadge: React.FC<WarningBadgeProps> = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const badgeContainer = document.querySelector<HTMLDivElement>('.queryAssist__badgeContainer');
    if (badgeContainer === null) return;
    const elementsWithBadge = document.querySelectorAll<HTMLElement>('.queryAssist__withBadge');
    elementsWithBadge.forEach((element) =>
      element.style.setProperty('--badge-width', `${badgeContainer.offsetWidth}px`)
    );
  }, [props.error]);

  if (!props.error) return null;
  const {
    error: { error, status },
  } = props.error;

  return (
    <div className="queryAssist__popoverWrapper">
      <EuiPopover
        button={
          <EuiBadge
            color="danger"
            // @ts-ignore this is needed to avoid enter key triggering warning badge instead of submit button
            type="button"
            iconType="alert"
            onClick={(e: SyntheticEvent) => {
              e.preventDefault();
              setIsPopoverOpen(!isPopoverOpen);
            }}
            onClickAriaLabel={i18n.translate('queryEnhancements.queryAssist.badge.ariaLabel', {
              defaultMessage: 'Click to show details',
            })}
            data-test-subj="queryAssistErrorBadge"
          >
            <FormattedMessage
              id="queryEnhancements.queryAssist.badge.title"
              defaultMessage="Error"
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
                <EuiFlexGroup gutterSize="xs" alignItems="center">
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="alert" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <FormattedMessage
                      id="queryEnhancements.queryAssist.error.title"
                      defaultMessage="Error"
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
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
    </div>
  );
};
