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

/*
    构建配置抽离成npm包的意义
    通用性:
        业务开发者不需要关注构建配置
        统一团队构建脚本
    可维护性:
        构建配置合理的拆分
        README文档，ChangeLog文档等
    质量:
        冒烟测试，单元测试，测试覆盖率
        持续集成
*/

/*
    构建配置管理的可选方案
    1.通过多个配置文件管理不同环境的构建，webpack --config 参数进行控制
    2.将构建配置设计成一个库，比如 hjs-webpack Neutrino webpack-blocks
    3.抽成一个工具进行管理，比如 create-react-app,kyt,nwb  例如使用 create-react-app build,create-react-app dev
    4.将所有的配置放在一个文件中，通过 --env 参数控制分支选择

    构建配置设计
    1.通过多个配置文件管理不同环境的webpack配置
        基础配置 webpack.base.js
        开发环境 webpack.dev.js
        生成环境 webpack.prod.js
        SSR环境 webpack.ssr.js
    2.抽离成一个 npm 包统一管理
        规范：Git commit日志，README，ESLint规范，Semver规范
        质量：冒烟测试，单元测试，测试覆盖率和CI
*/