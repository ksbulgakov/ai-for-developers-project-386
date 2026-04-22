import { useState } from 'react'
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { apiClient, type EventType, type EventTypeCreate } from './api/client'

type FormValues = {
  name: string
  description: string
  durationMinutes: number
}

type Props = {
  onCreated: (eventType: EventType) => void
}

function EventTypeForm({ onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      durationMinutes: 30,
    },
    validate: {
      name: (value) => {
        const trimmed = value.trim()
        if (trimmed.length < 1) return 'Название обязательно'
        if (trimmed.length > 120) return 'Не более 120 символов'
        return null
      },
      description: (value) =>
        value.length > 1000 ? 'Не более 1000 символов' : null,
      durationMinutes: (value) => {
        if (!Number.isInteger(value)) return 'Должно быть целым числом'
        if (value < 5) return 'Минимум 5 минут'
        if (value > 480) return 'Максимум 480 минут'
        if (value % 5 !== 0) return 'Должно быть кратно 5'
        return null
      },
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSubmitting(true)
    const body: EventTypeCreate = {
      name: values.name.trim(),
      durationMinutes: values.durationMinutes,
      ...(values.description.trim()
        ? { description: values.description.trim() }
        : {}),
    }
    const { data, error } = await apiClient.POST(
      '/api/v1/admin/event-types',
      { body },
    )
    setSubmitting(false)
    if (error || !data) {
      setSubmitError('Не удалось создать тип события')
      return
    }
    onCreated(data)
    modals.closeAll()
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Название"
          placeholder="Например, Интервью"
          withAsterisk
          {...form.getInputProps('name')}
        />
        <Textarea
          label="Описание"
          placeholder="Необязательно"
          autosize
          minRows={2}
          maxRows={6}
          {...form.getInputProps('description')}
        />
        <NumberInput
          label="Длительность, минут"
          withAsterisk
          min={5}
          max={480}
          step={5}
          {...form.getInputProps('durationMinutes')}
        />
        {submitError && (
          <Text c="red" size="sm">
            {submitError}
          </Text>
        )}
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => modals.closeAll()}
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button type="submit" loading={submitting}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

export default EventTypeForm
