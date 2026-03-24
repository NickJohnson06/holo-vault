import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

# Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION
)

def upload_file_to_s3(file_obj, filename: str, content_type: str) -> str:
    """
    Uploads a file object to AWS S3 and returns the public URL.
    """
    if not S3_BUCKET_NAME:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")
    
    try:
        s3_client.upload_fileobj(
            file_obj,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": content_type}
        )
        url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        return url
    except NoCredentialsError:
        raise ValueError("AWS credentials not found. Please review your .env variables.")
    except ClientError as e:
        raise ValueError(f"S3 Upload failed: {str(e)}")
