const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: process.env.REACT_APP_CYCLOPS_CTRL_HOST,
      changeOrigin: true,
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
    }),
  );
};
