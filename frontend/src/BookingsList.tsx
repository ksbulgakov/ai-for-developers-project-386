import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import dayjs from 'dayjs'
import { apiClient, type Booking } from './api/client'
import { formatDateTime } from './utils/format'

type Filter = 'upcoming' | 'past'

const FAR_PAST = dayjs(0).toISOString()

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Group gap="xs">
      <Text size="sm" c="dimmed">{label}:</Text>
      <Text size="sm">{value}</Text>
    </Group>
  )
}

function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <Stack gap="xs">
      <DetailRow
        label="Дата и время"
        value={`${formatDateTime(booking.start)} — ${dayjs(booking.end).format('HH:mm')}`}
      />
      <DetailRow label="Гость" value={booking.guestName} />
      <DetailRow label="Email" value={booking.guestEmail} />
      {booking.notes && (
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Заметка:</Text>
          <Text size="sm">{booking.notes}</Text>
        </Stack>
      )}
      <DetailRow label="Создано" value={formatDateTime(booking.createdAt)} />
    </Stack>
  )
}

function openBookingModal(booking: Booking) {
  modals.open({
    title: booking.eventTypeName,
    children: <BookingDetails booking={booking} />,
  })
}

function BookingsList() {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchBookings = async () => {
      const query =
        filter === 'upcoming'
          ? {}
          : { from: FAR_PAST, to: dayjs().toISOString() }

      const { data, error } = await apiClient.GET('/api/v1/admin/bookings', {
        params: { query },
      })
      if (cancelled) return
      if (error || !data) {
        setLoadError('Не удалось загрузить бронирования')
      } else {
        setBookings(filter === 'past' ? data.slice().reverse() : data)
      }
      setLoading(false)
    }

    fetchBookings()
    return () => {
      cancelled = true
    }
  }, [filter])

  const changeFilter = (next: Filter) => {
    if (next === filter) return
    setFilter(next)
    setBookings([])
    setLoading(true)
    setLoadError(null)
    setDeleteError(null)
  }

  const handleDelete = async (id: string) => {
    const snapshot = bookings
    setDeleteError(null)
    setBookings((prev) => prev.filter((b) => b.id !== id))
    const { error } = await apiClient.DELETE('/api/v1/admin/bookings/{id}', {
      params: { path: { id } },
    })
    if (error) {
      setBookings(snapshot)
      setDeleteError('Не удалось удалить бронирование')
    }
  }

  return (
    <Container size="sm" py="xl" w="100%">
      <Title order={1} mb="lg">Бронирования</Title>

      <Group mb="lg" gap="xs">
        <Button
          variant={filter === 'upcoming' ? 'filled' : 'default'}
          onClick={() => changeFilter('upcoming')}
        >
          Текущие
        </Button>
        <Button
          variant={filter === 'past' ? 'filled' : 'default'}
          onClick={() => changeFilter('past')}
        >
          Прошедшие
        </Button>
      </Group>

      {loading && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      {loadError && (
        <Text c="red" ta="center" py="md">
          {loadError}
        </Text>
      )}

      {deleteError && (
        <Text c="red" ta="center" py="md">
          {deleteError}
        </Text>
      )}

      {!loading && !loadError && bookings.length === 0 && (
        <Text c="dimmed" ta="center" py="md">
          Бронирований нет
        </Text>
      )}

      {!loading && (
        <Stack gap="sm" w="100%">
          {bookings.map((booking) => (
            <Paper
              key={booking.id}
              p="md"
              withBorder
              radius="md"
              w="100%"
              data-testid="booking-row"
              data-id={booking.id}
            >
              <Group justify="space-between" wrap="nowrap">
                <UnstyledButton
                  onClick={() => openBookingModal(booking)}
                  style={{ flex: 1, textAlign: 'left' }}
                >
                  <Stack gap={4}>
                    <Text fw={500}>{booking.eventTypeName}</Text>
                    <Badge variant="light" w="fit-content">
                      {formatDateTime(booking.start)}
                    </Badge>
                    <Text size="sm" c="dimmed">{booking.guestName}</Text>
                  </Stack>
                </UnstyledButton>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Удалить"
                  onClick={() => handleDelete(booking.id)}
                >
                  ×
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  )
}

export default BookingsList
