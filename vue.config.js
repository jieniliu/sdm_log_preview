const { defineConfig } = require('@vue/cli-service')

module.exports = {
  publicPath: '/sdm_log_preview/', // 👈 用 publicPath 而不是 base
  transpileDependencies: true,
  devServer: {
    port: 8080,
    open: true
  }
}
