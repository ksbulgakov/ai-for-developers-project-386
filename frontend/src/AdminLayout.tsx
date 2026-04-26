import { AppShell, Burger, Group, Menu, NavLink } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/event-types', label: 'События', icon: '📅' },
  { to: '/bookings', label: 'Бронирования', icon: '📋' },
  { to: '/choose-event-type', label: 'Забронировать встречу', icon: '➕' },
]

function AdminLayout() {
  const { pathname } = useLocation()
  const isCompact = useMediaQuery('(max-width: 48em)') ?? false
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] =
    useDisclosure(false)

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header px="md">
        {isCompact ? (
          <Group h="100%" gap="xs" wrap="nowrap">
            <Menu
              opened={menuOpened}
              onChange={(opened) => (opened ? toggleMenu() : closeMenu())}
              position="bottom-start"
              shadow="md"
              width={240}
            >
              <Menu.Target>
                <Burger
                  opened={menuOpened}
                  onClick={toggleMenu}
                  aria-label="Меню навигации"
                  size="sm"
                />
              </Menu.Target>
              <Menu.Dropdown>
                {links.map((link) => {
                  const isActive =
                    pathname === link.to ||
                    pathname.startsWith(`${link.to}/`)
                  return (
                    <Menu.Item
                      key={link.to}
                      component={Link}
                      to={link.to}
                      onClick={closeMenu}
                      style={
                        isActive
                          ? { color: 'var(--mantine-color-blue-4)' }
                          : undefined
                      }
                    >
                      {link.label}
                    </Menu.Item>
                  )
                })}
              </Menu.Dropdown>
            </Menu>
          </Group>
        ) : (
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
                  label={link.label}
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
        )}
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default AdminLayout
