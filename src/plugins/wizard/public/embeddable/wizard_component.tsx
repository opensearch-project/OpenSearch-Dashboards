/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import { SavedObjectEmbeddableInput, withEmbeddableSubscription } from '../../../embeddable/public';
import { WizardEmbeddable, WizardOutput } from './wizard_embeddable';
import { validateSchemaState } from '../application/utils/validate_schema_state';

interface Props {
  embeddable: WizardEmbeddable;
  input: SavedObjectEmbeddableInput;
  output: WizardOutput;
}

function WizardEmbeddableComponentInner({
  embeddable,
  input: {},
  output: { savedAttributes },
}: Props) {
  const { ReactExpressionRenderer, toasts, types, indexPatterns, aggs } = embeddable;
  const [expression, setExpression] = useState<string>();

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

  return <ReactExpressionRenderer expression={expression ?? ''} />;

  // TODO: add correct loading and error states
}

export const WizardEmbeddableComponent = withEmbeddableSubscription<
  SavedObjectEmbeddableInput,
  WizardOutput,
  WizardEmbeddable
>(WizardEmbeddableComponentInner);
