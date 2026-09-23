from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    OCI_ENDPOINT_URL: str = ""
    OCI_REGION: str = ""
    OCI_ACCESS_KEY_ID: str = ""
    OCI_SECRET_ACCESS_KEY: str = ""
    OCI_BUCKET_NAME: str = ""
    OCI_PUBLIC_BASE_URL: str = ""


settings = Settings()
