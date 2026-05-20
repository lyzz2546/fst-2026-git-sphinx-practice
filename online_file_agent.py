import os
import sys
from pathlib import Path
from openai import OpenAI

sys.stdout.reconfigure(encoding="utf-8")

client = OpenAI(
    api_key=os.environ["DASHSCOPE_API_KEY"],
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

file_path = Path(sys.argv[1])
question = sys.argv[2]

content = file_path.read_text(encoding="utf-8", errors="ignore")

response = client.chat.completions.create(
    model="qwen-plus",
    messages=[
        {
            "role": "system",
            "content": "You are a file analysis agent. Read the file content and answer the user's question clearly.",
        },
        {
            "role": "user",
            "content": f"File name: {file_path.name}\n\nFile content:\n{content[:12000]}\n\nQuestion: {question}",
        },
    ],
)

print(response.choices[0].message.content)
