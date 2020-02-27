import { SpecActions } from './specs';
import { ChartActions } from './chart';
import { ChartSettingsActions } from './chart_settings';
import { LegendActions } from './legend';
import { EventsActions } from './events';
import { MouseActions } from './mouse';
import { ColorsActions } from './colors';

export type StateActions =
  | SpecActions
  | ChartActions
  | ChartSettingsActions
  | LegendActions
  | EventsActions
  | MouseActions
  | ColorsActions;
