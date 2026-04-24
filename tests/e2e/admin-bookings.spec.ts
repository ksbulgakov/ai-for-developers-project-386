import {
  test,
  expect,
  endOfWorkdayUTC,
  nextWorkdayStartUTC,
  uniqueName,
} from './fixtures'

test('admin видит созданное бронирование', async ({ page, api }) => {
  const eventType = await api.createEventType({
    name: uniqueName('admin-view'),
    durationMinutes: 30,
  })

  const dayStart = nextWorkdayStartUTC()
  const dayEnd = endOfWorkdayUTC(dayStart)
  const slots = await api.fetchSlots(
    eventType.id,
    dayStart.toISOString(),
    dayEnd.toISOString(),
  )
  expect(slots.length).toBeGreaterThan(0)

  const booking = await api.createBooking({
    eventTypeId: eventType.id,
    start: slots[0].start,
    guestName: 'Admin View Guest',
    guestEmail: 'admin-view@example.com',
  })

  await page.goto('/bookings')
  await expect(page.getByRole('heading', { name: 'Бронирования' })).toBeVisible()

  const row = page.locator(`[data-testid="booking-row"][data-id="${booking.id}"]`)
  await expect(row).toBeVisible()
  await expect(row).toContainText(eventType.name)
  await expect(row).toContainText('Admin View Guest')
})
