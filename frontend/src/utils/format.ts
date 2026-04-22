import dayjs from 'dayjs'

export function formatDuration(minutes: number): string {
  return `${minutes} мин`
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('D MMMM YYYY, HH:mm')
}
