/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiText,
  EuiCallOut,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import { TaskInfo } from '../../../../../core/common/healthcheck';
import { mapTaskStatusToHealthColor } from '../services/health';
import { BadgeResults } from '../utils/badge_results';

interface CheckFlyoutProps {
  check: TaskInfo;
  formatDate: (date: string) => string;
  setIsFlyoutVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CheckFlyout = ({ check, formatDate, setIsFlyoutVisible }: CheckFlyoutProps) => {
  const { name, duration, startedAt, finishedAt, error, result, status, enabled, critical } = check;

  const callOut = !enabled && (
    <EuiCallOut iconType="help">
      <EuiText>
        <FormattedMessage
          id="healthcheck.status.disabledExplain"
          defaultMessage="Disabled. This does not run on initial or scheduled executions."
        />
      </EuiText>
    </EuiCallOut>
  );

  const responseYesOrNo = (value: boolean) =>
    value ? (
      <FormattedMessage id="healthcheck.yes" defaultMessage="Yes" />
    ) : (
      <FormattedMessage id="healthcheck.no" defaultMessage="No" />
    );

  return (
    <EuiFlyout
      type="push"
      size="s"
      side="right"
      onClose={() => setIsFlyoutVisible(false)}
      aria-labelledby="pushedFlyoutTitle"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <FormattedMessage
            id="healthcheck.check.details.title"
            defaultMessage="Check details for {name}"
            values={{ name }}
          />
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody banner={callOut}>
        <EuiFlexGroup direction="column">
          {error && (
            <>
              {result === 'red' && (
                <>
                  <EuiFlexItem>
                    <EuiText size="m">
                      <FormattedMessage
                        id="healthcheck.check.details.error"
                        defaultMessage="Error:"
                      />
                    </EuiText>
                    <EuiSpacer size="s" />
                    <EuiCallOut size="s" color={mapTaskStatusToHealthColor(result)}>
                      <p>{error}</p>
                    </EuiCallOut>
                  </EuiFlexItem>
                  <EuiSpacer />
                </>
              )}
              {result === 'yellow' && (
                <>
                  <EuiFlexItem>
                    <EuiText size="m">
                      <FormattedMessage
                        id="healthcheck.check.details.warning"
                        defaultMessage="Warning:"
                      />
                    </EuiText>
                    <EuiSpacer size="s" />
                    <EuiCallOut size="s" color={mapTaskStatusToHealthColor(result)}>
                      <p>{error}</p>
                    </EuiCallOut>
                  </EuiFlexItem>
                  <EuiSpacer />
                </>
              )}
            </>
          )}
          <EuiFlexItem>
            <EuiDescriptionList type="responsiveColumn">
              <EuiDescriptionListTitle>
                <FormattedMessage
                  id="healthcheck.check.details.isEnabled"
                  defaultMessage="Enabled:"
                />
              </EuiDescriptionListTitle>

              <EuiDescriptionListDescription>
                {responseYesOrNo(enabled)}
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage
                  id="healthcheck.check.details.critical"
                  defaultMessage="Critical:"
                />
              </EuiDescriptionListTitle>

              <EuiDescriptionListDescription>
                {responseYesOrNo(critical)}
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage id="healthcheck.check.details.status" defaultMessage="Status:" />
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <p>{status}</p>
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage id="healthcheck.check.details.result" defaultMessage="Result:" />
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <BadgeResults result={result} isEnabled={enabled} />
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage
                  id="healthcheck.check.details.startedAt"
                  defaultMessage="Started:"
                />
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <p>{startedAt ? formatDate(startedAt) : '-'}</p>
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage
                  id="healthcheck.check.details.finishedAt"
                  defaultMessage="Finished:"
                />
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <p>{finishedAt ? formatDate(finishedAt) : '-'}</p>
              </EuiDescriptionListDescription>

              <EuiDescriptionListTitle>
                <FormattedMessage
                  id="healthcheck.check.details.duration"
                  defaultMessage="Duration:"
                />
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription>
                <p>{duration ? `${duration}s` : '-'}</p>
              </EuiDescriptionListDescription>
            </EuiDescriptionList>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
