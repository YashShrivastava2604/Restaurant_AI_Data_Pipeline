import os
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import storage

# Load environment variables from project root
PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env")

# Configuration
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
DATA_DIR = PROJECT_ROOT / "data"
GCS_PREFIX = "raw"


def upload_files():
    # Validate configuration
    if not BUCKET_NAME:
        raise ValueError(
            "GCS_BUCKET_NAME is missing. Configure it in your .env file."
        )

    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")

    # Initialize GCS client using Application Default Credentials
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    # Discover CSV files
    csv_files = sorted(DATA_DIR.glob("*.csv"))

    if not csv_files: 
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

    print(f"Bucket: {BUCKET_NAME}")
    print(f"Found {len(csv_files)} CSV files.\n")

    successful_uploads = 0

    # Upload each CSV
    for file_path in csv_files:
        blob_name = f"{GCS_PREFIX}/{file_path.name}"
        blob = bucket.blob(blob_name)

        try:
            print(f"Uploading: {file_path.name}")

            blob.upload_from_filename(
                str(file_path),
                content_type="text/csv"
            )

            print(f"Uploaded: gs://{BUCKET_NAME}/{blob_name}\n")
            successful_uploads += 1

        except Exception as error:
            print(f"Failed: {file_path.name}")
            print(f"Reason: {error}\n")

    # Summary
    print("=" * 45)
    print(f"Total files:       {len(csv_files)}")
    print(f"Successful:        {successful_uploads}")
    print(f"Failed:            {len(csv_files) - successful_uploads}")
    print("=" * 45)

    if successful_uploads != len(csv_files):
        raise RuntimeError("Some files failed to upload.")


if __name__ == "__main__":
    upload_files()
