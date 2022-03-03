### Bar Series components Props table 

| Prop | Type | Default | Note |
|:------|:------:|:---------:|:------|
| id  `(required)` | `AxisId or string` |  | The id of the spec |
| name | `string` | | The name or label of the spec (ie: `'Simple bar series'`) |
| xScaleType `(required)`| `ScaleType (ScaleType.Ordinal or ScaleType.Linear or ScaleType.Time)` | `ScaleType.Ordinal` | The x axis scale type |
| yScaleType `(required)`| string[] scaleContinuousType | `ScaleType.Linear` | The y axis scale type |
| xAccessor `(required)`| Accessor |  | The field name of the x value on Datum object |
| yAccessors `(required)`| Accessor[] |  | An array of field names one per y metric value |
| data `(required)` | datum[] |  | An array of data |

***