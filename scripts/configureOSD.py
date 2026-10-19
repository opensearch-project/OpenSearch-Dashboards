# File: configureOSD.py - OpenSearch Dashboards 2.19.5
import sys
import json
import requests
import time
from os import listdir
from os.path import isfile, join, splitext
from util import Utility
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
UTIL = Utility()
logging, rotating_handler = UTIL.get_logging()
logger = logging.getLogger()
resources = '/usr/local/opensearch-dashboards-2.19.5-linux-x64/resources'
osd_base_url = 'http://localhost:5601/analyze'
def check_opensearch_health():
    try:
        url = 'http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=60s'
        session = requests.Session()
        response = session.get(url)
        if not response.ok:
            response.raise_for_status()
        logger.info('OpenSearch status:\n' + UTIL.pretty_format(response.json()))
        return True
    except Exception as err:
        logger.warning('[configureOSD.py] Caught HTTP exception: {0}'.format(err))
        return False
def check_osd_health():
    """Check if OSD API is ready"""
    try:
        url = f'{osd_base_url}/api/status'
        session = requests.Session()
        retries = Retry(total=10, backoff_factor=0.5, status_forcelist=[500, 503, 502])
        session.mount('http://', HTTPAdapter(max_retries=retries))
        response = session.get(url, timeout=30)
        if not response.ok:
            logger.warning(f'OSD not ready: {response.status_code}')
            return False
        status_data = response.json()
        overall_status = status_data.get('status', {}).get('overall', {}).get('state', 'unknown')
        logger.info(f'OSD status: {overall_status}')
        return overall_status == 'green'
    except Exception as err:
        logger.warning(f'[configureOSD.py] OSD health check failed: {err}')
        return False
def create_index_pattern(pattern_id, pattern_title, time_field='@timestamp'):
    """Create index pattern using OSD saved objects API"""
    try:
        url = f'{osd_base_url}/api/saved_objects/index-pattern/{pattern_id}?overwrite=true'
        data = {
            "attributes": {
                "title": pattern_title,
                "timeFieldName": time_field
            }
        }
        headers = {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
        }
        session = requests.Session()
        retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[500, 503])
        session.mount('http://', HTTPAdapter(max_retries=retries))
        response = session.post(url, headers=headers, json=data, timeout=30)
        if not response.ok:
            logger.warning(f'Failed to create index pattern {pattern_id}: {response.status_code} - {response.text}')
            return False
        logger.info(f'Created index pattern: {pattern_title}')
        return True
    except Exception as err:
        logger.warning(f'[configureOSD.py] Failed to create index pattern {pattern_id}: {err}')
        return False
def put_saved_object_via_api(object_type, object_id, content):
    """Upload saved object using OSD saved objects API"""
    try:
        url = f'{osd_base_url}/api/saved_objects/{object_type}/{object_id}?overwrite=true'
        attributes = content
        if 'attributes' in content:
            attributes = content['attributes']
        elif object_type in content:
            attributes = content[object_type]
        data = {"attributes": attributes}
        if 'references' in content:
            data['references'] = content['references']
        headers = {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
        }
        session = requests.Session()
        retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[500, 503])
        session.mount('http://', HTTPAdapter(max_retries=retries))
        response = session.post(url, headers=headers, json=data, timeout=30)
        if not response.ok:
            logger.warning(f'Failed to create {object_type} {object_id}: {response.status_code} - {response.text}')
            return False, response.text
        logger.info(f'Created {object_type}: {object_id}')
        return True, response.text
    except Exception as err:
        logger.warning(f'[configureOSD.py] Failed to create {object_type} {object_id}: {err}')
        return False, str(err)
def parse_resource_filename(filename):
    name_without_ext = splitext(filename)[0]
    if '__' in name_without_ext:
        object_type, object_id = name_without_ext.split('__', 1)
        return object_type, object_id
    elif ':' in name_without_ext:
        # Legacy colon separator (not valid on Windows, kept for compatibility)
        object_type, object_id = name_without_ext.split(':', 1)
        return object_type, object_id
    else:
        return 'unknown', name_without_ext
