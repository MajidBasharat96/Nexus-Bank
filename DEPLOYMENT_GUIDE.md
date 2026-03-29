# 🏦 NexusBank — Enterprise Core Banking System
## Complete Deployment Guide

---

## 📦 What's Included

```
nexus-bank/
├── backend/                  # Node.js + TypeScript API
│   ├── src/
│   │   ├── modules/          # 14 banking modules
│   │   │   ├── auth/         # JWT, MFA, RBAC
│   │   │   ├── customers/    # CIF management
│   │   │   ├── accounts/     # Account lifecycle
│   │   │   ├── transactions/ # Real-time engine
│   │   │   ├── loans/        # Full LOS
│   │   │   ├── cards/        # Card management
│   │   │   ├── compliance/   # AML/KYC
│   │   │   ├── fraud/        # AI fraud detection
│   │   │   ├── treasury/     # Liquidity
│   │   │   ├── reports/      # Analytics
│   │   │   ├── admin/        # Back office
│   │   │   ├── branches/     # Branch ops
│   │   │   ├── integrations/ # Raast, NADRA, etc.
│   │   │   └── notifications/
│   │   ├── config/           # DB, Redis, Swagger, Socket.IO
│   │   └── common/           # Auth, error, audit middleware
│   └── Dockerfile
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            # 15 full pages
│   │   ├── components/       # Layout, UI components
│   │   ├── services/         # API client
│   │   └── store/            # Zustand state
│   └── Dockerfile
├── infrastructure/
│   └── kubernetes/           # K8s production manifests
├── docker-compose.yml        # Full stack in one command
└── start.sh                  # One-click startup script
```

---

## 🚀 OPTION 1: Docker Compose (Easiest — Recommended)

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- 4GB+ RAM available

### Steps

```bash
# 1. Clone / extract the project
cd nexus-bank

# 2. Run the start script (auto-configures everything)
chmod +x start.sh
./start.sh

# OR manually:
docker compose up -d --build
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| API Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/health |
| pgAdmin (debug) | http://localhost:5050 |

### Default Credentials
```
Username: admin
Password: Admin@NexusBank123
```

---

## 🌐 OPTION 2: Deploy FREE on Railway (Recommended Free Platform)

**Railway.app** gives you free PostgreSQL + Redis + Node.js hosting.

### Steps

1. **Sign up** at https://railway.app (free tier = $5 credit/month)

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   railway login
   
   # Inside nexus-bank/backend/
   cd backend
   railway init
   railway add --plugin postgresql
   railway add --plugin redis
   railway up
   ```

3. **Set Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-256-bit-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
   (Railway auto-sets DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_URL)

4. **Deploy Frontend to Vercel** (free):
   ```bash
   cd frontend
   # Set VITE_API_URL in .env:
   echo "VITE_API_URL=https://your-railway-backend.up.railway.app/api/v1" > .env.production
   
   npx vercel --prod
   ```

---

## ☁️ OPTION 3: Deploy FREE on Render

**Render.com** — free tier for web services.

### Backend on Render

1. Go to https://render.com → New Web Service
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/main.js`
4. Add PostgreSQL: New → PostgreSQL (free tier)
5. Add Redis: New → Redis (free tier)
6. Set environment variables:
   ```
   NODE_ENV=production
   DB_HOST=<from render postgres>
   DB_PORT=5432
   DB_NAME=nexusbank
   DB_USER=<from render>
   DB_PASSWORD=<from render>
   REDIS_HOST=<from render redis>
   JWT_SECRET=<generate random 64-char string>
   ```

### Frontend on Render (Static Site)
1. New → Static Site
2. Root: `frontend`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

---

## ☁️ OPTION 4: Kubernetes Production Deployment

### Prerequisites
- kubectl configured
- Kubernetes cluster (minikube locally, or GKE/EKS/AKS)

```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/deployment.yaml

# Check status
kubectl get pods -n nexusbank
kubectl get services -n nexusbank

# Get frontend URL (LoadBalancer)
kubectl get ingress -n nexusbank

