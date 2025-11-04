import google.generativeai as genai
import os

# Configure sua chave
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Use o modelo com o nome completo (importante!)
model = genai.GenerativeModel("models/gemini-2.5-pro")

# Teste simples
response = model.generate_content("Olá, tudo bem?")

print("✅ Resposta do Gemini:")
print(response.text)
