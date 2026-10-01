import pandas as pd

# Replace this path if your file is in a different location
file_path = "C:\\Users\\10403\\OneDrive\\Desktop\\KaziForce_AI\\datasets\\resume_dataset\\training_data.csv"

# Load dataset
df = pd.read_csv(file_path)

print("=" * 60)
print("RESUME DATASET INFORMATION")
print("=" * 60)

print("\nFirst 5 rows:")
print(df.head())

print("\n")

print("Shape:")
print(df.shape)

print("\n")

print("Columns:")
print(df.columns.tolist())

print("\n")

print("Missing Values:")
print(df.isnull().sum())

print("\n")

print("Data Types:")
print(df.dtypes)

print("\n")

print("Random Resume:")
print(df.sample(1))