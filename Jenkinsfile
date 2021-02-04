node {
    label 'website'
    sh "env"
    echo "BRANCH: ${scmVars.GIT_BRANCH}, COMMIT: ${scmVars.GIT_COMMIT}"
    stage('bootstrap') {
        sh 'yarn kbn bootstrap'
    }
    stage('unit tests') {
      sh 'yarn test:jest'
    }
    stage('integration tests') {
      sh 'yarn test:jest_integration'
      sh 'yarn test:mocha'
    }
    stage('build'){
      sh 'yarn build --oss --skip-os-packages'
    }
}
