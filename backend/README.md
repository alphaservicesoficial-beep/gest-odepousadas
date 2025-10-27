# Backend - Inn Management Tool

Este diretório contém a API desenvolvida com FastAPI e integrada ao Firebase/Firestore.

## Execução (ambiente local)

1. Crie e ative um ambiente virtual (`python -m venv .venv` e `.\.venv\Scripts\activate` no Windows).
2. Instale as dependências: `pip install -e .[dev]`.
3. Defina as variáveis de ambiente necessárias (`FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`).
4. Execute o servidor: `uvicorn app.main:get_application --reload`.

## Estrutura

- `app/main.py`: ponto de entrada da aplicação.
- `app/core/`: configurações e clientes compartilhados (Firebase, Firestore).
- `app/api/v1/`: rotas organizadas por módulos funcionais.
- `app/schemas/`: modelos Pydantic usados na API.

## Próximas melhorias

- Implementar autenticação real com Firebase Authentication.
- Criar camada de repositório para Firestore.
- Adicionar testes automatizados para cada módulo.
