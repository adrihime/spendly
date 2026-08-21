import './App.css'
import { Route, Routes } from 'react-router-dom'
import { SummaryPage } from './routes/SummaryPage'
import { NavBar } from './shared/lib/NavBar'

function App() {

  return (
    <div className="p-4">
      <NavBar />
      <Routes>
        <Route path="/" element={<SummaryPage/>} />
      </Routes>
    </div>
  )
}

export default App
