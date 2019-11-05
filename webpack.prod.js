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
const FriendlyErrorsWebpackPlugin=require('friendly-errors-webpack-plugin')

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
            {
                test:/\.(jpe?g|gif|svg)$/,
                use:{
                    loader:'url-loader',
                    options:{
                        limit:10240
                    }
                }
            },
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
            },
            // 字体文件处理
            {
                test:/.(woff|woff2|eot|ttf|otf)$/,
                use:'file-loader'
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
        ,new FriendlyErrorsWebpackPlugin()
        ,function(){
            // 手动的错误处理抛出，可以用来上报错误日志，统计构建失败率和次数。
            // this为compile对象
            // 此处是webpack4的写法，webpack3改成 this.plugin即可
            this.hooks.done.tap('done',(stats)=>{
                if(stats.compilation.errors&&stats.compilation.errors.length&&process.argv.indexOf('--watch')==-1){
                    console.log('build error')
                    process.exit(1)
                }
            })
        }
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
    // 命令行反馈展示 设置stats
    ,stats:'errors-only'
}



// entry
// 单入口
// entry:''
// 多入口
// entry:{
//  app:'',
//  app2:''
// }

// output
// {filename:'[name]',path:''}
// 使用占位符实现多出口

// loaders
// webpack原生只支持js和json格式文件的解析，如果想让webpack解析其他格式的文件，需要添加
// 对应的loaders，将其转换成有效的模块，并且可以添加到依赖树中。
// loader本身是一个函数，接收源文件作为参数，返回转换之后的结果。
// 常见的loader
// babel css less sass ts file raw-loader thread-loader

// Plugins
// 用于增强webpack的功能：用于bundle文件的优化，资源管理和环境变量的注入。作用于整个构建过程。
// 任何loaders无法完成的事情都可以让Plugins做。
// CommonsChunkPlugin
// CleanWebpackPlugin
// ExtraTextWebpackPlugin ...
// HtmlWebpackPlugin

// css-loader 用于加载.css的文件，并且转换成commonjs对象，可以在js中使用
// style-loader 向DOM里面插入CSS样式，使得样式可以使用(将样式通过<style>标签插入到head中)
// less-loader sass-loader 将less文件或者sass文件转换为css文件
// rules中的use是链式调用的，并且是从右到左的顺序，所以是['style-loader','css-loader','sass-loader'] (tip:此处使用的是compose方法)

// npm 后缀 -D 相当于 --save-dev  -S 相当于 --save

// 生成默认的package.json包文件 npm init -y

// 文件指纹
// 用来实现版本管理。利用缓存。
// Hash:和整个项目构建相关，只要有一个文件发生变化，Hash就会发生变化，多入口时则会有问题，会每次更改所有entry文件的hash
// Chunkhash:模块hash，不同的entry有不同的chunk  ，js指纹采用Chunkhash（多入口时很有效）
// Contenthash:内容hash css采用Contenthash，如果使用Chunkhash，那么更改js时，也会更改css的hash，所以采用Contenthash

// mini-css-extract-plugin
// 将css分离打包成单独的文件

// 文件压缩：html，css，js
// webpack 内置了js的压缩 uglifyjs-webpack-plugin
// css压缩使用：optimize-css-assets-webpack-plugin（实测不需要）
// html的压缩：html-webpack-plugin

// postcss autoprefixer 插件完成自动添加前缀

// css自动rem转换为px
// https://github.com/amfe/lib-flexible 阿里官方设置font-size的插件，由于viewport已经被众多浏览器兼容，所以
// 使用vw作为单位，不再使用rem。

// 静态资源内联
// 原因：
// 代码层面 
// 1.页面框架的初始化脚本，比如如果使用了px2rem时的 lib-flexible需要放在head中内联
// 2.上报打点，比如pagestart，css，js开始加载和请求结束的上报
// 3.样式内联，避免页面闪动（style-loader）
// 请求层面
// 1.减少http请求次数 （url-loader）（小图片或者字体）
// html内联 raw-loader （raw-loader可以将文件转换成字符串）
// js内联 raw-loader 
// css内联 1.style-loader  
//         2.html-inline-css-webpack-plugin  

// 多页面应用（MPA）
// 详细见setMPA方法

// 提取页面公共资源
// 1.利用html-webpack-externals-plugin插件完成公共资源文件的分离处理，将文件采用script cdn的方式直接引入，打包bundle的时候不会再次引入
// 2.使用内置的SplitChunksPlugin进行分离，会把公共资源文件单独打包成vendor文件，并且注入。

