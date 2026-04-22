import { AppShell, NavLink } from '@mantine/core'
import { Link, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/event-types', label: 'События' },
  { to: '/bookings', label: 'Бронирования' },
  { to: '/choose-event-type', label: 'Забронировать встречу' },
]

function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar
        p="md"
        pt="calc(var(--mantine-spacing-md) + var(--mantine-spacing-xl) + var(--mantine-spacing-xs))"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            component={Link}
            to={link.to}
            label={link.label}
            active={pathname === link.to || pathname.startsWith(`${link.to}/`)}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default AdminLayout
