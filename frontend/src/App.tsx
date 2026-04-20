import { Navigate, Route, Routes } from 'react-router-dom'
import EvntTypesList from './EvntTypesList'
import ChooseEventType from './ChooseEventType'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/event-types" replace />} />
      <Route path="/event-types" element={<EvntTypesList />} />
      <Route path="/choose-event-type" element={<ChooseEventType />} />
    </Routes>
  )
}

export default App
