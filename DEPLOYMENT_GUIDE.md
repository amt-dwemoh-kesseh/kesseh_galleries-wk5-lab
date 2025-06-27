# Complete GitHub Deployment Guide for Kesseh Galleries

## 🚀 Your AWS Resources (Already Configured)

- **AWS Account ID**: 515966510180
- **Region**: eu-central-1
- **ECR Repository**: kesseh-galleries
- **ECS Cluster**: kesseh-galleries-cluster
- **ECS Service**: kesseh-galleries-service
- **Task Definition**: kesseh-galleries-task

## Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `kesseh-galleries` (or your preferred name)
3. **Visibility**: Choose Public or Private
4. **Don't initialize** with README, .gitignore, or license (you already have code)
5. **Click "Create repository"**

## Step 2: Add GitHub Secrets

1. **Go to your new repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Click "New repository secret"**
4. **Add these two secrets**:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your AWS access key ID

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your AWS secret access key

## Step 3: Initialize Git and Push to GitHub

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

## Step 4: Monitor Your First Deployment

1. **Go to your GitHub repository**
2. **Click the "Actions" tab**
3. **You should see a workflow running called "Deploy Kesseh Galleries to AWS ECS"**
4. **Click on it to watch the progress**

The deployment will:
- ✅ Test your code (lint, build)
- ✅ Build Docker image
- ✅ Push to ECR: `515966510180.dkr.ecr.eu-central-1.amazonaws.com/kesseh-galleries`
- ✅ Update ECS task definition
- ✅ Deploy to ECS service: `kesseh-galleries-service`
- ✅ Wait for deployment to stabilize

## Step 5: Verify Deployment Success

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

## Step 6: Test Your Application

Visit your ALB URL to test the deployed application. The asset loading issue should now be resolved with the updated Docker configuration.

## Step 7: Future Deployments

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Test your code
2. Build a new Docker image
3. Deploy it to your ECS service

## Manual Deployment Option

You can also trigger manual deployments:

1. **Go to Actions → Manual Deploy to ECS**
2. **Click "Run workflow"**
3. **Choose environment and optionally specify an image tag**
4. **Click "Run workflow"**

## Troubleshooting

### If GitHub Actions Fails:

1. **Check the Actions tab** for detailed error logs
2. **Common issues**:
   - AWS credentials not set correctly in GitHub Secrets
   - IAM permissions insufficient
   - Resource names don't match

### Required IAM Permissions:

Your AWS user needs these policies:
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `IAMReadOnlyAccess`

### If Deployment Succeeds but App Still Doesn't Load:

The updated Dockerfile should fix the asset loading issue. If problems persist:

1. Check ECS task logs in CloudWatch
2. Verify the task is running and healthy
3. Check ALB target group health
4. Test the `/api/health` endpoint directly

## What's Different Now:

1. **Proper asset serving**: The Dockerfile now correctly serves static assets
2. **Automated deployments**: Every push to main triggers a deployment
3. **Proper image tagging**: Each deployment gets a unique tag based on git commit
4. **Health checks**: The workflow waits for deployment stability

---

**Ready to deploy? Follow the steps above and your first push to GitHub will trigger the deployment!**