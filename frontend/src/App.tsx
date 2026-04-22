import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import EvntTypesList from './EvntTypesList'
import ChooseEventType from './ChooseEventType'
import ChooseSlot from './ChooseSlot'
import BookingsList from './BookingsList'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/event-types" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/event-types" element={<EvntTypesList />} />
        <Route path="/bookings" element={<BookingsList />} />
      </Route>
      <Route path="/choose-event-type" element={<ChooseEventType />} />
      <Route path="/event-types/:id/calendar" element={<ChooseSlot />} />
    </Routes>
  )
}

export default App
