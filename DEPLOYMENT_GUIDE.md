# Complete GitHub Deployment Guide for Kesseh Galleries with RDS Integration

## 🚀 AWS Infrastructure Overview

This application now uses a complete AWS infrastructure with:
- **Custom VPC** with public/private subnets across multiple AZs
- **RDS PostgreSQL** database with Multi-AZ failover
- **ECS Fargate** for containerized application deployment
- **Application Load Balancer** for high availability
- **S3** for image storage
- **Secrets Manager** for database credentials
- **Parameter Store** for configuration

## Step 1: Deploy AWS Infrastructure

### 1.1 Deploy VPC and Database Infrastructure

```bash
# Deploy the VPC and database infrastructure
aws cloudformation create-stack \
  --stack-name kesseh-galleries-vpc \
  --template-body file://aws/vpc-infrastructure.yml \
  --parameters ParameterKey=ApplicationName,ParameterValue=kesseh-galleries \
               ParameterKey=DatabaseUsername,ParameterValue=postgres \
               ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-1
```

### 1.2 Deploy ECS Infrastructure

```bash
# Get outputs from VPC stack
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text --region eu-central-1)

PUBLIC_SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnetIds`].OutputValue' \
  --output text --region eu-central-1)

PRIVATE_SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' \
  --output text --region eu-central-1)

ALB_SG=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBSecurityGroupId`].OutputValue' \
  --output text --region eu-central-1)

ECS_SG=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroupId`].OutputValue' \
  --output text --region eu-central-1)

DB_SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name kesseh-galleries-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text --region eu-central-1)

# Deploy ECS infrastructure
aws cloudformation create-stack \
  --stack-name kesseh-galleries-ecs \
  --template-body file://aws/ecs-infrastructure.yml \
  --parameters ParameterKey=ApplicationName,ParameterValue=kesseh-galleries \
               ParameterKey=VPCId,ParameterValue=$VPC_ID \
               ParameterKey=PublicSubnetIds,ParameterValue="$PUBLIC_SUBNETS" \
               ParameterKey=PrivateSubnetIds,ParameterValue="$PRIVATE_SUBNETS" \
               ParameterKey=ALBSecurityGroupId,ParameterValue=$ALB_SG \
               ParameterKey=ECSSecurityGroupId,ParameterValue=$ECS_SG \
               ParameterKey=DatabaseSecretArn,ParameterValue=$DB_SECRET_ARN \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-1
```

## Step 2: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `kesseh-galleries` (or your preferred name)
3. **Visibility**: Choose Public or Private
4. **Don't initialize** with README, .gitignore, or license (you already have code)
5. **Click "Create repository"**

## Step 3: Add GitHub Secrets

1. **Go to your new repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Click "New repository secret"**
4. **Add these secrets**:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your AWS access key ID

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your AWS secret access key

## Step 4: Initialize Git and Push to GitHub

Open your terminal in the project directory and run:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Kesseh Galleries with AWS ECS deployment"

# 4. Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/kesseh-galleries.git

# 5. Push to GitHub - THIS WILL TRIGGER THE DEPLOYMENT!
git push -u origin main
```

**Note**: If you get an error about the default branch, try:
```bash
git branch -M main
git push -u origin main
```

## Step 5: Monitor Your First Deployment

1. **Go to your GitHub repository**
2. **Click the "Actions" tab**
3. **You should see a workflow running called "Blue-Green Deploy to ECS via CodeDeploy"**
4. **Click on it to watch the progress**

The deployment will:
- ✅ Test your code (lint, build)
- ✅ Build Docker image
- ✅ Push to ECR
- ✅ Update ECS task definition
- ✅ Deploy via CodeDeploy (Blue/Green)
- ✅ Wait for deployment to stabilize

## Step 6: Verify Deployment Success

After the GitHub Action completes successfully:

```bash
# Check your ECS service status
aws ecs describe-services \
  --cluster kesseh-galleries-cluster \
  --services kesseh-galleries-service \
  --region eu-central-1 \
  --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,TaskDefinition:taskDefinition}'

# Get your load balancer URL
aws elbv2 describe-load-balancers \
  --region eu-central-1 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `kesseh-galleries`)].DNSName' \
  --output text
```

## Step 7: Initialize Database Schema

The database schema will be automatically initialized when the application starts. You can also manually run the schema:

```bash
# Connect to your RDS instance and run the schema
psql -h YOUR_RDS_ENDPOINT -U postgres -d kessehgalleries -f database/schema.sql
```

## Step 8: Test Your Application

Visit your ALB URL to test the deployed application. The new features include:
- **Image upload with descriptions**
- **Database-backed image metadata**
- **Search functionality**
- **Editable descriptions**
- **Paginated gallery view**

## Step 9: Future Deployments

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Test your code
2. Build a new Docker image
3. Deploy it via CodeDeploy Blue/Green deployment

## Step 10: Manual Deployment Option

You can also trigger manual blue/green deployments:

1. **Go to Actions → Manual Blue-Green Deploy**
2. **Click "Run workflow"**
3. **Choose deployment configuration and optionally specify an image tag**
4. **Click "Run workflow"**

## Troubleshooting

### If GitHub Actions Fails:

1. **Check the Actions tab** for detailed error logs
2. **Common issues**:
   - AWS credentials not set correctly in GitHub Secrets
   - IAM permissions insufficient
   - Resource names don't match
   - Database connection issues
   - VPC/Security Group misconfigurations

### Required IAM Permissions:

Your AWS user needs these policies:
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `AmazonRDSFullAccess`
- `AmazonVPCFullAccess`
- `IAMFullAccess`
- `AWSCloudFormationFullAccess`
- `AmazonSSMFullAccess`
- `SecretsManagerReadWrite`
- `IAMReadOnlyAccess`

### Database Connection Issues:

If the application can't connect to the database:

1. **Check ECS task logs** in CloudWatch for database connection errors
2. **Verify database credentials** in Secrets Manager
3. **Check security groups** - ECS tasks must be able to reach RDS on port 5432
4. **Verify Parameter Store** values for database endpoint and configuration

## What's New in This Version:

1. **Database Integration**: Image metadata stored in PostgreSQL with Multi-AZ failover
2. **Secure VPC**: Custom VPC with public/private subnets across multiple AZs
3. **Enhanced Features**: Image descriptions, search functionality, metadata management
4. **Blue/Green Deployments**: Zero-downtime deployments via CodeDeploy
5. **Secrets Management**: Database credentials stored securely in Secrets Manager
6. **High Availability**: Multi-AZ database and ECS service across multiple AZs
7. **Scalability**: Auto-scaling ECS service with load balancer

---

**Ready to deploy? Follow the infrastructure setup steps, then push to GitHub to trigger your first blue/green deployment!**