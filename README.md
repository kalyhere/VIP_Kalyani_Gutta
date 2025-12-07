# Virtual Patient Application

A comprehensive medical education platform with React frontend and FastAPI backend.
##As this Application is a module in Main Application of VIP project, I have included the code only for Virtual Patient Application. 

**
## .env file is not included as it holds the API keys for all the tools linked to the application for security reasons. Arizona Simulation and Training Education Center holds the right for the licenses

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
- **Virtual Patient Frontend**: http://localhost:5174
- **Virtual Patient Backend**: http://localhost:3001

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
| **Student** | `student` | `password` | Assigned cases, AIMHEI |

### ✅ Verify Your Setup

After running `npm run dev:build`, verify everything is working:
Hello world
1. **All Services Running**: 
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
   You should see 8 services: `postgres`, `redis`, `backend`, `worker`, `frontend`, `virtual-patient-backend`, `virtual-patient-frontend`, `pgadmin`

2. **Virtual Patient Frontend Accessible**: Visit [http://localhost:5174](http://localhost:5174)
   - Should show Virtual Patient Simulation interface
   - 3D character model should load

3. **Virtual Patient API Working**: Visit [http://localhost:3001](http://localhost:3001)
   - Should show Virtual Patient Backend API status

7. **Sample Data Loaded**: After login as student, you should see:
   - classes in your dashboard
   - Medical cases available for assignment


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
- **Virtual Patient Backend**: Node.js API server for virtual patient simulation
- **Virtual Patient Frontend**: React development server for 3D patient interface
- **pgAdmin**: Database administration tool for viewing and managing PostgreSQL data

### **Dependency Isolation**

**Docker (Recommended)**: When using `npm run dev`, all dependencies are installed **inside Docker containers**, providing complete isolation from your host system. No virtual environments needed!

---

**Happy coding!** 🚀 
