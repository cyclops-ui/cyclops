const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: process.env.REACT_APP_CYCLOPS_CTRL_HOST,
            changeOrigin: true,
            pathRewrite: {
                '^/api': ''
            }
        })
    )
}
