import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import {
  deleteAllChatData,
  loginAsTestUser,
  setupChatOwner,
} from "../auth-utils"

test.describe("owner live chat", () => {
  test.beforeEach(async () => {
    await deleteAllChatData()
  })

  test.afterEach(async () => {
    await deleteAllChatData()
  })

  test("given: a user and owner, should: coordinate realtime chat workflows", async ({
    browser,
  }) => {
    const suffix = Date.now()
    const ownerEmail = `owner-${suffix}@example.com`
    const userEmail = `user-${suffix}@example.com`
    await setupChatOwner(ownerEmail)

    const userContext = await browser.newContext()
    const ownerContext = await browser.newContext()
    const userPage = await userContext.newPage()
    const ownerPage = await ownerContext.newPage()
    const typingResponses: number[] = []
    userPage.on("response", (response) => {
      if (response.url().endsWith("/chat/typing"))
        typingResponses.push(response.status())
    })
    const userComposer = userPage.getByRole("textbox", { name: /message/i })

    try {
      await loginAsTestUser(userPage, { email: userEmail })
      await loginAsTestUser(ownerPage, { email: ownerEmail })

      await test.step("a conversation draft survives navigation and reload", async () => {
        const realtimeConnected = userPage.waitForResponse((response) =>
          response.url().endsWith("/chat/events"),
        )
        await userPage.goto("/chat")
        await realtimeConnected
        await userComposer.fill("Saved for later")
        await expect
          .poll(() =>
            userPage.evaluate(() =>
              Array.from(
                { length: globalThis.localStorage.length },
                (_, index) =>
                  globalThis.localStorage.getItem(
                    globalThis.localStorage.key(index) ?? "",
                  ),
              ),
            ),
          )
          .toContain("Saved for later")
        await userPage.goto("/")
        await userPage.goto("/chat")
        await expect(userComposer).toHaveValue("Saved for later")
        await userPage.reload()
        await expect(userComposer).toHaveValue("Saved for later")
      })

      await test.step("the owner sees typing and receives a message without reloading", async () => {
        const realtimeConnected = ownerPage.waitForResponse((response) =>
          response.url().endsWith("/chat/events"),
        )
        await ownerPage.goto("/owner/chats")
        await realtimeConnected
        await expect(ownerPage.getByText(userEmail)).toBeVisible()
        await userComposer.fill("Hello owner")
        await expect.poll(() => typingResponses).toContain(200)
        await expect(ownerPage.getByText("Typing…")).toBeVisible()
        await userPage.getByRole("button", { name: /send message/i }).click()
        await expect(userPage.getByText("Hello owner")).toBeVisible()
        await expect(userComposer).toHaveValue("")
        await expect(ownerPage.getByText("Typing…")).toBeHidden()
        await ownerPage
          .getByRole("link", { name: new RegExp(userEmail, "i") })
          .click()
        await expect(ownerPage.getByText("Hello owner")).toBeVisible()
      })

      await test.step("the user receives the owner reply without reloading", async () => {
        await ownerPage
          .getByRole("textbox", { name: /message/i })
          .fill("Hello user")
        await ownerPage.getByRole("button", { name: /send message/i }).click()
        await expect(ownerPage.getByText("Hello user")).toBeVisible()
        await expect(userPage.getByText("Hello user")).toBeVisible()
      })

      await test.step("the connection reports offline and resumes realtime updates", async () => {
        await userContext.setOffline(true)
        await expect(userPage.getByText(/chat is offline/i)).toBeVisible()
        await userContext.setOffline(false)
        await expect(userPage.getByText(/chat is offline/i)).toBeHidden()
        await ownerPage
          .getByRole("textbox", { name: /message/i })
          .fill("Connected again")
        await ownerPage.getByRole("button", { name: /send message/i }).click()
        await expect(userPage.getByText("Connected again")).toBeVisible()
      })

      await test.step("the sent draft stays cleared after reload", async () => {
        await userPage.reload()
        await expect(userComposer).toHaveValue("")
      })
    } finally {
      await userContext.close()
      await ownerContext.close()
    }
  })

  test("given: the chat composer, should: have no automatic accessibility violations", async ({
    page,
  }) => {
    const suffix = Date.now()
    await setupChatOwner(`owner-a11y-${suffix}@example.com`)
    await loginAsTestUser(page, { email: `user-a11y-${suffix}@example.com` })
    await page.goto("/chat")

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
