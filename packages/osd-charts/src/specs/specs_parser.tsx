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

import React, { useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { specParsing, specParsed, specUnmounted } from '../state/actions/specs';

const SpecsParserComponent: React.FunctionComponent<{}> = (props) => {
  const injected = props as DispatchProps;
  injected.specParsing();
  useEffect(() => {
    injected.specParsed();
  });
  useEffect(
    () => () => {
      injected.specUnmounted();
    },
    [],
  );
  return props.children ? (props.children as React.ReactElement) : null;
};

interface DispatchProps {
  specParsing: () => void;
  specParsed: () => void;
  specUnmounted: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      specParsing,
      specParsed,
      specUnmounted,
    },
    dispatch,
  );

/**
 * The Spec Parser component
 * @internal
 */
export const SpecsParser = connect(null, mapDispatchToProps)(SpecsParserComponent);
