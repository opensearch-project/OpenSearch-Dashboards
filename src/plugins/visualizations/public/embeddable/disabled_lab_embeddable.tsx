/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Embeddable, EmbeddableOutput } from '../../../embeddable/public';

import { DisabledLabVisualization } from './disabled_lab_visualization';
import { VisualizeInput } from './visualize_embeddable';
import { VISUALIZE_EMBEDDABLE_TYPE } from './constants';

export class DisabledLabEmbeddable extends Embeddable<VisualizeInput, EmbeddableOutput> {
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  private domNode?: HTMLElement;
  private root?: Root;
  public readonly type = VISUALIZE_EMBEDDABLE_TYPE;

  constructor(private readonly title: string, initialInput: VisualizeInput) {
    super(initialInput, { title });
  }

  public reload() {}
  public render(domNode: HTMLElement) {
    if (this.title) {
      if (this.root) {
        this.root.unmount();
      }
      this.domNode = domNode;
      this.root = createRoot(domNode);
      this.root.render(<DisabledLabVisualization title={this.title} />);
    }
  }

  public destroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}
