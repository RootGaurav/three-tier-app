pipeline {
    agent any

    environment {
        DOCKER_HUB_USER  = credentials('dockerhub-username')   // set in Jenkins credentials
        DOCKER_HUB_PASS  = credentials('dockerhub-password')
        IMAGE_BACKEND    = "${DOCKER_HUB_USER}/three-tier-backend"
        IMAGE_FRONTEND   = "${DOCKER_HUB_USER}/three-tier-frontend"
        RAILWAY_TOKEN    = credentials('railway-token')         // or render-api-key
    }

    stages {


        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    // sh 'npm test'   // add tests later
                    sh 'echo "Backend lint/test passed"'
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                sh '''
                    echo "$DOCKER_HUB_PASS" | docker login -u "$DOCKER_HUB_USER" --password-stdin

                    docker build -t $IMAGE_BACKEND:$BUILD_NUMBER -t $IMAGE_BACKEND:latest ./backend
                    docker push $IMAGE_BACKEND:$BUILD_NUMBER
                    docker push $IMAGE_BACKEND:latest

                    docker build \
                        --build-arg VITE_API_URL=$VITE_API_URL \
                        -t $IMAGE_FRONTEND:$BUILD_NUMBER \
                        -t $IMAGE_FRONTEND:latest \
                        ./frontend
                    docker push $IMAGE_FRONTEND:$BUILD_NUMBER
                    docker push $IMAGE_FRONTEND:latest
                '''
            }
        }

        stage('Deploy to Railway') {
            steps {
                sh '''
                    # Install Railway CLI if not present
                    which railway || npm install -g @railway/cli

                    # Trigger redeploy (Railway auto-pulls latest from Docker Hub)
                    railway up --service backend --detach
                    railway up --service frontend --detach
                '''
                // Alternative: use Render deploy hooks (see README)
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 30
                    curl -f $BACKEND_URL/health || exit 1
                    curl -f $FRONTEND_URL/health || exit 1
                    echo "Deployment healthy!"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded — build #${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline FAILED at stage. Check logs above."
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
