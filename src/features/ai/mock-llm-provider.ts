import { pageSchema } from "@/lib/validation/page-schema";
import { sanitizePlainText } from "@/lib/security/sanitize";
import type { BlockPatch, PagePatch, PageSchema } from "@/types/page-schema";
import type {
  EditBlockInput,
  EditPageInput,
  GeneratePageInput,
  LLMProvider,
  RegenerateTextInput,
  TextResult,
} from "@/types/ai";

import { LLMProviderError } from "./provider";

const PROMPT_LIMIT = 2_000;

type LandingCopy = {
  siteTitle: string;
  siteDescription: string;
  brand: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  featuresTitle: string;
  features: ReadonlyArray<{
    title: string;
    description: string;
    icon: "check" | "shield" | "clock";
  }>;
  servicesTitle: string;
  services: ReadonlyArray<{
    title: string;
    description: string;
    price: string;
  }>;
  stepsTitle: string;
  steps: ReadonlyArray<{ title: string; description: string }>;
  testimonialsTitle: string;
  testimonials: ReadonlyArray<{ quote: string; author: string; role: string }>;
  faqTitle: string;
  faq: ReadonlyArray<{ question: string; answer: string }>;
  formTitle: string;
  formDescription: string;
  address: string;
  phone: string;
  phoneDisplay: string;
  email: string;
};

const CLIMATE_COPY: LandingCopy = {
  siteTitle: "Установка кондиционеров в Саратове",
  siteDescription:
    "Профессиональная установка и обслуживание кондиционеров с понятной стоимостью и гарантией на работы.",
  brand: "Климат Мастер",
  eyebrow: "Установка кондиционеров в Саратове",
  heroTitle: "Комфортная температура дома уже с первого запуска",
  heroDescription:
    "Подберём место, аккуратно установим кондиционер и проверим каждый режим. Стоимость согласуем до начала работ.",
  featuresTitle: "Почему нам доверяют",
  features: [
    {
      title: "Честная смета",
      description:
        "Заранее объясняем состав работ и фиксируем согласованную стоимость.",
      icon: "check",
    },
    {
      title: "Гарантия на монтаж",
      description:
        "Отвечаем за качество установки и остаёмся на связи после запуска.",
      icon: "shield",
    },
    {
      title: "Удобное время",
      description:
        "Подбираем дату и интервал выезда, которые подходят именно вам.",
      icon: "clock",
    },
  ],
  servicesTitle: "Услуги и цены",
  services: [
    {
      title: "Стандартный монтаж",
      description: "Установка внутреннего и внешнего блока с базовой трассой.",
      price: "от 7 500 ₽",
    },
    {
      title: "Чистка кондиционера",
      description: "Очистка фильтров, теплообменника и дренажной системы.",
      price: "от 2 500 ₽",
    },
    {
      title: "Диагностика",
      description: "Проверка оборудования и поиск причины неисправности.",
      price: "от 1 500 ₽",
    },
  ],
  stepsTitle: "Как проходит работа",
  steps: [
    {
      title: "Заявка",
      description: "Вы оставляете контакты и кратко описываете задачу.",
    },
    {
      title: "Консультация",
      description: "Уточняем детали, рассчитываем стоимость и согласуем время.",
    },
    {
      title: "Монтаж",
      description: "Выполняем установку аккуратно и защищаем мебель от пыли.",
    },
    {
      title: "Проверка",
      description:
        "Запускаем систему, проверяем режимы и объясняем управление.",
    },
  ],
  testimonialsTitle: "Отзывы клиентов",
  testimonials: [
    {
      quote:
        "Мастер приехал вовремя, заранее подтвердил цену и оставил после монтажа чистоту.",
      author: "Анна",
      role: "Саратов",
    },
    {
      quote:
        "Подсказали удачное место для блока и спокойно ответили на все вопросы.",
      author: "Дмитрий",
      role: "Энгельс",
    },
    {
      quote:
        "Кондиционер работает тихо, а установка заняла ровно столько, сколько обещали.",
      author: "Мария",
      role: "Саратов",
    },
  ],
  faqTitle: "Частые вопросы",
  faq: [
    {
      question: "Сколько времени занимает установка?",
      answer:
        "Стандартный монтаж обычно выполняется за один выезд. Точное время зависит от длины трассы и особенностей стены.",
    },
    {
      question: "Можно ли узнать цену заранее?",
      answer:
        "Да. После уточнения деталей мы называем предварительную стоимость и согласуем дополнительные работы до их начала.",
    },
    {
      question: "Вы убираете после монтажа?",
      answer:
        "Мы защищаем рабочую зону, собираем строительную пыль и уносим упаковочные материалы после завершения.",
    },
    {
      question: "Есть ли гарантия?",
      answer:
        "Да, условия гарантии на монтаж фиксируются при согласовании заказа.",
    },
  ],
  formTitle: "Рассчитайте стоимость установки",
  formDescription:
    "Оставьте имя и телефон. Мы уточним детали и назовём предварительную стоимость без обязательств.",
  address: "Саратов и Энгельс",
  phone: "+78452123456",
  phoneDisplay: "+7 (8452) 12-34-56",
  email: "hello@example.ru",
};

