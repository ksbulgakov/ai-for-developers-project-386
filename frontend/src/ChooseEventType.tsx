import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { apiClient, type EventType } from './api/client'
import { formatDuration } from './utils/format'

function ChooseEventType() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchEvents = async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/event-types',
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

  const handleSelect = (id: string) => {
    navigate(`/event-types/${id}/calendar`)
  }

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">
        Выбор События
      </Title>

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
          <UnstyledButton
            key={event.id}
            onClick={() => handleSelect(event.id)}
          >
            <Paper p="md" withBorder radius="md">
              <Stack gap={4}>
                <Text fw={500}>{event.name}</Text>
                <Badge variant="light" w="fit-content">
                  {formatDuration(event.durationMinutes)}
                </Badge>
              </Stack>
            </Paper>
          </UnstyledButton>
        ))}
      </Stack>
    </Container>
  )
}

export default ChooseEventType
