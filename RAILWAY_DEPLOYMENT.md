# Railway Deployment Guide

This guide covers deploying the Library Management System as a single full-stack application on Railway.app.

## Overview

The application is configured for **monolithic deployment** where:
- Frontend (Next.js) is built as static files
- Backend (FastAPI) serves both API and frontend
- Everything runs in a single Docker container
- One Railway service = lower cost and simpler deployment

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repo
3. **Google OAuth Credentials**: Production OAuth credentials configured

## Step 1: Prepare Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create production OAuth credentials (or use existing)
3. Add authorized redirect URI:
   - `https://your-app-name.up.railway.app/auth/callback/google`
   - Note: You'll get the actual URL from Railway after first deployment

## Step 2: Create Railway Project

### Option A: Via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app) and login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `manos_library`
5. Railway will automatically detect the `Dockerfile`

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to GitHub repo (optional)
railway link
```

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a database and set `DATABASE_URL` automatically

## Step 4: Configure Environment Variables

In Railway dashboard, go to your service → **Variables** tab and add:

```bash
# These are automatically set by Railway:
# DATABASE_URL (set by Railway PostgreSQL)
# PORT (set by Railway)

# You need to add these:
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# Generate a strong secret key (run locally: openssl rand -hex 32)
SECRET_KEY=your-generated-secret-key-here

# Algorithm (default is fine)
ALGORITHM=HS256

# Token expiration
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
DEBUG=False

# These will be set after first deployment - see Step 6
# APP_URL=https://your-app-name.up.railway.app
# FRONTEND_URL=https://your-app-name.up.railway.app
```

## Step 5: Deploy

Railway will automatically deploy when you push to your main branch.

### First Deployment

1. **Commit and push** your code to GitHub
2. Railway will automatically:
   - Detect the `Dockerfile`
   - Build the frontend (Next.js static export)
   - Build the backend (FastAPI)
   - Run database migrations
   - Start the application

3. **Monitor deployment** in Railway dashboard:
   - Click on your service
   - Go to **"Deployments"** tab
   - Watch the build logs

### Manual Deploy via CLI

```bash
# Deploy current branch
railway up

# Or link to GitHub and push
git push origin main
```

## Step 6: Configure URLs After First Deploy

After first deployment, Railway will assign a URL like:
`https://your-app-name.up.railway.app`

1. **Update environment variables** in Railway:
   ```bash
   APP_URL=https://your-app-name.up.railway.app
   FRONTEND_URL=https://your-app-name.up.railway.app
   ```

2. **Update Google OAuth redirect URI**:
   - Go to Google Cloud Console
   - Add: `https://your-app-name.up.railway.app/auth/callback/google`

3. **Redeploy** (Railway will auto-redeploy on variable change)

## Step 7: Create First Admin User

After successful deployment:

1. **Visit your app**: `https://your-app-name.up.railway.app`
2. **Login with Google** (first time creates a regular member)
3. **Access the database** via Railway dashboard:
   - Click on PostgreSQL service
   - Click **"Data"** tab
   - Or use **"Query"** tab

4. **Make yourself super_admin**:
   ```sql
   UPDATE users
   SET user_type = 'super_admin'
   WHERE email = 'your-email@gmail.com';
   ```

## Step 8: Verify Deployment

Visit these URLs to verify:

- **Frontend**: `https://your-app-name.up.railway.app`
- **API Docs**: `https://your-app-name.up.railway.app/docs`
- **Health Check**: `https://your-app-name.up.railway.app/api/health`
- **OAuth Debug**: `https://your-app-name.up.railway.app/debug/oauth-config`

## Project Structure on Railway

```
Railway Project
├── Web Service (your-app-name)
│   ├── Source: GitHub (manos_library)
│   ├── Builder: Dockerfile
│   ├── Port: 8000 (auto-detected)
│   └── Environment Variables
└── PostgreSQL Database
    └── DATABASE_URL (auto-linked)
```

## Environment Variables Reference

| Variable | Required | Set By | Description |
|----------|----------|--------|-------------|
| `DATABASE_URL` | Yes | Railway | Auto-set when you add PostgreSQL |
| `PORT` | Yes | Railway | Auto-set by Railway |
| `GOOGLE_CLIENT_ID` | Yes | You | Production Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | You | Production Google OAuth secret |
| `SECRET_KEY` | Yes | You | JWT signing key (use `openssl rand -hex 32`) |
| `APP_URL` | Yes | You | Your Railway app URL |
| `FRONTEND_URL` | Yes | You | Your Railway app URL (same as APP_URL) |
| `ENVIRONMENT` | No | You | Set to `production` |
| `DEBUG` | No | You | Set to `False` |
| `ALGORITHM` | No | You | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | You | Token expiration (default: 30) |

## Custom Domain (Optional)

### Add Custom Domain

1. Go to your service **Settings** → **Domains**
2. Click **"+ Custom Domain"**
3. Enter your domain: `library.yourdomain.com`
4. Railway will provide DNS records
5. Add records to your DNS provider:
   ```
   CNAME library your-app-name.up.railway.app
   ```

### Update Environment Variables

After adding custom domain:

