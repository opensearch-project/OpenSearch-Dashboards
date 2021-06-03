#!/bin/bash

# Script to assist with migrating kibana.yml to opensearch_dashboards.yml
#
# Limitations in this script:
# Will only modify the keys in the config and append them to the new config 
# file. This does not touch the values though so if a configuration included
# some path to a file then it could be broken still.

sourcefile="*/kibana.yml"
destfile="*/opensearch_dashboards.yml"

function write_configuration {
  echo "$updated_configuration" >> $destfile
}

function rename_key {
  if [[ "$1" =~ "elasticsearch" ]]
  then
    result="${1/elasticsearch/opensearch}"
  elif [[ "$1" =~ "elastic" ]]
  then
    result="${1/elastic/opensearch}"
  elif [[ "$1" =~ "Elastic" ]]
  then
    result="${1/Elastic/OpenSearch}"
  elif [[ "$1" =~ "kibana" ]]
  then
    result="${1/kibana/opensearchDashboards}"
  elif [[ "$1" =~ "timelion" ]]
  then
    result="${1/timelion/timeline}"
  else
    result="$1"
  fi
  length_of_key=${#1}
  updated_configuration="$result${configuration[@]:$length_of_key}"
  write_configuration updated_configuration
}

echo 'Migrating configurations from kibana.yml to opensearch_dashboards.yml'
echo
echo 'This is based on the Dashboards Core Schema. No guarantees on plugins and if they have their own specific configuration.'
echo 'Hopefully, you know what you are doing!'
echo
echo '[WARNING] Will not migrate values. Please verify values are correct.'
echo
if [ ! -e $destfile ]; then
  echo '# CREATED EMPTY OPENSEARCH_DASHBOARDS.YML' >> 'config/opensearch_dashboards.yml'
fi
echo '# BEGINNING OF CONFIGURATIONS MIGRATED FROM DEV TOOLS' >> $destfile

while read configuration; do
  [[ "$configuration" =~ ^#.*$ ]] && continue
  rename_key $configuration
done < $sourcefile

echo 'Migration complete!'
