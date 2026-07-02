"""Convenção de data/hora: armazenamento e comparação sempre em UTC (aware).

O timezone do negócio (settings.business_timezone) só interpreta horários
locais — jornada de trabalho e slots de disponibilidade.
"""
from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings


def business_tz() -> ZoneInfo:
    return ZoneInfo(settings.business_timezone)


def agora_utc() -> datetime:
    return datetime.now(timezone.utc)


def para_utc(momento: datetime) -> datetime:
    if momento.tzinfo is None:
        momento = momento.replace(tzinfo=business_tz())
    return momento.astimezone(timezone.utc)


def combinar_local(dia: date, hora: time) -> datetime:
    local = datetime.combine(dia, hora, tzinfo=business_tz())
    return local.astimezone(timezone.utc)


def limites_do_dia(dia: date) -> tuple[datetime, datetime]:
    inicio = combinar_local(dia, time(0, 0))
    fim = combinar_local(dia, time(23, 59, 59, 999999))
    return inicio, fim


def dia_semana_local(momento: datetime) -> int:
    return momento.astimezone(business_tz()).weekday()


def data_local(momento: datetime) -> date:
    return momento.astimezone(business_tz()).date()


def formatar_local(momento: datetime) -> str:
    return momento.astimezone(business_tz()).strftime("%d/%m/%Y às %H:%M")