def load_assets(path_to_files):
    """Load assets using OSD saved objects API"""
    if not check_osd_health():
        logger.error('OSD is not ready for API calls')
        return False
    logger.info('Creating index patterns...')
    create_index_pattern('361f5c00-b47c-11e9-86a0-cd3d7bf2f81b', 'network_*', 'TimeUpdated')
    create_index_pattern('f655f660-db31-11e9-9a47-f1b6a93b3342', 'events_*', 'TimeUpdated')
    try:
        files = [filename for filename in listdir(path_to_files) if isfile(join(path_to_files, filename))]
        logger.info(f'Found {len(files)} resource files to load')
        success_count = 0
        for file in files:
            full_file_path = join(path_to_files, file)
            object_type, object_id = parse_resource_filename(file)
            if object_type == 'unknown':
                logger.warning(f'Could not determine object type for {file}, skipping')
                continue
            try:
                content = UTIL.read_json_from_file(full_file_path)
                if not content:
                    logger.warning(f'Could not read content from {file}')
                    continue
                created, result = put_saved_object_via_api(object_type, object_id, content)
                if created:
                    success_count += 1
                else:
                    logger.warning(f'Failed to load {object_type}: {object_id}')
            except Exception as err:
                logger.warning(f'Error processing {file}: {err}')
                continue
        logger.info(f'Successfully loaded {success_count}/{len(files)} objects')
        return success_count > 0
    except Exception as err:
        logger.error(f'Error loading assets: {err}')
        return False
def setup_config():
    """Set up OSD configuration"""
    try:
        url = f'{osd_base_url}/api/opensearch-dashboards/settings'
        headers = {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
        }
        settings = {
            'search:queryLanguage': 'lucene',
            'defaultIndex': '361f5c00-b47c-11e9-86a0-cd3d7bf2f81b'
        }
        session = requests.Session()
        retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[500, 503])
        session.mount('http://', HTTPAdapter(max_retries=retries))
        for key, value in settings.items():
            setting_data = {'value': value}
            response = session.post(f'{url}/{key}', headers=headers, json=setting_data, timeout=30)
            if response.ok:
                logger.info(f'Set {key} = {value}')
            else:
                logger.warning(f'Failed to set {key}: {response.status_code} - {response.text}')
    except Exception as err:
        logger.warning(f'[configureOSD.py] Setup config failed: {err}')
def verify_setup():
    try:
        response = requests.get(f'{osd_base_url}/api/saved_objects/_find?type=index-pattern&per_page=100', timeout=30)
        patterns = response.json().get('saved_objects', []) if response.ok else []
        logger.info(f'Verification: Found {len(patterns)} index patterns')
        response = requests.get(f'{osd_base_url}/api/saved_objects/_find?type=dashboard&per_page=100', timeout=30)
        dashboards = response.json().get('saved_objects', []) if response.ok else []
        logger.info(f'Verification: Found {len(dashboards)} dashboards')
        return len(patterns) > 0 and len(dashboards) > 0
    except Exception as err:
        logger.warning(f'Verification failed: {err}')
        return False
def main():
    logger.info('Starting LogRhythm OSD configuration...')
    es_ok = check_opensearch_health()
    if not es_ok:
        logger.error('OpenSearch is not ready')
        sys.exit(1)
    logger.info('Waiting for OSD to be ready...')
    osd_ready = False
    for attempt in range(30):
        if check_osd_health():
            osd_ready = True
            break
        logger.info(f'OSD not ready, attempt {attempt + 1}/30, waiting 10 seconds...')
        time.sleep(10)
    if not osd_ready:
        logger.error('OSD did not become ready in time')
        sys.exit(1)
    logger.info('OSD is ready, proceeding with configuration...')
    setup_config()
    success = load_assets(resources)
    if success:
        if verify_setup():
            logger.info('LogRhythm OSD configuration completed successfully!')
        else:
            logger.warning('Configuration completed but verification failed')
    else:
        logger.error('Failed to load OSD assets')
        sys.exit(1)
if __name__ == '__main__':
    main()
