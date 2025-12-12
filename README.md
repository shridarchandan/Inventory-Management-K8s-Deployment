# Inventory Management – 3-Tier App on AWS EKS with Jenkins CI/CD

This project is a production-style deployment of a 3-tier Inventory Management application on AWS, using a Jenkins CI/CD pipeline and Kubernetes (EKS).  
The stack consists of a React frontend, Node.js backend, and PostgreSQL database, all containerized with Docker and deployed to an Amazon EKS cluster via images stored in Amazon ECR.

---

## Architecture

The high-level architecture is:

- Developer pushes code changes to the GitHub repository.  
- A GitHub webhook notifies a Jenkins server running on an EC2 instance.  
- Jenkins pulls the source code, builds Docker images for the React frontend and Node.js backend, pushes them to Amazon ECR, and applies Kubernetes manifests to an Amazon EKS cluster.  
- The EKS cluster exposes the React frontend via a Load Balancer / Ingress, which talks to the Node.js backend, which in turn connects to PostgreSQL.

---

![Alt text](3tier-app-k8s.svg)

## Tech stack

- Frontend: React (containerized)  
- Backend: Node.js (containerized REST API)  
- Database: PostgreSQL (Kubernetes StatefulSet or external RDS, depending on deployment)  
- CI/CD: Jenkins on AWS EC2, GitHub Webhooks  
- Container registry: Amazon Elastic Container Registry (ECR)  
- Orchestrator: Amazon Elastic Kubernetes Service (EKS)  
- Infrastructure helpers: AWS CLI, kubectl, eksctl on EC2 instances

---

## CI/CD pipeline flow

### 1. Code push  
- Developer pushes changes to the Inventory-Management GitHub repository.  
- GitHub Webhook is configured to call the Jenkins `/github-webhook/` endpoint.

### 2. Jenkins job  
The pipeline stages typically include:

- Checkout frontend, backend and Kubernetes manifests.  
- Install dependencies and run tests for React and Node.js.  
- Build Docker images:
  - inventory-frontend  
  - inventory-backend  
- Tag images and log in to Amazon ECR.  
- Push images to respective ECR repositories.

### 3. Push to ECR  
The pipeline pushes both images to:

- `inventory-frontend`  
- `inventory-backend`

### 4. Deploy to EKS  
Jenkins executes:

- `kubectl apply -f k8s/`  
- Updates Deployments with new image tags  
- Performs rollout restarts  
- Frontend is exposed via Load Balancer / Ingress

---

# AWS infrastructure setup 

---

## 1. Create EC2 instances

Create **two t3.medium EC2 instances**:

1. **Jenkins Server**
2. **Deployment Server** (used to create/manage EKS cluster)

---

## 2. Install Jenkins and Docker on the Jenkins Server

### Install Jenkins and Docker  
After installing Docker, give permission to Jenkins user:

```bash
sudo usermod -aG docker jenkins
newgrp docker
```

---

## 3. Install AWS CLI, kubectl, eksctl on both EC2 servers

### Install kubectl
```bash
curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin
kubectl version --short --client
```

### Install AWS CLI
```bash
sudo apt install unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

### Install eksctl
```bash
curl --silent --location \
"https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" \
| tar xz -C /tmp

sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

---

## 4. Configure GitHub webhook

In your GitHub repo:

- Go to **Settings → Webhooks → Add Webhook**  
- Add Jenkins webhook URL:  

```
http://<jenkins-server-public-ip>:8080/github-webhook/
```

---

## 5. Install required Jenkins plugins

Install the following plugins:

- Git Plugin  
- AWS Credentials Plugin  
- Credentials Binding Plugin  
- Docker Pipeline / Docker plugins  

---

## 6. Store credentials in Jenkins

Store:

- AWS credentials  
- Database username/password  

These will be used in the pipeline.

---

## 7. Create IAM Role for Jenkins EC2 (Attach Policies)

Create a role and attach the required policies shown in the screenshot (ECR access, EKS access, EC2, IAM, etc.).

![Jenkins Role](images/inventory%20project%20screenshots/Jenkins%20role.PNG)


Attach this role to the **Jenkins Server EC2 instance**.


---

## 8. Configure Jenkins to use scmGit

In Jenkins job:

- Select **Pipeline**  
- Choose **SCM**  
- Provide GitHub repository URL  

---

## 9. Create ECR repositories

Create **two** repositories:

- `inventory-backend`
- `inventory-frontend`

These will store the Docker images built in Jenkins.

---

## 10. Configure Deployment Server (IAM Role)

On the **Deployment Server**, attach an IAM role that includes the permissions shown in the attached screenshot (EKS admin + EC2/VPC access).

![Deployment Roles](images/inventory%20project%20screenshots/Roles%20for%20deployment.PNG)

---

## 11. Create EKS cluster (from Deployment Server)

Run:

```bash
eksctl create cluster \
    --name cluster-name \
    --region region-name \
    --node-type instance-type \
    --nodes-min 2 \
    --nodes-max 2 \
    --zones <comma-separated-availability-zones>
```

This creates:

- EKS Control Plane  
- Node Group with 2 nodes  

---

## 12. Copy kubeconfig from Deployment Server to Jenkins

On Deployment Server:

```bash
cat ~/.kube/config
```

Copy the output.

### On Jenkins Server:

```bash
cd /var/lib/jenkins
sudo mkdir .kube
sudo vi .kube/config
```

Paste the copied kubeconfig.

---

## 13. Configure kubeconfig for ubuntu user (optional)

On Jenkins Server:

```bash
aws eks update-kubeconfig --region ap-south-1 --name <cluster-name>
```

Check EKS nodes:

```bash
kubectl get nodes
```

---

## 14. After deployment, fetch ALB DNS and update ConfigMap

After first pipeline run:

1. Go to AWS → EC2 → Load Balancers → copy the DNS name  
2. Update `REACT_APP_API_URL` in `k8s/app-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: inventory

data:
  DB_HOST: db
  DB_PORT: "5432"
  DB_NAME: inventory_db
  REACT_APP_API_URL: http://<your-load-balancer-dns>:5000
```

3. Run the Jenkins pipeline again.

### Example:
```
http://a482944cbd6d94306ad2e043f89aabc8-1616021472.us-east-1.elb.amazonaws.com:5000
```

Now the application will be live at the Load Balancer DNS.

![Final Output](images/inventory%20project%20screenshots/final%20op.PNG)

---


## Repository structure

```
/frontend       - React UI
/backend        - Node.js API
/k8s            - Kubernetes manifests
/Jenkinsfile    - Jenkins pipeline definition
/docs           - Documentation and diagrams
```

---

## Future improvements

- Add automated tests and quality checks (lint, unit tests, SonarQube)  
- Use Helm or Kustomize for deployment  
- Add monitoring/logging (Prometheus, Grafana, CloudWatch)  
- Use AWS RDS instead of in-cluster PostgreSQL

