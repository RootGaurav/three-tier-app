# Three-Tier App — Full Deploy Guide

## Architecture
```
React (Vite) → Express (Node.js) → PostgreSQL
     ↑                ↑                 ↑
  Docker/nginx    Docker/node      Managed DB
  (free tier)    (free tier)      (free tier)
```

---

## Free Tier Services Used
| Layer     | Local          | Production (free)         |
|-----------|----------------|---------------------------|
| Frontend  | Vite dev server| Railway / Render / Vercel |
| Backend   | Node.js + nodemon | Railway / Render       |
| Database  | Postgres in Docker | Railway Postgres / Neon |
| CI/CD     | —              | Jenkins (self-hosted free)|
| Registry  | local          | Docker Hub (free tier)    |

---

## Step 1 — Run locally

```bash
# Clone and start everything
git clone <your-repo>
cd three-tier-app
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- DB: localhost:5432

---

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/three-tier-app.git
git push -u origin main
```

---

## Step 3 — Set up Docker Hub

1. Sign up at https://hub.docker.com (free)
2. Create two repositories:
   - `YOUR_USER/three-tier-backend`
   - `YOUR_USER/three-tier-frontend`

---

## Step 4 — Deploy free tier (Railway recommended)

### Option A: Railway (easiest)

1. Sign up at https://railway.app (free $5/month credit, no card needed)
2. New Project → Deploy from GitHub repo
3. Railway auto-detects services from your repo
4. Add Postgres: Add Plugin → PostgreSQL
5. Copy the `DATABASE_URL` from Postgres plugin → set as env var in backend service
6. Set env vars for backend:
   ```
   DATABASE_URL=<from railway postgres>
   NODE_ENV=production
   ```
7. Set env vars for frontend:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
8. Railway gives you public URLs for both services

### Option B: Render (alternative)

1. Sign up at https://render.com
2. New → Web Service → Connect GitHub repo → point to `backend/`
3. New → Static Site → point to `frontend/` → build command: `npm run build`
4. New → PostgreSQL (free 90-day tier)
5. Set the same env vars as above

### Option C: Vercel (frontend) + Railway (backend)

- Deploy frontend to Vercel (easiest static hosting)
- Deploy backend + DB to Railway

---

## Step 5 — Set up Jenkins

### Install Jenkins (free, self-hosted)
Jenkins runs on your own machine or a free Oracle Cloud VM.

#### On Ubuntu / Oracle Cloud free tier:
```bash
sudo apt update
sudo apt install -y openjdk-17-jdk docker.io
sudo usermod -aG docker $USER

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update && sudo apt install -y jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Jenkins runs at: http://YOUR_SERVER_IP:8080

#### Jenkins plugins to install:
- Pipeline
- Docker Pipeline
- Git
- Credentials Binding
- Blue Ocean (optional, nicer UI)

---

## Step 6 — Configure Jenkins credentials

Go to: Manage Jenkins → Credentials → System → Global → Add Credentials

Add these (all as "Secret text" or "Username/password"):
| ID                  | Value                          |
|---------------------|--------------------------------|
| `dockerhub-username`| Your Docker Hub username       |
| `dockerhub-password`| Your Docker Hub password/token |
| `railway-token`     | Railway API token              |
| `BACKEND_URL`       | https://your-backend.railway.app |
| `FRONTEND_URL`      | https://your-frontend.railway.app |

---

## Step 7 — Create Jenkins pipeline

1. Jenkins → New Item → Pipeline
2. Name it `three-tier-cicd`
3. Pipeline → Definition: "Pipeline script from SCM"
4. SCM: Git → enter your GitHub repo URL
5. Credentials: add your GitHub token
6. Branch: `*/main`
7. Script Path: `Jenkinsfile`
8. Save

Now every push to `main` triggers the full pipeline:
```
Checkout → Test → Build Docker images → Push to Hub → Deploy → Health check
```

---

## Step 8 — Webhook (auto-trigger on push)

1. In GitHub: repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://YOUR_JENKINS:8080/github-webhook/`
3. Content type: `application/json`
4. Events: Just the push event
5. Save

Now `git push` → GitHub notifies Jenkins → pipeline runs automatically.

---

## Environment variables summary

### Backend
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
PORT=3001
```

### Frontend (build-time)
```
VITE_API_URL=https://your-backend-url.railway.app
```

---

## Full CI/CD flow

```
Developer pushes code to GitHub
        ↓
GitHub webhook triggers Jenkins
        ↓
Jenkins: checkout → npm ci → (run tests)
        ↓
Jenkins: docker build backend image
Jenkins: docker build frontend image
        ↓
Jenkins: docker push to Docker Hub
        ↓
Jenkins: railway up (redeploy)
        ↓
Jenkins: curl /health (verify)
        ↓
Success / Failure notification
```

---

## Useful commands

```bash
# Local dev without Docker
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# Build and run specific container
docker build -t myapp-backend ./backend
docker run -p 3001:3001 -e DATABASE_URL=... myapp-backend

# Check logs in docker compose
docker compose logs -f backend

# Connect to local postgres
docker compose exec db psql -U appuser -d appdb
```
