FROM nginx:stable-alpine

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/site.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx index.html elixir.html assinatura.html perfume-social.html elixir-apresentacao.html assinatura-apresentacao.html perfume-apresentacao.html /usr/share/nginx/html/
COPY --chown=nginx:nginx assets/ /usr/share/nginx/html/assets/

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
