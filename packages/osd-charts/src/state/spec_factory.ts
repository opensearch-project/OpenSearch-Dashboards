/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useEffect } from 'react';
import { connect } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';

import { Spec } from '../specs';
import { upsertSpec, removeSpec } from './actions/specs';

/** @internal */
export interface DispatchProps {
  upsertSpec: (spec: Spec) => void;
  removeSpec: (id: string) => void;
}

/** @internal */
export function specComponentFactory<U extends Spec, D extends keyof U>(
  defaultProps: Pick<U, D | 'chartType' | 'specType'>,
) {
  /* eslint-disable no-shadow, react-hooks/exhaustive-deps, unicorn/consistent-function-scoping */
  const SpecInstance = (props: U & DispatchProps) => {
    const { removeSpec, upsertSpec, ...SpecInstance } = props;
    useEffect(() => {
      upsertSpec(SpecInstance);
    });
    useEffect(
      () => () => {
        removeSpec(props.id);
      },
      [],
    );
    return null;
  };
  /* eslint-enable */
  SpecInstance.defaultProps = defaultProps;
  return SpecInstance;
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      upsertSpec,
      removeSpec,
    },
    dispatch,
  );

/** @internal */
export function getConnect() {
  /**
   * Redux assumes shallowEqual for all connected components
   *
   * This causes an issue where the specs are cleared and memoized spec components will never be
   * re-rendered and thus never re-upserted to the state. Setting pure to false solves this issue
   * and doesn't cause traditional performance degradations.
   */
  return connect(null, mapDispatchToProps, null, { pure: false });
}
