/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';

interface SidebarPanelContextValue {
  collapseSidebar: () => void;
}

export const SidebarPanelContext = createContext<SidebarPanelContextValue>({
  collapseSidebar: () => {},
});

export const useSidebarPanel = () => useContext(SidebarPanelContext);
