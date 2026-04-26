import { AppShell, Group, NavLink } from '@mantine/core'
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
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header px="md">
        <Group h="100%" gap="xs" wrap="nowrap" justify="center">
          {links.map((link) => {
            const isActive =
              pathname === link.to || pathname.startsWith(`${link.to}/`)
            return (
              <NavLink
                key={link.to}
                component={Link}
                to={link.to}
                w="auto"
                variant="subtle"
                label={isCompact ? link.icon : link.label}
                aria-label={link.label}
                active={isActive}
                styles={{
                  label: isActive
                    ? { color: 'var(--mantine-color-blue-4)' }
                    : undefined,
                }}
              />
            )
          })}
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default AdminLayout
