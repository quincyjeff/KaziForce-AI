import pandas as pd

# Load datasets
job_skills = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\jobs\\job_skills.csv")
skills = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\mappings\\skills.csv")

print("=" * 60)
print("JOB SKILLS DATASET")
print("=" * 60)

print("\nShape:")
print(job_skills.shape)

print("\nColumns:")
print(job_skills.columns.tolist())

print("\nFirst 5 Rows:")
print(job_skills.head())

print("\nMissing Values:")
print(job_skills.isnull().sum())

print("\n")

print("=" * 60)
print("SKILLS MAPPING DATASET")
print("=" * 60)

print("\nShape:")
print(skills.shape)

print("\nColumns:")
print(skills.columns.tolist())

print("\nFirst 5 Rows:")
print(skills.head())

print("\nMissing Values:")
print(skills.isnull().sum())