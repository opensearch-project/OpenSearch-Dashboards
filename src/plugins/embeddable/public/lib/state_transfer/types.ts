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

import { Optional } from '@osd/utility-types';
import { EmbeddableInput, SavedObjectEmbeddableInput } from '..';

export interface ContainerInfo {
  containerName: string;
  containerId: string;
  /**
   * Opaque, container-owned context that the originating container wants to
   * round-trip through an editor. The embeddable framework and editors treat
   * this as a pass-through: they carry it out (in {@link EmbeddableEditorState})
   * and echo it back (in {@link EmbeddablePackageState}) without interpreting
   * it. A container populates it via the optional
   * `IContainer.getStateTransferContainerInfoData()` method.
   */
  containerData?: Record<string, unknown>;
}

/**
 * A state package that contains information an editor will need to create or edit an embeddable then redirect back.
 * @public
 */
export interface EmbeddableEditorState {
  originatingApp: string;
  embeddableId?: string;
  valueInput?: EmbeddableInput;
  containerInfo?: ContainerInfo;
}

export function isEmbeddableEditorState(state: unknown): state is EmbeddableEditorState {
  return ensureFieldOfTypeExists('originatingApp', state, 'string');
}

/**
 * A state package that contains all fields necessary to create or update an embeddable by reference or by value in a container.
 * @public
 */
export interface EmbeddablePackageState {
  type: string;
  input: Optional<EmbeddableInput, 'id'> | Optional<SavedObjectEmbeddableInput, 'id'>;
  embeddableId?: string;
  /**
   * Echoed back verbatim from the {@link EmbeddableEditorState} the editor was
   * launched with, so the originating container can recover its own
   * pass-through context (see {@link ContainerInfo.containerData}).
   */
  containerInfo?: ContainerInfo;
}

export function isEmbeddablePackageState(state: unknown): state is EmbeddablePackageState {
  return (
    ensureFieldOfTypeExists('type', state, 'string') &&
    ensureFieldOfTypeExists('input', state, 'object')
  );
}

function ensureFieldOfTypeExists(key: string, obj: unknown, type?: string): boolean {
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  return (
    obj &&
    key in (obj as { [key: string]: unknown }) &&
    (!type || typeof (obj as { [key: string]: unknown })[key] === type)
  );
}
