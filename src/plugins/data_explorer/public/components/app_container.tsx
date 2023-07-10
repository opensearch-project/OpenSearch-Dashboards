/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { EuiPageTemplate } from '@elastic/eui';

import { Sidebar } from './sidebar';
import { NoView } from './no_view';
import { View } from '../services/view_service/view';

export const AppContainer = ({ view }: { view?: View }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unmountRef = useRef<any>(null);

  useLayoutEffect(() => {
    const unmount = () => {
      if (unmountRef.current) {
        unmountRef.current();
        unmountRef.current = null;
      }
    };

    if (!view) {
      return;
    }

    // unmount the previous view
    unmount();

    const mount = async () => {
      setShowSpinner(true);
      try {
        unmountRef.current =
          (await view.mount({
            canvasElement: canvasRef.current!,
            panelElement: panelRef.current!,
          })) || null;
      } catch (e) {
        // TODO: add error UI
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        // if (canvasRef.current && panelRef.current) {
        if (canvasRef.current) {
          setShowSpinner(false);
        }
      }
    };

    mount();

    return unmount;
  }, [view]);

  // TODO: Make this more robust.
  if (!view) {
    return <NoView />;
  }

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <EuiPageTemplate
      pageSideBar={
        <Sidebar>
          <div ref={panelRef} />
        </Sidebar>
      }
      className="dePageTemplate"
      template="default"
      restrictWidth={false}
      paddingSize="none"
    >
      {/* TODO: improve loading state */}
      {showSpinner && <div>Loading...</div>}
      <div key={view.id} ref={canvasRef} />
    </EuiPageTemplate>
  );
};
