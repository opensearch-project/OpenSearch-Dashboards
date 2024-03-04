/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPosition, getOsdSidecarPaddingStyle } from './helper';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from './sidecar_service';

describe('sidecar helper', () => {
  describe('getPosition', () => {
    test('return clientX for mouse event when horizontal', () => {
      expect(
        getPosition({ clientX: 1, clientY: 2, pageX: 0, pageY: 0 } as MouseEvent, true)
      ).toEqual(1);
    });
    test('return clientY for mouse event when not horizontal', () => {
      expect(
        getPosition({ clientX: 1, clientY: 2, pageX: 0, pageY: 0 } as MouseEvent, false)
      ).toEqual(2);
    });

    test('return clientX for touch event when horizontal', () => {
      expect(
        getPosition(({ touches: [{ clientX: 1, clientY: 2 }] } as unknown) as TouchEvent, true)
      ).toEqual(1);
    });
    test('return clientY for touch event when not horizontal', () => {
      expect(
        getPosition(({ touches: [{ clientX: 1, clientY: 2 }] } as unknown) as TouchEvent, false)
      ).toEqual(2);
    });
  });
  describe('getOsdSidecarPaddingStyle', () => {
    const props: ISidecarConfig = {
      paddingSize: 460,
      dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
      isHidden: false,
    };

    test('return paddingRight style object when dockedMode is right ', () => {
      expect(
        getOsdSidecarPaddingStyle({ ...props, dockedMode: SIDECAR_DOCKED_MODE.RIGHT })
      ).toEqual({ paddingRight: 460 });
    });

    test('return paddingLeft style object when dockedMode is left ', () => {
      expect(
        getOsdSidecarPaddingStyle({ ...props, dockedMode: SIDECAR_DOCKED_MODE.LEFT })
      ).toEqual({ paddingLeft: 460 });
    });

    test('return null object when isHidden is true ', () => {
      expect(getOsdSidecarPaddingStyle({ ...props, isHidden: true })).toEqual({});
    });

    test('return null object when dockedMode is takeover ', () => {
      expect(
        getOsdSidecarPaddingStyle({ ...props, dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER })
      ).toEqual({});
    });
  });
});
