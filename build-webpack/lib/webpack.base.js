'use strict'

/* 
    基本配置
    资源解析
        1.解析ES6
        2.解析React
        3.解析Css
        4.解析Sass
        5.解析图片
        6.解析字体
    样式增强
        1.css前缀补齐
        2.css px转rem
    目录清理
    多页面打包
    命令行信息显示优化
    错误捕获和处理
    CSS提取成一个单独的文件
*/


const path=require('path')
const {CleanWebpackPlugin} =require('clean-webpack-plugin')
const HtmlWebpackPlugin=require('html-webpack-plugin')
const MiniCssExtractPlugin =require('mini-css-extract-plugin')
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
    entry:entry,
    module:{
        rules:[
            {
                test:/\.js$/,
                use:[
                    'babel-loader'
                ]
            },
            {
                test:/\.css$/,
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
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
                    {
                        loader:'px2rem-loader',
                        options:{
                            // 换算的比例
                            remUnit:75,
                            // 小数点位数
                            remPrecesion:8
                        }
                    }
                ]
            },
            {
                test:/\.(jpe?g|gif|svg)$/,
                use:{
                    loader:'url-loader',
                    options:{
                        limit:10240
                    }
                }
            },
            {
                test:/\.(jpe?g|gif|svg)$/,
                use:{
                    loader:'file-loader',
                    options:{
                        // 
                        name:'img/[name]_[hash:8].[ext]'
                    }
                }
            },
            // 字体文件处理
            {
                test:/.(woff|woff2|eot|ttf|otf)$/,
                use:'file-loader'
            }
        ]
    },
    plugins:[
        new MiniCssExtractPlugin({
            filename:'[name]_[contenthash:8].css'
        }),
        new CleanWebpackPlugin(),
        new FriendlyErrorsWebpackPlugin(),
        function(){
            this.hooks.done.tap('done',(stats)=>{
                if(stats.compilation.errors&&stats.compilation.errors.length&&process.argv.indexOf('--watch')==-1){
                    console.log('build error')
                    process.exit(1)
                }
            })
        },
        ...htmlWebpackPlugin
    ],
    stats:'errors-only'
}