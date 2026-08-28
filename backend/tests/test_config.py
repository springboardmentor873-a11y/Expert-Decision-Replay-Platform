from app.core.config import get_settings


def test_settings_load_from_environment() -> None:
    settings = get_settings()
    assert settings.app_name
    assert settings.secret_key
    assert settings.database_url.startswith("postgresql")
    assert settings.jwt_algorithm
    assert isinstance(settings.cors_origin_list, list)
    assert len(settings.cors_origin_list) >= 1
