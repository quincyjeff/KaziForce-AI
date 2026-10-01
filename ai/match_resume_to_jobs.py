from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

print("=" * 60)
print("LOADING AI MODEL...")
print("=" * 60)

model = SentenceTransformer("all-MiniLM-L6-v2")

print("AI Model Loaded Successfully!\n")

# Load processed datasets
resumes = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_resumes.csv")
jobs = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_jobs.csv")

# Select the first resume
resume = resumes.iloc[0]

print(f"Resume Role: {resume['job_role']}")
print("Generating resume embedding...\n")

# Generate the resume embedding ONCE
resume_embedding = model.encode(
    resume["resume_text"],
    convert_to_tensor=False
)

results = []

# Compare against the first 100 jobs
for _, job in jobs.head(100).iterrows():

    job_embedding = model.encode(
        job["job_description"],
        convert_to_tensor=False
    )

    similarity = cosine_similarity(
        [resume_embedding],
        [job_embedding]
    )[0][0]

    results.append({
        "Job Title": job["job_title"],
        "Company": job["company_name"],
        "Location": job["location"],
        "Similarity": similarity
    })

# Convert to DataFrame
results_df = pd.DataFrame(results)

# Sort by similarity
results_df = results_df.sort_values(
    by="Similarity",
    ascending=False
)

print("=" * 60)
print("TOP 10 MATCHES")
print("=" * 60)

print(results_df.head(10))