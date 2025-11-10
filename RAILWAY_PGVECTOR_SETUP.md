# Setting Up pgvector on Railway PostgreSQL

This guide explains how to enable pgvector extension on your Railway PostgreSQL database and apply the embedding migrations.

## Step 1: Enable pgvector Extension

Railway's PostgreSQL supports pgvector, but you need to enable it manually.

### Option A: Using Railway CLI

```bash
# Connect to your Railway PostgreSQL database
railway connect postgres

# Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Option B: Using Alembic Migration (Recommended)

The migration already includes the command to enable pgvector:

```bash
# Run the migrations
alembic upgrade head
```

The migration file `07b4005596b1_add_embedding_vector_column_to_books_.py` contains:
```python
# Enable pgvector extension
op.execute('CREATE EXTENSION IF NOT EXISTS vector')
```

## Step 2: Apply the Migration

```bash
# Make sure you're using the production database
export DATABASE_URL=<your-railway-postgres-url>

# Run migrations
alembic upgrade head
```

## Step 3: Verify the Setup

Connect to your Railway PostgreSQL and verify:

```sql
-- Check extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check the embedding column exists
\d books

-- Check the index was created
\di books_embedding_idx
```

You should see:
- `vector` extension listed
- `embedding` column of type `vector(768)` in the `books` table
- `books_embedding_idx` index using ivfflat

## Step 4: Configure Vertex AI Environment Variables

Add these environment variables in Railway:

```
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### For Railway Deployment:

1. Create a service account in GCP with Vertex AI permissions
2. Download the JSON key file
3. In Railway, go to your service's Variables tab
4. Add the above environment variables
5. For GOOGLE_APPLICATION_CREDENTIALS, you can either:
   - Upload the JSON file to your repo (not recommended for security)
   - Use Railway's secret files feature
   - Or store the JSON content as a base64-encoded environment variable

## Troubleshooting

### Error: "extension vector does not exist"

Run manually:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "operator class vector_cosine_ops does not exist"

Make sure pgvector extension is properly installed:
```sql
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION vector;
```

### Migration fails on Railway

Check logs for specific error. Common issues:
- Insufficient permissions: Ensure your DATABASE_URL user has CREATE EXTENSION privileges
- Extension not available: Contact Railway support to enable pgvector on your database

## What the Migration Does

1. **Enables pgvector extension**: Required for vector operations
2. **Adds `embedding` column**: Stores 768-dimensional vectors from Vertex AI's text-embedding-004 model
3. **Creates ivfflat index**: Enables fast approximate nearest neighbor search using cosine similarity

## Next Steps

After setup, embeddings will be generated automatically when:
- Creating new books
- Updating existing books
- Running the batch embedding generation script (if you create one)

The embedding service uses the book's title, author, genre, and summary to create a semantic representation for similarity search.