```bash
APP_URL=https://library.yourdomain.com
FRONTEND_URL=https://library.yourdomain.com
```

Update Google OAuth redirect URI:
```
https://library.yourdomain.com/auth/callback/google
```

## Continuous Deployment

Railway automatically deploys when you push to your main branch:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Builds the Docker image
# 3. Runs migrations
# 4. Deploys the new version
```

## Monitoring and Logs

### View Logs

**Via Dashboard:**
1. Go to your service
2. Click **"Logs"** tab
3. Filter by deployment or time range

**Via CLI:**
```bash
# Stream logs
railway logs

# Follow logs (like tail -f)
railway logs --follow
```

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request metrics

Access in: Service → **"Metrics"** tab

## Database Management

### Access Database

**Via Railway Dashboard:**
1. Click PostgreSQL service
2. Go to **"Data"** tab (GUI)
3. Or **"Query"** tab (SQL editor)

**Via CLI:**
```bash
# Get database URL
railway variables

# Connect with psql
railway run psql $DATABASE_URL
```

### Backups

Railway automatically backs up PostgreSQL databases.

**Manual backup:**
```bash
# Get database credentials from Railway
railway variables

# Backup locally
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Run Migrations Manually

```bash
# Via Railway CLI
railway run alembic upgrade head

# Or SSH into the service
railway shell
alembic upgrade head
```

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to **Deployments** tab
2. Click on failed deployment
3. Check **"Build Logs"** and **"Deploy Logs"**

**Common issues:**
- Missing dependencies in `requirements.txt`
- Frontend build errors
- Dockerfile syntax errors

**Solution:**
```bash
# Test build locally
docker build -t library-test .
docker run -p 8000:8000 library-test
```

### Application Crashes

**Check logs:**
```bash
railway logs --follow
```

**Common issues:**
1. **Database connection**: Check `DATABASE_URL` is set
2. **Missing env vars**: Verify all required variables
3. **Migrations failed**: Run manually with `railway run alembic upgrade head`

### OAuth Not Working

1. **Verify redirect URI** in Google Cloud Console exactly matches:
   ```
   https://your-app-name.up.railway.app/auth/callback/google
   ```

2. **Check environment variables**:
   ```bash
   APP_URL=https://your-app-name.up.railway.app
   FRONTEND_URL=https://your-app-name.up.railway.app
   ```

3. **Check debug endpoint**: Visit `/debug/oauth-config`

### Frontend Not Loading

1. **Verify build succeeded**:
   - Check build logs for frontend build step
   - Ensure `npm run build` completed successfully

2. **Check static files**:
   ```bash
   railway shell
   ls -la frontend/out/
   ```

3. **Test locally**:
   ```bash
   cd frontend
   npm run build
   ls -la out/
   ```

## Cost Optimization

Railway offers:
- **Free tier**: $5 credit/month
- **Developer plan**: $5/month + usage
- **Team plan**: $20/month/seat + usage

### Optimize costs:

1. **Use single service** (this setup ✓)
2. **Optimize Docker image**:
   - Multi-stage builds (already done ✓)
   - Minimal base images (already done ✓)

3. **Scale appropriately**:
   - Start small, scale as needed
   - Monitor usage in dashboard

## Scaling

Railway auto-scales based on traffic, but you can configure:

1. Go to service **Settings** → **Resources**
2. Adjust:
   - Memory limit
   - CPU allocation
   - Replicas (horizontal scaling)

For heavy traffic:
- Enable **horizontal scaling** (multiple replicas)
- Consider separating services (backend + frontend)

## Updates and Maintenance

### Update Dependencies

```bash
# Backend
pip list --outdated
pip install --upgrade package-name
pip freeze > requirements.txt

# Frontend
cd frontend
npm outdated
npm update
```

### Rolling Updates

Railway does **zero-downtime deployments**:
1. New version builds
2. Health check passes
3. Traffic switches to new version
4. Old version shuts down

### Rollback

**Via Dashboard:**
1. Go to **Deployments**
2. Click on previous successful deployment
3. Click **"Redeploy"**

**Via CLI:**
```bash
railway rollback
```

## Security Checklist

- ✅ `DEBUG=False` in production
- ✅ Strong `SECRET_KEY` (32+ characters)
- ✅ HTTPS enforced (Railway does this)
- ✅ Environment variables (not hardcoded)
- ✅ Database credentials from Railway
- ✅ OAuth redirect URI matches exactly
- ✅ CORS configured correctly
- ✅ `.dockerignore` excludes sensitive files

## Support and Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app)
- **This App's Docs**: See main [DEPLOYMENT.md](DEPLOYMENT.md)

## Quick Command Reference

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# View/set variables
railway variables
railway variables set KEY=value

# Run command in Railway environment
railway run <command>

# SSH into service
railway shell

# Deploy
railway up

# Rollback
railway rollback

# Open in browser
railway open
```

## Next Steps

After successful deployment:

1. ✅ Test all features (login, book management, borrowing)
2. ✅ Create your first admin user
3. ✅ Add test data
4. ✅ Set up monitoring alerts
5. ✅ Configure custom domain (optional)
6. ✅ Set up automated backups
7. ✅ Document your deployment process

Congratulations! Your library management system is now live! 🚀