# View logs
kubectl logs -f deployment/nexusbank-backend -n nexusbank
```

### Free Kubernetes Options
- **Minikube**: Local development
  ```bash
  minikube start --memory=4096
  kubectl apply -f infrastructure/kubernetes/deployment.yaml
  minikube service frontend-service -n nexusbank
  ```
- **Oracle Cloud Free Tier**: 4 OCPUs + 24GB RAM free forever
- **Google Cloud Free Trial**: $300 credit

---

## 🛠️ OPTION 5: Manual Setup (No Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB/Redis credentials

npm install
npm run migrate    # Creates all tables
npm start:dev      # Development
# OR
npm run build && npm start  # Production
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Set: VITE_API_URL=http://localhost:3000/api/v1

npm install
npm run dev        # Development (port 5173)
# OR
npm run build      # Build for production
# Serve dist/ with nginx or any static server
```

---

## 🔐 Security Configuration (Production)

### Change all default passwords in `.env`:
```bash
# Generate secure JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in .env:
JWT_SECRET=<generated_above>
JWT_REFRESH_SECRET=<generate_another>
DB_PASSWORD=<strong_random_password>
REDIS_PASSWORD=<strong_random_password>
```

### SSL/TLS
For production, always use HTTPS. With Railway/Render, SSL is automatic.
For custom domains, use Cloudflare (free SSL) in front of your deployment.

---

## 👥 User Roles & Permissions

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access |
| `admin` | All operations except system config |
| `branch_manager` | Branch operations, customer onboarding |
| `compliance_officer` | AML, KYC, fraud review |
| `loan_officer` | Loan origination and approval |
| `teller` | Deposits, withdrawals, basic ops |
| `customer` | Self-service (future mobile app) |

### Create users via Admin Panel
Login as admin → Admin Panel → Create User

---

## 📊 API Documentation

Once running, visit: `http://localhost:3000/api/docs`

Key endpoints:
```
POST /api/v1/auth/login          - Login
POST /api/v1/customers           - Create customer (CIF)
POST /api/v1/accounts            - Open account
POST /api/v1/transactions/deposit - Cash deposit
POST /api/v1/transactions/transfer - Fund transfer
POST /api/v1/loans               - Loan application
GET  /api/v1/reports/dashboard   - Dashboard stats
GET  /api/v1/fraud/alerts        - Fraud alerts
GET  /api/v1/compliance/alerts   - AML alerts
POST /api/v1/integrations/raast/transfer - Raast payment
POST /api/v1/integrations/nadra/verify   - NADRA KYC
```

---

## 🇵🇰 Pakistan-Specific Features

### Raast Integration
- IBAN verification: `POST /api/v1/integrations/raast/verify-iban`
- Instant transfer: `POST /api/v1/integrations/raast/transfer`

### NADRA KYC
- CNIC verification: `POST /api/v1/integrations/nadra/verify`

### AML Compliance (SBP Rules)
- CTR threshold: PKR 2,500,000
- Auto-flagging of structured transactions
- Suspicious transaction reports

### Islamic Banking
- Set `isIslamic: true` on accounts/loans
- Murabaha/Mudarabah account types supported

---

## 📈 Scaling for Production

### Performance Tuning
```bash
# Increase DB pool in .env:
DB_POOL_MAX=50

# Redis for session caching (already configured)

# For high load, use PM2:
npm install -g pm2
pm2 start dist/main.js -i max  # Cluster mode
```

### Database Optimization
```sql
-- Add indexes for common queries (already included in migrations)
-- For analytics, set up read replicas
-- Consider Supabase (free PostgreSQL with dashboard)
```

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change PORT in .env or docker-compose.yml
PORT=3001
```

**Database connection failed:**
```bash
# Check postgres is running
docker compose ps
docker compose logs postgres
```

**Frontend can't reach API:**
```bash
# Check VITE_API_URL in frontend/.env.local
VITE_API_URL=http://localhost:3000/api/v1
```

**Migration failed:**
```bash
# Check DB credentials in .env
# Try connecting manually:
psql -h localhost -U nexusbank_user -d nexusbank
```

---

## 📞 Support

- API Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health
- Logs: `docker compose logs -f backend`

---

*NexusBank Core Banking System — Enterprise Grade, Production Ready*
