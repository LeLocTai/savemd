const path = require('path')
const WebExtensionPlugin = require('webpack-target-webextension')
const CopyPlugin = require('copy-webpack-plugin');
const { env } = require('process');
const { ProvidePlugin, optimize } = require('webpack');

const mode = env.NODE_ENV === 'development' ? 'development' : 'production'
const isProduction = mode !== 'development'

module.exports = {
    mode,
    entry: {
        popup: './src/popup/popup.ts',
        options: './src/option/options.ts',
        content: './src/content.ts'
    },
    devtool: isProduction ? undefined : 'eval-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
        },
    },
    plugins: [
        new optimize.LimitChunkCountPlugin({
            maxChunks: 1
        }),
        new ProvidePlugin({
            process: 'process/browser',
        }),
        new WebExtensionPlugin({
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: '**/*.{png,svg,html}',
                    context: './src',
                    to: "[name][ext]" // flatten dir
                },
                {
                    from: "./src/manifest.json",
                    to: "manifest.json",
                    transform(buffer)
                    {
                        if (isProduction)
                            return buffer

                        const manifest = JSON.parse(buffer.toString())
                        manifest.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self';"
                        return JSON.stringify(manifest, null, 2)
                    }
                }
            ],
        }),
    ],
};