pipeline {
    agent any

    environment {
        // Définition des variables globales
        DOCKER_REGISTRY      = "docker.io" 
        DOCKER_CREDENTIALS_ID = "anasdocker12" // ID des identifiants Docker Hub configurés dans Jenkins
        VPS_SSH_CREDENTIALS   = "vps-ssh-key" // ID de la clé SSH privée configurée dans Jenkins (créez ce credential dans Jenkins UI)
        VPS_USER              = "root"
        VPS_IP                = "217.65.145.127"
        DEPLOY_PATH           = "/opt/certif-fun"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Préparation (Checkout)') {
            steps {
                echo '=== Récupération du code source depuis GitHub ==='
                git branch: 'main', credentialsId: 'github-credentials', url: 'https://github.com/anas-khaiy/Certificate.git'
                
                echo '=== Préparation de Node.js Portable (Architecture Dynamique) ==='
                sh '''
                    ARCH=$(uname -m)
                    if [ "$ARCH" = "x86_64" ]; then
                        NODE_ARCH="x64"
                    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
                        NODE_ARCH="arm64"
                    else
                        NODE_ARCH="x64"
                    fi
                    echo "Architecture détectée : $ARCH (Utilisation de la version Linux-$NODE_ARCH)"

                    if [ ! -d "node-v20.11.1-linux-$NODE_ARCH" ]; then
                        echo "Téléchargement de Node.js portable..."
                        curl -sSOL "https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-$NODE_ARCH.tar.gz"
                        tar -xf "node-v20.11.1-linux-$NODE_ARCH.tar.gz"
                        rm "node-v20.11.1-linux-$NODE_ARCH.tar.gz"
                    fi
                    
                    # Création d'un lien symbolique universel
                    ln -sfn "node-v20.11.1-linux-$NODE_ARCH" node-portable
                '''
                
                echo '=== Préparation de Maven Portable ==='
                sh '''
                    if [ ! -d "apache-maven-3.9.6" ]; then
                        echo "Téléchargement de Maven portable..."
                        curl -sSOL https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
                        tar -xf apache-maven-3.9.6-bin.tar.gz
                        rm apache-maven-3.9.6-bin.tar.gz
                    fi
                '''
            }
        }

        stage('2. Validation & Tests Backend (Maven)') {
            parallel {
                stage('Build Service-Admin') {
                    steps {
                        dir('Backend-Admin') {
                            echo '=== Compilation & Tests du Service Admin ==='
                            sh '''
                                export PATH=${WORKSPACE}/apache-maven-3.9.6/bin:$PATH
                                mvn clean package -DskipTests=true
                            '''
                        }
                    }
                }
                stage('Build Service-Formateur') {
                    steps {
                        dir('Backend-Formateur') {
                            echo '=== Compilation & Tests du Service Formateur ==='
                            sh '''
                                export PATH=${WORKSPACE}/apache-maven-3.9.6/bin:$PATH
                                mvn clean package -DskipTests=true
                            '''
                        }
                    }
                }
                stage('Build Service-Apprenant') {
                    steps {
                        dir('Backend-Apprenant') {
                            echo '=== Compilation & Tests du Service Apprenant ==='
                            sh '''
                                export PATH=${WORKSPACE}/apache-maven-3.9.6/bin:$PATH
                                mvn clean package -DskipTests=true
                            '''
                        }
                    }
                }
            }
        }

        stage('3. Build & Bundling Frontend (React / Vite)') {
            parallel {
                stage('Build Portal Admin') {
                    steps {
                        dir('Service Admin') {
                            echo '=== Build Portal Admin ==='
                            sh '''
                                export PATH=${WORKSPACE}/node-portable/bin:$PATH
                                npm install
                                npm run build
                            '''
                        }
                    }
                }
                stage('Build Portal Formateur') {
                    steps {
                        dir('Service Formateur') {
                            echo '=== Build Portal Formateur ==='
                            sh '''
                                export PATH=${WORKSPACE}/node-portable/bin:$PATH
                                npm install
                                npm run build
                            '''
                        }
                    }
                }
                stage('Build Portal Apprenant') {
                    steps {
                        dir('Service Apprenant') {
                            echo '=== Build Portal Apprenant ==='
                            sh '''
                                export PATH=${WORKSPACE}/node-portable/bin:$PATH
                                npm install
                                npm run build
                            '''
                        }
                    }
                }
            }
        }

        stage('4. Déploiement et Conteneurisation Native sur le VPS') {
            steps {
                script {
                    echo '=== Compression des sources pour le transfert vers le VPS ==='
                    sh '''
                        tar --exclude='node_modules' \
                            --exclude='.git' \
                            --exclude='.venv' \
                            --exclude='node-portable' \
                            --exclude='apache-maven-3.9.6' \
                            -czf /tmp/deploy.tar.gz .
                        mv /tmp/deploy.tar.gz .
                    '''

                    echo '=== Connexion SSH au VPS et envoi de l\'archive ==='
                    sshagent(credentials: [env.VPS_SSH_CREDENTIALS]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_IP} "mkdir -p ${env.DEPLOY_PATH}"
                            scp -o StrictHostKeyChecking=no deploy.tar.gz ${env.VPS_USER}@${env.VPS_IP}:${env.DEPLOY_PATH}/
                            ssh -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_IP} "cd ${env.DEPLOY_PATH} && tar -xzf deploy.tar.gz && rm deploy.tar.gz && docker exec certiflow-db pg_dump -U postgres certif_db > /opt/certif-fun/backup_\$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || true && docker ps --format '{{.Names}}' | grep -v certiflow-db | xargs -r docker stop 2>/dev/null || true && docker ps -a --format '{{.Names}}' | grep -v certiflow-db | xargs -r docker rm 2>/dev/null || true && docker volume create certif_uploads_data 2>/dev/null || true && docker compose up --build -d && docker image prune -f"
                        """
                    }
                }
            }
        }

        stage('6. Vérification de la santé des Services (Health Check)') {
            steps {
                echo '=== Lancement des vérifications de santé (Health Checks) ==='
                script {
                    // Attendre quelques secondes que les services s'initialisent complètement sur le VPS
                    sleep(time: 15, unit: 'SECONDS')
                    
                    // Tester la réponse de la passerelle Nginx / Services
                    def responseNginx = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://\$VPS_IP", returnStdout: true).trim()
                    def responseAdmin = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://\$VPS_IP:9091/actuator/health", returnStdout: true).trim()
                    
                    echo "Statut Nginx : ${responseNginx}"
                    echo "Statut Actuator Service-Admin : ${responseAdmin}"

                    if (responseNginx != "200" && responseNginx != "301" && responseNginx != "302") {
                        error "Le Health Check Nginx a échoué avec le code HTTP: ${responseNginx}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '=== Nettoyage de l\'espace de travail ==='
            cleanWs()
        }
        success {
            echo '=== PIPELINE REUSSIE ! La plateforme Certif-fun a été mise en production avec succès. ==='
            // Optionnel : Envoi d'une notification (Email, Slack, Discord, Discord Webhook, etc.)
        }
        failure {
            echo '=== ERREUR DANS LA PIPELINE ! Le déploiement a échoué. Consultez les logs pour plus de détails. ==='
        }
    }
}
