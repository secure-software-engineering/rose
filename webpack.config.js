module.exports = {
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                exclude: /node_modules/,
                query: {
                    plugins: ['transform-runtime', 'transform-async-to-generator'],
                    presets: ['es2015']
                }
            },
            { loader: 'json-loader', test: /\.json$/ }
        ]
    },
    plugins: []
}
