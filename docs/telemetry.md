# Voice send telemetry

The bot uses `npm:grammy@1.46.0` and `@grammyjs/opentelemetry@0.1.1`, following
`context-tg`. Service name: `ouhyesbot`; instrumentation scope:
`grammyjs-opentelemetry`. The plugin exports API/update traces and structured
log events via OTLP/HTTP.

Each successful inline or guest answer emits `voice_send` with these attributes:

| Attribute    | Values                                   |
| ------------ | ---------------------------------------- |
| `event_type` | `voice_send` (explicit SQL filter)       |
| `chat_type`  | `private`, `group`, `channel`, `unknown` |
| `mode`       | `inline`, `guest`                        |

Supergroups count as `group`; inline `sender` counts as `private`. Telegram may
omit inline chat type, which becomes `unknown`. Channels remain `channel`.
Failed answers and the one-time setup upload do not count as sends.

An inline event means Telegram accepted the result list, not that the user chose
and sent the voice. Inline result caching is disabled so subsequent queries
reach the bot. Guest events mean Telegram accepted the voice reply.

## Compose

Compose joins the existing external `dev-infra` network and defaults to
`OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-ingester:4318`, matching
`context-tg`. The collector/network must already exist. Override the endpoint
and optional `OTEL_EXPORTER_OTLP_HEADERS` in `.env` as needed; Compose forwards
`.env` to the container. Run `docker compose up -d` to apply changes.

## SigNoz panels

Add the SQL files as ClickHouse log timeseries panels with legend
`{{__name__}}`:

- `signoz-sends-by-chat-type.sql`: counts by chat type.
- `signoz-sends-by-mode.sql`: counts by inline/guest mode.

Create these dashboard variables, following `context-tg`:

| Variable    | Selection | Values / default                                                       |
| ----------- | --------- | ---------------------------------------------------------------------- |
| `bucket`    | Single    | `minute`, `hour`, `day`; default `minute`                              |
| `chat_type` | Multiple  | `__all__`, `private`, `group`, `channel`, `unknown`; default `__all__` |
| `mode`      | Multiple  | `__all__`, `inline`, `guest`; default `__all__`                        |

The queries use the dashboard time range, time-bounded resource fingerprints,
and an explicit `event_type` filter to count only voice send events.

Compose starts the bot directly. Set `BOT_TOKEN` and `VOICE_FILE_ID` in `.env`.
It does not check, hash, or upload the audio. The `--upload CHAT_ID` command
remains available for manual setup.
