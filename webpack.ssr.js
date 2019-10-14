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

// 多页面应用打包通用方案:
// 文件目录必须按照规范  每个页面按照名称放在src文件夹下，每个文件夹包括js，css，html模板文件
// 使用glob插件获取所有页面文件夹的名称，生产对应的entry和htmlWebpackPlugin
const setMPA=()=>{
    let entry={},htmlWebpackPlugin=[]
    let arr=glob.sync(path.join(__dirname,'./src/*/index-server.js'))
    arr.map((item)=>{
        let pageName=/\/src\/(.+)\/index-server.js$/.exec(item)[1]
        if(pageName){
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
        }
    })
    return {
        entry,
        htmlWebpackPlugin
    }
}

const {entry,htmlWebpackPlugin}=setMPA()


module.exports={
    entry:entry,
    output:{
        // server render 不需要hash值
        filename:'[name]-server.js',
        path:path.join(__dirname,'dist'),
        // 设置成umd是因为server render只支持commonjs格式文件
        libraryTarget: 'umd'
        // 用于导出默认exports，让使用时更方便
        // ,libraryExport: 'default'
    },
    // production,development,none
    // 会设置process.env.NODE_ENV的值，并且添加默认的内置plugins
    mode:'none',
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
                    }
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
        ,...htmlWebpackPlugin
    ]
}

// SSR(server side render)
/*
    页面打开过程分析（其中1-2的过程中会出现白屏）：
    1.页面开始加载
    2.html加载成功并开始加载数据（js，css）（此时页面还是空屏因为数据组装和填充都在JS逻辑里面）
    3.数据加载成功，渲染成功开始加载图片资源（此时页面才有了展示内容，可以进行交互了）
    4.图片加载成功，可以交互

    html+js+css+data=>渲染之后的html
    服务端渲染优势：
    1.所有资源文件都存储在服务器端
    2.内网拉取数据更快（比在客服端发起http请求或者ajax更快）
    3.一个html返回所有内容

    流程:
    html请求 => server端找到html模板和data进行拼装 => 客户端渲染html并请求js(此处js为非首屏的JS逻辑代码)(首屏可完全交互) => 整页面可完全交互

                客户端渲染                          服务器渲染
    请求        多个请求（HTML，资源，数据）          一个请求（所有都是server render的情况下）
    加载过程    HTML和数据串行加载                   一个请求返回HTML和所有数据
    渲染        前端渲染                            服务器渲染
    可交互      图片等静态资源加载完成，JS代码逻辑执行完成可交互

    总结:
    SSR的核心是减少请求（数据请求和资源文件请求）
    SSR为了减少白屏时间，对于SEO更友好

    SSR 实现思路
    服务端:
        使用 react-dom/server 的 renderToString 方法将React组件渲染成字符串（前端代码无法在服务器端使用，例如前端代码中使用了window，document等前端对象）
        服务端路由返回对应的模板
    客户端:
        打包出针对服务端的组件（根据环境变量判断）

    webpack打包SSR问题
    1.浏览器的全局变量（Node.js中没有document和window）
        使用hack，在server.js中添加window和document对象
        组件适配：将不兼容的组件根据打包环境进行配置
            1)output添加libraryTarget:'umd'
            2)把组件中的 ReactDOM.render 改成commonjs的 module.exports = <Search/>
            3)把组件中的 import from 改成commonjs的 require
        fetch或者ajax等写法改成axios或者isomorphic-fetch
    2.样式问题（无法显示）
        使用ignore-loader忽略css的解析

    server文件中使用html模板文件和占位符实现css样式加载
    const template=fs.readFileSync(path.join(__dirname,'../dist/search.html'),'utf-8')
    template.replace('<!--HTML_PLACEHOLDER-->',str)
 */