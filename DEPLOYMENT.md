# Deployment Guide

This guide covers deploying the Library Management System to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Considerations](#security-considerations)
7. [Post-Deployment Steps](#post-deployment-steps)

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Production PostgreSQL database provisioned
- [ ] Production Google OAuth credentials created
- [ ] Domain names for backend and frontend
- [ ] SSL certificates configured (HTTPS)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Application tested locally with production-like settings

## Environment Configuration

### 1. Create Production Environment File

Copy the production environment template:

```bash
cp .env.prod.example .env.prod
```

### 2. Configure Production Variables

Edit `.env.prod` with your production values:

```bash
# Database - Use your production PostgreSQL URL
DATABASE_URL=postgresql://username:password@your-db-host:5432/library_prod

# Google OAuth - Create separate credentials for production
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret

# Security - Generate a strong secret key
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# URLs - Use your production domains (HTTPS!)
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Environment
ENVIRONMENT=production
DEBUG=False
```

### 3. Load Production Environment

When running the application, specify the environment file:

```bash
export ENV_FILE=.env.prod
# or
ENV_FILE=.env.prod uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Database Setup

### 1. Provision Production Database

**Option A: Cloud Provider**

- **AWS RDS PostgreSQL**: [Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreatePostgreSQLInstance.html)
- **Google Cloud SQL**: [Guide](https://cloud.google.com/sql/docs/postgres/quickstart)
- **Azure Database**: [Guide](https://learn.microsoft.com/en-us/azure/postgresql/single-server/quickstart-create-server-database-portal)
- **DigitalOcean**: [Guide](https://docs.digitalocean.com/products/databases/postgresql/)

**Option B: Self-Hosted**

```bash
# Install PostgreSQL on Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE library_prod;
CREATE USER library_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE library_prod TO library_user;
\q
```

### 2. Configure Database Connection

Ensure your `DATABASE_URL` in `.env.prod` is correctly formatted:

```
postgresql://username:password@host:port/database
```

### 3. Run Migrations

```bash
# Set environment file
export ENV_FILE=.env.prod

# Run migrations
alembic upgrade head
```

### 4. Create Initial Super Admin (Optional)

```bash
# Connect to database and insert super admin user
psql $DATABASE_URL

INSERT INTO users (name, email, user_type, google_id)
VALUES ('Admin User', 'admin@yourdomain.com', 'super_admin', 'google-id-here');
```

## Backend Deployment

### Option 1: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run database migrations on startup
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Create docker-compose.prod.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env.prod
    restart: unless-stopped
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: library_prod
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Platform-as-a-Service (PaaS)

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set GOOGLE_CLIENT_ID=your-client-id
heroku config:set GOOGLE_CLIENT_SECRET=your-client-secret
heroku config:set SECRET_KEY=$(openssl rand -hex 32)
heroku config:set APP_URL=https://your-app-name.herokuapp.com
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
heroku config:set ENVIRONMENT=production
heroku config:set DEBUG=False

# Create Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile
echo "release: alembic upgrade head" >> Procfile

# Deploy
git push heroku main
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Set environment variables via dashboard or CLI
railway variables set GOOGLE_CLIENT_ID=your-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-client-secret
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set ENVIRONMENT=production
railway variables set DEBUG=False

# Deploy
railway up
```

#### Render

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: library-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: False
      - key: DATABASE_URL
        fromDatabase:
          name: library-db
          property: connectionString
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: APP_URL
        value: https://your-app.onrender.com
      - key: FRONTEND_URL
        value: https://your-frontend.onrender.com

databases:
  - name: library-db
    plan: free
```

2. Connect your GitHub repo and deploy via Render dashboard

### Option 3: Traditional Server (VPS)

#### 1. Setup Server (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3.11 python3.11-venv python3-pip nginx postgresql-client -y

# Create application user
sudo useradd -m -s /bin/bash library
sudo su - library

# Clone repository
git clone https://github.com/yourusername/manos_library.git
cd manos_library

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.prod.example .env.prod
nano .env.prod  # Edit with your values

# Run migrations
export ENV_FILE=.env.prod
alembic upgrade head
```

#### 2. Configure Gunicorn

```bash
# Install Gunicorn
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/library-api.service
```

```ini
[Unit]
Description=Library Management System API
After=network.target

[Service]
User=library
WorkingDirectory=/home/library/manos_library
Environment="ENV_FILE=/home/library/manos_library/.env.prod"
ExecStart=/home/library/manos_library/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl start library-api
sudo systemctl enable library-api
sudo systemctl status library-api
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/library-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/library-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm install -g vercel

# From frontend directory
cd frontend

# Set environment variable for production
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" > .env.production

# Deploy
vercel --prod
```

In Vercel dashboard, set environment variables:
- `NEXT_PUBLIC_API_URL`: Your backend URL

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the application
cd frontend
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

### Option 3: Self-Hosted

```bash
# Build frontend
cd frontend
npm run build

# Use PM2 to run
npm install -g pm2
pm2 start npm --name "library-frontend" -- start
pm2 save
pm2 startup
```

Configure Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security Considerations

### 1. Environment Variables

- ✅ **NEVER** commit `.env.prod` to version control
- ✅ Use strong, random SECRET_KEY (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use environment-specific OAuth credentials

### 2. Database Security

- ✅ Use strong database passwords
- ✅ Enable SSL connections for database
- ✅ Restrict database access to application servers only
- ✅ Regular backups

### 3. Application Security

- ✅ Always use HTTPS in production
- ✅ Set `DEBUG=False` in production
- ✅ Configure CORS to only allow your frontend domain
- ✅ Keep dependencies updated
- ✅ Enable rate limiting (consider using nginx or a WAF)

### 4. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create production OAuth credentials
3. Add authorized redirect URIs:
   - `https://api.yourdomain.com/auth/callback/google`
4. Set authorized JavaScript origins:
   - `https://yourdomain.com`

## Post-Deployment Steps

### 1. Verify Deployment

```bash
# Check API health
curl https://api.yourdomain.com/health

# Check API root
curl https://api.yourdomain.com/

# Test OAuth redirect
curl https://api.yourdomain.com/auth/login/google
```

### 2. Monitor Application

- Set up application monitoring (e.g., Sentry, DataDog)
- Configure log aggregation
- Set up uptime monitoring
- Create alerts for errors

### 3. Performance Optimization

- Enable HTTP/2
- Configure CDN for frontend (Cloudflare, AWS CloudFront)
- Enable gzip compression
- Set up database connection pooling
- Consider Redis for caching

### 4. Backup Strategy

```bash
# Automated database backups
# Example cron job (runs daily at 2 AM)
0 2 * * * pg_dump $DATABASE_URL > /backups/library_$(date +\%Y\%m\%d).sql
```

### 5. Create First Admin User

After deployment, log in with your Google account, then update your user type in the database:

```sql
UPDATE users SET user_type = 'super_admin' WHERE email = 'your-email@gmail.com';
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth client secret |
| `SECRET_KEY` | Yes | - | JWT signing secret (generate with `openssl rand -hex 32`) |
| `ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 30 | JWT token expiration time |
| `APP_URL` | Yes | - | Backend URL (must be HTTPS in production) |
| `FRONTEND_URL` | Yes | - | Frontend URL (must be HTTPS in production) |
| `ENVIRONMENT` | No | development | Environment name (development/production/staging) |
| `DEBUG` | No | True | Debug mode (set to False in production) |

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check migrations
alembic current
alembic history
```

### OAuth Issues

1. Verify redirect URIs in Google Cloud Console match exactly
2. Check `APP_URL` and `FRONTEND_URL` are correct
3. Ensure HTTPS is enabled
4. Verify OAuth credentials are for the correct project

### CORS Issues

1. Check `FRONTEND_URL` matches your actual frontend domain
2. Verify CORS middleware configuration
3. Ensure credentials are included in requests

### Application Not Starting

```bash
# Check logs
journalctl -u library-api -f  # For systemd
docker logs <container-id>    # For Docker
heroku logs --tail            # For Heroku

# Test application manually
export ENV_FILE=.env.prod
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (nginx, AWS ALB, etc.)
- Deploy multiple application instances
- Use managed database with read replicas
- Implement Redis for session storage

### Database Optimization

- Add indexes for frequently queried fields
- Enable connection pooling
- Use database query optimization
- Consider read replicas for read-heavy workloads

## Support

For issues or questions:
1. Check the logs first
2. Review this deployment guide
3. Consult the main README.md
4. Check application documentation at `/docs`
