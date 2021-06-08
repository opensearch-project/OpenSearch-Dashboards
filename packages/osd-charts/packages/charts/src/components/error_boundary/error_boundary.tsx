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

import React, { Component, ReactNode } from 'react';

import { SettingsSpecProps } from '../../specs';
import { NoResults } from '../no_results';
import { isGracefulError } from './errors';

type ErrorBoundaryProps = {
  children: ReactNode;
  renderFn?: SettingsSpecProps['noResults'];
};

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error Boundary to catch and handle custom errors
 * @internal
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  hasError = false;

  componentDidUpdate() {
    if (this.hasError) {
      this.hasError = false;
    }
  }

  componentDidCatch(error: Error) {
    if (isGracefulError(error)) {
      this.hasError = true;
      this.forceUpdate();
    }
  }

  render() {
    if (this.hasError) {
      return <NoResults renderFn={this.props.renderFn} />;
    }

    return this.props.children;
  }
}
