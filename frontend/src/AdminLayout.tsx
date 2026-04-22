import { AppShell, NavLink } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/event-types', label: 'События', icon: '📅' },
  { to: '/bookings', label: 'Бронирования', icon: '📋' },
  { to: '/choose-event-type', label: 'Забронировать встречу', icon: '➕' },
]

function AdminLayout() {
  const { pathname } = useLocation()
  const isCompact = useMediaQuery('(max-width: 48em)') ?? false

  return (
    <AppShell
      navbar={{ width: isCompact ? 80 : 240, breakpoint: 0 }}
      padding="md"
    >
      <AppShell.Navbar
        p="md"
        pt="calc(var(--mantine-spacing-md) + var(--mantine-spacing-xl) + var(--mantine-spacing-xs))"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            component={Link}
            to={link.to}
            label={
              isCompact ? (
                <span
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {link.icon}
                </span>
              ) : (
                link.label
              )
            }
            aria-label={link.label}
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
