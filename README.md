# \# Ride-Share Platform

# 

# A microservices-based ride-sharing application built with DevOps best practices.

# 

# \## Project Overview

# This project demonstrates a complete DevOps workflow including:

# \- Microservices architecture

# \- Docker containerization

# \- Kubernetes orchestration

# \- Infrastructure as Code (Terraform)

# \- CI/CD with Jenkins

# \- AWS deployment (ECR, ECS, EKS)

# 

# \## Microservices

# 1\. \*\*API Gateway\*\* - Request routing and authentication

# 2\. \*\*User Service\*\* - User management

# 3\. \*\*Booking Service\*\* - Ride bookings

# 4\. \*\*Driver Service\*\* - Driver management

# 5\. \*\*Payment Service\*\* - Payment processing

# 6\. \*\*Notification Service\*\* - Notifications

# 

# \## Project Structure

# \## Frontend

# A Gen Z-style frontend lives in `frontend/`.

# To run it locally:

# 1. Open `frontend/config.js`
# 2. Add your `googleMapsApiKey` or `appleMapsToken`
# 3. Start the static server:

# ```bash
# node frontend/server.js
# ```

# Then open `http://localhost:4173`

# The frontend talks to the existing API gateway at `http://localhost:3000/api`.

