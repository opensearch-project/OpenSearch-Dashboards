/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ReactDOM from 'react-dom';
import { useRef } from 'react';
import type { PropsWithChildren } from 'react';
import { usePortalContainer } from './use_portal_container.hook';
import type { PortalProps } from './types';
// created portal so Context menu can render over other nodes.
// Only Z index not working
const Portal: React.FC<PropsWithChildren<PortalProps>> = ({ position, children }) => {
  // Create a container element for testing purposes
  const containerElRef = useRef<HTMLDivElement | null>(null);
  if (!containerElRef.current) {
    containerElRef.current = document.createElement('div');
  }

  // Use the container element with the hook
  const portalContainer = usePortalContainer(position, containerElRef.current);

  // Pass in menu items from here
  // Can later modify to maybe pass in a prop from Celestial Node
  // to detect what kind of menu is needed and change accordingly
  return ReactDOM.createPortal(children, portalContainer);
};

// eslint-disable-next-line import/no-default-export
export default Portal;
