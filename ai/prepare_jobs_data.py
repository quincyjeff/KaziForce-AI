import pandas as pd

# Load the original job postings dataset
df = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\postings.csv")

# Keep only the columns we need
processed_df = df[
    [
        "job_id",
        "title",
        "description",
        "company_name",
        "location",
        "formatted_experience_level",
        "formatted_work_type"
    ]
]

# Rename the columns
processed_df.columns = [
    "job_id",
    "job_title",
    "job_description",
    "company_name",
    "location",
    "experience_level",
    "work_type"
]

# Remove jobs with no description
processed_df = processed_df.dropna(subset=["job_description"])

# Save the cleaned dataset
processed_df.to_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_jobs.csv",
    index=False
)

print("=" * 60)
print("JOB DATASET PROCESSED SUCCESSFULLY")
print("=" * 60)

print("\nShape:")
print(processed_df.shape)

print("\nColumns:")
print(processed_df.columns.tolist())

print("\nFirst 5 rows:")
print(processed_df.head())