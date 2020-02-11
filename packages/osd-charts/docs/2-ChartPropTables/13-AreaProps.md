### Area component props table 
Default props are set in the area_series.tsx file 

| Prop | Type | Default | Note |
|:------|:------:|:---------:|:------|
| id  `(required)` | `string` |  | The id of the spec |
| name | `string` | | The name or label of the spec |
| xScaleType `(required)`| `ScaleType (ScaleType.Ordinal or ScaleType.Linear or ScaleType.Time)` | `ScaleType.Ordinal` | The x axis scale type |
| yScaleType `(required)`| string[] scaleContinuousType | `ScaleType.Linear` | The y axis scale type |
| xAccessor `(required)`| Accessor |  | The field name of the x value on Datum object |
| yAccessors `(required)`| Accessor[] |  | An array of field names one per y metric value |
| data `(required)` | datum[] |  | An array of data |
| chartType | `typeof ChartTypes.XYAxis` | ChartTypes.XYAxis  |  |
| specType | `typeof SpecTypes.Series` | SpecTypes.Series | | 
| seriesType| `typeof SeriesTypes.Area` | SeriesTypes.Area | |
| groupId | string | DEFAULT_GLOBAL_ID | | 
| yScaleToDataExtent | boolean | false | | 
| hideInLegend | boolean | false | hide the series in the legend | 
| histogramModeAlignment | `Start or Center or End` | histogramModeAlignment.Center | Determines how points in the series will align to bands in histogram mode |

***