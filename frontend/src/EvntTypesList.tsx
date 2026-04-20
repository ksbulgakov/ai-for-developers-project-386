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
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { apiClient, type EventType } from './api/client'
import EventTypeForm from './EventTypeForm'
import { formatDuration } from './utils/format'

function EvntTypesList() {
  const [events, setEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchEvents = async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/admin/event-types',
      )
      if (cancelled) return
      if (error || !data) {
        setLoadError('Не удалось загрузить типы событий')
      } else {
        setEvents(data)
      }
      setLoading(false)
    }
    fetchEvents()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreated = (eventType: EventType) => {
    setEvents((prev) => [...prev, eventType])
  }

  const openCreateModal = () => {
    modals.open({
      title: 'Новый тип события',
      children: <EventTypeForm onCreated={handleCreated} />,
    })
  }

  const handleDelete = async (id: string) => {
    const snapshot = events
    setEvents((prev) => prev.filter((event) => event.id !== id))
    const { error } = await apiClient.DELETE(
      '/api/v1/admin/event-types/{id}',
      { params: { path: { id } } },
    )
    if (error) {
      setEvents(snapshot)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>События</Title>
        <Button onClick={openCreateModal}>Создать</Button>
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

      {!loading && !loadError && events.length === 0 && (
        <Text c="dimmed" ta="center" py="md">
          Пока нет ни одного типа события
        </Text>
      )}

      <Stack gap="sm">
        {events.map((event) => (
          <Paper key={event.id} p="md" withBorder radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={4}>
                <Text fw={500}>{event.name}</Text>
                <Badge variant="light" w="fit-content">
                  {formatDuration(event.durationMinutes)}
                </Badge>
              </Stack>
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label="Удалить"
                onClick={() => handleDelete(event.id)}
              >
                ×
              </ActionIcon>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Container>
  )
}

export default EvntTypesList
