export type ChartSizeArray = [number | string | undefined, number | string | undefined];
export interface ChartSizeObject {
  width?: number | string;
  height?: number | string;
}

export type ChartSize = number | string | ChartSizeArray | ChartSizeObject;

export function getChartSize(size: ChartSize) {
  if (Array.isArray(size)) {
    return {
      width: size[0] === undefined ? '100%' : size[0],
      height: size[1] === undefined ? '100%' : size[1],
    };
  } else if (typeof size === 'object') {
    return {
      width: size.width === undefined ? '100%' : size.width,
      height: size.height === undefined ? '100%' : size.height,
    };
  }
  const sameSize = size === undefined ? '100%' : size;
  return {
    width: sameSize,
    height: sameSize,
  };
}
