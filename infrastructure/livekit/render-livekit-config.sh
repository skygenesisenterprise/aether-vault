#!/bin/sh
set -eu

required_env() {
    name="$1"
    eval "value=\${$name:-}"
    if [ -z "$value" ]; then
        echo "missing required environment variable: $name" >&2
        exit 1
    fi
}

for key in \
    LIVEKIT_PORT \
    LIVEKIT_RTC_TCP_PORT \
    LIVEKIT_RTP_PORT_MIN \
    LIVEKIT_RTP_PORT_MAX \
    LIVEKIT_API_KEY \
    LIVEKIT_REDIS_ADDRESS \
    LIVEKIT_REDIS_PASSWORD \
    LIVEKIT_KEYS \
    LIVEKIT_WEBHOOK_URL
do
    required_env "$key"
done

render_livekit_keys() {
    printf '%s' "$LIVEKIT_KEYS" | tr ',' '\n' | while IFS= read -r pair; do
        [ -n "$pair" ] || continue

        key_name=${pair%%:*}
        key_secret=${pair#*:}

        if [ "$key_name" = "$pair" ] || [ -z "$key_name" ] || [ -z "$key_secret" ]; then
            echo "invalid LIVEKIT_KEYS entry: $pair" >&2
            exit 1
        fi

        printf '  %s: %s\n' "$key_name" "$key_secret"
    done
}

cat > /tmp/livekit.yaml <<EOF
port: ${LIVEKIT_PORT}
bind_addresses:
  - 0.0.0.0
rtc:
  tcp_port: ${LIVEKIT_RTC_TCP_PORT}
  port_range_start: ${LIVEKIT_RTP_PORT_MIN}
  port_range_end: ${LIVEKIT_RTP_PORT_MAX}
redis:
  address: ${LIVEKIT_REDIS_ADDRESS}
  password: ${LIVEKIT_REDIS_PASSWORD}
keys:
$(render_livekit_keys)
webhook:
  api_key: ${LIVEKIT_API_KEY}
  urls:
    - ${LIVEKIT_WEBHOOK_URL}
EOF

if command -v livekit-server >/dev/null 2>&1; then
    exec livekit-server --config /tmp/livekit.yaml
fi

if command -v livekit >/dev/null 2>&1; then
    exec livekit --config /tmp/livekit.yaml
fi

if [ -x /livekit-server ]; then
    exec /livekit-server --config /tmp/livekit.yaml
fi

echo "livekit executable not found in container" >&2
exit 127
