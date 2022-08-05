def IMAGE_NAME
def DOCKER_IMAGE
pipeline {
	agent { label 'fork' }
    // Ensure we don't take any other build, this is needed to ensure we build only once.
    options {
      throttleJobProperty(
          categories: ['Website_PR'],
          throttleEnabled: true,
          throttleOption: 'category'
      )
    }
	stages {
    stage("Build") {
      steps {
        script {
          IMAGE_NAME = "website-src-image:${env.BUILD_ID}"
          DOCKER_IMAGE = docker.build(IMAGE_NAME)
          DOCKER_IMAGE.inside {
              stage('bootstrap') {
                  echo "Bootstrap here"
                  sh 'yarn osd bootstrap'
                  sh 'node scripts/build_opensearch_dashboards_platform_plugins --no-examples --workers 10'
              }
          }
        }
      }
    }
    stage('Unit tests') {
      steps {
        script { 
          DOCKER_IMAGE.inside {
              sh 'yarn test:jest -u --ci --verbose' // TODO::Need to remove -u and fix the CI
          }
        }
      }
    }
    stage('Integ tests') {
      steps {
        script {
          DOCKER_IMAGE.inside {
              sh 'yarn test:jest_integration -u --ci --verbose' // TODO::Need to remove -u and fix the CI
              sh 'yarn test:mocha'
          }
        }
      }
    }
		stage("Functional tests") {
      steps {
        functionalDynamicParallelSteps(DOCKER_IMAGE)
      }
		}
	}
}

def functionalDynamicParallelSteps(image){
    ciGroupsMap = [:]
    ciGroups = [
      "ciGroup1",
      "ciGroup2",
      "ciGroup3",
      "ciGroup4",
      "ciGroup5",
      "ciGroup6",
      "ciGroup7",
      "ciGroup8",
      "ciGroup9",
      "ciGroup10",
      "ciGroup11",
      "ciGroup12",
      "ciGroup13",
    ]
    for (int i = 0; i < ciGroups.size(); i++) {
      def currentCiGroup = ciGroups[i];
      def currentStep = i;
      ciGroupsMap["${currentCiGroup}"] = {
        stage("${currentCiGroup}") {
          withEnv([
              "TEST_BROWSER_HEADLESS=1",
              "CI=1",
              "CI_GROUP=${currentCiGroup}",
              "GCS_UPLOAD_PREFIX=fake",
              "TEST_OPENSEARCH_DASHBOARDS_HOST=localhost",
              "TEST_OPENSEARCH_DASHBOARDS_PORT=6610",
              "TEST_OPENSEARCH_TRANSPORT_PORT=9403",
              "TEST_OPENSEARCH_PORT=9400",
              "CI_PARALLEL_PROCESS_NUMBER=${currentStep}",
              "JOB=ci${currentStep}",
              "CACHE_DIR=${currentCiGroup}"
          ]) {
              image.inside {
                  sh "node scripts/functional_tests.js --config test/functional/config.js --include ${currentCiGroup}"
              }
          }
        }
      }
    }
    parallel ciGroupsMap
}
