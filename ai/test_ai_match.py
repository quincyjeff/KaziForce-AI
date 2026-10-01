from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

print("=" * 60)
print("LOADING AI MODEL...")
print("=" * 60)

# Load the pre-trained Sentence Transformer model
model = SentenceTransformer("all-MiniLM-L6-v2")

print("AI Model Loaded Successfully!\n")

# Load processed datasets
resumes = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_resumes.csv")
jobs = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_jobs.csv")

# Select one resume and one job
resume = resumes.iloc[0]
job = jobs.iloc[0]

print("Resume Selected:")
print(resume["job_role"])

print("\nJob Selected:")
print(job["job_title"])

# Generate embeddings
resume_embedding = model.encode(
    resume["resume_text"],
    convert_to_tensor=False
)

job_embedding = model.encode(
    job["job_description"],
    convert_to_tensor=False
)

# Calculate similarity
score = cosine_similarity(
    [resume_embedding],
    [job_embedding]
)[0][0]

print("\n")
print("=" * 60)
print("AI MATCH RESULT")
print("=" * 60)

print(f"Similarity Score: {score:.2f}")

# Recommendation
if score >= 0.80:
    print("Recommendation: HIGH MATCH ✅")
elif score >= 0.60:
    print("Recommendation: GOOD MATCH 🟡")
elif score >= 0.40:
    print("Recommendation: POSSIBLE MATCH 🟠")
else:
    print("Recommendation: LOW MATCH ❌")