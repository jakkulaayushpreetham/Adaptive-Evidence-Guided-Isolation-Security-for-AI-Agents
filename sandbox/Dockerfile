FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN useradd \
    --create-home \
    --uid 10001 \
    --shell /usr/sbin/nologin \
    aegisagent

WORKDIR /app

COPY entrypoint.py /app/entrypoint.py

RUN mkdir -p \
    /workspace/input \
    /workspace/output \
    && chown -R aegisagent:aegisagent \
       /app \
       /workspace

USER aegisagent

ENTRYPOINT ["python", "/app/entrypoint.py"]
