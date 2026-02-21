import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration


def init_sentry():
    """Initialize Sentry SDK for backend error tracking.
    Only activates if SENTRY_DSN environment variable is set.
    """
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        print("[Sentry] No SENTRY_DSN set — skipping initialization")
        return

    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
        traces_sample_rate=1.0,
        send_default_pii=True,
        environment=os.environ.get("ENVIRONMENT", "development"),
    )
    print("[Sentry] Initialized successfully")
