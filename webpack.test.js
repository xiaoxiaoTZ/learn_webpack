'use strict'

const path=require('path')
const {CleanWebpackPlugin}=require('clean-webpack-plugin')
const webpack=require('webpack')

module.exports={
    entry:'./test/b.js',
    output:{
        filename:'[name]_[chunkhash:8].js',
        path:path.join(__dirname,'dist')
    },
    // production,development,none
    // 会设置process.env.NODE_ENV的值，并且添加默认的内置plugins
    mode:'none',
    module:{
        rules:[
            {test:/\.js$/,use:'babel-loader'}
        ]
    },
    plugins:[
        // 每次构建之前清理output指定的输出目录
        new CleanWebpackPlugin()
        // 手动开启 scope hoisting
        ,new webpack.optimize.ModuleConcatenationPlugin()
    ]
}

// 模块转换分析
// 1.被webpack转换后的模块会带上一层包裹，生成一个个模块初始化函数
// 2.import会转换为 __webpack_require__，export转换为 __webpack_exports__
// __webpack_require__ 用于加载模块
// Scope hoisting原理:
// 将所有模块的代码按照引用顺序放在一个函数作用域里，然后通过适当的重命名一些变量以防止变量名冲突。
// (由于之前是用函数包裹起来存放在数组中，所以不需要考虑顺序，但是如果放在一个函数里面就需要根据依赖顺序来放置到不同的位置)
// 好处：通过 scope hoisting 可以减少函数声明代码和内存开销（函数闭包过多）