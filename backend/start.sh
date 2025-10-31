#!/bin/bash
# Garante que estamos na pasta backend
cd "$(dirname "$0")"

echo "Instalando dependências..."
pip install --no-cache-dir -r requirements.txt

echo "Iniciando servidor..."
uvicorn backend.app.main:app --host 0.0.0.0 --port 10000
