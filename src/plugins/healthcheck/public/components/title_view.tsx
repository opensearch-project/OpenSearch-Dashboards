/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import { groupBy } from 'lodash';
import { TASK, RESULT } from '../constants';
import { HealthIcon } from './health_icon';
import { TaskInfo } from '../../../../core/common/healthcheck';
import { BadgeResults } from './utils/badge_results';

interface TitleViewProps {
  status: RESULT;
  checks: TaskInfo[];
}

export const TitleView = ({ status, checks }: TitleViewProps) => {
  const checksGroupByResult = groupBy(checks, 'result');

  return (
    <EuiFlexGroup alignItems="center" justifyContent="flexStart" gutterSize="s" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiText>
          <h3>
            <FormattedMessage id="healthcheck.statusTitle" defaultMessage="Status is " />
            <BadgeResults result={status} isEnabled={checks.some((check) => check.enabled)} />
          </h3>
        </EuiText>
      </EuiFlexItem>
      {[
        TASK.RUN_RESULT.GREEN,
        TASK.RUN_RESULT.YELLOW,
        TASK.RUN_RESULT.RED,
        TASK.RUN_RESULT.GRAY,
      ].map((result) => {
        const CheckByResult = checksGroupByResult?.[result.value]?.length ?? 0;
        if (CheckByResult > 0) {
          return (
            <EuiFlexItem grow={false}>
              <HealthIcon key={result.value} status={result.value}>
                {CheckByResult}
              </HealthIcon>
            </EuiFlexItem>
          );
        }
        return null;
      })}
    </EuiFlexGroup>
  );
};
