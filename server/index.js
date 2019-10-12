const express=require('express')
const {renderToString} =require('react-dom/server')

const app=express()
app.use(express.static('dist'))
app.get('./search',(req,res)=>{

})
// process.env 属性返回包含用户环境的对象，可以修改此对象 
// $ node -e 'process.env.foo = "bar"' && echo $foo
app.listen(process.env.PORT||3000)