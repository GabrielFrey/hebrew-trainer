import { expect, test, type Page, type Response } from "@playwright/test";

const LETTERS = ["א", "ב", "ג", "ד", "ה"] as const;
const MATCH: Record<string, string> = { א: "Alef", ב: "Bet", ג: "Gimel", ד: "Dalet" };

function lessonBodies(page: Page) {
  const bodies: unknown[] = [];
  page.on("response", async (res: Response) => {
    const url = res.url();
    if (!url.includes("/lessons/") && !url.includes("/attempts/") && !url.includes("/curriculum/")) return;
    const ct = res.headers()["content-type"] || "";
    if (!ct.includes("application/json")) return;
    try {
      bodies.push(await res.json());
    } catch {
      /* ignore */
    }
  });
  return bodies;
}

function assertNoAnswerLeak(bodies: unknown[]) {
  const dump = JSON.stringify(bodies);
  expect(dump).not.toMatch(/"accepted"/);
  expect(dump).not.toMatch(/"pairs":\{/);
}

async function onboard(page: Page, lang: "en" | "ru" = "en") {
  await page.goto("/");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await page.getByTestId(`lang-${lang}`).click();
  if (lang === "en") {
    await expect(page.getByTestId("onboarding-title")).toContainText("Welcome to Biti Hebrew");
  } else {
    await expect(page.getByTestId("onboarding-title")).toContainText("Добро пожаловать");
  }
  await page.getByTestId("start-alef").click();
  await expect(page.getByTestId("learn-path")).toBeVisible();
}

async function answerCurrent(page: Page, step: number) {
  if (step < 10) {
    const letter = LETTERS[Math.floor(step / 2)];
    if (step % 2 === 0) {
      await page.getByTestId(`choice-${letter}`).click();
    } else {
      const input = page.getByTestId("hebrew-input");
      await expect(input).toBeVisible();
      await page.getByTestId(`key-${letter}`).click();
      await expect(page.getByTestId("keyboard-preview")).toContainText(letter);
      if (step === 1) {
        await input.fill("");
        await input.pressSequentially(letter);
      }
    }
  } else if (step === 10) {
    for (const [glyph, name] of Object.entries(MATCH)) {
      await page.getByTestId(`match-${glyph}`).fill(name);
    }
  }
  await page.getByTestId("check-answer").click();
  await expect(page.getByTestId("feedback")).toBeVisible();
  await page.getByTestId("next-exercise").click();
}

test.describe("acceptance", () => {
  test("1 onboarding through first alphabet lesson (EN + RU copy)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("lang-ru").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Добро пожаловать в Biti Ivrit");
    await page.getByTestId("lang-uk").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Ласкаво просимо до Biti Ivrit");
    await page.getByTestId("lang-es").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Bienvenido a Biti Ivrit");
    await page.getByTestId("lang-fr").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Bienvenue dans Biti Ivrit");
    await page.getByTestId("lang-en").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Welcome to Biti Hebrew");
    const bodies = lessonBodies(page);
    await page.getByTestId("start-alef").click();
    await expect(page.getByTestId("learn-path")).toBeVisible();
    await expect(page.getByTestId("path-script-alef-he")).toBeVisible();
    await expect(page.getByTestId("path-script-vav-lamed")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    for (let i = 0; i < 11; i++) {
      await answerCurrent(page, i);
    }
    await expect(page.getByTestId("speech-unavailable")).toBeVisible();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("feedback")).toBeVisible();
    await page.getByTestId("next-exercise").click();
    await expect(page.getByTestId("lesson-complete")).toBeVisible();
    assertNoAnswerLeak(bodies);
  });

  test("3 lesson payloads never leak accepted answers", async ({ page }) => {
    const bodies = lessonBodies(page);
    await onboard(page);
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    await page.getByTestId("choice-א").click();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("feedback")).toBeVisible();
    assertNoAnswerLeak(bodies);
    for (const body of bodies) {
      const text = JSON.stringify(body);
      expect(text).not.toContain("accepted");
    }
  });

  test("5 RTL / bidi: Hebrew+Latin+numbers, unclipped niqqud, RTL caret", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    const mix = page.getByTestId("bidi-mix");
    await expect(mix).toContainText("שָׁלוֹם");
    await expect(mix).toContainText("Biti 42");
    const he = mix.locator('[lang="he"][dir="rtl"]');
    await expect(he).toHaveCount(1);
    const niqqud = page.getByTestId("niqqud-sample");
    const box = await niqqud.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(28);
    const overflow = await niqqud.evaluate((el) => {
      const s = getComputedStyle(el);
      return { lineHeight: parseFloat(s.lineHeight), overflow: s.overflow, fontSize: parseFloat(s.fontSize) };
    });
    expect(overflow.lineHeight).toBeGreaterThan(overflow.fontSize);
    await page.getByTestId("choice-א").click();
    await page.getByTestId("check-answer").click();
    await page.getByTestId("next-exercise").click();
    const input = page.getByTestId("hebrew-input");
    await expect(input).toHaveAttribute("dir", "rtl");
    await expect(input).toHaveAttribute("lang", "he");
    const dir = await input.evaluate((el) => getComputedStyle(el).direction);
    expect(dir).toBe("rtl");
  });

  test("6 OS typing and virtual keyboard", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("path-script-alef-he").click();
    await page.getByTestId("choice-א").click();
    await page.getByTestId("check-answer").click();
    await page.getByTestId("next-exercise").click();
    const input = page.getByTestId("hebrew-input");
    await input.fill("ב");
    await expect(input).toHaveValue("ב");
    await page.getByTestId("key-clear").click();
    await page.getByTestId("key-א").click();
    await expect(page.getByTestId("keyboard-preview")).toContainText("א");
    await page.getByTestId("key-clear").click();
    await page.getByTestId("key-ב").click();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("feedback-result")).toBeVisible();
  });

  test("7 audio-unavailable is visible and does not block the lesson", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("audio-unavailable")).toBeVisible();
    await expect(page.getByTestId("check-answer")).toBeEnabled();
    await page.getByTestId("choice-א").click();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("feedback")).toBeVisible();
  });

  test("15 keyboard navigation and lang=he labels", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    await page.evaluate(() => {
      document.body.setAttribute("tabindex", "-1");
      document.body.focus();
    });
    await page.keyboard.press("Tab");
    const skip = page.getByTestId("skip-content").first();
    await expect(skip).toBeFocused();
    const key = page.getByTestId("choice-א");
    await key.focus();
    await expect(key).toBeFocused();
    await expect(page.locator('[lang="he"]').first()).toHaveAttribute("dir", "rtl");
    await page.getByTestId("choice-א").click();
    await page.getByTestId("check-answer").click();
    await page.getByTestId("next-exercise").click();
    const heKey = page.getByTestId("key-א");
    await expect(heKey).toHaveAttribute("lang", "he");
    await expect(heKey).toHaveAttribute("aria-label", "א");
    await heKey.focus();
    await expect(heKey).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("keyboard-preview")).toContainText("א");
  });
});
