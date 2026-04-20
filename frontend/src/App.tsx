import { Navigate, Route, Routes } from 'react-router-dom'
import EvntTypesList from './EvntTypesList'
import ChooseEventType from './ChooseEventType'
import ChooseSlot from './ChooseSlot'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/event-types" replace />} />
      <Route path="/event-types" element={<EvntTypesList />} />
      <Route path="/choose-event-type" element={<ChooseEventType />} />
      <Route path="/event-types/:id/calendar" element={<ChooseSlot />} />
    </Routes>
  )
}

export default App
