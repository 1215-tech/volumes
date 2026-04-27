import type { Page } from "@playwright/test"

import { urlBarScrollTolerance } from "../constants"
import { type Theme } from "../scripts/darkmode"
import { test, expect } from "./fixtures"
import {
  takeRegressionScreenshot,
  isDesktopViewport,
  setTheme,
  reloadPage,
  gotoPage,
  triggerAndWaitForSPANav,
  moveMouseToSafePosition,
} from "./visual_utils"

test.beforeEach(async ({ page }) => {
  await gotoPage(page, "http://localhost:8080/test-page", "domcontentloaded")

  await page.evaluate(() => window.scrollTo(0, 0))
})

test("Clicking away closes the menu (lostpixel)", async ({ page }, testInfo) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const menuButton = page.locator("#menu-button")
  const navbarRightMenu = page.locator("#navbar-right .menu")
  await expect(menuButton).toBeVisible()

  await menuButton.click()
  await expect(navbarRightMenu).toBeVisible()
  await expect(navbarRightMenu).toHaveClass(/visible/)
  // Move mouse away
  await moveMouseToSafePosition(page)
  await takeRegressionScreenshot(page, testInfo, "visible-menu", {
    elementToScreenshot: navbarRightMenu,
  })

  const body = page.locator("body")
  await body.click()
  await expect(navbarRightMenu).toBeHidden()
  await expect(navbarRightMenu).not.toHaveClass(/visible/)
})

test("Menu button makes menu visible (lostpixel)", async ({ page }, testInfo) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const menuButton = page.locator("#menu-button")
  const navbarRightMenu = page.locator("#navbar-right .menu")

  // Test initial state
  const originalMenuButtonState = await menuButton.screenshot()
  await expect(navbarRightMenu).toBeHidden()
  await expect(navbarRightMenu).not.toHaveClass(/visible/)

  // Test opened state
  await menuButton.click()
  const openedMenuButtonState = await menuButton.screenshot()
  expect(openedMenuButtonState).not.toEqual(originalMenuButtonState)
  await expect(navbarRightMenu).toBeVisible()
  await expect(navbarRightMenu).toHaveClass(/visible/)

  // Move mouse away to avoid hover states
  await moveMouseToSafePosition(page)
  await takeRegressionScreenshot(page, testInfo, "visible-menu", {
    elementToScreenshot: navbarRightMenu,
  })

  // Test closed state
  await menuButton.click()
  await expect(navbarRightMenu).toBeHidden()
  await expect(navbarRightMenu).not.toHaveClass(/visible/)
})

test("Pressing Escape closes the menu and returns focus to button", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const menuButton = page.locator("#menu-button")
  const navbarRightMenu = page.locator("#navbar-right .menu")

  await menuButton.click()
  await expect(navbarRightMenu).toBeVisible()
  await expect(menuButton).toHaveAttribute("aria-expanded", "true")

  await page.keyboard.press("Escape")
  await expect(navbarRightMenu).toBeHidden()
  await expect(menuButton).toHaveAttribute("aria-expanded", "false")

  // Focus should return to the hamburger button
  const focused = page.locator(":focus")
  await expect(focused).toHaveId("menu-button")
})

test("Menu button has aria-controls pointing to nav-menu", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const menuButton = page.locator("#menu-button")
  await expect(menuButton).toHaveAttribute("aria-controls", "nav-menu")

  const navMenu = page.locator("#nav-menu")
  await expect(navMenu).toBeAttached()
})

test("Can't see the menu at desktop size", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  const menuButton = page.locator("#menu-button")
  await expect(menuButton).toBeHidden()
})

// Test scrolling down, seeing the menu disappears, and then reappears when scrolling back up
test("Menu disappears when scrolling down and reappears when scrolling up", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const navbar = page.locator("#navbar")

  await expect(navbar).toBeVisible()
  await expect(navbar).not.toHaveClass(/hide-above-screen/)

  await page.evaluate(() => {
    window.scrollTo({
      top: 250,
      behavior: "instant",
    })
  })

  await expect(navbar).toHaveClass(/hide-above-screen/)
  await expect(navbar).toHaveCSS("opacity", "0")

  await page.evaluate(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    })
  })

  await expect(navbar).not.toHaveClass(/hide-above-screen/)
  await expect(navbar).toBeVisible()
})

test("Content behind hidden navbar is clickable on mobile", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const navbar = page.locator("#navbar")
  const leftSidebar = page.locator("#left-sidebar")

  // Navbar visible: sidebar should not intercept, navbar should intercept
  await expect(leftSidebar).toHaveCSS("pointer-events", "none")
  await expect(navbar).toHaveCSS("pointer-events", "auto")

  // Scroll down to hide navbar
  await page.evaluate(() => window.scrollTo({ top: 250, behavior: "instant" }))
  await expect(navbar).toHaveClass(/hide-above-screen/)

  // When hidden, navbar should also not intercept clicks
  await expect(navbar).toHaveCSS("pointer-events", "none")

  // Verify a link in the content area is clickable despite the sticky sidebar
  const firstVisibleLink = page.locator("article a.internal[href]").first()
  await firstVisibleLink.scrollIntoViewIfNeeded()
  const href = firstVisibleLink
  await expect(href).toHaveAttribute("href")

  const initialUrl = page.url()
  await triggerAndWaitForSPANav(page, () => firstVisibleLink.click())
  await expect(page).not.toHaveURL(initialUrl)
})

