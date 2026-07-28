<div align="center">

# 🚗 Ride-Share Platform

### A production-grade microservices ride-sharing application  
### built with a full DevOps pipeline from code to cloud.

[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![AWS](https://img.shields.io/badge/AWS-ECR%20%7C%20ECS%20%7C%20EKS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Microservices](#-microservices)
- [Frontend](#-frontend)
- [DevOps Pipeline](#-devops-pipeline)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Kubernetes Deployment](#-kubernetes-deployment)
- [AWS Deployment](#-aws-deployment)
- [Contributing](#-contributing)

---

## 🧭 Overview

**Ride-Share Platform** is a cloud-native, microservices-based ride-sharing application built to demonstrate **real-world DevOps engineering**. It covers the full software lifecycle — from local development to containerized deployment on AWS using Kubernetes, with a CI/CD pipeline powered by Jenkins.

This project is not a sample. It's architected the same way production systems at scale are built:

- **Decoupled services** — each domain owns its data and logic independently
- **Infrastructure as Code** — all cloud resources are provisioned via Terraform, not consoles
- **GitOps-ready** — Kubernetes manifests live in the repo alongside application code
- **Automated delivery** — Jenkins pushes images to ECR and deploys to EKS on every merge

---

## 🏛️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                │
│                      Frontend (port 4173)                              │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTP
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY  :3000                            │
│              Request routing · Auth · Rate limiting                  │
└──────┬──────────────┬──────────────┬───────────────┬────────────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
│   User   │  │   Booking    │  │  Driver  │  │   Payment    │
│ Service  │  │   Service    │  │ Service  │  │   Service    │
└──────────┘  └──────────────┘  └──────────┘  └──────┬───────┘
                                                       │
                                               ┌───────▼────────┐
                                               │  Notification  │
                                               │    Service     │
                                               └────────────────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MySQL & Mongo     │
                    │   (StatefulSets)    │
                    └─────────────────────┘
```

---

## 🔧 Microservices

| Service | Responsibility | Port |
|---------|---------------|------|
| **API Gateway** | Routes all incoming requests, handles authentication and rate limiting | `3000` |
| **Booking Service** | Create, track, cancel, and complete ride bookings | 3001 |
| **Payment Service** | Fare calculation, payment processing, receipts | 3002 |
| **User Service** | Registration, login, profile management, JWT issuance | 5000 |
| **Driver Service** | Driver onboarding, availability, location tracking | 5001 |
| **Notification Service** | Push, email, and SMS notifications for ride events | 5002 |

Each service is independently deployable with its own Docker image, Kubernetes Deployment, and Service manifest.

---

## 🖥️ Frontend

A **Trendy-style** ride-sharing frontend with real-time map integration.

- **Location**: `frontend/`
- **Server**: `node frontend/server.js`
- **Port**: `4173`
- **Maps**: Google Maps API or Apple Maps (configured via `frontend/config.js`)
- **Backend**: Talks to the API Gateway at `http://localhost:3000/api`

### Run the frontend locally

```bash
# 1. Configure your Maps API key
#    Open frontend/config.js and set:
#      googleMapsApiKey: "YOUR_KEY"


# 2. Start the server
node frontend/server.js

# 3. Open in browser
open http://localhost:4173
```

---

## ⚙️ DevOps Pipeline

```
 Developer Push
      │
      ▼
 ┌─────────┐     ┌──────────────────┐     ┌─────────────────┐
 │ Jenkins │────▶│  Build & Test    │────▶│  Docker Build  │
 │  CI/CD  │     │  each service    │     │  per service    │
 └─────────┘     └──────────────────┘     └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │   Push to AWS   │
                                          │      ECR        │
                                          └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │  Deploy to EKS  │
                                          │  (kubectl apply)│
                                          └─────────────────┘
```

| Stage | Tool | What happens |
|-------|------|-------------|
| Source control | Git + GitHub | Feature branch → PR → merge to `main` |
| CI/CD | Jenkins | Triggers on push, builds all services |
| Containerization | Docker | Each service builds to its own image |
| Image registry | AWS ECR | Tagged images pushed per service |
| Container orchestration | Kubernetes on EKS | Rolling deployments, health checks |
| Infrastructure provisioning | Terraform | VPC, EKS cluster, ECR repos, IAM |

---

## 📁 Project Structure

```
ride-share-platform/
│
├── frontend/                    # Trendy-style web frontend
│   ├── config.js                # Maps API key configuration
│   └── server.js                # Static file server (port 4173)
│
├── jenkins/
│   └── Jenkinsfile              # Pipeline definition
│
├── kubernetes/
│   ├── configmaps/              # App config per service
│   ├── deployments/             # Deployment manifests per service
│   ├── services/                # ClusterIP / LoadBalancer definitions
│   ├── statefulsets/            # Databases ( etc.)
│   ├── pvc/                     # Persistent Volume Claims
│   ├── ingress.yaml             # Ingress controller rules
│   ├── namespaces.yaml          # Namespace definitions
│   └── secrets.yaml             # Secret templates (do not commit real values)
│
├── docs/                        # Architecture docs and runbooks
└── scripts/                     # Utility and automation scripts
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Docker | 24+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| kubectl | 1.28+ | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| Terraform | 1.6+ | [terraform.io](https://developer.hashicorp.com/terraform/install) |
| AWS CLI | 2.x | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |

### Local Development

```bash
# Clone the repo
git clone https://github.com/TeamWork28/ride-share-platform.git
cd ride-share-platform

# Start all services with Docker Compose
docker compose up --build

# Or start the frontend only
node frontend/server.js
# → http://localhost:4173
```

---

## ☸️ Kubernetes Deployment

```bash
# 1. Create namespaces
kubectl apply -f kubernetes/namespaces.yaml

# 2. Apply ConfigMaps
kubectl apply -f kubernetes/configmaps/

# 3. Create secrets (edit secrets.yaml with real values first — never commit them)
kubectl apply -f kubernetes/secrets.yaml

# 4. Provision databases (StatefulSets + PVCs)
kubectl apply -f kubernetes/statefulsets/
kubectl apply -f kubernetes/pvc/

# 5. Deploy services
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/

# 6. Configure ingress
kubectl apply -f kubernetes/ingress.yaml

# 7. Verify everything is running
kubectl get pods --all-namespaces
```

---

## ☁️ AWS Deployment

### 1. Provision infrastructure with Terraform

```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

This creates:
- VPC with public/private subnets
- EKS cluster
- ECR repositories (one per service)
- IAM roles and policies

### 2. Authenticate Docker to ECR

```bash
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.<region>.amazonaws.com
```

### 3. Build and push service images

```bash
# Example for the API Gateway
docker build -t ride-share/api-gateway ./api-gateway
docker tag ride-share/api-gateway <ecr-repo-uri>/api-gateway:latest
docker push <ecr-repo-uri>/api-gateway:latest
```

### 4. Deploy to EKS

```bash
aws eks update-kubeconfig --region <region> --name ride-share-cluster
kubectl apply -f kubernetes/
```

---

## 🔐 Secrets Management

> ⚠️ **Never commit real secrets to the repository.**

`kubernetes/secrets.yaml` contains **template placeholders only**. Before applying:

1. Copy the file: `cp kubernetes/secrets.yaml kubernetes/secrets.local.yaml`
2. Fill in real values in `secrets.local.yaml`
3. Apply: `kubectl apply -f kubernetes/secrets.local.yaml`
4. Add `*.local.yaml` to `.gitignore`

For production, use **AWS Secrets Manager** or **Kubernetes External Secrets Operator**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

---

<div align="center">

Built by [TeamWork28](https://github.com/TeamWork28) · Powered by Docker, Kubernetes & AWS

</div>
