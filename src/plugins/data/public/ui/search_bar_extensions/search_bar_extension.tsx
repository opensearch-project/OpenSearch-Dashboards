/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiErrorBoundary } from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IIndexPattern } from '../../../common';

interface SearchBarExtensionProps {
  config: SearchBarExtensionConfig;
  dependencies: SearchBarExtensionDependencies;
  portalContainer: Element;
}

export interface SearchBarExtensionDependencies {
  /**
   * Currently selected index patterns.
   */
  indexPatterns?: Array<IIndexPattern | string>;
}

export interface SearchBarExtensionConfig {
  /**
   * The id for the search bar extension.
   */
  id: string;
  /**
   * Lower order indicates higher position on UI.
   */
  order: number;
  /**
   * A function that determines if the search bar extension is enabled and should be rendered on UI.
   * @returns whether the extension is enabled.
   */
  isEnabled: (dependencies: SearchBarExtensionDependencies) => Promise<boolean>;
  /**
   * A function that returns the mount point for the search bar extension.
   * @param dependencies - The dependencies required for the extension.
   * @returns The component the search bar extension.
   */
  getComponent: (dependencies: SearchBarExtensionDependencies) => React.ReactElement;
}

export const SearchBarExtension: React.FC<SearchBarExtensionProps> = (props) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const isMounted = useRef(true);

  const component = useMemo(() => props.config.getComponent(props.dependencies), [
    props.config,
    props.dependencies,
  ]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    props.config.isEnabled(props.dependencies).then((enabled) => {
      if (isMounted.current) setIsEnabled(enabled);
    });
  }, [props.dependencies, props.config]);

  if (!isEnabled) return null;

  return ReactDOM.createPortal(
    <EuiErrorBoundary>{component}</EuiErrorBoundary>,
    props.portalContainer
  );
};
