import requests
import json

API_KEY = "YOUR_GEMINI_API_KEY"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"

payload = {
    "contents": [{"parts": [{"text": "Hello! What is AI?"}]}]
}

response = requests.post(url, json=payload)
data = response.json()  

text = data["candidates"][0]["content"]["parts"][0]["text"]
# print(text)

# print(json.dumps(data, indent=2))

data = response.json()

text        = data["candidates"][0]["content"]["parts"][0]["text"]
role        = data["candidates"][0]["content"]["role"]
finish      = data["candidates"][0]["finishReason"]
total_tok   = data["usageMetadata"]["totalTokenCount"]

result = {
    "text": text,
    "role": role,
    "finishReason": finish,
    "totalTokens": total_tok
}

print(result)