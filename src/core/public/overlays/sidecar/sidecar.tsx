/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject } from 'rxjs';
import classNames from 'classnames';
import { I18nStart } from '../../i18n';
import { MountPoint } from '../../types';
import { MountWrapper } from '../../utils';
import './sidecar_service.scss';
import { ResizableButton } from './resizable_button';
import { ISidecarConfig, OverlaySidecarOpenOptions } from './sidecar_service';

interface Props {
  sidecarConfig$: BehaviorSubject<ISidecarConfig | undefined>;
  options: OverlaySidecarOpenOptions;
  setSidecarConfig: (config: Partial<ISidecarConfig>) => void;
  i18n: I18nStart;
  mount: MountPoint;
}

export const Sidecar = ({ sidecarConfig$, options, setSidecarConfig, i18n, mount }: Props) => {
  const sidecarConfig = useObservable(sidecarConfig$, undefined);

  const classes = classNames(
    'osdSidecarFlyout',
    {
      'osdSidecarFlyout--dockedRight': sidecarConfig?.dockedDirection === 'right',
      'osdSidecarFlyout--dockedLeft': sidecarConfig?.dockedDirection === 'left',
      'osdSidecarFlyout--dockedBottom': sidecarConfig?.dockedDirection === 'bottom',
      'osdSidecarFlyout--hide': sidecarConfig?.isHidden === true,
    },
    options.className
  );
  const handleResize = useCallback(
    (newSize: number) => {
      setSidecarConfig({
        paddingSize: newSize,
      });
    },
    [setSidecarConfig]
  );

  const flyoutSizeStyle = useMemo(
    () =>
      sidecarConfig?.dockedDirection === 'bottom'
        ? {
            height: sidecarConfig?.paddingSize,
          }
        : {
            width: sidecarConfig?.paddingSize,
          },
    [sidecarConfig]
  );

  return (
    <i18n.Context>
      <div data-test-subj={options['data-test-subj']} style={flyoutSizeStyle} className={classes}>
        <ResizableButton
          isHorizontal={sidecarConfig?.dockedDirection !== 'bottom'}
          onResize={handleResize}
          dockedDirection={sidecarConfig?.dockedDirection}
          flyoutSize={sidecarConfig?.paddingSize ?? 0}
          minSize={sidecarConfig?.minSize}
        />
        <MountWrapper mount={mount} className="osdSidecarMountWrapper" />
      </div>
    </i18n.Context>
  );
};
