import { useState } from 'react'
import './App.css'
import logo from './pictures/horabus.png'
import Select from './components/select/Select'
    function App() {
      return (
        <div className="app">
          <div className="logo-container">
            <img src={logo} alt="Horabus Logo" className="logo" />
          </div>
          <div className="selector-container">
            <Select/>
          </div>
        </div>   
  )
}

export default App
