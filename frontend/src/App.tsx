import { Navigate, Route, Routes } from 'react-router-dom'
import EvntTypesList from './EvntTypesList'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/event-types" replace />} />
      <Route path="/event-types" element={<EvntTypesList />} />
    </Routes>
  )
}

export default App
