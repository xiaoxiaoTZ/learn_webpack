'use strict'

const path=require('path')
const webpack =require('webpack')
const MiniCssExtractPlugin =require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin=require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin=require('html-webpack-plugin')
const {CleanWebpackPlugin} =require('clean-webpack-plugin')
const glob=require('glob')
// use pre-packaged vendor bundles 用于预打包公共资源包
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')

// console.log('glob',glob.sync(path.join(__dirname,'./src/*/index.js')))
// [ 'E:/project/learn_webpack/src/index/index.js',
//   'E:/project/learn_webpack/src/search/index.js' ]
// 多页面应用打包通用方案:
// 文件目录必须按照规范  每个页面按照名称放在src文件夹下，每个文件夹包括js，css，html模板文件
// 使用glob插件获取所有页面文件夹的名称，生产对应的entry和htmlWebpackPlugin
const setMPA=()=>{
    let entry={},htmlWebpackPlugin=[]
    let arr=glob.sync(path.join(__dirname,'./src/*/index.js'))
    arr.map((item)=>{
        let pageName=/\/src\/(.+)\/index.js$/.exec(item)[1]
        entry[pageName]=item
        htmlWebpackPlugin.push(
            new HtmlWebpackPlugin({
                // 模板文件位置
                template:path.join(__dirname,`src/${pageName}/index.html`),
                // 生成文件的名称
                filename:`${pageName}.html`,
                // 使用哪些chunk，此处和entry设置的一致,如果没有设置,则为main
                // chunks里的顺序与最后注入的顺序无关
                // 实测发现如下所示，无论如何更改，最后注入的顺序都是 commons,vendors,pageName
                chunks:["commons","vendors",pageName],
                // 自动注入css和js，所以模板中不需要再次引入js和css
                inject:true,
                // 设置压缩参数
                minify:{
                    html5:true,
                    collapseWhitespace:true,
                    preserveLineBreaks:false,
                    minifyCSS:true,
                    minifyJS:true,
                    removeComments:false
                }
            })
        )
    })
    return {
        entry,
        htmlWebpackPlugin
    }
}

const {entry,htmlWebpackPlugin}=setMPA()


