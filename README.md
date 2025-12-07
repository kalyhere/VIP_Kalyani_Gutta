# AIMMS Web Platform - Monorepo

A comprehensive medical education platform with React frontend and FastAPI backend, featuring real-time AIMHEI transcript processing with job queues.

## Quick Start for Students

### Prerequisites
- **Docker Desktop** (includes Docker Compose) - [Download here](https://www.docker.com/products/docker-desktop/)
- **Node.js** (v20 or higher) - [Download here](https://nodejs.org/)
- **Git** - For cloning the repository

### Three-Step Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd aimms-web

# 2. Put the .env file (found at https://github.com/orgs/UA-AIDSET/discussions/23#discussioncomment-14342919) in the **root directory** (same folder as `docker-compose.dev.yml`)

# 3. Start everything with one command  
npm run dev:build
```

That's it! 🎉 The application will be available at:
- **Main Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Virtual Patient Frontend**: http://localhost:5174
- **Virtual Patient Backend**: http://localhost:3001
- **Suture Analysis Backend**: http://localhost:8001
- **pgAdmin**: http://localhost:5050 (Email: `admin@example.com`, Password: `admin`)
- **PostgreSQL Database**: http://localhost:5432 (User: `aimms_user`, Password: `dev`, Database: `aimms_web`)
- **Redis**: http://localhost:6379

### Recommended Student Workflow
```bash
# First time or when dependencies change
npm run dev:build

# Daily development (much faster)
npm run dev

# If something seems off, rebuild
npm run dev:build
```

### 🔐 Security Notes

- **NEVER commit your `.env` file!** (It's already in `.gitignore`)
- **Keep API keys private**: Only share with your development team

### 👥 Demo Accounts (Auto-Created)

Once you run `npm run dev:build`, these test accounts are automatically created:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin` | `password` | Full system access |
| **Faculty** | `faculty` | `password` | Classes, students, assignments |
| **Student** | `student` | `password` | Assigned cases, AIMHEI |

### ✅ Verify Your Setup

After running `npm run dev:build`, verify everything is working:
Hello world
1. **All Services Running**: 
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
   You should see 8 services: `postgres`, `redis`, `backend`, `worker`, `frontend`, `virtual-patient-backend`, `virtual-patient-frontend`, `pgadmin`

2. **Main Frontend Accessible**: Visit [http://localhost:3000](http://localhost:3000)
   - Should show AIMMS login page
   - Login with `faculty` / `password`

3. **Virtual Patient Frontend Accessible**: Visit [http://localhost:5174](http://localhost:5174)
   - Should show Virtual Patient Simulation interface
   - 3D character model should load

4. **Backend API Working**: Visit [http://localhost:8000/docs](http://localhost:8000/docs)
   - Should show FastAPI Swagger documentation

5. **Virtual Patient API Working**: Visit [http://localhost:3001](http://localhost:3001)
   - Should show Virtual Patient Backend API status

6. **Database Admin (pgAdmin)**: Visit [http://localhost:5050](http://localhost:5050)
   - Login with: `admin@example.com` / `admin`
   - Click on "AIMMS Local Database" server
   - When prompted for password, enter: `dev`
   - You can now browse database tables and run SQL queries

7. **Sample Data Loaded**: After login as faculty, you should see:
   - 3 classes in your dashboard
   - Medical cases available for assignment

If any step fails, check the [Troubleshooting](#troubleshooting) section below.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full development environment with Docker Compose (**Recommended**) |
| `npm run dev:build` | Rebuild containers and start development environment |
| `npm run dev:clean` | Stop containers and remove volumes |
| `npm run stop` | Stop all services |
| `npm run logs` | View logs from all services |
| `npm run frontend:dev` | Run main frontend only (requires backend running) |
| `npm run backend:dev` | Run backend only (requires Redis running) |
| `npm run backend:worker` | Run Celery worker only (requires Redis running) |
| `npm run virtual-patient-frontend:dev` | Run virtual patient frontend only |
| `npm run virtual-patient-backend:dev` | Run virtual patient backend only |

## Architecture Overview

This monorepo contains four main packages:

### `packages/frontend/`
- **Technology**: React 18 with TypeScript and Vite
- **Purpose**: Main user interface for students and faculty
- **Port**: 3000
- **Key Features**:
  - Real-time AIMHEI progress tracking via Server-Sent Events
  - Medical case management
  - Student dashboard and assignment tracking
  - Faculty administration tools

### `packages/backend/`
- **Technology**: FastAPI with Python 3.11
- **Purpose**: Main API server and background job processing
- **Port**: 8000
- **Key Features**:
  - RESTful API endpoints
  - AIMHEI transcript processing with Celery
  - Real-time progress updates via Server-Sent Events
  - Redis job queue for timeout-free processing

### `packages/virtual-patient-frontend/`
- **Technology**: React 18 with Vite and Three.js
- **Purpose**: 3D virtual patient simulation interface
- **Port**: 5174
- **Key Features**:
  - 3D character model with React Three Fiber
  - Voice processing with Picovoice Cobra
  - Interactive palpation and examination tools
  - Medical UI components and vitals monitoring

### `packages/virtual-patient-backend/`
- **Technology**: Node.js with Express
- **Purpose**: Virtual patient simulation API and voice processing
- **Port**: 3001
- **Key Features**:
  - OpenAI integration for patient responses
  - ElevenLabs text-to-speech for voice output
  - Palpation and examination endpoints
  - Audio file management and processing

## Development Environment

The development environment uses Docker Compose with these services:

- **PostgreSQL**: Database server for application data
- **Redis**: Job queue and caching
- **Backend**: FastAPI application server (AIMMS main API)
- **Worker**: Celery worker for background processing
- **Frontend**: React development server (AIMMS main UI)
- **Virtual Patient Backend**: Node.js API server for virtual patient simulation
- **Virtual Patient Frontend**: React development server for 3D patient interface
- **pgAdmin**: Database administration tool for viewing and managing PostgreSQL data

### **Dependency Isolation**

**Docker (Recommended)**: When using `npm run dev`, all dependencies are installed **inside Docker containers**, providing complete isolation from your host system. No virtual environments needed!

**Local Fallback**: The `npm run install:all` command can install backend dependencies locally for debugging, but Docker is the preferred approach.

## API Documentation

When running locally, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Production Deployment

For production deployment documentation, see [docs/DATABASE-BACKUP.md](docs/DATABASE-BACKUP.md).

### Quick Reference Commands

**Database Backups:**
```bash
# Create manual backup
ssh aidset "/home/ec2-user/backup-postgres.sh"

# List backups
ssh aidset "ls -lh /home/ec2-user/postgres-backups/"

# View backup logs
ssh aidset "tail -50 /home/ec2-user/postgres-backup.log"

# Download backup
scp aidset:/home/ec2-user/postgres-backups/aimms_postgres_YYYYMMDD_HHMMSS.sql.gz ./
```

**Service Management:**
```bash
# View running containers
ssh aidset "docker ps"

# View service logs
ssh aidset "docker logs aimms-web-backend-1"

# Restart all services
ssh aidset "cd /home/ec2-user/aimms-web && docker-compose -f docker-compose.prod.yml restart"

# Check API health
ssh aidset "curl -s https://aimms.colo-prod-aws.arizona.edu/api/health"
```

**Deployment:**
```bash
# Deploy frontend
bash deploy-frontend.sh

# Deploy backend (pull latest code and rebuild)
ssh aidset "cd /home/ec2-user/aimms-web && git pull && docker-compose -f docker-compose.prod.yml build backend && docker-compose -f docker-compose.prod.yml up -d backend worker"
```

## Troubleshooting

### Common Issues

1. **Missing `.env` file**: 
   - **Error**: `WARNING: The VITE_OPENAI_API_KEY variable is not set`
   - **Solution**: Create `.env` file in root directory using template from [Environment Setup](#environment-setup)

2. **Browser shows "ERR_CONNECTION_REFUSED"**:
   - **Error**: `GET http://localhost:5173/ net::ERR_CONNECTION_REFUSED`
   - **Solution**: Use `npm run dev:build` instead of `npm run dev`, frontend runs on port 3000 in Docker

3. **`docker-compose: command not found`**: 
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) which includes Docker Compose
   - Or try `docker compose` (space, not hyphen) if you have newer Docker
   
4. **OpenAI API errors**:
   - **Error**: `Invalid API key` or AIMHEI processing fails
   - **Solution**: Check your `VITE_OPENAI_API_KEY` in `.env` file is valid

5. **Faculty has no classes**:
   - **Error**: Faculty dashboard shows empty classes
   - **Solution**: Run `docker compose -f docker-compose.dev.yml exec backend python -m backend.db.init_db` to seed sample data

6. **Frontend build fails with package lock errors**:
   - Run `cd packages/frontend && npm install` to regenerate lock file
   - Then try `npm run dev:build` again
   
7. **Database connection errors**: Backend waits for PostgreSQL to be healthy before starting
8. **Node.js version warnings**: Make sure you have Node.js v20+ installed
9. **Port conflicts**: Ensure ports 3000, 5432, 6379, 8000 are available
10. **Docker issues**: Try `npm run dev:clean` then `npm run dev:build`
11. **Permission errors**: Ensure Docker daemon is running

### Logs
```bash
npm run logs
```

### Clean Reset
```bash
npm run dev:clean
npm run dev:build
```

---

**Happy coding!** 🚀 
