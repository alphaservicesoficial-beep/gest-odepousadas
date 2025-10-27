from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    project_name: str = "Inn Management Tool API"
    version: str = "0.1.0"
    api_v1_str: str = "/api/v1"

    firebase_project_id: str | None = Field(default=None, env="FIREBASE_PROJECT_ID")
    firebase_credentials_path: str | None = Field(
        default=None, env="GOOGLE_APPLICATION_CREDENTIALS"
    )

    firestore_emulator_host: str | None = Field(
        default=None, env="FIRESTORE_EMULATOR_HOST"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
