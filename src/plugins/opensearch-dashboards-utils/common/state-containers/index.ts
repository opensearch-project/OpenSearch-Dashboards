/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * State containers are Redux-store-like objects meant to help you manage state in your services or apps.
 * TODO: Update link
 * Refer to {@link https://github.com/opensearch-project/OpenSearch-Dashboards/tree/master/src/plugins/opensearch-dashboards-utils/docs/state-containers | guides and examples} for more info
 *
 * @packageDocumentation
 */

export {
  BaseState,
  BaseStateContainer,
  TransitionDescription,
  StateContainer,
  ReduxLikeStateContainer,
  Dispatch,
  Middleware,
  Selector,
  Comparator,
  MapStateToProps,
  Connect,
  Reducer,
  UnboxState,
  PureSelectorToSelector,
  PureSelectorsToSelectors,
  EnsurePureSelector,
  PureTransitionsToTransitions,
  PureTransitionToTransition,
  EnsurePureTransition,
  PureSelector,
  PureTransition,
  Transition,
} from './types';
export { createStateContainer, CreateStateContainerOptions } from './create_state_container';
export {
  createStateContainerReactHelpers,
  useContainerSelector,
  useContainerState,
} from './create_state_container_react_helpers';
