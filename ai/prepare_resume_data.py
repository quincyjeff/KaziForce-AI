import pandas as pd

# Load the original resume dataset
df = pd.read_csv("C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\resume_dataset\\training_data.csv")

# Select only the columns we need
processed_df = df[
    [
        "Resume ID",
        "Resume Text",
        "Skills",
        "Experience Years",
        "Education",
        "Job Role",
        "Category"
    ]
]

# Rename columns to simpler names
processed_df.columns = [
    "resume_id",
    "resume_text",
    "skills",
    "experience_years",
    "education",
    "job_role",
    "category"
]

# Save the cleaned dataset
processed_df.to_csv(
    "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\processed\\processed_resumes.csv",
    index=False
)

print("Resume dataset processed successfully!")

print("\nShape:")
print(processed_df.shape)

print("\nColumns:")
print(processed_df.columns.tolist())

print("\nFirst 5 rows:")
print(processed_df.head())