import {
  test,
  expect,
  endOfWorkdayUTC,
  formatYMD,
  nextWorkdayStartUTC,
  uniqueName,
} from './fixtures'

test('гость бронирует свободный слот', async ({ page, api }) => {
  const eventType = await api.createEventType({
    name: uniqueName('booking'),
    durationMinutes: 30,
    description: 'e2e booking flow',
  })

  const dayStart = nextWorkdayStartUTC()
  const dayEnd = endOfWorkdayUTC(dayStart)
  const slots = await api.fetchSlots(
    eventType.id,
    dayStart.toISOString(),
    dayEnd.toISOString(),
  )
  expect(slots.length).toBeGreaterThan(0)

  const targetSlot = slots[0]
  const dayKey = formatYMD(dayStart)

  await page.goto('/choose-event-type')
  const card = page
    .getByTestId('choose-event-type-card')
    .filter({ hasText: eventType.name })
  await expect(card).toBeVisible()
  await card.click()

  await expect(page.getByRole('heading', { name: 'Бронирование' })).toBeVisible()

  await page.locator(`[data-date="${dayKey}"]:not([disabled])`).click()

  await page
    .locator(
      `[data-testid="slot-button"][data-time="${targetSlot.start}"]`,
    )
    .click()

  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await modal.getByLabel('Имя').fill('E2E Guest')
  await modal.getByLabel('Email').fill('e2e@example.com')
  await page.getByTestId('booking-submit').click()

  await expect(page.getByTestId('booking-success')).toBeVisible()
})
