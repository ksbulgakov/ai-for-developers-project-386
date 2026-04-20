import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { Calendar } from '@mantine/dates'
import { useForm } from '@mantine/form'
import dayjs from 'dayjs'
import {
  apiClient,
  type Booking,
  type BookingCreate,
  type EventType,
  type Problem,
  type Slot,
} from './api/client'
import { formatDuration } from './utils/format'

type BookingFormValues = {
  guestName: string
  guestEmail: string
  notes: string
}

function problemToMessage(problem: Problem | undefined): string {
  if (!problem) return 'Не удалось создать бронирование'
  if (problem.status === 409) return 'Этот слот уже занят, выберите другой'
  if (problem.status === 422) return problem.detail ?? 'Слот недоступен для бронирования'
  if (problem.status === 400) return problem.detail ?? 'Проверьте правильность данных'
  return problem.detail ?? problem.title ?? 'Не удалось создать бронирование'
}

function ChooseSlot() {
  const { id } = useParams<{ id: string }>()

  const [eventType, setEventType] = useState<EventType | null>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [slotsReloadTick, setSlotsReloadTick] = useState(0)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<Booking | null>(null)

  const today = useMemo(() => dayjs().startOf('day'), [])
  const windowEndExclusive = useMemo(() => today.add(14, 'day'), [today])
  const selectedDayjs = useMemo(
    () => (selectedDate ? dayjs(selectedDate).startOf('day') : null),
    [selectedDate],
  )

  const form = useForm<BookingFormValues>({
    initialValues: { guestName: '', guestEmail: '', notes: '' },
    validate: {
      guestName: (value) => {
        const trimmed = value.trim()
        if (trimmed.length < 1) return 'Имя обязательно'
        if (trimmed.length > 120) return 'Не более 120 символов'
        return null
      },
      guestEmail: (value) => {
        const trimmed = value.trim()
        if (trimmed.length < 1) return 'Email обязателен'
        if (trimmed.length > 320) return 'Не более 320 символов'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Неверный формат email'
        return null
      },
      notes: (value) =>
        value.length > 1000 ? 'Не более 1000 символов' : null,
    },
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const fetchEventType = async () => {
      const { data, error, response } = await apiClient.GET(
        '/api/v1/event-types/{id}',
        { params: { path: { id } } },
      )
      if (cancelled) return
      if (error || !data) {
        setLoadError(
          response?.status === 404
            ? 'Тип события не найден'
            : 'Не удалось загрузить тип события',
        )
      } else {
        setEventType(data)
      }
      setEventLoading(false)
    }
    fetchEventType()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id || !selectedDate) return
    let cancelled = false
    const from = dayjs(selectedDate).startOf('day').toISOString()
    const to = dayjs(selectedDate).endOf('day').toISOString()
    const fetchSlots = async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/event-types/{id}/slots',
        { params: { path: { id }, query: { from, to } } },
      )
      if (cancelled) return
      if (error || !data) {
        setSlotsError('Не удалось загрузить слоты')
        setSlots([])
      } else {
        setSlotsError(null)
        setSlots(data)
      }
      setSlotsLoading(false)
    }
    fetchSlots()
    return () => {
      cancelled = true
    }
  }, [id, selectedDate, slotsReloadTick])

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setSlots([])
    setSlotsError(null)
    setSlotsLoading(true)
  }

  const reloadSlots = () => {
    setSlotsError(null)
    setSlotsLoading(true)
    setSlotsReloadTick((tick) => tick + 1)
  }

  const handleSlotClick = (slot: Slot) => {
    setSubmitError(null)
    setSelectedSlot(slot)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setSelectedSlot(null)
    setSubmitError(null)
    form.reset()
  }

  const handleSubmit = async (values: BookingFormValues) => {
    if (!id || !selectedSlot) return
    setSubmitError(null)
    setSubmitting(true)
    const body: BookingCreate = {
      eventTypeId: id,
      start: selectedSlot.start,
      guestName: values.guestName.trim(),
      guestEmail: values.guestEmail.trim(),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    }
    const { data, error } = await apiClient.POST('/api/v1/bookings', { body })
    setSubmitting(false)
    if (error || !data) {
      setSubmitError(problemToMessage(error as Problem | undefined))
      return
    }
    setSuccessInfo(data)
    setSelectedSlot(null)
    form.reset()
    reloadSlots()
  }

  if (eventLoading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      </Container>
    )
  }

  if (loadError || !eventType) {
    return (
      <Container size="lg" py="xl">
        <Text c="red" ta="center" py="md">
          {loadError ?? 'Тип события недоступен'}
        </Text>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="lg">
        Бронирование
      </Title>

      {successInfo && (
        <Alert
          color="green"
          mb="lg"
          title="Бронирование создано"
          withCloseButton
          onClose={() => setSuccessInfo(null)}
        >
          {`${dayjs(successInfo.start).format('D MMMM YYYY, HH:mm')} — подтверждение отправлено на ${successInfo.guestEmail}`}
        </Alert>
      )}

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder radius="md">
            <Stack gap="sm">
              <Text fw={500} size="lg">
                {eventType.name}
              </Text>
              <Badge variant="light" w="fit-content">
                {formatDuration(eventType.durationMinutes)}
              </Badge>
              {eventType.description && (
                <Text size="sm" c="dimmed">
                  {eventType.description}
                </Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="md" withBorder radius="md">
            <Calendar
              getDayProps={(date) => {
                const d = dayjs(date).startOf('day')
                const inWindow =
                  !d.isBefore(today) && d.isBefore(windowEndExclusive)
                return {
                  selected: selectedDayjs != null && d.isSame(selectedDayjs, 'day'),
                  disabled: !inWindow,
                  onClick: () => {
                    if (inWindow) handleDayClick(date)
                  },
                }
              }}
            />
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder radius="md">
            {!selectedDate && (
              <Text c="dimmed">Выберите дату в календаре</Text>
            )}

            {selectedDate && (
              <Stack gap="sm">
                <Text fw={500}>
                  {dayjs(selectedDate).format('D MMMM YYYY')}
                </Text>

                {slotsLoading && (
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                  </Group>
                )}

                {!slotsLoading && slotsError && (
                  <Stack gap="xs">
                    <Text c="red">{slotsError}</Text>
                    <Button variant="subtle" onClick={reloadSlots}>
                      Повторить
                    </Button>
                  </Stack>
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <Text c="dimmed">На эту дату свободных слотов нет</Text>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <Stack gap="xs">
                    {slots.map((slot) => (
                      <Button
                        key={slot.start}
                        variant="light"
                        onClick={() => handleSlotClick(slot)}
                      >
                        {dayjs(slot.start).format('HH:mm')}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Stack>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal
        opened={selectedSlot !== null}
        onClose={handleCloseModal}
        title={
          selectedSlot
            ? `${eventType.name} — ${dayjs(selectedSlot.start).format('D MMMM, HH:mm')}`
            : ''
        }
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Имя"
              placeholder="Как к вам обращаться"
              withAsterisk
              {...form.getInputProps('guestName')}
            />
            <TextInput
              label="Email"
              placeholder="guest@example.com"
              withAsterisk
              {...form.getInputProps('guestEmail')}
            />
            <Textarea
              label="Заметка"
              placeholder="Повестка или пожелания (необязательно)"
              autosize
              minRows={2}
              maxRows={6}
              {...form.getInputProps('notes')}
            />
            {submitError && (
              <Text c="red" size="sm">
                {submitError}
              </Text>
            )}
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button type="submit" loading={submitting}>
                Забронировать
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}

export default ChooseSlot
