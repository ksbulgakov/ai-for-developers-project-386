import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'
import App from './App.tsx'

dayjs.locale('ru')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider defaultColorScheme="dark">
        <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1, consistentWeeks: true }}>
          <ModalsProvider>
            <App />
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>,
)
