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
import {
  Container,
  ContainerInput,
  EmbeddableStart,
  EmbeddableInput,
} from '../../../../src/plugins/embeddable/public';
import { SearchableListContainerComponent } from './searchable_list_container_component';

export const SEARCHABLE_LIST_CONTAINER = 'SEARCHABLE_LIST_CONTAINER';

export interface SearchableContainerInput extends ContainerInput {
  search?: string;
}

interface ChildInput extends EmbeddableInput {
  search?: string;
}

export class SearchableListContainer extends Container<ChildInput, SearchableContainerInput> {
  public readonly type = SEARCHABLE_LIST_CONTAINER;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  private node?: HTMLElement;
  private root: Root | null = null;

  constructor(input: SearchableContainerInput, private embeddableServices: EmbeddableStart) {
    super(input, { embeddableLoaded: {} }, embeddableServices.getEmbeddableFactory);
  }

  // TODO: add a more advanced example here where inherited child input is derived from container
  // input and not just an exact pass through.
  getInheritedInput(id: string) {
    return {
      id,
      search: this.getInput().search,
      viewMode: this.input.viewMode,
    };
  }

  public render(node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.node = node;
    this.root = createRoot(node);
    this.root.render(
      <SearchableListContainerComponent
        embeddable={this}
        embeddableServices={this.embeddableServices}
      />
    );
  }

  public destroy() {
    super.destroy();
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
