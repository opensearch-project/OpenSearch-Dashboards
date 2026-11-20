/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './bottom_container.scss';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  EuiResizableContainer,
  EuiPageBody,
  EuiButtonEmpty,
  EuiPanel,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { CanvasPanel } from '../../panel/canvas_panel';
import { DiscoverPanel } from '../../fields_selector/fields_selector_panel';
import { BottomRightContainer } from './bottom_right_container';
import { isImeComposing } from '../../../../../../core/public/utils';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../application/context';
import { buildColumns } from '../../../application/legacy/discover/application/utils/columns';
import { selectColumns } from '../../../application/utils/state_management/selectors';
import { setColumns } from '../../../application/utils/state_management/slices';

// Below this *container* width the fields sidebar becomes an overlay flyout. Measured on the
// container, not the window, so it also fires when this view is embedded in a narrow host
// (~940px canvas) inside a wide window.
// Crossing the breakpoint switches between a resizable sidebar and an overlay, remounting
// the results subtree. Opening or closing Fields within either layout keeps results mounted.
// 992 = OUI `l` breakpoint.
const NARROW_CONTAINER_WIDTH = 992;

export const BottomContainer = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldsToggleRef = useRef<HTMLButtonElement>(null);
  const fieldsPanelId = `expFieldsPanel${useId()}`;
  const { services } = useOpenSearchDashboards();
  const { dataset } = useDatasetContext();
  const columns = useSelector(selectColumns);
  const prevColumns = useRef(columns);
  const dispatch = useDispatch();
  // null until first measured, so we never paint the wrong layout (useLayoutEffect sets it
  // before the browser paints).
  const [isNarrow, setIsNarrow] = useState<boolean | null>(null);
  const [isFieldsPanelOpen, setIsFieldsPanelOpen] = useState(false);

  // Table actions also change columns, so cleanup must run while Fields is unmounted.
  useEffect(() => {
    const timeFieldname = dataset?.timeFieldName;

    if (columns !== prevColumns.current) {
      let updatedColumns = buildColumns(columns);
      if (
        columns &&
        timeFieldname &&
        !prevColumns.current.includes(timeFieldname) &&
        columns.includes(timeFieldname)
      ) {
        // Preserve an existing time column, but exclude one added to the current selection.
        updatedColumns = columns.filter((column: string) => column !== timeFieldname);
      }
      dispatch(setColumns(updatedColumns));
      prevColumns.current = columns;
    }
  }, [columns, dispatch, dataset?.timeFieldName]);

  const toggleFieldsPanel = useCallback(() => setIsFieldsPanelOpen((open) => !open), []);
  const collapseFieldsPanel = useCallback(() => {
    setIsFieldsPanelOpen(false);
    requestAnimationFrame(() => fieldsToggleRef.current?.focus());
  }, []);

  services.keyboardShortcut?.useKeyboardShortcut({
    id: 'ToggleFieldsPanel',
    pluginId: 'explore',
    name: i18n.translate('explore.discoverFieldHeader.toggleFieldsPanelShortcut', {
      defaultMessage: 'Toggle fields panel',
    }),
    category: i18n.translate('explore.discoverFieldHeader.panelLayoutCategory', {
      defaultMessage: 'Panel / layout',
    }),
    keys: 'shift+f',
    execute: toggleFieldsPanel,
  });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const apply = (width: number) => {
      if (width > 0) setIsNarrow(width < NARROW_CONTAINER_WIDTH);
    };
    apply(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => apply(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showFieldsLabel = i18n.translate('explore.bottomContainer.showFieldsAriaLabel', {
    defaultMessage: 'Show fields',
  });
  const fieldsLabel = i18n.translate('explore.bottomContainer.fieldsFlyoutAriaLabel', {
    defaultMessage: 'Fields',
  });

  useEffect(() => {
    if (!isNarrow || !isFieldsPanelOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isImeComposing(event)) collapseFieldsPanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNarrow, isFieldsPanelOpen, collapseFieldsPanel]);

  const renderFieldsRail = () => (
    <EuiPanel
      className="expBottomContainer__fieldsRail"
      paddingSize="none"
      borderRadius="none"
      color="subdued"
      hasShadow={false}
      grow={false}
    >
      {!isFieldsPanelOpen && (
        <EuiToolTip position="right" content={showFieldsLabel}>
          <EuiButtonEmpty
            className="expBottomContainer__fieldsToggle"
            contentProps={{ className: 'expBottomContainer__fieldsToggleContent' }}
            textProps={{ className: 'expBottomContainer__fieldsToggleLabel' }}
            buttonRef={fieldsToggleRef}
            iconType="menuRight"
            aria-label={showFieldsLabel}
            aria-expanded={false}
            aria-controls={fieldsPanelId}
            data-test-subj="exploreFieldsToggle"
            onClick={toggleFieldsPanel}
            size="s"
          >
            {fieldsLabel}
          </EuiButtonEmpty>
        </EuiToolTip>
      )}
    </EuiPanel>
  );

  const renderNarrow = () => (
    <div
      className={`expBottomContainer__panels expBottomContainer__panels--narrow${
        isFieldsPanelOpen ? '' : ' expBottomContainer__panels--fieldsClosed'
      }`}
    >
      {renderFieldsRail()}
      <EuiPageBody className="expBottomContainer__canvas">
        <BottomRightContainer />
      </EuiPageBody>
      {isFieldsPanelOpen && (
        // The mask is not a tab stop; keyboard users dismiss with Escape or the collapse button.
        <div
          className="expBottomContainer__fieldsFlyoutMask"
          role="presentation"
          onClick={collapseFieldsPanel}
        />
      )}
      <EuiPanel
        id={fieldsPanelId}
        className="expBottomContainer__fieldsFlyout"
        hidden={!isFieldsPanelOpen}
        paddingSize="none"
        borderRadius="none"
        hasShadow
        role="dialog"
        aria-label={fieldsLabel}
        data-test-subj="exploreFieldsFlyout"
      >
        {isFieldsPanelOpen && (
          <div className="expBottomContainer__fieldsFlyoutBody">
            <DiscoverPanel collapsePanel={collapseFieldsPanel} />
          </div>
        )}
      </EuiPanel>
    </div>
  );

  const renderWide = () => (
    <EuiResizableContainer
      direction="horizontal"
      className={`expBottomContainer__panels${
        isFieldsPanelOpen ? '' : ' expBottomContainer__panels--fieldsClosed'
      }`}
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            id={fieldsPanelId}
            initialSize={15}
            minSize="10%"
            wrapperProps={{ className: 'expBottomContainer__fieldsPanel' }}
            paddingSize="none"
          >
            {isFieldsPanelOpen ? (
              <CanvasPanel testId="dscBottomLeftCanvas">
                <DiscoverPanel collapsePanel={collapseFieldsPanel} />
              </CanvasPanel>
            ) : (
              renderFieldsRail()
            )}
          </EuiResizablePanel>
          <EuiResizableButton
            className="expBottomContainer__fieldsResizer"
            disabled={!isFieldsPanelOpen}
          />
          <EuiResizablePanel
            className="expBottomContainer__results"
            initialSize={85}
            minSize="65%"
            wrapperProps={{ className: 'expBottomContainer__resultsPanel' }}
            paddingSize="none"
          >
            <EuiPageBody className="expBottomContainer__canvas">
              <BottomRightContainer />
            </EuiPageBody>
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );

  return (
    <div ref={rootRef} className="expBottomContainer">
      {isNarrow === null ? null : isNarrow ? renderNarrow() : renderWide()}
    </div>
  );
};
