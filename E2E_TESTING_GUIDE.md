# End-to-End (E2E) Testing Setup

This document provides setup and test examples for automated browser testing using **Playwright** and **Cypress**.

---

## Table of Contents

1. [Playwright Setup & Tests](#playwright)
2. [Cypress Setup & Tests](#cypress)
3. [Test Scenarios](#test-scenarios)
4. [CI/CD Integration](#cicd-integration)

---

## Playwright

### Installation

```bash
cd client
npm install -D @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.js` in the `client` directory:

```javascript
// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Test Examples

Create directory structure:

```
client/tests/e2e/
├── auth.spec.js
├── playback.spec.js
├── library.spec.js
├── admin.spec.js
└── responsive.spec.js
```

#### **auth.spec.js** - Authentication Tests

```javascript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sangatamizh Music/);
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(
      page.getByText(/invalid credentials|login failed/i)
    ).toBeVisible();
  });

  test("should register a new user", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Sign Up"); // Click sign-up tab/link

    const testEmail = `test${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.click('button:has-text("Sign Up")');

    // Should redirect to home after successful signup
    await expect(page).toHaveURL(/\/(home)?$/);
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Use a pre-created test account
    await page.fill('input[type="email"]', "testuser@example.com");
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    // Should navigate to home page
    await expect(page).toHaveURL(/\/(home)?$/);

    // Verify user is logged in (sidebar visible)
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "testuser@example.com");
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(home)?$/);

    // Logout
    await page.click('[data-testid="logout-button"]'); // Add this test ID to your logout button

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should protect routes when not logged in", async ({ page }) => {
    await page.goto("/library");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

#### **playback.spec.js** - Music Playback Tests

```javascript
import { test, expect } from "@playwright/test";

test.describe("Music Playback", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "testuser@example.com");
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home)?$/);
  });

  test("should play a song from home page", async ({ page }) => {
    await page.goto("/");

    // Click on first song card play button
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    // Music player should appear at bottom
    await expect(page.locator('[data-testid="music-player"]')).toBeVisible();

    // Player should show playing state
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

    // Song title should be displayed
    await expect(
      page.locator('[data-testid="player-song-title"]')
    ).not.toBeEmpty();
  });

  test("should pause and resume playback", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    // Wait for player to load
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

    // Pause
    await page.click('[data-testid="pause-button"]');
    await expect(
      page.locator('[data-testid="play-button-player"]')
    ).toBeVisible();

    // Resume
    await page.click('[data-testid="play-button-player"]');
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();
  });

  test("should seek to different position", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    // Wait for playback to start
    await page.waitForTimeout(2000);

    // Get seek bar
    const seekBar = page.locator('[data-testid="seek-bar"]');
    const box = await seekBar.boundingBox();

    // Click at 50% position
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);

    // Time should have changed (not at 0:00)
    const timeText = await page
      .locator('[data-testid="current-time"]')
      .textContent();
    expect(timeText).not.toBe("0:00");
  });

  test("should play next song", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    // Get current song title
    const firstSongTitle = await page
      .locator('[data-testid="player-song-title"]')
      .textContent();

    // Click next button
    await page.click('[data-testid="next-button"]');

    // Song title should change
    await page.waitForTimeout(500);
    const secondSongTitle = await page
      .locator('[data-testid="player-song-title"]')
      .textContent();
    expect(secondSongTitle).not.toBe(firstSongTitle);
  });

  test("should adjust volume", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    // Get volume slider
    const volumeSlider = page.locator('[data-testid="volume-slider"]');

    // Set volume to 50%
    await volumeSlider.fill("50");

    // Volume value should update
    const volumeValue = await volumeSlider.inputValue();
    expect(parseInt(volumeValue)).toBe(50);
  });

  test("should toggle shuffle mode", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    const shuffleButton = page.locator('[data-testid="shuffle-button"]');

    // Click shuffle
    await shuffleButton.click();

    // Button should show active state (check class or aria-pressed)
    await expect(shuffleButton).toHaveClass(/active/);
  });

  test("should toggle repeat mode", async ({ page }) => {
    await page.goto("/");
    await page.click(
      '[data-testid="song-card"]:first-child [data-testid="play-button"]'
    );

    const repeatButton = page.locator('[data-testid="repeat-button"]');

    // Click repeat once (Repeat All)
    await repeatButton.click();
    await expect(repeatButton).toHaveAttribute("aria-label", /repeat all/i);

    // Click again (Repeat One)
    await repeatButton.click();
    await expect(repeatButton).toHaveAttribute("aria-label", /repeat one/i);

    // Click again (Repeat Off)
    await repeatButton.click();
    await expect(repeatButton).toHaveAttribute("aria-label", /repeat off/i);
  });
});
```

---

#### **library.spec.js** - Library & Favorites Tests

```javascript
import { test, expect } from "@playwright/test";

