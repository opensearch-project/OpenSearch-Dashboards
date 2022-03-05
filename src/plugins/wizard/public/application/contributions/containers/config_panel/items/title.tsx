/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { TitleItemContribution } from './types';
import { useTypedDispatch } from '../../../../utils/state_management';
import { setActiveItem } from '../../../../utils/state_management/config_slice';

export interface TitleProps {
  title: string;
  icon?: React.ReactNode;
  showDivider?: boolean;
}

export const TitleComponent = ({ title, icon, showDivider = false }: TitleProps) => (
  <>
    <div className="wizConfig__title">
      <EuiFlexGroup gutterSize="s" alignItems="center">
        {icon && <EuiFlexItem grow={false}>{icon}</EuiFlexItem>}
        <EuiFlexItem>
          <EuiTitle size="xxs">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
    {showDivider ? <EuiHorizontalRule margin="s" /> : <EuiSpacer size="s" />}
  </>
);

interface TitleContributionProps extends TitleItemContribution {
  isSecondary?: boolean;
}

export const Title = ({ title, isSecondary }: TitleContributionProps) => {
  const dispatch = useTypedDispatch();

  return (
    <TitleComponent
      title={title}
      icon={
        isSecondary && <EuiIcon type="arrowLeft" onClick={() => dispatch(setActiveItem(null))} />
      }
      showDivider={isSecondary}
    />
  );
};
