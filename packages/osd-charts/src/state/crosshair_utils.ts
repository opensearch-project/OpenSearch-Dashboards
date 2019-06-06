import { Rotation } from '../lib/series/specs';
import { Dimensions } from '../lib/utils/dimensions';
import { Scale } from '../lib/utils/scales/scales';
import { isHorizontalRotation } from './utils';

export interface SnappedPosition {
  position: number;
  band: number;
}

export const DEFAULT_SNAP_POSITION_BAND = 1;

export function getSnapPosition(
  value: string | number,
  scale: Scale,
  totalBarsInCluster: number = 1,
): { band: number; position: number } | undefined {
  const position = scale.scale(value);
  if (position === undefined) {
    return;
  }

  if (scale.bandwidth > 0) {
    const band = scale.bandwidth / (1 - scale.barsPadding);
    const halfPadding = (band - scale.bandwidth) / 2;
    return {
      position: position - halfPadding * totalBarsInCluster,
      band: band * totalBarsInCluster,
    };
  } else {
    return {
      position,
      band: DEFAULT_SNAP_POSITION_BAND,
    };
  }
}

export function getCursorLinePosition(
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  cursorPosition: { x: number; y: number },
): Dimensions {
  const { left, top, width, height } = chartDimensions;
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  if (isHorizontalRotated) {
    const crosshairTop = cursorPosition.y + top;
    return {
      left,
      width,
      top: crosshairTop,
      height: 0,
    };
  } else {
    const crosshairLeft = cursorPosition.x + left;

    return {
      top,
      left: crosshairLeft,
      width: 0,
      height,
    };
  }
}

export function getCursorBandPosition(
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  cursorPosition: { x: number; y: number },
  snapEnabled: boolean,
  xScale: Scale,
  data: any[],
  totalBarsInCluster?: number,
): Dimensions | undefined {
  const { top, left, width, height } = chartDimensions;
  const { x, y } = cursorPosition;
  const isHorizontalRotated = isHorizontalRotation(chartRotation);

  const chartWidth = isHorizontalRotated ? width : height;
  const chartHeight = isHorizontalRotated ? height : width;
  if (x > chartWidth || y > chartHeight || x < 0 || y < 0) {
    return;
  }

  const invertedValue = xScale.invertWithStep(x, data);

  if (invertedValue == null) {
    return;
  }
  const snappedPosition = getSnapPosition(invertedValue, xScale, totalBarsInCluster);
  if (!snappedPosition) {
    return;
  }

  const { position, band } = snappedPosition;
  const bandOffset = xScale.bandwidth > 0 ? band : 0;

  if (isHorizontalRotated) {
    const adjustedLeft = snapEnabled ? position : x;
    const leftPosition = chartRotation === 0 ? left + adjustedLeft : left + width - adjustedLeft - bandOffset;

    return {
      top,
      left: leftPosition,
      width: band,
      height,
    };
  } else {
    const adjustedTop = snapEnabled ? position : x;
    const topPosition = chartRotation === 90 ? top + adjustedTop : height + top - adjustedTop - bandOffset;

    return {
      top: topPosition,
      left,
      width,
      height: band,
    };
  }
}

export function getTooltipPosition(
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  cursorBandPosition: Dimensions,
  cursorPosition: { x: number; y: number },
): {
  transform: string;
} {
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  const hPosition = getHorizontalTooltipPosition(
    cursorPosition.x,
    cursorBandPosition,
    chartDimensions,
    isHorizontalRotated,
  );
  const vPosition = getVerticalTooltipPosition(
    cursorPosition.y,
    cursorBandPosition,
    chartDimensions,
    isHorizontalRotated,
  );
  const xTranslation = `translateX(${hPosition.position}px) translateX(-${hPosition.offset}%)`;
  const yTranslation = `translateY(${vPosition.position}px) translateY(-${vPosition.offset}%)`;
  return {
    transform: `${xTranslation} ${yTranslation}`,
  };
}

export function getHorizontalTooltipPosition(
  cursorXPosition: number,
  cursorBandPosition: Dimensions,
  chartDimensions: Dimensions,
  isHorizontalRotated: boolean,
  padding: number = 20,
): { offset: number; position: number } {
  if (isHorizontalRotated) {
    if (cursorXPosition <= chartDimensions.width / 2) {
      return {
        offset: 0,
        position: cursorBandPosition.left + cursorBandPosition.width + padding,
      };
    } else {
      return {
        offset: 100,
        position: cursorBandPosition.left - padding,
      };
    }
  } else {
    if (cursorXPosition <= chartDimensions.width / 2) {
      return {
        offset: 0,
        position: chartDimensions.left + cursorXPosition,
      };
    } else {
      return {
        offset: 100,
        position: chartDimensions.left + cursorXPosition,
      };
    }
  }
}

export function getVerticalTooltipPosition(
  cursorYPosition: number,
  cursorBandPosition: Dimensions,
  chartDimensions: Dimensions,
  isHorizontalRotated: boolean,
  padding: number = 20,
): {
  offset: number;
  position: number;
} {
  if (isHorizontalRotated) {
    if (cursorYPosition <= chartDimensions.height / 2) {
      return {
        offset: 0,
        position: cursorYPosition + chartDimensions.top,
      };
    } else {
      return {
        offset: 100,
        position: cursorYPosition + chartDimensions.top,
      };
    }
  } else {
    if (cursorYPosition <= chartDimensions.height / 2) {
      return {
        offset: 0,
        position: cursorBandPosition.top + cursorBandPosition.height + padding,
      };
    } else {
      return {
        offset: 100,
        position: cursorBandPosition.top - padding,
      };
    }
  }
}