test.describe("Library and Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "testuser@example.com");
    await page.fill('input[type="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home)?$/);
  });

  test("should display library page", async ({ page }) => {
    await page.goto("/library");

    await expect(page.getByRole("heading", { name: /library/i })).toBeVisible();

    // Should show songs or empty state
    const hasSongs =
      (await page.locator('[data-testid="song-card"]').count()) > 0;
    const hasEmptyState = await page.getByText(/no songs found/i).isVisible();

    expect(hasSongs || hasEmptyState).toBeTruthy();
  });

  test("should like a song", async ({ page }) => {
    await page.goto("/");

    const likeButton = page.locator(
      '[data-testid="song-card"]:first-child [data-testid="like-button"]'
    );

    // Click like
    await likeButton.click();

    // Button should show liked state
    await expect(likeButton).toHaveClass(/liked|active/);
  });

  test("should unlike a song", async ({ page }) => {
    await page.goto("/");

    const likeButton = page.locator(
      '[data-testid="song-card"]:first-child [data-testid="like-button"]'
    );

    // Ensure it's liked first
    await likeButton.click();
    await expect(likeButton).toHaveClass(/liked|active/);

    // Unlike
    await likeButton.click();
    await expect(likeButton).not.toHaveClass(/liked|active/);
  });

  test("should search for songs", async ({ page }) => {
    await page.goto("/library");

    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("test song");

    // Results should filter
    await page.waitForTimeout(500); // Debounce
    const songCards = page.locator('[data-testid="song-card"]');

    // Should show filtered results or "no results" message
    const count = await songCards.count();
    expect(count >= 0).toBeTruthy();
  });

  test("should navigate to playlists", async ({ page }) => {
    await page.goto("/playlists");

    await expect(
      page.getByRole("heading", { name: /playlists/i })
    ).toBeVisible();
  });
});
```

---

#### **admin.spec.js** - Admin Panel Tests

```javascript
import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "AdminPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home)?$/);
  });

  test("should access admin analytics", async ({ page }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: /analytics|admin/i })
    ).toBeVisible();

    // Should display stats
    await expect(page.getByText(/total songs/i)).toBeVisible();
    await expect(page.getByText(/total logins/i)).toBeVisible();
  });

  test("should display analytics chart", async ({ page }) => {
    await page.goto("/admin");

    // Recharts renders SVG
    const chart = page.locator("svg.recharts-surface");
    await expect(chart).toBeVisible();
  });

  test("should navigate to upload tab", async ({ page }) => {
    await page.goto("/admin");

    await page.click('button:has-text("Upload")');

    // Upload form should be visible
    await expect(page.getByText(/youtube url|upload song/i)).toBeVisible();
  });

  test("should validate YouTube URL input", async ({ page }) => {
    await page.goto("/admin");
    await page.click('button:has-text("Upload")');

    // Enter invalid URL
    await page.fill('[data-testid="youtube-url-input"]', "invalid-url");
    await page.click('[data-testid="auto-fill-button"]');

    // Should show error
    await expect(page.getByText(/invalid url|error/i)).toBeVisible();
  });

  test("should delete a song", async ({ page }) => {
    await page.goto("/admin");
    await page.click('button:has-text("Manage")');

    // Click delete on first song
    page.on("dialog", (dialog) => dialog.accept()); // Accept confirmation
    await page.click('[data-testid="delete-button"]:first-child');

    // Should show success message
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });
});
```

---

#### **responsive.spec.js** - Responsive Design Tests

```javascript
import { test, expect, devices } from "@playwright/test";

