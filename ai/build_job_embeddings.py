import pickle
import os
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE = "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI"
JOBS_PATH = os.path.join(BASE, "datasets", "processed", "master_jobs.csv")
OUTPUT_PATH = os.path.join(BASE, "models", "job_embeddings.pkl")

# Set to a number (e.g. 5000) 
LIMIT = 5000

print("=" * 60)
print("BUILDING JOB EMBEDDINGS")
print("=" * 60)

# 1. Load jobs (master_jobs has the skills column merged in)
jobs = pd.read_csv(JOBS_PATH)
jobs = jobs.dropna(subset=["job_description"])

if LIMIT:
    jobs = jobs.head(LIMIT)

print(f"Jobs to encode: {len(jobs)}")

# 2. Build one text per job.

texts = (
    jobs["job_title"].fillna("")
    + ". Skills: "
    + jobs["skills"].fillna("Not Specified")
    + ". "
    + jobs["job_description"]
).tolist()

# 3. Encode everything in batches
print("\nLoading model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Encoding jobs (this can take a while on CPU)...")
embeddings = model.encode(
    texts,
    batch_size=64,
    show_progress_bar=True,
    normalize_embeddings=True,  # makes cosine similarity a simple dot product
)

# 4. Save embeddings with the job IDs so rows can be matched back to jobs
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(
        {
            "job_ids": jobs["job_id"].tolist(),
            "embeddings": embeddings,
            "model_name": "all-MiniLM-L6-v2",
        },
        f,
    )

print("\nDONE")
print(f"Embeddings shape: {embeddings.shape}")
print(f"Saved to: {OUTPUT_PATH}")