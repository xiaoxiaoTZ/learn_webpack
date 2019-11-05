const merge=require('webpack-merge')
const webpack=require('webpack')
const baseConfig=require('./webpack.base')
/*
    DEV
    代码热更新
        1.CSS热更新
        2.JS热更新
    sourcemap
*/

const devConfig={
    mode:'development',
    plugins:[
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer:{
        contentBase: path.join(__dirname, "./dist"),
        port:9002,
        hot:true,
        stats:'errors-only'
    },
    devtool:'source-map'
}

module.exports=merge(devConfig,baseConfig)