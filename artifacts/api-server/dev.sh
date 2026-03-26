#!/bin/bash
# Start API server in dev mode. If port 8080 is already in use (e.g. by the
# "Start Backend" workflow), sleep to keep the artifact workflow alive without
# competing for the port.
if fuser -n tcp 8080 2>/dev/null; then
  echo "Port 8080 is already in use — API server is running via Start Backend workflow"
  exec sleep infinity
else
  export PORT=8080
  exec pnpm --filter @workspace/api-server run dev
fi