module.exports={
    // 单入口 采用字符串的方式生成的文件名称为main，采用对象的方式则可以设置生成的文件名称
    // entry:'./src/search.js',
    // 多入口
    // entry:{
    //     // app:'./src/app.js',
    //     search:'./src/search.js'
    // },
    entry:entry,
    output:{
        // [name] 利用占位符实现多入口的输出打包
        // js的文件指纹使用chunkhash,chunkhash对应一个入口文件的所有文件，如果任意js或者css更改了，chunkhash都会更改
        filename:'[name]_[chunkhash:8].js',
        path:path.join(__dirname,'dist')
    },
    // production,development,none
    // 会设置process.env.NODE_ENV的值，并且添加默认的内置plugins
    mode:'production',
    module:{
        rules:[
            {
                test:/\.js$/,
                use:[
                    'babel-loader'
                    // ,'eslint-loader'
                ]
            },
            {
                test:/\.css$/,
                // MiniCssExtractPlugin.loader
                // 'style-loader'
                use:[MiniCssExtractPlugin.loader,'css-loader']
            },
            {
                test:/\.scss$/,
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                    // 使用postcss的autoprefixer添加浏览器前缀
                    {
                        loader:'postcss-loader',
                        options:{
                            plugins:[
                                require('autoprefixer')
                            ]
                        }
                    },
                    // px2rem的转换
                    // {
                    //     loader:'px2rem-loader',
                    //     options:{
                    //         // 换算的比例
                    //         remUnit:75,
                    //         // 小数点位数
                    //         remPrecesion:8
                    //     }
                    // }
                ]
            },
            // url-loader相比于file-loader可以做图片的base64转换，内部使用的是file-loader
            // {
            //     test:/\.(jpe?g|gif|svg)$/,
            //     use:{
            //         loader:'url-loader',
            //         options:{
            //             limit:10240
            //         }
            //     }
            // }
            // 图片，字体的文件指纹设置 此处的hash对应的是contenthash，是根据文件的md5生成的
            {
                test:/\.(jpe?g|gif|svg)$/,
                use:{
                    loader:'file-loader',
                    options:{
                        // 
                        name:'img/[name]_[hash:8].[ext]'
                    }
                }
            }
        ]
    },
    plugins:[
        // MiniCssExtractPlugin插件用于提取独立的css文件，contenthash对应独立生成的css的文件指纹
        // contenthash对应文件本身，是根据md5生成的
        new MiniCssExtractPlugin({
            filename:'[name]_[contenthash:8].css'
        }),
        // css压缩（实测不添加webpack也会自动压缩）
        // new OptimizeCssAssetsPlugin({
        //     assetNameRegExp:/\.css$/g,
        //     // OptimizeCssAssetsPlugin依赖于cssnano(css处理器)
        //     cssProcessor:require('cssnano')
        // }),
        // 压缩html     一个页面对应一个 HtmlWebpackPlugin 
        // new HtmlWebpackPlugin({
        //     // 模板文件位置
        //     template:path.join(__dirname,'src/search.html'),
        //     // 生成文件的名称
        //     filename:'search.html',
        //     // 使用哪些chunk，此处和entry设置的一致,如果没有设置,则为main
        //     chunks:['search'],
        //     // 自动注入css和js，所以模板中不需要再次引入js和css
        //     inject:true,
        //     // 设置压缩参数
        //     minify:{
        //         html5:true,
        //         collapseWhitespace:true,
        //         preserveLineBreaks:false,
        //         minifyCSS:true,
        //         minifyJS:true,
        //         removeComments:false
        //     }
        // }),
        // 每次构建之前清理output指定的输出目录
        new CleanWebpackPlugin()
        // 利用html-webpack-externals-plugin插件完成公共资源文件的分离处理，将在html中直接引入，打包的bundle中不再引入
        // 建议将 HtmlWebpackExternalsPlugin 放在 htmlWebpackPlugin 之前，不然会自动注入，可能会注入多遍文件
        // ,new HtmlWebpackExternalsPlugin({
        //     externals: [
        //         {
        //             // 模块名称
        //             module: 'react',
        //             // cdn文件路径
        //             entry: 'https://unpkg.com/react@16/umd/react.production.min.js',
        //             // 模块exports的名称，就是文件中使用的名称，必须和使用时一致
        //             global: 'React'
        //         },
        //         {
        //             module: 'react-dom',
        //             entry: 'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js',
        //             global: 'ReactDOM'
        //         }
        //     ]
        // })
        ,...htmlWebpackPlugin
    ]
    // SplitChunksPlugin分离基础包（此插件为webpack4内置）
    ,optimization:{
        splitChunks:{
            minSize:0,
            cacheGroups:{
                vendors: {
                    test: /(react|react-dom)/,
                    name:'vendors',
                    chunks:'all'
                },
                // 至少被引用两次的公共文件
                commons:{
                    name:'commons',
                    chunks:'all',
                    // 最小引用次数
                    minChunks:2
                }
            }
        }
    }
}

// SSR
/*
    页面打开过程分析（其中1-2的过程中会出现白屏）：
    1.页面加载
    2.html加载成功并开始加载数据（js，css）
    3.数据加载成功，渲染成功开始加载图片资源
    4.图片加载成功，可以交互

    html+js+css+data=>渲染之后的html
    服务端：
    1.所有资源文件都存储在服务器端
    2.内网拉取数据更快（比在客服端发起http请求或者ajax更快）
    3.一个html返回所有内容

                客户端渲染                          服务器渲染
    请求        多个请求（HTML，资源，数据）          一个请求
    加载过程    HTML和数据串行加载                   一个请求返回HTML和所有数据
    渲染        前端渲染                            服务器渲染
    可交互      图片等静态资源加载完成，JS代码逻辑执行完成可交互

    总结：SSR的核心是减少请求（数据请求和资源文件请求）
    SSR为了减少白屏时间，对于SEO更友好

    SSR 实现思路
    服务端:
        使用 react-dom/server 的 renderToString 方法将React组件渲染成字符串
        服务端路由返回对应的模板
    客户端:
        打包出针对服务端的组件（前端代码无法在服务器端使用，例如前端代码中使用了window，document等前端对象）

 */