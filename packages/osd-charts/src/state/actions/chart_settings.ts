import { Dimensions } from '../../utils/dimensions';

export const UPDATE_PARENT_DIMENSION = 'UPDATE_PARENT_DIMENSION';

interface UpdateParentDimensionAction {
  type: typeof UPDATE_PARENT_DIMENSION;
  dimensions: Dimensions;
}

export function updateParentDimensions(dimensions: Dimensions): UpdateParentDimensionAction {
  return { type: UPDATE_PARENT_DIMENSION, dimensions };
}

export type ChartSettingsActions = UpdateParentDimensionAction;
