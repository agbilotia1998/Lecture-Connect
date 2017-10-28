#!/bin/bash

node serve.js \
  --port 8443 \
  --key node_modules/localhost.daplie.me-certificates/privkey.pem \
  --cert node_modules/localhost.daplie.me-certificates/fullchain.pem \
  --root node_modules/localhost.daplie.me-certificates/root.pem \
  -c "$(cat node_modules/localhost.daplie.me-certificates/root.pem)" &

PID=$!

sleep 1
curl -s --insecure http://localhost.daplie.me:8443 > ./root.pem
curl -s https://localhost.daplie.me:8443 --cacert ./root.pem

rm ./root.pem
kill $PID 2>/dev/null
