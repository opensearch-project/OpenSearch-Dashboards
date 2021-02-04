node {
    label 'website'
    def scmVars = checkout scm
    sh "env"
    def imageName = "test-image:${env.BUILD_ID}"
    def testImage
    stage('Build container image') {
        sh 'ls -l'
        testImage = docker.build imageName
    }
    testImage.inside {
        try {
            stage('bootstrap') {
              sh 'yarn kbn bootstrap'
            }
            stage('unit tests') {
                sh 'yarn test:jest -u --ci --verbose --maxWorkers=5'
            }
            stage('integration tests') {
                sh 'yarn test:jest_integration -u --ci'
                sh 'yarn test:mocha'
            }
        } catch (e) {
            echo 'This will run only if failed'
            currentBuild.result = 'FAILURE'
            // Since we're catching the exception in order to report on it,
            // we need to re-throw it, to ensure that the build is marked as failed
            throw e
        }
    }
}
