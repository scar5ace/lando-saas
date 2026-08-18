import { describe, expect, it, vi } from "vitest";

import { GigaChatProvider } from "@/features/ai";
import { pageSchema } from "@/lib/validation/page-schema";

const generatedPlan = {
  style: "warm",
  site: {
    title: "Семейная пекарня",
    description: "Свежая выпечка и торты на заказ в Саратове.",
    brand: "Тёплый хлеб",
  },
  hero: {
    eyebrow: "Печём каждый день",
    title: "Свежая выпечка рядом с домом",
    description: "Хлеб, десерты и торты для семейных праздников.",
    buttonLabel: "Оставить заказ",
  },
  features: [
    { title: "Свежесть", description: "Печём ежедневно." },
    { title: "Состав", description: "Понятные ингредиенты." },
    { title: "Забота", description: "Внимательны к заказам." },
  ],
  services: [
    {
      title: "Хлеб",
      description: "Несколько видов хлеба.",
      price: "Уточняйте",
    },
    {
      title: "Торты",
      description: "Торты на заказ.",
      price: "По расчёту",
    },
  ],
  steps: [
    { title: "Заявка", description: "Расскажите о заказе." },
    { title: "Согласование", description: "Обсудим детали." },
    { title: "Получение", description: "Заберите готовый заказ." },
  ],
  faq: [
    { question: "Когда заказывать?", answer: "Срок зависит от изделия." },
    { question: "Есть доставка?", answer: "Условия уточняйте при заказе." },
    {
      question: "Можно изменить состав?",
      answer: "Обсудим ваши пожелания.",
    },
  ],
  form: {
    title: "Оставьте заявку",
    description: "Мы свяжемся и уточним детали.",
    submitLabel: "Отправить",
    successMessage: "Спасибо! Заявка принята.",
  },
  contactsTitle: "Контакты",
  footerLegalText: "Информация на сайте носит ознакомительный характер.",
} as const;

describe("GigaChatProvider", () => {
  it("authorizes as a physical person, generates and validates a page", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_at: Date.now() + 30 * 60 * 1_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(generatedPlan) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const provider = new GigaChatProvider({
      credentials: "test-credentials",
      fetchImpl,
    });
    const page = await provider.generatePage({ prompt: "Лендинг пекарни" });

    expect(pageSchema.safeParse(page).success).toBe(true);
    const authRequest = fetchImpl.mock.calls[0];
    expect(String(authRequest[1]?.body)).toBe("scope=GIGACHAT_API_PERS");
    expect(authRequest[1]?.headers).toMatchObject({
      Authorization: "Basic test-credentials",
    });
    const generationBody = JSON.parse(String(fetchImpl.mock.calls[1][1]?.body));
    expect(generationBody.model).toBe("GigaChat-2");
    expect(generationBody.response_format.type).toBe("json_schema");
    expect(generationBody.response_format.strict).toBe(false);
    expect(generationBody.max_tokens).toBe(8_000);
    expect(page.site.title).toBe("Семейная пекарня");
    expect(page.blocks.map((block) => block.type)).toEqual([
      "header",
      "hero",
      "features",
      "services",
      "steps",
      "faq",
      "leadForm",
      "contacts",
      "footer",
    ]);
  });

  it("rejects a response that is not a valid Lando page", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_at: Date.now() + 30 * 60 * 1_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify({ unsafe: true }) } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify({ unsafe: true }) } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await expect(
      new GigaChatProvider({ credentials: "test", fetchImpl }).generatePage({
        prompt: "Сайт",
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
  });

  it("repairs harmless JSON formatting defects", async () => {
    const malformedPlan = `${JSON.stringify(generatedPlan).slice(0, -1)},}`;
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_at: Date.now() + 30 * 60 * 1_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: `\`\`\`json\n${malformedPlan}\n\`\`\`` } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const page = await new GigaChatProvider({
      credentials: "test",
      fetchImpl,
    }).generatePage({ prompt: "Лендинг пекарни" });

    expect(page.site.title).toBe("Семейная пекарня");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("repairs a missing comma between generated array items", async () => {
    const validPlan = JSON.stringify(generatedPlan);
    const malformedPlan = validPlan.replace(
      '"Печём ежедневно."},{"title":"Состав"',
      '"Печём ежедневно."}{"title":"Состав"',
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_at: Date.now() + 30 * 60 * 1_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: malformedPlan } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const page = await new GigaChatProvider({
      credentials: "test",
      fetchImpl,
    }).generatePage({ prompt: "Лендинг пекарни" });

    expect(page.site.title).toBe("Семейная пекарня");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries once when the generated plan is invalid", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_at: Date.now() + 30 * 60 * 1_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(generatedPlan) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const page = await new GigaChatProvider({
      credentials: "test",
      fetchImpl,
    }).generatePage({ prompt: "Лендинг пекарни" });

    expect(page.site.title).toBe("Семейная пекарня");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const retryBody = JSON.parse(String(fetchImpl.mock.calls[2][1]?.body));
    expect(retryBody.messages[0].content).toContain("Повтори ответ");
    expect(retryBody.messages[0].role).toBe("system");
    expect(retryBody.messages[1].role).toBe("user");
  });
});
