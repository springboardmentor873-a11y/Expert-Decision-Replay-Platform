import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load .env from this file's folder
env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)

api_key = os.getenv("APINEX_API_KEY")

if not api_key:
    print("ERROR: APINEX_API_KEY not found.")
    exit()

client = OpenAI(
    api_key=api_key,
    base_url="https://api.apinex.bond/v1"
)

print("====================================")
print("      GPT-6 Luna Terminal Chat")
print("====================================")
print("Type 'exit' to stop.\n")

messages = [
    {
        "role": "system",
        "content": """You are a careful technical assistant.
Always verify calculations, algorithms, code, and technical explanations before answering.
If something is uncertain, say so instead of inventing information.
For exam questions, give clear, accurate, well-structured answers suitable for VTU engineering exams."""
    }
]

while True:
    user_input = input("You: ")

    if user_input.lower() == "exit":
        print("Chat ended.")
        break

    messages.append({
        "role": "user",
        "content": user_input
    })

    try:
        response = client.chat.completions.create(
            model="free/gpt-6-luna",
            messages=messages
        )

        answer = response.choices[0].message.content

        print("\nGPT-6 Luna:", answer)
        print()

        messages.append({
            "role": "assistant",
            "content": answer
        })

    except Exception as e:
        print("\nError:", e)