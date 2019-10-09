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
    render(){
        debugger
        return <div className="search">
            <p>Search Text 2</p>
            <img src={Logo}></img>
            </div>
    }
}

ReactDOM.render(
    <Search/>,
    document.getElementById('root')
)