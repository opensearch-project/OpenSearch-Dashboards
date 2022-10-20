/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { SavedObjectEmbeddableInput, withEmbeddableSubscription } from '../../../embeddable/public';
import { WizardEmbeddable, WizardOutput } from './vis_builder_embeddable';
import { getReactExpressionRenderer } from '../plugin_services';

interface Props {
  embeddable: WizardEmbeddable;
  input: SavedObjectEmbeddableInput;
  output: WizardOutput;
}

function WizardEmbeddableComponentInner({ embeddable, input: {}, output: { error } }: Props) {
  const { expression } = embeddable;
  const ReactExpressionRenderer = getReactExpressionRenderer();

  return (
    <>
      {error?.message ? (
        // TODO: add correct loading and error states
        <div>{error.message}</div>
      ) : (
        <ReactExpressionRenderer expression={expression ?? ''} />
      )}
    </>
  );
}

export const WizardEmbeddableComponent = withEmbeddableSubscription<
  SavedObjectEmbeddableInput,
  WizardOutput,
  WizardEmbeddable
>(WizardEmbeddableComponentInner);
