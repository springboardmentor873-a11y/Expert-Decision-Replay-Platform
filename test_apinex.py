import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Find .env in the same folder as this Python file
env_file = Path(__file__).resolve().parent / ".env"

# Load the .env file
load_dotenv(dotenv_path=env_file)

# Get API key
api_key = os.getenv("APINEX_API_KEY")

if not api_key:
    print("ERROR: APINEX_API_KEY was not loaded.")
    print("Looking for .env at:", env_file)
    exit()

print("API key loaded successfully.")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.apinex.bond/v1"
)

response = client.chat.completions.create(
    model="free/gpt-6-luna",
    messages=[
        {
            "role": "user",
            "content": "Hello! Are you working?"
        }
    ]
)

print(response.choices[0].message.content)