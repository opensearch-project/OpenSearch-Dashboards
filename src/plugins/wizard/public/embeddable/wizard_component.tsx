/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiText,
  EuiAvatar,
  EuiFlexGrid,
  EuiCodeBlock,
} from '@elastic/eui';

import { withEmbeddableSubscription } from '../../../embeddable/public';
import { WizardEmbeddable, WizardInput, WizardOutput } from './wizard_embeddable';
import { validateSchemaState } from '../application/utils/validate_schema_state';

interface Props {
  embeddable: WizardEmbeddable;
  input: WizardInput;
  output: WizardOutput;
}

function wrapSearchTerms(task?: string, search?: string) {
  if (!search) return task;
  if (!task) return task;
  const parts = task.split(new RegExp(`(${search})`, 'g'));
  return parts.map((part, i) =>
    part === search ? (
      <span key={i} style={{ backgroundColor: 'yellow' }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function WizardEmbeddableComponentInner({
  embeddable,
  input: { search },
  output: { savedAttributes },
}: Props) {
  const { ReactExpressionRenderer, toasts, types, indexPatterns, aggs } = embeddable;
  const [expression, setExpression] = useState<string>();
  const { title, description, visualizationState, styleState } = savedAttributes || {};

  useEffect(() => {
    const { visualizationState: visualization, styleState: style } = savedAttributes || {};
    if (savedAttributes === undefined || visualization === undefined || style === undefined) {
      return;
    }

    const rootState = {
      visualization: JSON.parse(visualization),
      style: JSON.parse(style),
    };

    const visualizationType = types.get(rootState.visualization?.activeVisualization?.name ?? '');
    if (!visualizationType) {
      throw new Error(`Invalid visualization type ${visualizationType}`);
    }
    const { toExpression, ui } = visualizationType;

    async function loadExpression() {
      const schemas = ui.containerConfig.data.schemas;
      const [valid, errorMsg] = validateSchemaState(schemas, rootState);

      if (!valid) {
        if (errorMsg) {
          toasts.addWarning(errorMsg);
        }
        setExpression(undefined);
        return;
      }
      const exp = await toExpression(rootState, indexPatterns, aggs);
      setExpression(exp);
    }

    if (savedAttributes !== undefined) {
      loadExpression();
    }
  }, [aggs, indexPatterns, savedAttributes, toasts, types]);

  // TODO: add correct loading and error states, remove debugging mode
  return (
    <>
      {expression ? (
        <EuiFlexItem>
          <ReactExpressionRenderer expression={expression} />
        </EuiFlexItem>
      ) : (
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiAvatar name={title || description || ''} size="l" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGrid columns={1}>
              <EuiFlexItem>
                <EuiText data-test-subj="wizardEmbeddableTitle">
                  <h3>{wrapSearchTerms(title || '', search)}</h3>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText data-test-subj="wizardEmbeddableDescription">
                  {wrapSearchTerms(description, search)}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCodeBlock data-test-subj="wizardEmbeddableDescription">
                  {wrapSearchTerms(visualizationState, search)}
                </EuiCodeBlock>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCodeBlock data-test-subj="wizardEmbeddableDescription">
                  {wrapSearchTerms(styleState, search)}
                </EuiCodeBlock>
              </EuiFlexItem>
            </EuiFlexGrid>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </>
  );
}

export const WizardEmbeddableComponent = withEmbeddableSubscription<
  WizardInput,
  WizardOutput,
  WizardEmbeddable
>(WizardEmbeddableComponentInner);
