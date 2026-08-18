import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Check,
  FileText,
  LayoutTemplate,
  MousePointerClick,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { ProductPreview } from "@/components/marketing/product-preview";
import { PromptComposer } from "@/components/marketing/prompt-composer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Опишите задачу",
    description:
      "Расскажите о бизнесе обычными словами: что предлагаете, кому и в каком стиле.",
  },
  {
    icon: WandSparkles,
    number: "02",
    title: "Получите первую версию",
    description: `${productConfig.name} подготовит структуру, русские тексты, оформление и нужные блоки лендинга.`,
  },
  {
    icon: Rocket,
    number: "03",
    title: "Проверьте и опубликуйте",
    description:
      "Измените детали в понятном редакторе и откройте готовую страницу по ссылке.",
  },
] as const;

const capabilities = [
  {
    icon: LayoutTemplate,
    title: "Не пустой холст",
    description:
      "Начинайте с содержательной страницы: первый экран, преимущества, услуги, отзывы, FAQ и контакты.",
  },
  {
    icon: Blocks,
    title: "Понятные блоки",
    description:
      "Меняйте тексты и порядок секций без HTML, CSS и сложных настроек конструктора.",
  },
  {
    icon: Sparkles,
    title: "AI там, где он полезен",
    description: `Сформулируйте желаемый результат. ${productConfig.name} создаёт только безопасную структурированную страницу.`,
  },
] as const;

const faqs = [
  {
    question: "Нужно ли уметь программировать?",
    answer:
      "Нет. Вы описываете будущий сайт обычным текстом, а затем меняете содержание через знакомые поля и блоки.",
  },
  {
    question: "Какой сайт можно создать?",
    answer: `В первой версии ${productConfig.name} создаёт одностраничные сайты: визитки специалистов, страницы услуг, курсов и локального бизнеса.`,
  },
  {
    question: "Запрос сохранится после регистрации?",
    answer:
      "Да. Мы сохраняем его только в текущей вкладке браузера и переносим в создание первого проекта после входа.",
  },
  {
    question: "Можно ли изменить готовый вариант?",
    answer:
      "Да. Перед публикацией можно исправить тексты, оформление и порядок блоков в простом визуальном редакторе.",
  },
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[var(--border-default)] bg-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
          <Badge className="mb-6 gap-1.5 border-[var(--ai-border)] bg-[var(--ai-surface)] text-[var(--ai-accent)]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Первая версия лендинга по вашему описанию
          </Badge>

          <h1 className="marketing-heading max-w-4xl text-4xl leading-[1.08] font-bold tracking-[-0.035em] text-balance text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Создайте сайт одной фразой
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-balance text-[var(--text-secondary)]">
            {productConfig.description}
          </p>

          <div className="mt-10 flex w-full justify-center">
            <PromptComposer promptLimit={productConfig.promptLimit} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
            {[
              "Без навыков программирования",
              "Русские тексты",
              "Адаптивная страница",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-[var(--success-surface)] text-[var(--success)]">
                  <Check
                    className="size-3"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="bg-[var(--background)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        aria-labelledby="preview-title"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Сразу видите результат
            </p>
            <h2
              id="preview-title"
              className="marketing-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            >
              Готовая страница в понятном редакторе
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              {productConfig.name} собирает цельную первую версию — вам остаётся
              проверить смысл, поправить детали и опубликовать.
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-[var(--border-default)] bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Три понятных шага
            </p>
            <h2 className="marketing-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Запрос → готовый сайт → публикация
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, description }) => (
              <li
                key={number}
                className="relative rounded-[var(--radius-large)] border border-[var(--border-default)] bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-[var(--radius-medium)] bg-[var(--primary-subtle)] text-[var(--primary)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-tertiary)]">
                    {number}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="examples"
        className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Продуманный старт
            </p>
            <h2 className="marketing-heading mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Всё необходимое для первой версии
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--text-secondary)]">
              Простые инструменты для специалистов и небольшого бизнеса — без
              лишней сложности.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[var(--radius-large)] border border-[var(--border-default)] bg-white p-6 shadow-sm"
              >
                <span className="grid size-11 place-items-center rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-primary)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="scroll-mt-20 border-y border-[var(--border-default)] bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Прозрачные тарифы
            </p>
            <h2 className="marketing-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Начните бесплатно
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--text-secondary)]">
              В прототипе списания отключены. Платный тариф появится после
              проверки основного сценария.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <article className="rounded-[var(--radius-xl)] border-2 border-[var(--primary)] bg-white p-7 shadow-sm">
              <Badge>Для старта</Badge>
              <h3 className="mt-5 text-2xl font-semibold">Free</h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                Первая версия проекта и публикация на ссылке{" "}
                {productConfig.name}.
              </p>
              <p className="mt-7 text-4xl font-bold tracking-tight">0 ₽</p>
              <ul className="mt-7 space-y-3 text-sm text-[var(--text-secondary)]">
                {[
                  "1 проект",
                  "Генерация первой версии",
                  "Редактор и публикация",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check
                      className="size-4 text-[var(--success)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?next=%2Fdashboard%2Fnew"
                className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full")}
              >
                Создать сайт
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
            <article className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--background)] p-7">
              <Badge className="border-[var(--border-default)] bg-white text-[var(--text-secondary)]">
                После прототипа
              </Badge>
              <h3 className="mt-5 text-2xl font-semibold">Pro</h3>
              <p className="mt-2 text-[var(--text-secondary)]">
                Больше проектов, собственный домен и расширенные возможности.
              </p>
              <p className="mt-7 text-4xl font-bold tracking-tight">
                {productConfig.proPriceRub.toLocaleString("ru-RU")} ₽
                <span className="text-sm font-normal text-[var(--text-secondary)]">
                  {" "}
                  / месяц
                </span>
              </p>
              <ul className="mt-7 space-y-3 text-sm text-[var(--text-secondary)]">
                {[
                  "До 10 проектов",
                  "Собственный домен",
                  "Расширенные AI-команды",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check
                      className="size-4 text-[var(--text-tertiary)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-8 w-full cursor-default text-[var(--text-secondary)]",
                )}
              >
                Скоро
              </span>
            </article>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">
              Коротко о главном
            </p>
            <h2 className="marketing-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Частые вопросы
            </h2>
            <p className="mt-4 leading-7 text-[var(--text-secondary)]">
              {productConfig.name} создаётся для тех, кому нужен понятный
              рабочий сайт без долгого освоения конструктора.
            </p>
          </div>
          <div className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[var(--radius-medium)] px-2 py-5 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">
                  {question}
                  <span
                    className="text-xl font-normal text-[var(--text-tertiary)] transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="px-2 pr-10 pb-6 leading-7 text-[var(--text-secondary)]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-[var(--radius-xl)] bg-[var(--primary-active)] px-6 py-12 text-center text-white sm:px-10 sm:py-16">
          <ShieldCheck className="size-8 text-blue-200" aria-hidden="true" />
          <h2 className="marketing-heading mt-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Расскажите о бизнесе — начните с готовой основы
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Ваш запрос сохранится в этой вкладке и будет готов после
            регистрации.
          </p>
          <Link
            href="/register?next=%2Fdashboard%2Fnew"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-8 border-white bg-white text-[var(--primary-active)] hover:bg-blue-50",
            )}
          >
            Начать бесплатно
            <MousePointerClick className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
