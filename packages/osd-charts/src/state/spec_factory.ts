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
 * under the License. */

import { useEffect, useRef } from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { upsertSpec, removeSpec } from './actions/specs';
import { Spec } from '../specs';

export interface DispatchProps {
  upsertSpec: (spec: Spec) => void;
  removeSpec: (id: string) => void;
}

function usePrevious(value: string) {
  const ref = useRef<string>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function specComponentFactory<U extends Spec, D extends keyof U>(
  defaultProps: Pick<U, D | 'chartType' | 'specType'>,
) {
  const spec = (props: U & DispatchProps) => {
    const prevId = usePrevious(props.id);
    const { removeSpec, upsertSpec, ...spec } = props;
    useEffect(() => {
      if (prevId && prevId !== props.id) {
        removeSpec(prevId);
      }
      upsertSpec(spec);
    });
    useEffect(
      () => () => {
        removeSpec(props.id);
      },
      [],
    );
    return null;
  };
  spec.defaultProps = defaultProps;
  return spec;
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      upsertSpec,
      removeSpec,
    },
    dispatch,
  );

export function getConnect() {
  /**
   * Redux assumes shallowEqual for all connected components
   *
   * This causes an issue where the specs are cleared and memoized spec components will never be
   * rerendered and thus never re-upserted to the state. Setting pure to false solves this issue
   * and doesn't cause traditional performance degradations.
   */
  return connect(null, mapDispatchToProps, null, { pure: false });
}
