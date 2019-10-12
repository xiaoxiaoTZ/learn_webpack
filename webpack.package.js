'use strict'

// 打包基础库的webpack配置文件

const path=require('path')
const {CleanWebpackPlugin}=require('clean-webpack-plugin')
const TerserPlugin=require('terser-webpack-plugin')

module.exports={
    entry:{
        'large-number':'./pack/index.js',
        'large-number.min':'./pack/index.js'
    },
    output:{
        filename:'[name].js',
        path:path.join(__dirname,'dist'),
        library: 'largeNumber',
        // umd支持 CommonJS, AMD and as global variable
        libraryTarget: 'umd',
        // 用于导出默认exports，让使用时更方便
        libraryExport: 'default'
    },
    mode:'none',
    module:{
        rules:[
            {test:/\.js$/,use:'babel-loader'}
        ]
    },
    plugins:[
        // 每次构建之前清理output指定的输出目录
        new CleanWebpackPlugin()
    ],
    optimization:{
        minimize:true,
        // 设置只压缩min.js结尾的文件
        minimizer:[
            new TerserPlugin({
                include:/\.min\.js$/
            })
        ]
    }
}

// 利用output的 library 和 libraryTarget 实现打包基础组件