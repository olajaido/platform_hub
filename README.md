# Infrastructure Provisioning Platform

A self-service platform for developers to provision and manage cloud infrastructure through a simple web interface, backed by Infrastructure as Code automation.

<img src="docs/images/dashboard.png" alt="Dashboard Diagram" width="800">

## Features

- 🚀 **Self-service infrastructure provisioning** - No DevOps expertise required
- 🔐 **Role-based access control** - Define who can provision what
- 📊 **Resource monitoring and management** - Track all your infrastructure
- 🧩 **Modular infrastructure templates** - Easily extend with new resource types
- 🔄 **GitOps workflows** - Infrastructure changes through code
- 📱 **User-friendly interface** - Multi-step guided wizard
- 🔍 **Real-time status tracking** - Monitor deployments as they happen

## Architecture

The platform consists of three main components:

1. **Frontend**: React application with Material UI
2. **Backend**: FastAPI service with JWT authentication
3. **Infrastructure Pipeline**: GitHub Actions workflow that executes Terraform

<img src="docs/images/architecture.png" alt="Architecture Diagram" width="800">



## Technology Stack

### Frontend
- React with TypeScript
- Material UI for components
- React Query for data fetching
- Formik for form handling
- React Router for navigation

### Backend
- FastAPI (Python)
- JWT authentication
- Supabase for database
- GitHub API integration

### Infrastructure
- Terraform for IaC
- GitHub Actions for CI/CD
- AWS as the cloud provider

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Python 3.11+
- AWS Account
- GitHub Account
- Supabase Account

### Setup

#### 1. Clone the repository

```bash
git clone https://github.com/olajaido/platform_hub.git
cd platform_hub
```

#### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your configuration

# Create database tables in Supabase
# Run the SQL commands in docs/schema.sql in your Supabase SQL editor

# Start the backend
uvicorn src.main:app --reload
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start the frontend
npm start
```

#### 4. GitHub Setup

1. Create a GitHub Personal Access Token with `repo` and `workflow` scopes
2. Add the token to your backend `.env` file as `GITHUB_TOKEN`
3. Update the `GITHUB_REPO` in `.env` with your repository name

#### 5. AWS Setup

1. Set up an IAM role for GitHub Actions with the necessary permissions
2. Configure the trust relationship to allow GitHub Actions to assume the role
3. Add the role ARN to your GitHub workflow file

## Usage

### Login

Use the following credentials to log in:
- Username: `admin` or `developer`
- Password: Set up in your Supabase users table

### Requesting Resources

1. Navigate to "Request Resource"
2. Select the resource type and size
3. Fill in the required parameters
4. Review and submit
5. Track deployment status in real-time

### Monitoring Deployments

1. View all deployments on the Dashboard
2. Click "Details" on any deployment to see status, logs, and outputs
3. Filter deployments by type or status

## Deployment

### Backend Deployment

The backend can be deployed to any platform that supports Python:

```bash
# Deploy to Render
render deploy
```

### Frontend Deployment

The frontend can be deployed to Netlify:

```bash
# Build for production
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod
```

### Infrastructure Pipeline Setup

1. Make your Terraform modules reusable and parameterized
2. Set up the GitHub workflow to trigger on interface requests
3. Configure webhooks to report back deployment status

## Project Structure

```
/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Context providers
│   │   └── pages/          # Page components
│   └── public/             # Static assets
├── backend/                # FastAPI backend
│   ├── src/
│   │   ├── auth.py         # Authentication
│   │   ├── github_api.py   # GitHub integration
│   │   ├── main.py         # API endpoints
│   │   ├── supabase.py     # Database access
│   │   └── terraform.py    # Terraform execution
│   └── requirements.txt    # Python dependencies
├── terraform/              # Infrastructure as Code
│   ├── modules/
│   │   ├── ec2_instance/   # EC2 module
│   │   └── s3_bucket/      # S3 module
│   └── environments/       # Environment configs
└── .github/
    └── workflows/
        └── terraform-deploy.yml # Deployment workflow
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Terraform](https://www.terraform.io/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Material UI](https://mui.com/)
- [GitHub Actions](https://github.com/features/actions)
- [Supabase](https://supabase.io/)

---

## Troubleshooting

### Common Issues

#### API Connection Errors
- Verify the `REACT_APP_API_URL` is set correctly in your frontend .env
- Check CORS settings in the backend

#### GitHub Workflow Failures
- Ensure your GitHub token has the correct permissions
- Verify AWS role trust relationship is properly configured

#### Deployment Timeouts
- Check GitHub Actions logs for detailed error messages
- Verify AWS credentials and permissions

For more help, please [open an issue](https://github.com/olajaido/platform_hub/issues/new).