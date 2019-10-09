import React from 'react'
import ReactDOM from 'react-dom'
import './search.scss'
import Logo from './img/logo.svg'

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