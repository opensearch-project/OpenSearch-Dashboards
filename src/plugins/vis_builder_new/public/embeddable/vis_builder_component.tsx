/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { SavedObjectEmbeddableInput, withEmbeddableSubscription } from '../../../embeddable/public';
import { VisBuilderEmbeddable, VisBuilderOutput } from './vis_builder_embeddable';
import { getReactExpressionRenderer } from '../plugin_services';

interface Props {
  embeddable: VisBuilderEmbeddable;
  input: SavedObjectEmbeddableInput;
  output: VisBuilderOutput;
}

function VisBuilderEmbeddableComponentInner({ embeddable, input: {}, output: { error } }: Props) {
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

export const VisBuilderEmbeddableComponent = withEmbeddableSubscription<
  SavedObjectEmbeddableInput,
  VisBuilderOutput,
  VisBuilderEmbeddable
>(VisBuilderEmbeddableComponentInner);
