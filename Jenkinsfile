pipeline {
  agent any

  environment {
    AWS_ACCOUNT_ID = '462397577823'
    AWS_REGION     = 'us-east-1'
    REGISTRY       = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
  }

  stages {

    stage('Cleanup Docker Space') {
      steps {
        sh '''
          echo "Pre-build cleanup..."
          docker system prune -af --volumes || true
        '''
      }
    }

    stage('Checkout') {
      steps {
        checkout scmGit(branches: [[name: '*/master']], extensions: [],
          userRemoteConfigs: [[url: 'https://github.com/shridarchandan/Inventory-Management']])
        echo('Checkout Successful')
      }
    }

    stage('Build') {
      steps {
        script {
          def VERSION = sh(script: "date +'%Y-%m-%d-%H%M'", returnStdout: true).trim()
          env.IMAGE_TAG = "v${VERSION}"
          env.BACKEND_LOCAL  = "inventory-backend:${env.IMAGE_TAG}"
          env.FRONTEND_LOCAL = "inventory-frontend:${env.IMAGE_TAG}"

          sh """
            docker build --no-cache -t ${BACKEND_LOCAL} ./backend
            docker build --no-cache -t ${FRONTEND_LOCAL} ./frontend
          """
        }
      }
    }

    stage('Push to ECR') {
      steps {
        withAWS(credentials: 'aws-ecr-creds', region: "${AWS_REGION}") {
          script {
            def BACKEND_ECR  = "${REGISTRY}/inventory-backend:${env.IMAGE_TAG}"
            def FRONTEND_ECR = "${REGISTRY}/inventory-frontend:${env.IMAGE_TAG}"

            sh """
              aws ecr get-login-password --region ${AWS_REGION} \
                | docker login --username AWS --password-stdin ${REGISTRY}

              docker tag ${BACKEND_LOCAL}  ${BACKEND_ECR}
              docker tag ${FRONTEND_LOCAL} ${FRONTEND_ECR}

              docker push ${BACKEND_ECR}
              docker push ${FRONTEND_ECR}
            """
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker system prune -af --volumes || true'
    }
  }
}