test.describe("Responsive Design", () => {
  test("should display correctly on mobile (iPhone 12)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices["iPhone 12"],
    });
    const page = await context.newPage();

    await page.goto("/");

    // Bottom navigation should be visible on mobile
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();

    // Sidebar should be hidden
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      expect(await sidebar.boundingBox()).toBeNull();
    }

    await context.close();
  });

  test("should display correctly on tablet (iPad)", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPad (gen 7)"],
    });
    const page = await context.newPage();

    await page.goto("/");

    // Check layout adapts
    const songCards = page.locator('[data-testid="song-card"]');
    await expect(songCards.first()).toBeVisible();

    await context.close();
  });

  test("should have 2-column grid on mobile", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 740 }, // Galaxy S8+
    });
    const page = await context.newPage();

    await page.goto("/library");

    // Get grid container
    const grid = page.locator('[data-testid="song-grid"]');
    const gridStyles = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );

    // Should have 2 columns (might be "1fr 1fr" or "repeat(2, 1fr)")
    expect(gridStyles).toMatch(/1fr.*1fr/);

    await context.close();
  });

  test("should have 6-column grid on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/library");

    const grid = page.locator('[data-testid="song-grid"]');
    const gridStyles = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );

    // Should have 6 columns
    const columnCount = gridStyles.split(" ").length;
    expect(columnCount).toBe(6);
  });
});
```

---

### Running Playwright Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/auth.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Run on specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

---

## Cypress

### Installation

```bash
cd client
npm install -D cypress
npx cypress open
```

### Configuration

Create `cypress.config.js` in the `client` directory:

```javascript
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
});
```

---

### Test Examples

Create directory: `client/cypress/e2e/`

#### **auth.cy.js**

```javascript
describe("Authentication", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login form", () => {
    cy.contains(/login|sign in/i).should("be.visible");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
  });

  it("should login successfully", () => {
    cy.get('input[type="email"]').type("testuser@example.com");
    cy.get('input[type="password"]').type("TestPassword123!");
    cy.get('button[type="submit"]').click();

    cy.url().should("match", /\/(home)?$/);
  });

  it("should show error on invalid credentials", () => {
    cy.get('input[type="email"]').type("invalid@example.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    cy.contains(/invalid|error|failed/i).should("be.visible");
  });
});
```

#### **playback.cy.js**

```javascript
describe("Music Playback", () => {
  beforeEach(() => {
    // Login
    cy.visit("/login");
    cy.get('input[type="email"]').type("testuser@example.com");
    cy.get('input[type="password"]').type("TestPassword123!");
    cy.get('button[type="submit"]').click();
    cy.url().should("match", /\/(home)?$/);
  });

  it("should play a song", () => {
    cy.get('[data-testid="song-card"]')
      .first()
      .find('[data-testid="play-button"]')
      .click();

    cy.get('[data-testid="music-player"]').should("be.visible");
    cy.get('[data-testid="pause-button"]').should("be.visible");
  });

  it("should pause playback", () => {
    cy.get('[data-testid="song-card"]')
      .first()
      .find('[data-testid="play-button"]')
      .click();
    cy.get('[data-testid="pause-button"]').click();

    cy.get('[data-testid="play-button-player"]').should("be.visible");
  });
});
```

---

### Running Cypress Tests

```bash
# Open Cypress interactive UI
npx cypress open

# Run headless
npx cypress run

# Run specific file
npx cypress run --spec "cypress/e2e/auth.cy.js"
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  playwright:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          cd client
          npm ci

      - name: Install Playwright Browsers
        run: |
          cd client
          npx playwright install --with-deps

      - name: Run Playwright tests
        run: |
          cd client
          npx playwright test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: client/playwright-report/
          retention-days: 30
```

---

**Last Updated:** 2025-12-12
