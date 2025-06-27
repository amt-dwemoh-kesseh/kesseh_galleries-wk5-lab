# Kesseh Galleries

A beautiful, production-ready image gallery application with AWS S3 integration, featuring drag & drop uploads, responsive design, and complete CI/CD pipeline.

## Features

- **Beautiful UI**: Modern glass-morphism design with smooth animations
- **Image Upload**: Drag & drop interface with progress indicators
- **Gallery Display**: Responsive grid layout with pagination
- **AWS S3 Integration**: Secure cloud storage for images
- **Image Management**: View, download, and delete images
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Production Ready**: Complete CI/CD pipeline with Docker containerization

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Cloud Storage**: AWS S3
- **Deployment**: Docker, AWS ECR, AWS ECS
- **CI/CD**: GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+
- AWS Account with S3 access
- Docker (for containerization)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kesseh-galleries
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your AWS credentials:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=kesseh-galleries
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:3001` (API).

## Production Deployment

This application is configured for automated deployment to AWS ECS using GitHub Actions.

### Deployment Setup

1. **Create GitHub Repository** and add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Automatic Deployment**: GitHub Actions will automatically:
   - Run tests and linting
   - Build Docker image
   - Push to AWS ECR
   - Deploy to AWS ECS
   - Verify deployment

### Manual Deployment

You can also trigger manual deployments through the GitHub Actions interface.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/images` - Get paginated images
- `POST /api/upload` - Upload image
- `DELETE /api/images/:key` - Delete image
- `GET /api/images/:key/metadata` - Get image metadata

## Project Structure

```
kesseh-galleries/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   └── App.tsx            # Main application component
├── server/                 # Backend source code
│   ├── index.js           # Express server
│   └── healthcheck.js     # Health check script
├── .github/workflows/      # GitHub Actions workflows
│   ├── deploy.yml         # Main deployment workflow
│   └── manual-deploy.yml  # Manual deployment workflow
├── Dockerfile             # Docker configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.