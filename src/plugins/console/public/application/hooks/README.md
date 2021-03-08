## Notes

* Do not add any code directly to this directory. This code should be moved to the neighbouring `lib` directory to be in line with future OpenSearch UI plugin patterns.

* The `opensearch.send` method uses $.ajax under the hood and needs to be refactored to use the new platform-provided http client.