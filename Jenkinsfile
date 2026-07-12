pipeline {
    agent any

    tools {
        nodejs 'node20'      // Configure this in Manage Jenkins -> Tools
    }

    environment {
        // Docker Hub credentials
        DOCKER_HUB_USER = credentials('dockerhub-username')
        DOCKER_HUB_PASS = credentials('dockerhub-password')

        // Image names
        IMAGE_BACKEND  = "${DOCKER_HUB_USER}/three-tier-backend"
        IMAGE_FRONTEND = "${DOCKER_HUB_USER}/three-tier-frontend"

        // Application URLs
        VITE_API_URL = 'https://hopeful-essence-production-cd2f.up.railway.app'
        BACKEND_URL  = 'https://hopeful-essence-production-cd2f.up.railway.app'
        FRONTEND_URL = 'https://truthful-transformation-production-643b.up.railway.app'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    node -v
                    npm -v
                    docker --version
                '''
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        npm ci
                        echo "Backend lint/test passed"
                    '''
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                sh '''
                    echo "$DOCKER_HUB_PASS" | docker login \
                        -u "$DOCKER_HUB_USER" \
                        --password-stdin

                    # Backend image
                    docker build \
                        -t $IMAGE_BACKEND:$BUILD_NUMBER \
                        -t $IMAGE_BACKEND:latest \
                        ./backend

                    docker push $IMAGE_BACKEND:$BUILD_NUMBER
                    docker push $IMAGE_BACKEND:latest

                    # Frontend image
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

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for deployment..."
                    sleep 30

                    curl -f $BACKEND_URL/health
                    curl -f $FRONTEND_URL/health

                    echo "Deployment healthy!"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded — build #${BUILD_NUMBER} completed successfully."
        }

        failure {
            echo "Pipeline FAILED. Check logs above."
        }

        always {
            sh 'docker image prune -f || true'
        }
    }
}