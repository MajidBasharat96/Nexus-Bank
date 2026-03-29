<div align="center">

# 🏦 NexusBank
### Enterprise Core Banking System

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A production-ready, multi-tenant core banking platform built for modern financial institutions.**  
Handles everything from customer onboarding and real-time payments to AI-powered fraud detection, AML compliance, and full loan lifecycle management.

[Quick Start](#-quick-start) · [Features](#-features) · [Architecture](#-architecture) · [API Docs](#-api-documentation) · [Deploy Free](#-free-deployment-guide) · [Screenshots](#-screenshots)

---

![NexusBank Dashboard](https://img.shields.io/badge/Dashboard-Dark%20Enterprise%20UI-4361ee?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Banking Modules](#-banking-modules)
- [User Roles & RBAC](#-user-roles--rbac)
- [Pakistan-Specific Features](#-pakistan-specific-features)
- [Free Deployment Guide](#-free-deployment-guide)
- [Kubernetes Production](#-kubernetes-production)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🌟 Overview

NexusBank is a **full-stack, enterprise-grade core banking system** designed to serve as the digital backbone of a financial institution. It is built with a microservices-inspired modular architecture, multi-tenancy support, and real-time capabilities.

### What makes it enterprise-grade?

| Capability | Details |
|---|---|
| **Multi-tenancy** | Full tenant isolation — one deployment, many banks |
| **Real-time** | Socket.IO for live transaction feeds and alerts |
| **Compliance-first** | Built-in AML, KYC, CTR reporting (SBP-compliant) |
| **AI Fraud Detection** | Multi-factor risk scoring on every transaction |
| **Full Audit Trail** | Immutable logs for every user action |
| **Scalable** | Kubernetes-ready with Horizontal Pod Autoscaler |
| **Secure** | JWT + MFA, bcrypt, helmet, rate limiting, RBAC |
| **Pakistan-ready** | Raast, NADRA, Credit Bureau integrations |

---

## ✨ Features

### 👤 Customer Management (CIF)
- Individual & corporate customer onboarding
- Digital KYC workflow (CNIC/passport, document upload)
- Customer profiling — risk category, income, segment
- Multi-account linking, joint accounts, nominees
- Full customer lifecycle tracking with audit history

### 🏦 Account Management
- **Account Types**: Savings, Current, Fixed Deposit, Forex, Islamic
- Real-time balance & available balance tracking
- Minimum balance enforcement, overdraft linking
- Dormancy tracking & reactivation
- Account statements (real-time + date-range)
- Interest / profit calculation engine

### 💸 Transaction Processing Engine
- Real-time deposits, withdrawals, fund transfers
- **Payment Types**: Internal, IBFT, Raast, RTGS
- Standing instructions & bulk disbursement
- Full transaction reversal with reason tracking
- Daily limit enforcement per account
- Multi-currency transaction support
- Fee & tax calculation engine

### 📊 Loan & Credit Management
- **Loan Types**: Personal, Home, Auto, SME, Credit Card
- Full origination → approval → disbursement → repayment lifecycle
- Automated EMI calculation & amortization schedule generation
- Collateral management, LTV ratio tracking
- Loan portfolio dashboard with NPL monitoring
- Islamic financing support (Murabaha/Mudarabah)
- Restructuring & write-off support

### 💳 Cards & Digital Payments
- Debit, credit & virtual card issuance
- Card activation, blocking, unblocking
- Per-card transaction limits
- Visa / Mastercard / UnionPay scheme support
- Apple Pay / Google Pay token fields (ready for integration)

### 🛡️ AI-Powered Fraud Detection
- **7-factor real-time risk scoring** on every transaction:
  - Velocity checks (transaction frequency anomaly)
  - Amount anomaly detection vs. historical average
  - Time-of-day anomaly (unusual hours)
  - Geographic anomaly detection
  - AML threshold proximity alerts
  - Transaction structuring detection
  - High-risk beneficiary flagging
- Automated fraud alert creation and escalation
- Compliance officer review workflow (clear / confirm)

### ⚖️ Compliance & AML
- Anti-Money Laundering (AML) monitoring
- KYC verification workflow with status tracking
- Suspicious Transaction Reports (STR)
- Currency Transaction Reports (CTR) — PKR 2.5M threshold
- PEP (Politically Exposed Person) flagging
- FATCA / CRS reporting fields
- Full regulatory audit readiness

### 📈 Reports & Analytics
- Executive dashboard with live KPIs
- 30-day transaction volume charts by type
- Customer growth analytics
- Loan portfolio health metrics
- Fraud & compliance summary reports
- Custom date-range filtering

### 🔧 Admin Panel & Back Office
- User management with role assignment
- Real-time system health monitoring (uptime, memory)
- Full immutable audit log (all user actions, IPs, timestamps)
- Branch management (add/view all locations)
- Product configuration framework

### 🌐 Integration Layer
- **Raast** — Pakistan instant payment system (IBAN verification + transfers)
- **NADRA** — National ID (CNIC) verification
- **Credit Bureau** — Credit score & loan history lookup
- Webhook-ready architecture for third-party fintech
- RESTful API with Swagger/OpenAPI documentation
- Socket.IO for real-time event streaming

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20** + **TypeScript 5** | Runtime & type safety |
| **Express.js** | HTTP framework |
| **PostgreSQL 16** | Primary relational database |
| **Redis 7** | Session cache, token blacklist, rate limiting |
| **Socket.IO** | Real-time bidirectional events |
| **JWT** + **Speakeasy** | Authentication & TOTP MFA |
| **Winston** | Structured rotating log files |
| **Swagger/OpenAPI** | Auto-generated API documentation |
| **Bull** | Background job queues |
| **Bcrypt** | Password hashing |
| **Helmet** + **CORS** | Security headers |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **TypeScript** | Type safety |
| **Tailwind CSS 3** | Utility-first styling |
| **Recharts** | Financial charts & graphs |
| **Zustand** | Lightweight global state |
| **React Router 6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **React Hot Toast** | Notification system |
| **Lucide React** | Icon library |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** + **Docker Compose** | Containerization & local stack |
| **Kubernetes** | Production orchestration |
| **Nginx** | Reverse proxy & static file serving |
| **GitHub Actions** | CI/CD pipeline |

---

## 📁 Project Structure

```
nexus-bank/
│
├── 📂 backend/                          # Node.js + TypeScript API
│   ├── src/
│   │   ├── main.ts                      # Application entry point
│   │   ├── config/
│   │   │   ├── app.config.ts            # Central configuration
│   │   │   ├── database.config.ts       # PostgreSQL + migrations
│   │   │   ├── redis.config.ts          # Redis client
│   │   │   ├── logger.config.ts         # Winston logger
│   │   │   ├── socket.config.ts         # Socket.IO handlers
│   │   │   └── swagger.config.ts        # API documentation
│   │   ├── modules/
│   │   │   ├── auth/                    # Login, JWT, MFA, password reset
│   │   │   ├── customers/               # CIF management
│   │   │   ├── accounts/                # Account lifecycle
│   │   │   ├── transactions/            # Core transaction engine
│   │   │   ├── loans/                   # Full LOS
│   │   │   ├── cards/                   # Card issuance & management
│   │   │   ├── compliance/              # AML, KYC, reporting
│   │   │   ├── fraud/                   # AI risk scoring
│   │   │   ├── treasury/                # Liquidity & cash flow
│   │   │   ├── reports/                 # Analytics & dashboards
│   │   │   ├── admin/                   # Back office, audit logs
│   │   │   ├── branches/                # Branch management
│   │   │   ├── integrations/            # Raast, NADRA, Credit Bureau
│   │   │   └── notifications/           # Email, SMS, push
│   │   ├── common/
│   │   │   └── middleware/
│   │   │       ├── auth.middleware.ts    # JWT verification + RBAC
│   │   │       ├── audit.middleware.ts   # Immutable action logging
│   │   │       ├── tenant.middleware.ts  # Multi-tenancy isolation
│   │   │       └── error.middleware.ts   # Global error handler
│   │   └── database/
│   │       └── seed.ts                  # Demo data seeder
│   ├── .env.example                     # Environment template
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── 📂 frontend/                         # React + Vite + Tailwind
│   ├── src/
│   │   ├── main.tsx                     # React entry point
│   │   ├── App.tsx                      # Router & app shell
│   │   ├── index.css                    # Global styles
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx            # Authentication
│   │   │   ├── DashboardPage.tsx        # KPI dashboard + charts
│   │   │   ├── CustomersPage.tsx        # Customer list & search
│   │   │   ├── CustomerDetailPage.tsx   # Full CIF profile
│   │   │   ├── AccountsPage.tsx         # Account management
│   │   │   ├── TransactionsPage.tsx     # Transaction ledger
│   │   │   ├── TransferPage.tsx         # Fund transfer wizard
│   │   │   ├── LoansPage.tsx            # Loan origination & tracking
│   │   │   ├── CardsPage.tsx            # Card management
│   │   │   ├── CompliancePage.tsx       # AML alerts & reports
│   │   │   ├── FraudPage.tsx            # Fraud alerts & review
│   │   │   ├── TreasuryPage.tsx         # Liquidity dashboard
│   │   │   ├── ReportsPage.tsx          # Analytics & charts
│   │   │   ├── BranchesPage.tsx         # Branch network
│   │   │   ├── IntegrationsPage.tsx     # External system testing
│   │   │   └── AdminPage.tsx            # User management & audit
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppLayout.tsx        # Sidebar + header shell
│   │   ├── services/
│   │   │   └── api.ts                   # Full API client (all endpoints)
│   │   └── store/
│   │       └── auth.store.ts            # Zustand auth state
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── 📂 infrastructure/
│   ├── kubernetes/
│   │   └── deployment.yaml              # Full K8s manifests + HPA
│   └── postgres/
│       └── init.sql                     # DB initialization
│
├── 📂 .github/
│   └── workflows/
│       └── ci-cd.yml                    # GitHub Actions pipeline
│
├── docker-compose.yml                   # Full stack orchestration
├── start.sh                             # One-click startup script
├── package.json                         # Monorepo scripts
├── DEPLOYMENT_GUIDE.md                  # Detailed deploy instructions
└── README.md                            # This file
```

---

## ⚡ Quick Start

### Option A — Docker (Recommended, Zero Config)

> Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux)

```bash
# 1. Extract the project
unzip nexusbank-enterprise-core-banking.zip
cd nexus-bank

# 2. Start everything with one command
chmod +x start.sh
./start.sh
```

That's it. The script will:
- Build backend & frontend Docker images
- Start PostgreSQL, Redis, API, and Nginx
- Run database migrations automatically
- Seed default admin user

**Access Points:**

| Service | URL |
|---|---|
| 🖥️ Frontend (UI) | http://localhost |
| ⚙️ Backend API | http://localhost:3000 |
| 📖 API Docs | http://localhost:3000/api/docs |
| ❤️ Health Check | http://localhost:3000/health |

**Default Login:**
```
Username:  admin
Password:  Admin@NexusBank123
```

---

### Option B — Manual (Without Docker)

**Prerequisites:** Node.js 20+, PostgreSQL 16+, Redis 7+

```bash
# --- BACKEND ---
cd backend
cp .env.example .env
# Edit .env: set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST

npm install
npm run start:dev          # Development mode (hot reload)
# App runs on http://localhost:3000

# --- FRONTEND (new terminal) ---
cd frontend
cp .env.example .env.local
# Set: VITE_API_URL=http://localhost:3000/api/v1

npm install
npm run dev                # Development mode
# App runs on http://localhost:5173
```

---

### Useful Docker Commands

```bash
# View running services
docker compose ps

# Stream backend logs
docker compose logs -f backend

# Stop everything
docker compose down

# Full reset (wipe data + rebuild)
docker compose down -v && docker compose up -d --build

# Seed demo data
docker compose exec backend npx ts-node src/database/seed.ts
```

---

## 🔧 Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# ─── Application ──────────────────────────────────────
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173

# ─── Database (PostgreSQL) ────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexusbank
DB_USER=nexusbank_user
DB_PASSWORD=your_strong_password

# ─── Cache (Redis) ────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# ─── Authentication (CHANGE THESE IN PRODUCTION!) ─────
JWT_SECRET=generate_a_64_char_random_string_here
JWT_REFRESH_SECRET=generate_another_64_char_string_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── Email (SMTP) ─────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# ─── Pakistan Integrations ────────────────────────────
RAAST_API_URL=https://api.raast.com.pk
RAAST_INSTITUTION_ID=your_institution_id
NADRA_API_KEY=your_nadra_key
CREDIT_BUREAU_KEY=your_bureau_key

# ─── Banking Rules ────────────────────────────────────
DAILY_TRANSFER_LIMIT=5000000
SINGLE_TRANSACTION_LIMIT=1000000
AML_THRESHOLD_AMOUNT=500000
CTR_THRESHOLD=2500000
IBFT_FEE=25
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📖 API Documentation

Interactive Swagger UI is available at **http://localhost:3000/api/docs** when the server is running.

### Core Endpoints

#### Authentication
```http
POST   /api/v1/auth/login              # Login → returns JWT
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Revoke tokens
POST   /api/v1/auth/mfa/setup          # Generate MFA QR code
POST   /api/v1/auth/mfa/enable         # Activate MFA
POST   /api/v1/auth/forgot-password    # Send reset email
POST   /api/v1/auth/reset-password     # Set new password
```

#### Customers (CIF)
```http
GET    /api/v1/customers               # List with pagination & filters
POST   /api/v1/customers               # Create new customer
GET    /api/v1/customers/:id           # Full profile + accounts
PUT    /api/v1/customers/:id           # Update customer info
PATCH  /api/v1/customers/:id/kyc       # Update KYC status
GET    /api/v1/customers/:id/transactions  # Transaction history
GET    /api/v1/customers/search?q=...  # Quick search
```

#### Accounts
```http
GET    /api/v1/accounts                # List accounts
POST   /api/v1/accounts                # Open new account
GET    /api/v1/accounts/:id            # Account detail
GET    /api/v1/accounts/:id/balance    # Live balance
PATCH  /api/v1/accounts/:id/status     # Activate/freeze/close
GET    /api/v1/accounts/dashboard      # Aggregate stats
```

#### Transactions
```http
GET    /api/v1/transactions            # Ledger with filters
POST   /api/v1/transactions/deposit    # Cash deposit
POST   /api/v1/transactions/withdraw   # Cash withdrawal
POST   /api/v1/transactions/transfer   # Fund transfer (IBFT/Raast)
POST   /api/v1/transactions/:id/reverse   # Reverse transaction
GET    /api/v1/transactions/stats      # Today's summary
```

#### Loans
```http
GET    /api/v1/loans                   # Loan portfolio
POST   /api/v1/loans                   # New application
GET    /api/v1/loans/:id               # Loan detail + schedule
POST   /api/v1/loans/:id/approve       # Approve / reject
POST   /api/v1/loans/:id/repay         # Record repayment
GET    /api/v1/loans/stats             # Portfolio stats
```

#### Integrations (Pakistan)
```http
POST   /api/v1/integrations/raast/transfer       # Raast instant payment
POST   /api/v1/integrations/raast/verify-iban    # Validate IBAN
POST   /api/v1/integrations/nadra/verify         # CNIC verification
GET    /api/v1/integrations/credit-bureau/:cnic  # Credit score
```

### Authentication Header
```http
Authorization: Bearer <your_access_token>
X-Tenant-ID: default
```

---

## 🏛 Banking Modules

### Transaction Flow (Deposit)
```
Client Request
     │
     ▼
Rate Limiter → Auth Guard → Tenant Middleware → Audit Logger
     │
     ▼
TransactionController.deposit()
     │
     ▼
TransactionService.deposit()
     │
     ├─→ Validate amount limits (single txn limit)
     ├─→ BEGIN database transaction
     ├─→ SELECT account FOR UPDATE (row lock)
     ├─→ UPDATE account balance
     ├─→ INSERT transaction record
     ├─→ COMMIT
     ├─→ Emit Socket.IO event → live UI update
     └─→ Queue notification (email/SMS)
```

### Fraud Scoring Pipeline
```
Every transaction runs through:

1. Velocity Check      → >5 txns/hour         = +10 pts
2. Amount Anomaly      → >5x average amount   = +20 pts
3. Time Anomaly        → 1 AM – 5 AM          = +15 pts
4. Geographic Anomaly  → New IP region        = +20 pts
5. AML Threshold       → Near PKR 2.5M        = +20 pts
6. Structuring         → Multiple near-limit  = +45 pts
7. Beneficiary Risk    → Account has alerts   = +15 pts

Score 0–49   → ✅ ALLOW (proceed)
Score 50–79  → ⚠️  REVIEW (flag for officer)
Score 80–100 → 🚫 BLOCK (auto-block transaction)
```

### Database Schema (Key Tables)
```sql
tenants         -- Multi-tenancy root
users           -- System users (staff + customers)
customers       -- CIF (Customer Information File)
accounts        -- All deposit accounts
transactions    -- Full transaction ledger
loans           -- Loan portfolio
loan_repayments -- EMI payment tracking
cards           -- Card records (encrypted)
compliance_alerts  -- AML/KYC alerts
fraud_alerts    -- AI-generated fraud flags
audit_logs      -- Immutable action trail
notifications   -- Email/SMS/push queue
branches        -- Branch network
products        -- Account/loan product catalog
```

---

## 👥 User Roles & RBAC

| Role | Description | Key Permissions |
|---|---|---|
| `super_admin` | Full system access | Everything |
| `admin` | Bank administrator | Users, config, all operations |
| `branch_manager` | Branch operations | Customer onboarding, accounts |
| `compliance_officer` | Regulatory role | AML review, KYC, fraud alerts |
| `loan_officer` | Lending department | Loan origination & approval |
| `teller` | Counter staff | Deposits, withdrawals, basic ops |
| `customer` | Self-service (future mobile) | Own accounts only |

### Create Users via Admin Panel
`Admin Panel → Create User → Assign Role`

Or via API:
```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"john.teller","email":"john@bank.com","password":"Secure@Pass123","role":"teller"}'
```

---

## 🇵🇰 Pakistan-Specific Features

### Raast Integration
Pakistan's State Bank (SBP) real-time payment system:
```bash
# Verify recipient IBAN
POST /api/v1/integrations/raast/verify-iban
{"iban": "PK36EXMP0123456789012345"}

# Send instant payment
POST /api/v1/integrations/raast/transfer
{"fromAccount": "...", "toIBAN": "PK36...", "amount": 50000, "purpose": "Salary"}
```

### NADRA KYC
Real-time CNIC verification against national database:
```bash
POST /api/v1/integrations/nadra/verify
{"cnic": "42201-1234567-1", "name": "Ahmed Khan", "dob": "1990-01-15"}
```

### Credit Bureau
Check customer creditworthiness before loan approval:
```bash
GET /api/v1/integrations/credit-bureau/42201-1234567-1
# Returns: credit score, active loans, repayment history, defaults
```

### SBP Compliance Rules
- **CTR (Currency Transaction Report)**: Auto-flagged for transactions ≥ PKR 2,500,000
- **STR (Suspicious Transaction Report)**: Automated flagging via fraud engine
- **AML Monitoring**: Continuous pattern analysis on all accounts
- **Islamic Banking**: Full Murabaha/Mudarabah account type support

---

## 🆓 Free Deployment Guide

### 🥇 Railway.app (Easiest — Recommended)
Free tier includes PostgreSQL + Redis + Node.js hosting.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli
railway login

# 2. Inside /backend directory
cd backend
railway init
railway add --plugin postgresql
railway add --plugin redis
railway up

# 3. Railway auto-sets DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
# Add manually in dashboard:
JWT_SECRET=<your_64_char_secret>
JWT_REFRESH_SECRET=<another_64_char_secret>
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

**Deploy frontend to Vercel (free):**
```bash
cd frontend
echo "VITE_API_URL=https://your-backend.up.railway.app/api/v1" > .env.production
npx vercel --prod
```

---

### 🥈 Render.com

```
1. New Web Service → connect GitHub repo
   Root: backend | Build: npm install | Start: node dist/main.js

2. New PostgreSQL (free tier) → copy connection string

3. New Redis (free tier) → copy connection string

4. Set env vars from .env.example in Render dashboard

5. New Static Site → frontend/
   Build: npm install && npm run build | Publish: dist/
   Add: VITE_API_URL = https://your-backend.onrender.com/api/v1
```

---

### 🥉 Oracle Cloud (Free Forever — Most Resources)
Oracle Always Free tier: **4 OCPUs + 24GB RAM** — enough for full production.

```bash
# 1. Create Oracle Cloud account (always-free tier)
# 2. Launch Ubuntu 22.04 VM

# 3. Install Docker on VM
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 4. Upload project & start
scp -r nexus-bank/ ubuntu@<your-oracle-ip>:/home/ubuntu/
ssh ubuntu@<your-oracle-ip>
cd nexus-bank && ./start.sh
```

---

### 🐳 Self-Hosted VPS (DigitalOcean, Vultr, Hetzner)

```bash
# Hetzner CX11 = €3.79/month (cheapest)
# DigitalOcean Basic Droplet = $4/month

# On your VPS:
git clone https://github.com/yourusername/nexus-bank.git
cd nexus-bank
./start.sh

# Point your domain to VPS IP, add SSL via Cloudflare (free)
```

---

## ☸️ Kubernetes Production

```bash
# Apply full stack
kubectl apply -f infrastructure/kubernetes/deployment.yaml

# Check all pods running
kubectl get pods -n nexusbank

# Watch scaling
kubectl get hpa -n nexusbank

# Access frontend
kubectl get ingress -n nexusbank

# Stream backend logs
kubectl logs -f deployment/nexusbank-backend -n nexusbank

# Scale manually
kubectl scale deployment nexusbank-backend --replicas=5 -n nexusbank
```

The K8s manifests include:
- Namespace isolation (`nexusbank`)
- ConfigMap + Secrets management
- PostgreSQL with PersistentVolumeClaim (10Gi)
- Redis deployment
- Backend Deployment (2 replicas default)
- Frontend Deployment (2 replicas default)
- HorizontalPodAutoscaler (2–10 replicas, 70% CPU trigger)
- Ingress with domain routing

---

## 🔐 Security

### Implemented Security Controls

| Control | Implementation |
|---|---|
| **Authentication** | JWT access tokens (15min) + refresh tokens (7 days) |
| **MFA** | TOTP (Google Authenticator compatible) via Speakeasy |
| **Password Storage** | bcrypt with cost factor 12 |
| **Account Lockout** | 5 failed attempts → 30-minute lockout |
| **Token Revocation** | Redis blacklist on logout |
| **RBAC** | Role + permission check on every protected route |
| **Audit Trail** | Immutable log of all write operations (user, IP, timestamp) |
| **Rate Limiting** | 100 req/15min globally, 10 req/15min on auth endpoints |
| **Security Headers** | Helmet.js (HSTS, CSP, X-Frame-Options, etc.) |
| **CORS** | Whitelist-only origin policy |
| **SQL Injection** | Parameterized queries throughout (pg library) |
| **Multi-tenancy** | Tenant isolation on every DB query |
| **Data in Transit** | HTTPS enforced in nginx config |

### Production Security Checklist
```bash
# 1. Rotate ALL default secrets in .env
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Change default admin password immediately after first login

# 3. Enable MFA for all admin/compliance accounts
# Admin Panel → Profile → Enable MFA

# 4. Review and tighten CORS in src/main.ts:
# Replace '*' with your specific domain

# 5. Enable SSL (use Cloudflare, Let's Encrypt, or Railway built-in)

# 6. Set strong DB passwords (no defaults in production)

# 7. Enable PostgreSQL SSL:
DB_SSL=true
```

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native / Flutter)
- [ ] OpenBanking APIs (PSD2-style)
- [ ] AI credit scoring model (ML microservice)
- [ ] Blockchain-based settlement ledger
- [ ] Full SMS OTP via Twilio
- [ ] Email notifications via Nodemailer
- [ ] Multi-language support (Urdu)
- [ ] Embedded finance / BaaS API layer
- [ ] Biometric KYC (liveness detection)
- [ ] Regulatory report auto-generation (SBP PDF export)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

### Coding Standards
- TypeScript strict mode on all files
- ESLint + Prettier formatting
- All new modules follow the `service → controller → routes` pattern
- Every route must pass through `authenticate` middleware
- Sensitive operations require appropriate `authorize(role)` guard

---

## 📄 License

MIT License — free for personal and commercial use.

---

<div align="center">

Built with ❤️ for the future of banking in Pakistan and beyond.

**NexusBank** — *Where Enterprise Banking Meets Modern Technology*

</div>
