import os
import pickle
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE = "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI"
JOBS_PATH = os.path.join(BASE, "datasets", "processed", "master_jobs.csv")
RESUMES_PATH = os.path.join(BASE, "datasets", "processed", "processed_resumes.csv")
EMBEDDINGS_PATH = os.path.join(BASE, "models", "job_embeddings.pkl")


RESUME_INDEX = 0
TOP_N = 10

print("=" * 60)
print("LOADING EVERYTHING")
print("=" * 60)

# 1. Load the model, the saved job embeddings, and the job details
model = SentenceTransformer("all-MiniLM-L6-v2")

with open(EMBEDDINGS_PATH, "rb") as f:
    saved = pickle.load(f)

job_ids = saved["job_ids"]
job_embeddings = saved["embeddings"]  # shape: (num_jobs, 384)

# Look up job details by job_id 
jobs = pd.read_csv(JOBS_PATH).set_index("job_id").loc[job_ids]

print(f"Loaded {len(job_ids)} job embeddings")


def find_top_jobs(resume_text, top_n=TOP_N):
    """Return the top_n jobs most similar to a resume, as a DataFrame."""
    # Encode the resume the same way as the jobs
    resume_embedding = model.encode(resume_text, normalize_embeddings=True)

    
    scores = job_embeddings @ resume_embedding

    results = jobs.copy()
    results["similarity"] = scores
    results = results.sort_values("similarity", ascending=False).head(top_n)

    return results[
        ["job_title", "company_name", "location", "work_type", "similarity"]
    ].reset_index()


if __name__ == "__main__":
    resumes = pd.read_csv(RESUMES_PATH)
    resume = resumes.iloc[RESUME_INDEX]

    
    resume_text = (
        f"{resume['job_role']}. Skills: {resume['skills']}. {resume['resume_text']}"
    )

    print(f"\nResume role: {resume['job_role']}")
    print(f"Resume skills: {resume['skills']}")

    top_jobs = find_top_jobs(resume_text)

    print("\n" + "=" * 60)
    print(f"TOP {TOP_N} MATCHES")
    print("=" * 60)

    for i, row in top_jobs.iterrows():
        print(f"\n{i + 1}. {row['job_title']} at {row['company_name']}")
        print(f"   {row['location']} | {row['work_type']}")
        print(f"   Match: {row['similarity'] * 100:.1f}%")