from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_firebase_app() -> firebase_admin.App:
    """Inicializa ou retorna a instância compartilhada do Firebase Admin SDK."""
    if firebase_admin._apps:  # type: ignore[attr-defined]
        return firebase_admin.get_app()

    if settings.firebase_credentials_path:
        cred: credentials.Base = credentials.Certificate(
            settings.firebase_credentials_path
        )
    else:
        cred = credentials.ApplicationDefault()

    logger.info("Inicializando Firebase Admin SDK.")
    return firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})


def get_firestore_client() -> firestore.Client:
    """Retorna um cliente Firestore pronto para uso."""
    app = get_firebase_app()
    return firestore.client(app=app)  # type: ignore[no-any-return]
