/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiToolTip } from '@elastic/eui';
import {
  Action,
  IncompatibleActionError,
  ActionExecutionContext,
} from '../../../../ui_actions/public';
import { IEmbeddable, EmbeddableContext, panelBadgeTrigger } from '../../../../embeddable/public';
import { reactToUiComponent } from '../../../../opensearch_dashboards_react/public';
import { VariableUtils } from '../../variables/utils';

export const VARIABLE_BADGE_ACTION = 'VARIABLE_BADGE_ACTION';

interface VariableBadgeContext extends EmbeddableContext {
  embeddable: IEmbeddable;
}

/**
 * Get the query string from an embeddable
 * Different embeddable types may store query in different places
 */
function getEmbeddableQuery(embeddable: IEmbeddable): string | undefined {
  // Try to access originalQuery property (for explore embeddables)
  if ('originalQuery' in embeddable && typeof embeddable.originalQuery === 'string') {
    return embeddable.originalQuery;
  }

  // Try to access query from input
  const input = embeddable.getInput();
  if ('query' in input && input.query && typeof input.query === 'object') {
    const query = input.query as any;
    if (typeof query.query === 'string') {
      return query.query;
    }
  }

  return undefined;
}

/**
 * React component for custom variable badge display
 */
const VariableBadgeMenuItem: React.FC<{
  context: ActionExecutionContext<VariableBadgeContext>;
}> = ({ context }) => {
  const query = getEmbeddableQuery(context.embeddable);
  const variables = query ? VariableUtils.extractVariableNames(query) : [];

  if (variables.length === 0) {
    return null;
  }

  const MAX_VISIBLE = 2;
  const visibleVars = variables.slice(0, MAX_VISIBLE);
  const remainingCount = variables.length - MAX_VISIBLE;

  // Tooltip showing all variables
  const tooltipContent = (
    <div>
      <div style={{ fontWeight: 'bold' }}>
        {i18n.translate('dashboard.panel.variableBadge.tooltip.title', {
          defaultMessage: 'Variables used in this visualization:',
        })}
      </div>
      <ul>
        {variables.map((varName, index) => (
          <li key={varName}>
            {index + 1}. {varName}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <EuiToolTip content={tooltipContent} position="top">
      <EuiBadge iconType="bolt" iconSide="left" color="hollow">
        {visibleVars.join(', ')}
        {remainingCount > 0 && ` +${remainingCount}`}
      </EuiBadge>
    </EuiToolTip>
  );
};

export class VariableBadgeAction implements Action<VariableBadgeContext> {
  public readonly type = VARIABLE_BADGE_ACTION;
  public readonly id = VARIABLE_BADGE_ACTION;
  public order = 20;

  constructor() {}

  public getDisplayName({ embeddable }: ActionExecutionContext<VariableBadgeContext>) {
    const query = getEmbeddableQuery(embeddable);
    const variables = query ? VariableUtils.extractVariableNames(query) : [];
    return variables.length === 0 ? '' : variables.join(', ');
  }

  public getIconType(_context: ActionExecutionContext<VariableBadgeContext>) {
    return 'bolt' as const;
  }

  public async isCompatible({ embeddable }: ActionExecutionContext<VariableBadgeContext>) {
    const query = getEmbeddableQuery(embeddable);
    if (!query) {
      return false;
    }

    const variables = VariableUtils.extractVariableNames(query);
    return variables.length > 0;
  }

  public async execute({ embeddable }: ActionExecutionContext<VariableBadgeContext>) {
    if (!(await this.isCompatible({ embeddable, trigger: panelBadgeTrigger }))) {
      throw new IncompatibleActionError();
    }
  }

  /**
   * Custom MenuItem component to show variables with tooltip
   */
  public MenuItem = reactToUiComponent(VariableBadgeMenuItem);
}
