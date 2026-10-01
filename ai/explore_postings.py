import pandas as pd

# Path to the postings dataset
file_path = "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\linkedin_dataset\\postings.csv"

# Load the dataset
df = pd.read_csv(file_path)

print("=" * 60)
print("JOB POSTINGS DATASET INFORMATION")
print("=" * 60)

print("\nFirst 5 rows:")
print(df.head())

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nMissing Values:")
print(df.isnull().sum())

print("\nData Types:")
print(df.dtypes)

print("\nRandom Job Posting:")
print(df.sample(1))