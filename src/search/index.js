import React from 'react'
import ReactDOM from 'react-dom'
import Logo from './img/logo.svg'
import './search.scss'

// 测试commons公用资源文件
import {log} from '../../common/index'
log('test')

import {a} from './treeShaking'

const testA=a()
log(testA)

class Search extends React.Component{
    constructor(){
        super(...arguments)
        this.state={
            Text:null
        }
    }
    // loadComponent=()=>{
    loadComponent(){
        // 动态引入使用时是一个Promise，参数是完整的exports，所以此处使用的是text.default
        // 动态引入会单独生成一个js文件，直到代码被调用时才去下载并执行对应的JS，动态引入的js采用jsonp的方式加载和使用
        import('./test').then((text)=>{
            this.setState({
                Text:text.default
            })
        })
    }
    render(){
        let {Text}=this.state
        return <div className="search">
            <p>Search Text 2</p>
            <img src={Logo} onClick={this.loadComponent.bind(this)}></img>
            {
                Text?<Text/>:null
            }
            </div>
    }
}

ReactDOM.render(
    <Search/>,
    document.getElementById('root')
)