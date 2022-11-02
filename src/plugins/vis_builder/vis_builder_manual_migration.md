### Overview

Here is an instruction on how users can manually migrate the previous visualizations created using earlier release version of VisBuilder. There are two changes to the stucture of the saved objects that created from VisBuilder since we release VisBuilder:

1. In 2.3 release, we change the way of storing index pattern: previously we save index pattern in the visualizationState, now we save index pattern following other saved object structure and using `kibanaSavedObjectMeta` attribute and the `references` array.
2. In 2.4 release, we change the type name of the visualizations created by VisBuilder from `wizard` to `visualization-visbuilder`.

### Migration steps

1. Before updating to later release version, export the existing visualizations created by VisBuilder:
    a. Navigate to `Stack Management` page
    b. Select `Saved Object` page
    c. Select the visualizations created using VisBuilder
    d. Click `Export` button that's next to the `Delete` button
    e. Toggle off `Include related objects` option and click `Export`
2. If any visualizations are associated with any dashboards, for each associated dashboard, also export into json files following similar steps
3. Open the exported json files for visualizations, make the corresponding changes and save the changes
    a. If the visualizations are created using VisBuilder in release version 2.3, for each visualization: 
        - locate `type` attribute, and change `wizard` to `visualization-visbuilder`
    b. If the visualizations are created using VisBuilder in release versions earlier than 2.3, for each visualization: 
        - locate `type` attribute, and change `wizard` to `visualization-visbuilder`
        - locate `visualizationState` and delete the index pattern related string
        - add a new attribute name `kibanaSavedObjectMeta` with `indexRefName: kibanaSavedObjectMeta.searchSourceJSON.index`
        - locate attribute named `references` and add a new object with index pattern information
        For example, previous json
           ```ts
           "attributes":{
                "description":"",
                "styleState":"{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":60}}}",
                "title":"wizard 1",
                "version":1,
                "visualizationState":"{\"searchField\":\"\",\"activeVisualization\":{\"name\":\"metric\",\"aggConfigParams\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"params\":{\"field\":\"currency\"},\"schema\":\"metric\"},{\"id\":\"3\",\"enabled\":true,\"type\":\"cardinality\",\"params\":{\"field\":\"customer_full_name.keyword\"},\"schema\":\"metric\"}]},\"indexPattern\":\"ff959d40-b880-11e8-a6d9-e546fe2bba5f\"}"},
                "id":"bfe96550-5ae8-11ed-abb8-dbba5c796c9a",
                "references":[],
                "type":"wizard",
                "updated_at":"2022-11-02T19:58:41.701Z",
                "version":"WzUxLDFd"
            }

            ```
        should change to
            ```ts
            "attributes":{
                "description":"",
                "kibanaSavedObjectMeta":{
                    "searchSourceJSON":"{\"indexRefName\":\"kibanaSavedObjectMeta.searchSourceJSON.index\"}"
                },
                "styleState":"{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":60}}}",
                "title":"wizard 1",
                "version":1,
                "visualizationState":"{\"searchField\":\"\",\"activeVisualization\":{\"name\":\"metric\",\"aggConfigParams\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"params\":{\"field\":\"currency\"},\"schema\":\"metric\"},{\"id\":\"3\",\"enabled\":true,\"type\":\"cardinality\",\"params\":{\"field\":\"customer_full_name.keyword\"},\"schema\":\"metric\"}]}}"},"id":"bfe96550-5ae8-11ed-abb8-dbba5c796c9a",
                "references":[
                    {
                        "id":"ff959d40-b880-11e8-a6d9-e546fe2bba5f",
                        "name":"kibanaSavedObjectMeta.searchSourceJSON.index",
                        "type":"index-pattern"
                    }
                ],
                "type":"visualization-visbuilder",
                "updated_at":"2022-11-02T19:58:41.701Z",
                "version":"WzUxLDFd"
            }
            ```

4. Open the exported json files for dashboards, make the corresponding changes and save the changes
    a. Locate the `references` attribute and the visualizations created by visBuilder, change the type name from `wizard` to `visualization-visbuilder`
        For example, previous json
            ```ts
             ...
            "references":[
                ...
                {
                    "id":"f8283bf0-52fd-11e8-a160-89cc2ad9e8e2","name":"panel_12","type":"visualization"
                },
                {
                    "id":"08884800-52fe-11e8-a160-89cc2ad9e8e2","name":"panel_13","type":"visualization"
                },
                {
                    "id":"bfe96550-5ae8-11ed-abb8-dbba5c796c9a","name":"panel_18","type":"wizard"
                }
            ],
            "type":"dashboard",
            ...
            ```
        should change to
            ```.ts
            ...
            "references":[
                ...
                {
                    "id":"f8283bf0-52fd-11e8-a160-89cc2ad9e8e2","name":"panel_12","type":"visualization"
                },
                {
                    "id":"08884800-52fe-11e8-a160-89cc2ad9e8e2","name":"panel_13","type":"visualization"
                },
                {
                    "id":"bfe96550-5ae8-11ed-abb8-dbba5c796c9a","name":"panel_18","type":"visualization-visbuilder"
                }
            ],
            "type":"dashboard",
            ...
            ```
5. Update Opensearch Dashboards to a later release version, and restart the Dashboards
6. Import and update the visualizations
    a. Navigate to `Stack Management` page
    b. Select `Saved Object` page
    c. Select `Import` option, and select the modified json files for visualizations, click `Import`
    d. Verify and select `Done`
7. Import and update the dashboard (if any):
    a. Navigate to `Stack Management` page
    b. Select `Saved Object` page
    c. Select `Import` option, and select the modified json files for dashboard, click `Import`
    d. Verify and select `Done`