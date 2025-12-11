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
        checkout scmGit(
          branches: [[name: '*/master']],
          extensions: [],
          userRemoteConfigs: [[url: 'https://github.com/shridarchandan/Inventory-Management']]
        )
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
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                          credentialsId: 'aws-ecr-creds']]) {
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
   stage('Deploy to EKS') {
      steps {
        withCredentials([
          string(credentialsId: 'DB_USER_CRED',      variable: 'DB_USER'),
          string(credentialsId: 'DB_PASSWORD_CRED', variable: 'DB_PASSWORD')
        ]) {
          script {
            // IMAGE_TAG already set in Build stage, reuse it here
            sh """
              # 0) Ensure kubeconfig points to your cluster (if not already done globally)
              # aws eks update-kubeconfig --name your-cluster --region ${AWS_REGION}

              # 1) Create / update Secret from Jenkins credentials
              kubectl create secret generic db-secret \\
                -n inventory \\
                --from-literal=DB_USER=${DB_USER} \\
                --from-literal=DB_PASSWORD=${DB_PASSWORD} \\
                --dry-run=client -o yaml | kubectl apply -f -

              # 2) Apply non-sensitive manifests from Git
              kubectl apply -f k8s/app-config.yaml -n inventory
              kubectl apply -f k8s/db.yaml         -n inventory
              kubectl apply -f k8s/backend.yaml    -n inventory
              kubectl apply -f k8s/frontend.yaml   -n inventory

              # 3) Update images in Deployments to this build's tag (rolling update)
              kubectl set image deployment/backend-deployment  backend=${REGISTRY}/inventory-backend:${IMAGE_TAG}   -n inventory
              kubectl set image deployment/frontend-deployment frontend=${REGISTRY}/inventory-frontend:${IMAGE_TAG} -n inventory

              # 4) Wait for rollouts to finish
              kubectl rollout status deployment/backend-deployment  -n inventory
              kubectl rollout status deployment/frontend-deployment -n inventory
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