const GENERIC_COPY: LandingCopy = {
  siteTitle: "Надёжные услуги для дома и бизнеса",
  siteDescription:
    "Понятный сервис, согласованная стоимость и внимательное отношение к каждой задаче.",
  brand: "Мастер Сервис",
  eyebrow: "Профессиональные услуги рядом",
  heroTitle: "Решаем вашу задачу спокойно и аккуратно",
  heroDescription:
    "Обсудим детали, предложим понятный план и заранее согласуем стоимость работ.",
  featuresTitle: "Преимущества сервиса",
  features: [
    {
      title: "Понятные условия",
      description:
        "До начала работ объясняем этапы, сроки и итоговую стоимость.",
      icon: "check",
    },
    {
      title: "Ответственный подход",
      description:
        "Бережно относимся к вашему времени и отвечаем за результат.",
      icon: "shield",
    },
    {
      title: "Всегда на связи",
      description: "Оперативно отвечаем на вопросы и согласуем удобное время.",
      icon: "clock",
    },
  ],
  servicesTitle: "Наши услуги",
  services: [
    {
      title: "Консультация",
      description: "Разберём задачу и предложим подходящее решение.",
      price: "бесплатно",
    },
    {
      title: "Основная услуга",
      description: "Выполним согласованный объём работ с контролем качества.",
      price: "по расчёту",
    },
    {
      title: "Дополнительная помощь",
      description: "Поддержим после завершения и ответим на вопросы.",
      price: "по запросу",
    },
  ],
  stepsTitle: "Простой порядок работы",
  steps: [
    {
      title: "Заявка",
      description: "Вы рассказываете, какой результат вам нужен.",
    },
    { title: "Расчёт", description: "Мы уточняем детали и согласуем условия." },
    {
      title: "Работа",
      description: "Выполняем задачу по согласованному плану.",
    },
    { title: "Результат", description: "Проверяем качество вместе с вами." },
  ],
  testimonialsTitle: "Что говорят клиенты",
  testimonials: [
    {
      quote:
        "Всё объяснили простыми словами и выполнили работу точно по договорённости.",
      author: "Елена",
      role: "частный клиент",
    },
    {
      quote: "Удобно, что стоимость и порядок действий были понятны заранее.",
      author: "Алексей",
      role: "предприниматель",
    },
  ],
  faqTitle: "Ответы на вопросы",
  faq: [
    {
      question: "Как получить расчёт?",
      answer:
        "Оставьте заявку, и мы зададим несколько уточняющих вопросов перед расчётом.",
    },
    {
      question: "Когда можно начать?",
      answer:
        "Подберём ближайшее свободное время после согласования задачи и условий.",
    },
    {
      question: "Стоимость изменится в процессе?",
      answer:
        "Дополнительные работы выполняются только после отдельного согласования с вами.",
    },
  ],
  formTitle: "Обсудить задачу",
  formDescription:
    "Оставьте контакты, чтобы получить консультацию и предварительный расчёт.",
  address: "Работаем по предварительной записи",
  phone: "+78005553535",
  phoneDisplay: "+7 (800) 555-35-35",
  email: "hello@example.ru",
};