// tree shaking（摇树优化）
// uglify阶段去除掉没有用到的文件中的方法(例如只引用了某个js文件中的一个方法，但是却要引入整个文件)
// 必须使用es6方式编写的方法，通过静态分析代码的import来判断是否用到了文件中的方法
// 使用mode:production将默认开启tree shaking
// 注意tree shaking的原则 
// DCE:即死码消除，编译器原理中，死码消除（Dead code elimination）
// 1.代码不会被执行                 import a from '...'   if(false){a()}
// 2.代码执行的结果没有被使用        import a from '...'   a()
// 3.代码只会影响死变量(只写不读)    import a from '...'  let result=a() 但是ar没有被使用

// Scope Hoisting(webpack4中mode设置为production默认开启) 详情请看webpack.test.js

// 代码分割
// 1.抽离相同代码到一个共享块 （splitChunkPlugin分离common和vendor）
// 2.脚本懒加载，使初试下载的代码更小（比如首屏或者tab切换）（代码在真正需要时再加载）
//  懒加载JS的方式
//  1. CommonJS: require.ensure
//  2. ES6:动态import 原生不支持，需要babel转换 (使用babel的 "@babel/plugin-syntax-dynamic-import"插件实现)

// ESLint 落地:
// 1.git的CI/CD系统集成
// 2.和webpack集成
// 依赖 eslint, eslint-plugin-import, eslint-plugin-react, eslint-plugin-react-hooks, and eslint-plugin-jsx-a11y
//      eslint-loader

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

/*
    优化构建时命令行显示日志:
    统计信息 stats
    stats:'errors-only' 命令行显示太单一，没有明显标识 
    使用 friendly-errors-webpack-plugin 
*/

/*
    构建失败上报和统计
    手动的错误处理抛出，可以用来上报错误日志，统计构建失败率和次数。
    this.hooks.done.tap('done',(stats)=>{
        if(stats.compilation.errors&&stats.compilation.errors.length&&process.argv.indexOf('--watch')==-1){
            console.log('build error')
            process.exit(1)
        }
    })
*/


/*
    ** 注意：字符串匹配和查找方案：RegExp的exec 和 String的match
    使用RegExp的exec时正则加不加g返回的结果都一样
    /\/src\/(.+)\/index.js$/.exec('E:/project/learn_webpack/src/search/index.js')
    // (2) ["/src/search/index.js", "search", index: 24, input: "E:/project/learn_webpack/src/search/index.js", groups: undefined]0: "/src/search/index.js"1: "search"groups: undefinedindex: 24input: "E:/project/learn_webpack/src/search/index.js"length: 2__proto__: Array(0)
    /\/src\/(.+)\/index.js$/g.exec('E:/project/learn_webpack/src/search/index.js')
    // (2) ["/src/search/index.js", "search", index: 24, input: "E:/project/learn_webpack/src/search/index.js", groups: undefined]0: "/src/search/index.js"1: "search"groups: undefinedindex: 24input: "E:/project/learn_webpack/src/search/index.js"length: 2__proto__: Array(0)
    使用String的match时，如果添加了g，则只返回完全匹配的字符串或者null，不返回捕获组，
        如果没添加g，则返回完全匹配的字符串和捕获组，或者null，此时，返回的结果和 RegExp的exec返回结果一致
    'E:/project/learn_webpack/src/search/index.js'.match(/\/src\/(.+)\/index.js$/)
    // (2) ["/src/search/index.js", "search", index: 24, input: "E:/project/learn_webpack/src/search/index.js", groups: undefined]
    'E:/project/learn_webpack/src/search/index.js'.match(/\/src\/(.+)\/index.js$/g)
    // ["/src/search/index.js"]
*/

/*
    --save 和 --save-dev 的区别
    --save是运行时依赖，--save-dev是开发时依赖
    npm自己的文档说dependencies是运行时依赖，devDependencies是开发时的依赖。
    即devDependencies 下列出的模块，是我们开发时用的，比如 我们安装 js的压缩包
    gulp-uglify 时，我们采用的是 “npm install –save-dev gulp-uglify ”命令安装，
    因为我们在发布后用不到它，而只是在我们开发才用到它。dependencies 下的模块，则是
    我们发布后还需要依赖的模块，譬如像jQuery库或者Angular框架类似的，我们在开发完后后
    肯定还要依赖它们，否则就运行不了。

    void 0 与 undefined 的区别
    1.undefined可以被重写
    undefined 在 ES5 中已经是全局对象的一个只读（read-only）属性了，它不能被重写。但是在局部作用域中，还是可以被重写的。
    (function() {
        var undefined = 10;
        // 10 -- chrome
        alert(undefined);
    })();
    void 运算符能对给定的表达式进行求值，然后返回 undefined。也就是说，void 后面你随便跟上一个表达式，返回的都是 undefined，如 void (2), void (‘hello’)。并且void是不能被重写的。但为什么是void 0 呢，void 0 是表达式中最短的。用 void 0 代替 undefined 能节省字节。不少 JavaScript 压缩工具在压缩过程中，正是将 undefined 用 void 0 代替掉了。
*/