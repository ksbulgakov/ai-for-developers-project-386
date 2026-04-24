import { test, expect, uniqueName } from './fixtures'

test('admin создаёт и удаляет тип события', async ({ page }) => {
  const name = uniqueName('meeting')

  await page.goto('/event-types')
  await expect(page.getByRole('heading', { name: 'События' })).toBeVisible()

  await page.getByTestId('event-types-create').click()

  const form = page.getByTestId('event-type-form')
  await expect(form).toBeVisible()
  await form.getByLabel('Название').fill(name)
  await form.getByLabel('Длительность, минут').fill('30')

  await page.getByTestId('event-type-submit').click()
  await expect(form).toBeHidden()

  const card = page.getByTestId('event-type-card').filter({ hasText: name })
  await expect(card).toBeVisible()

  await card.getByTestId('event-type-delete').click()
  await expect(card).toBeHidden()
})