function buildLanding(copy: LandingCopy): PageSchema {
  const page = {
    schemaVersion: 1,
    site: {
      title: copy.siteTitle,
      description: copy.siteDescription,
      language: "ru",
      theme: {
        colorMode: "light",
        primaryColor: "#2563EB",
        backgroundColor: "#FFFFFF",
        surfaceColor: "#F8FAFC",
        textColor: "#111827",
        mutedTextColor: "#64748B",
        headingFont: "Manrope",
        bodyFont: "Inter",
        borderRadius: "large",
      },
      seo: {
        title: copy.siteTitle,
        description: copy.siteDescription,
        indexing: true,
      },
    },
    blocks: [
      {
        id: "header-1",
        type: "header",
        variant: "with-cta",
        hidden: false,
        content: {
          logoText: copy.brand,
          navLinks: [
            {
              label: "Услуги",
              action: { type: "scroll", target: "services-1" },
            },
            { label: "Этапы", action: { type: "scroll", target: "steps-1" } },
            {
              label: "Отзывы",
              action: { type: "scroll", target: "testimonials-1" },
            },
            { label: "Вопросы", action: { type: "scroll", target: "faq-1" } },
          ],
          cta: {
            label: "Оставить заявку",
            style: "primary",
            action: { type: "scroll", target: "lead-form-1" },
          },
        },
      },
      {
        id: "hero-1",
        type: "hero",
        variant: "centered",
        hidden: false,
        style: { alignment: "center", padding: "large" },
        content: {
          eyebrow: copy.eyebrow,
          title: copy.heroTitle,
          description: copy.heroDescription,
          primaryButton: {
            label: "Получить расчёт",
            style: "primary",
            action: { type: "scroll", target: "lead-form-1" },
          },
          secondaryButton: {
            label: "Посмотреть услуги",
            style: "outline",
            action: { type: "scroll", target: "services-1" },
          },
        },
      },
      {
        id: "features-1",
        type: "features",
        variant: "icons-grid",
        hidden: false,
        content: { title: copy.featuresTitle, items: copy.features },
      },
      {
        id: "services-1",
        type: "services",
        variant: "cards",
        hidden: false,
        style: { background: "#F8FAFC", padding: "large" },
        content: { title: copy.servicesTitle, items: copy.services },
      },
      {
        id: "steps-1",
        type: "steps",
        variant: "numbered",
        hidden: false,
        content: { title: copy.stepsTitle, items: copy.steps },
      },
      {
        id: "testimonials-1",
        type: "testimonials",
        variant: "cards",
        hidden: false,
        content: { title: copy.testimonialsTitle, items: copy.testimonials },
      },
      {
        id: "faq-1",
        type: "faq",
        variant: "accordion",
        hidden: false,
        content: { title: copy.faqTitle, items: copy.faq },
      },
      {
        id: "lead-form-1",
        type: "leadForm",
        variant: "card",
        hidden: false,
        style: { background: "#EFF6FF", padding: "large" },
        content: {
          title: copy.formTitle,
          description: copy.formDescription,
          formKey: "main-request",
          fields: [
            {
              type: "name",
              key: "name",
              label: "Ваше имя",
              placeholder: "Например, Анна",
              required: true,
            },
            {
              type: "phone",
              key: "phone",
              label: "Телефон",
              placeholder: "+7 900 000-00-00",
              required: true,
            },
          ],
          submitLabel: "Получить консультацию",
          successMessage:
            "Спасибо! Мы свяжемся с вами, когда приём заявок будет подключён.",
          consent: {
            label: "Я согласен на обработку персональных данных.",
            required: true,
          },
        },
      },
      {
        id: "contacts-1",
        type: "contacts",
        variant: "mapless",
        hidden: false,
        content: {
          title: "Контакты",
          contacts: [
            {
              label: "Телефон",
              value: copy.phoneDisplay,
              action: { type: "phone", phone: copy.phone },
            },
            {
              label: "Электронная почта",
              value: copy.email,
              action: { type: "email", email: copy.email },
            },
          ],
          address: copy.address,
          hours: "Ежедневно с 09:00 до 20:00",
        },
      },
      {
        id: "footer-1",
        type: "footer",
        variant: "with-brand",
        hidden: false,
        content: {
          brand: copy.brand,
          links: [
            {
              label: "Услуги",
              action: { type: "scroll", target: "services-1" },
            },
            {
              label: "Контакты",
              action: { type: "scroll", target: "contacts-1" },
            },
          ],
          legalText:
            "Демонстрационная страница. Информация не является публичной офертой.",
        },
      },
    ],
  } as const;

  return pageSchema.parse(page);
}

function unsupported(capability: string): LLMProviderError {
  return new LLMProviderError(
    "PROVIDER_CAPABILITY_UNAVAILABLE",
    `Локальный mock-провайдер не поддерживает операцию «${capability}».`,
  );
}

export class MockLLMProvider implements LLMProvider {
  generatePage(input: GeneratePageInput): Promise<PageSchema> {
    const prompt = sanitizePlainText(input.prompt, { maxLength: PROMPT_LIMIT });
    if (prompt.length === 0) {
      return Promise.reject(
        new LLMProviderError(
          "INVALID_PROVIDER_INPUT",
          "Опишите сайт хотя бы одной фразой.",
        ),
      );
    }

    const normalizedPrompt = prompt.toLocaleLowerCase("ru-RU");
    const isClimateLanding = /кондиционер|сплит-систем|климат/.test(
      normalizedPrompt,
    );
    return Promise.resolve(
      buildLanding(isClimateLanding ? CLIMATE_COPY : GENERIC_COPY),
    );
  }

  editPage(input: EditPageInput): Promise<PagePatch> {
    void input;
    return Promise.reject(unsupported("редактирование страницы"));
  }

  editBlock(input: EditBlockInput): Promise<BlockPatch> {
    void input;
    return Promise.reject(unsupported("редактирование блока"));
  }

  regenerateText(input: RegenerateTextInput): Promise<TextResult> {
    void input;
    return Promise.reject(unsupported("перегенерация текста"));
  }
}
