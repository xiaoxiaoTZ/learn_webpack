// hack处理，添加一个window
if(typeof window=='undefined'){
    global.window={};
}

const fs=require('fs')
const path=require('path')
const express=require('express')
const {renderToString} =require('react-dom/server')
const SSR=require('../dist/search-server')
const template=fs.readFileSync(path.join(__dirname,'../dist/search.html'),'utf-8')
const data=require('./data.json')

const server=(port)=>{
    const app=express()

    app.get('/search',(req,res)=>{
        app.use(express.static('dist'))
        let html=renderMarkup(renderToString(SSR))
        res.status(200).send(html)
    })
    // process.env 属性返回包含用户环境的对象，
    // 可以修改此对象，但这些修改不会反映到 Node.js 进程之外，或者（除非明确请求）反映到其他 Worker 线程。 
    // $ node -e 'process.env.foo = "bar"' && echo $foo
    app.listen(port,()=>{
        console.log('Sever is running on port '+port)
    })
}

server(process.env.PORT||3000)

const renderMarkup=(str)=>{
    return template.replace('<!--HTML_PLACEHOLDER-->',str)
            .replace('<!--INITIAL_DATA_PLACEHOLDER-->',`<script>var INITIAL_DATA=${JSON.stringify(data)}</script>`)
}