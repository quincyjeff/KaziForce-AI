import pandas as pd


print("=" * 60)
print("BUILDING MASTER JOB DATASET")
print("=" * 60)


# Load datasets

jobs = pd.read_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_jobs.csv"
)

job_skills = pd.read_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\jobs\\job_skills.csv"
)

skills = pd.read_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\mappings\\skills.csv"
)


# Convert skill abbreviations into names

job_skills = job_skills.merge(
    skills,
    on="skill_abr",
    how="left"
)


# Group skills per job

skills_grouped = (
    job_skills
    .groupby("job_id")["skill_name"]
    .apply(lambda x: ", ".join(x))
    .reset_index()
)


# Merge skills with jobs

master_jobs = jobs.merge(
    skills_grouped,
    on="job_id",
    how="left"
)


# Replace missing skills

master_jobs["skill_name"] = (
    master_jobs["skill_name"]
    .fillna("Not Specified")
)


# Rename column

master_jobs.rename(
    columns={
        "skill_name": "skills"
    },
    inplace=True
)


# Save result

master_jobs.to_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\master_jobs.csv",
    index=False
)


print("\nMASTER JOB DATASET CREATED")

print("\nShape:")
print(master_jobs.shape)

print("\nColumns:")
print(master_jobs.columns.tolist())


print("\nSample:")
print(master_jobs.head())