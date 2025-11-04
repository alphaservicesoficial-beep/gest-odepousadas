import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("🔎 Modelos disponíveis para esta chave:")
for m in genai.list_models():
    print("-", m.name)
