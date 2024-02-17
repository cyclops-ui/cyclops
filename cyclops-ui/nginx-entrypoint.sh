#!/bin/sh

WWW_DIR=/usr/share/nginx/html

ENV_SRC="${WWW_DIR}/env.js"
ENV_DST="${WWW_DIR}/env-config.js"

envsubst < "${ENV_SRC}" > "${ENV_DST}"
envsubst '${REACT_APP_CYCLOPS_CTRL_HOST}' < /default-nginx.conf > /etc/nginx/conf.d/default.conf

[ -z "$@" ] && nginx -g 'daemon off;' || $@
