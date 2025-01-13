import withBundleAnalyzer from "@next/bundle-analyzer"
import withTM from "next-transpile-modules"

/**
 * @type {import('next').NextConfig}
 */
const config = {
  webpack: (config, _options) => {
    /** Add glslify loader to webpack */
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"]
    })

    return config
  }
}

const createConfig = (_phase, { defaultConfig: _ }) => {
  const plugins = [
    withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" }),
    withTM([]) // añade los módulos que quieres transpilar aquí
  ]
  return plugins.reduce((acc, plugin) => plugin(acc), { ...config })
}

export default createConfig
