#!/usr/bin/env sh
# INFRA-001 sandbox sentinel.
#
# Proves the two isolation guarantees the Docker sandbox is supposed to provide:
#   1. The container CANNOT read files in the host home directory
#      (i.e. a malicious postinstall couldn't exfiltrate ~/.ssh).
#   2. The container has NO network access (run under network_mode: none),
#      so a second-stage payload can't be fetched and data can't be sent out.
#
# Run via:  docker compose run --rm sentinel
# Exit 0 = isolated as expected; non-zero = a guarantee was violated.

set -eu

fail() {
  echo "SENTINEL FAILED: $1" >&2
  exit 1
}

echo "== INFRA-001 sandbox sentinel =="

# ---------------------------------------------------------------------------
# 1. Host home directory must be unreachable.
#
# The host writes a marker file at $HOME/.jetlag-sandbox-sentinel before
# invoking this (see scripts/run-sandbox-sentinel.sh). Common host home paths
# are checked from inside the container; none should exist, because $HOME is
# never bind-mounted.
# ---------------------------------------------------------------------------
SENTINEL_NAME=".jetlag-sandbox-sentinel"
LEAKED=""
for d in /host-home /root /home/node "${HOST_HOME:-/nonexistent-host-home}"; do
  if [ -r "$d/$SENTINEL_NAME" ]; then
    LEAKED="$d/$SENTINEL_NAME"
    break
  fi
done
[ -z "$LEAKED" ] || fail "host home sentinel was readable from the container at: $LEAKED"

# Also make sure no SSH material is visible.
if [ -e /root/.ssh ] || [ -e /home/node/.ssh ] || [ -d "${HOST_HOME:-/nope}/.ssh" ]; then
  fail "an .ssh directory is visible inside the container"
fi
echo "  [ok] host home / ~/.ssh not reachable from container"

# ---------------------------------------------------------------------------
# 2. No network access.
#
# Under network_mode: none there are no usable interfaces beyond loopback and
# DNS/outbound connections must fail. We try a couple of cheap probes that do
# not depend on extra tooling being installed.
# ---------------------------------------------------------------------------
NET_OK=1

# node is always present in this image; attempt a DNS lookup + TCP connect.
if node -e '
  const dns = require("dns");
  const net = require("net");
  dns.lookup("example.com", (err) => {
    if (err) { process.exit(0); }          // lookup failed => no network, good
    const s = net.connect(80, "example.com");
    s.setTimeout(2000);
    s.on("connect", () => process.exit(42)); // connected => network LEAK
    s.on("timeout", () => process.exit(0));
    s.on("error",   () => process.exit(0));
  });
' 2>/dev/null; then
  : # exit 0 => no network reached, good
else
  rc=$?
  if [ "$rc" = "42" ]; then NET_OK=0; fi
fi
[ "$NET_OK" = "1" ] || fail "outbound network connection succeeded (expected none)"
echo "  [ok] no outbound network from container"

echo "SENTINEL PASSED: container is isolated from host home and network"