test("Menu disappears gradually when scrolling down", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const navbar = page.locator("#navbar")
  await expect(navbar).toHaveCSS("opacity", "1")

  // Scroll down past the 50px threshold. scrollTo dispatches a scroll event
  // which the scroll handler picks up via requestAnimationFrame. Using
  // "instant" behavior to avoid smooth-scroll timing issues across browsers.
  // Note: mouse.wheel() is not supported in mobile WebKit.
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }))

  // The hide-above-screen class triggers a CSS opacity transition (0.45s).
  // Wait for the class to be applied and the transition to complete.
  await expect(navbar).toHaveClass(/hide-above-screen/)
  await expect(navbar).toHaveCSS("opacity", "0")
})

test("Navbar shows shadow when scrolling down (lostpixel)", async ({ page }, testInfo) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  const navbar = page.locator("#navbar")

  const takeNavbarScreenshot = async (suffix: string) => {
    await expect(navbar).toBeVisible()
    const box = await navbar.boundingBox()
    test.fail(!box, "Could not find navbar")
    // skipcq: JS-0339 - box is checked for nullability above
    await takeRegressionScreenshot(page, testInfo, suffix, {
      clip: {
        // skipcq: JS-0339
        x: box!.x,
        // skipcq: JS-0339
        y: box!.y,
        // skipcq: JS-0339
        width: box!.width,
        // skipcq: JS-0339
        height: box!.height + 12,
      },
    })
  }

  await expect(navbar).not.toHaveClass(/shadow/)
  await takeNavbarScreenshot("navbar-no-shadow")

  // Scroll down slightly to trigger shadow
  await page.evaluate(() => {
    window.scrollTo({
      top: 50,
      behavior: "instant",
    })
  })

  await expect(navbar).toHaveClass(/shadow/)
  await takeNavbarScreenshot("navbar-with-shadow")

  await page.evaluate(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    })
  })

  await expect(navbar).not.toHaveClass(/shadow/)
})

for (const theme of ["light", "dark", "auto"]) {
  test(`Left sidebar is visible on desktop in ${theme} mode (lostpixel)`, async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktopViewport(page), "Desktop-only test")

    const leftSidebar = page.locator("#left-sidebar")
    await expect(leftSidebar).toBeVisible()
    await setTheme(page, theme as Theme)
    await takeRegressionScreenshot(page, testInfo, `left-sidebar-${theme}`, {
      elementToScreenshot: leftSidebar,
    })
  })
}

test("Right sidebar is visible on desktop on page load", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const sidebar = document.querySelector<HTMLElement>("#right-sidebar")
      // @ts-expect-error - test instrumentation
      window.initialSidebarDisplayStyle = sidebar
        ? window.getComputedStyle(sidebar).display
        : "not-found"
    })
  })

  await reloadPage(page)

  const initialDisplayStyle = await page.evaluate(() => {
    // @ts-expect-error - test instrumentation
    return window.initialSidebarDisplayStyle
  })
  expect(initialDisplayStyle).toBe("flex")
})

test("Clicking TOC title scrolls to top", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }))
  await page.waitForFunction(
    (tolerance) => Math.abs(window.scrollY - 500) < tolerance,
    urlBarScrollTolerance,
  )

  const tocTitle = page.locator("#toc-title button")
  await expect(tocTitle).toBeVisible()
  await tocTitle.click()

  await page.waitForFunction((tolerance) => window.scrollY < tolerance, urlBarScrollTolerance)
})

test("Random post link is visible on desktop", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  await expect(page.locator("#random-post-link")).toBeVisible()
})

test("Random post link is visible in mobile hamburger menu", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  await page.locator("#menu-button").click()
  await expect(page.locator("#random-post-link")).toBeVisible()
})

test("Random post link navigates to a different page on desktop", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  const initialUrl = page.url()
  await triggerAndWaitForSPANav(page, () => page.locator("#random-post-link").click())
  await expect(page).not.toHaveURL(initialUrl)
})

test("Random post link navigates to a different page on mobile", async ({ page }) => {
  test.skip(isDesktopViewport(page), "Mobile-only test")

  await page.locator("#menu-button").click()
  const initialUrl = page.url()
  await triggerAndWaitForSPANav(page, () => page.locator("#random-post-link").click())
  await expect(page).not.toHaveURL(initialUrl)
})

test("Theme toggle is visible and functional", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  const dayIcon = page.locator("#day-icon")
  const nightIcon = page.locator("#night-icon")
  const themeToggle = page.locator("#theme-toggle")

  await expect(themeToggle).toBeVisible()
  // Initially should show day icon (light mode)
  await expect(dayIcon).toBeVisible()
  await expect(nightIcon).toBeHidden()
})

test("SPA navigation works correctly", async ({ page }) => {
  test.skip(!isDesktopViewport(page), "Desktop-only test")

  const localLink = page.locator("a:not(.skip-to-content)").first()
  const initialUrl = page.url()
  await triggerAndWaitForSPANav(page, () => localLink.click())

  await expect(page).not.toHaveURL(initialUrl)
})
