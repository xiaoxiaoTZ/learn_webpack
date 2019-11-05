'use strict'

const path=require('path')
const webpack =require('webpack')
const {CleanWebpackPlugin} =require('clean-webpack-plugin')
// const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackPlugin=require('html-webpack-plugin')
const glob=require('glob')
const FriendlyErrorsWebpackPlugin=require('friendly-errors-webpack-plugin')

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
                chunks:[pageName],
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
    mode:'development',
    // 单入口
    // entry:'./src/search.js'
    entry:entry
    // 多入口
    // entry:{
    //   app:'./src/app.js',
    //   adminApp:'./src/adminApp.js'  
    // },
    ,output:{
        // [name] 利用占位符实现多入口的输出打包
        filename:'[name].bundle.js',
        path:path.join(__dirname,'dist'),
        publicPath: '/'
    }
    // production,development,none
    ,module:{
        rules:[
            {test:/\.js$/,use:'babel-loader'},
            {
                test:/\.css$/,
                use:['style-loader','css-loader']
            },
            {
                test:/\.scss$/,
                use:['style-loader','css-loader','sass-loader']
            },
            // {
            //     test:/\.(jpe?g|gif|svg)$/,
            //     use:'file-loader'
            // },
            {
                test:/\.(jpe?g|gif|svg)$/,
                use:{
                    loader:'url-loader',
                    options:{
                        limit:10240
                    }
                }
            }
        ]
    }
    // watch更新
    // ,watch:true
    // ,watchOption:{
    //     // 不监听的文件或者文件夹
    //     ignored:/node_modules/,
    //     // 监听到变化发生之后会等300ms再去执行，先把监听到的更改缓存起来，如果300ms内又有变化，则会和之前的更改一起缓存起来，直到300ms都没有变化再去重新构建bundle.js
    //     aggregateTimeout:300,
    //     // 判断文件是否发生变化的次数，方法是通过不停的询问系统指定文件的最后编辑时间有没有发生变化，下面表示每秒1000次
    //     poll:1000
    // }
    // wds热更新 生成的内容放在了内存中，没有像watch一样使用了I/O放在了磁盘中
    ,plugins:[
        new webpack.HotModuleReplacementPlugin(),
        new CleanWebpackPlugin(),
        // new HtmlWebpackPlugin({
        //   title: 'Development'
        // })
        // new CleanWebpackPlugin(),
        new FriendlyErrorsWebpackPlugin(),
        ...htmlWebpackPlugin
    ]
    ,devServer:{
        // 服务的基础目录
        contentBase: path.join(__dirname, "./dist"),
        port:9002,
        hot:true
        ,stats:'errors-only'
    }
    // 使用 source-map 进行调试可以方便的查看构建之前的源代码，非常的方便
    // ,devtool: 'source-map',
    // source-map 类型
    ,devtool:'source-map'
}


// 开启监听模式
// 在启动webpack时添加--watch
// webpack --watch
// watch模式缺陷：不会自动刷新浏览器，需要手动刷新
// 文件监听原理：
// 首先记录初始的文件最后修改时间，然后轮询的去检查文件的最后修改时间，如果有变化就记录下来，
// 但是注意，此时不会立刻去重新打包，而是等待一定(aggregateTimeout)时间，如果此时间段内还有文件变化
// 再记录下来，最后把需要更新的文件列表统一更新到bundle文件中。(注意，watch模式下会更新磁盘文件)

// 热更新及原理
// webpack-dev-server
// 1.wds不刷新页面
// 2.wds不输出文件，生成的文件放在内存中，效率更高
// 3.需要使用HotModuleReplacementPlugin插件
// --open每次启动时自动打开一个页面

// 热更新另一种方式 webpack-dev-middleware
// 将webpack输出的文件传给服务器，使用更加灵活

// 使用 devtool source-map 可以很方便的调试代码，代码为压缩处理之前的源文件 ☆☆☆
// devtool:'source-map'