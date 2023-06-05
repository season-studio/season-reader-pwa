const webpack = require('webpack');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const fs = require("fs");
const zip = require("@zip.js/zip.js");

/* global require, module, process, __dirname */

const inDevServer = process.env.WEBPACK_DEV_SERVER || process.env.WEBPACK_SERVE;

function getPassword(_prompt) {
    return new Promise(resolve => {
        try {
            _prompt && process.stdout.write(_prompt);
        
            const stdin = process.stdin;
            stdin.resume();
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');
        
            let password = '';
            stdin.on('data', function (ch) {
                ch = ch.toString('utf8');
                
                if (ch.length === 1) {
                    switch (ch) {
                        case "\u001b":
                        case "\u0008":
                            // skip controller character
                            break;

                        case "\n":
                        case "\r":
                        case "\u0004":
                            // They've finished typing their password
                            process.stdout.write('\n');
                            stdin.setRawMode(false);
                            stdin.pause();
                            resolve(password);
                            break;

                        case "\u0003":
                            // Ctrl-C
                            stdin.setRawMode(false);
                            stdin.pause();
                            resolve(undefined);
                            break;
                        default:
                            // More passsword characters
                            process.stdout.write('*');
                            password += ch;
                            break;
                    }
                }
            });
        } catch {
            resolve(undefined);
        }
    });
}

const PackPlugins = {
    apply: (compiler) => {
        compiler.hooks.afterEmit.tapPromise('PackPlugins', async (compilation) => {
            let cpkgsSrc = [];
            let pkgsSrc = [];
            compilation.entries.forEach((src, name) => {
                name = String(name);
                if (name.startsWith("crypt-plugin-")) {
                    cpkgsSrc.push({name: name.substring(13) , src});
                } else if (name.startsWith("plugin-")) {
                    pkgsSrc.push({name: name.substring(7) , src});
                }
            });
            let zipOpt = {};
            if (cpkgsSrc.length > 0) {
                const password = (inDevServer ? "123" : await getPassword("package password: "));
                if (password) {
                    zipOpt.password = password;
                }
            }
            const outputDir = path.join(compilation.outputOptions.path, "plugins");
            fs.mkdirSync(outputDir, { recursive: true });
            let fn = async (item) => {
                let itemSrcPath = path.resolve(compilation.outputOptions.path, item.src.options.filename);
                let itemSrcBuffer = fs.readFileSync(itemSrcPath);
                let itemSrcBlob = new Blob([itemSrcBuffer.buffer]);
                let zipPkg = new zip.fs.FS();
                zipPkg.addBlob("index", itemSrcBlob, zipOpt);
                let targetData = await zipPkg.exportUint8Array();
                fs.writeFileSync(path.join(outputDir, item.name), targetData);
            }
            cpkgsSrc.forEach(fn);
            zipOpt = {};
            pkgsSrc.forEach(fn);
        });
    }
}

module.exports = async (env, options) => {
    let count = 0;
    const dev = options.mode === "development";
    const config = {
        devtool: "source-map",
        entry: {
            polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
            vendor: ["react", "react-dom", "core-js"],
            index: ["react-hot-loader/patch", "./src/index.js", "./src/index.html"],
            sw: ["core-js/stable", "regenerator-runtime/runtime", "./src/sw.js"],
            "crypt-plugin-snsq": {
                import: ["core-js/stable", "regenerator-runtime/runtime", "./plugins/snsq/index.js"],
                filename: "../.plugins/snsq.js",
            }
        },
        output: {
            clean: true,
            path: path.join(__dirname, '.dist'),
            filename: '[name].js'
        },
        resolve: {
            extensions: [".ts", ".tsx", ".html", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: [
                        "react-hot-loader/webpack",
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/preset-env"],
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [{
                        loader: 'style-loader',
                        options: {
                            insert: function (element, opt) {
                                document.head.appendChild(element);
                            },
                        },
                    }, 'css-loader']
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                        },
                    },
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: "html-loader",
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico)$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/[name][ext][query]",
                    },
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                PackStamp: `"${Date.now()}"`
            }),
            new HtmlWebpackPlugin({
                filename: "index.html",
                template: "./src/index.html",
                chunks: ["polyfill", "vendor", "index"],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "assets/*",
                        to: "assets/[name][ext][query]",
                    }
                ],
            }),
            new webpack.ProvidePlugin({
                Promise: ["es6-promise", "Promise"],
            }),
            PackPlugins
        ],
        devServer: {
            allowedHosts: ['localhost', 'test.season-studio.top'],
            static: {
                directory: path.join(__dirname, ".dist"),
                publicPath: "",
            },
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            server: {
                type: "https",
                //options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
                options: {
                    key: fs.readFileSync(path.join(__dirname, ".keys/test.season-studio.top.key")),
                    cert: fs.readFileSync(path.join(__dirname, ".keys/test.season-studio.top.pem"))
                }
            },
            port: process.env.npm_package_config_dev_server_port || 3000,
        },
        performance: {
            hints: false, // 枚举
            maxAssetSize: 30000000, // 整数类型（以字节为单位）
            maxEntrypointSize: 50000000, // 整数类型（以字节为单位）
            assetFilter: function (assetFilename) {
                // 提供资源文件名的断言函数
                return assetFilename.endsWith(".css") || assetFilename.endsWith(".js");
            }
        }
    };

    return config;
};
