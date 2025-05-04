const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware(
      (pathname) => {
        return pathname.startsWith("/api");
      },
      {
        target: process.env.REACT_APP_CYCLOPS_CTRL_HOST,
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          "^/api": "",
        },
        onProxyReq: (proxyRes, req, res) => {
          res.on("close", () => proxyRes.destroy());
        },
        onProxyRes: (proxyRes, req, res) => {
          proxyRes.on("close", () => {
            if (!res.writableEnded) {
              res.end();
            }
          });

          proxyRes.on("end", () => {
            if (!res.writableEnded) {
              res.end();
            }
          });
        },
      },
    ),
  );
};
