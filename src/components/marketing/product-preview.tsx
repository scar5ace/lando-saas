import {
  Check,
  ChevronDown,
  Monitor,
  PanelLeft,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { productConfig } from "@/config/product";

export function ProductPreview() {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-white shadow-[0_30px_80px_-36px_rgba(15,23,42,0.4)]"
      role="img"
      aria-label={`Предпросмотр редактора ${productConfig.name} с готовым лендингом мастера по установке кондиционеров`}
    >
      <div className="flex h-12 items-center justify-between border-b border-[var(--border-default)] bg-white px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="ml-2 hidden text-xs font-semibold text-[var(--text-primary)] sm:inline">
            КлиматСервис · Главная
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden rounded-md bg-[var(--surface-secondary)] p-1.5 text-[var(--text-secondary)] sm:inline-flex">
            <Monitor className="size-3.5" />
          </span>
          <span className="hidden rounded-md p-1.5 text-[var(--text-tertiary)] sm:inline-flex">
            <Smartphone className="size-3.5" />
          </span>
          <span className="ml-1 rounded-[8px] bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-semibold text-white sm:text-xs">
            Опубликовать
          </span>
        </div>
      </div>

      <div className="grid min-h-[430px] grid-cols-1 bg-[var(--surface-secondary)] lg:grid-cols-[200px_minmax(0,1fr)_220px]">
        <aside
          className="hidden border-r border-[var(--border-default)] bg-white p-3 lg:block"
          aria-hidden="true"
        >
          <p className="mb-3 px-1 text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
            Блоки страницы
          </p>
          {[
            ["Первый экран", true],
            ["Преимущества", false],
            ["Услуги и цены", false],
            ["Как мы работаем", false],
            ["Отзывы", false],
            ["Частые вопросы", false],
            ["Контакты", false],
          ].map(([label, selected]) => (
            <div
              key={label as string}
              className={`mb-1 flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-[11px] font-medium ${
                selected
                  ? "bg-[var(--primary-subtle)] text-[var(--primary-active)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <PanelLeft className="size-3" />
              {label}
            </div>
          ))}
          <div className="mt-4 rounded-[10px] border border-[var(--ai-border)] bg-[var(--ai-surface)] p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--ai-accent)]">
              <Sparkles className="size-3" />
              AI-изменение
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-[var(--text-secondary)]">
              Сделай первый экран убедительнее
            </p>
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5">
          <div className="mx-auto max-w-[680px] overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
              <div className="text-xs font-extrabold tracking-tight text-slate-900 sm:text-sm">
                КЛИМАТСЕРВИС
              </div>
              <div className="hidden gap-4 text-[9px] font-medium text-slate-500 sm:flex">
                <span>Услуги</span>
                <span>Цены</span>
                <span>Отзывы</span>
                <span>Контакты</span>
              </div>
              <span className="rounded-md bg-blue-600 px-2.5 py-1.5 text-[9px] font-semibold text-white">
                Вызвать мастера
              </span>
            </div>

            <div className="grid min-h-[220px] items-center gap-5 bg-gradient-to-br from-slate-50 to-blue-50 px-5 py-8 sm:grid-cols-[1.25fr_0.75fr] sm:px-8 sm:py-10">
              <div>
                <span className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[8px] font-bold tracking-wide text-blue-700 uppercase">
                  Работаем по Саратову
                </span>
                <h3 className="mt-3 max-w-md text-xl leading-tight font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Прохлада дома без лишних хлопот
                </h3>
                <p className="mt-2 max-w-sm text-[10px] leading-4 text-slate-600 sm:text-xs sm:leading-5">
                  Подберём и установим кондиционер с гарантией. Честная смета до
                  начала работ.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-3 py-2 text-[9px] font-semibold text-white sm:text-[10px]">
                    Рассчитать стоимость
                  </span>
                  <span className="text-[9px] font-semibold text-slate-600 sm:text-[10px]">
                    от 4 900 ₽
                  </span>
                </div>
              </div>
              <div className="hidden aspect-square rounded-[18px] bg-blue-600 p-4 sm:grid sm:place-items-center">
                <div className="grid size-24 place-items-center rounded-full border-[14px] border-blue-300 bg-white shadow-lg">
                  <div className="size-8 rounded-full border-4 border-blue-200 bg-blue-50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-slate-200">
              {[
                "Монтаж за один визит",
                "Гарантия на работы",
                "Без скрытых доплат",
              ].map((item) => (
                <div
                  key={item}
                  className="flex min-h-16 items-center gap-1.5 bg-white px-2 py-3 sm:px-4"
                >
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-green-50 text-green-600">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className="text-[8px] leading-3 font-semibold text-slate-700 sm:text-[10px]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-6">
              {["Стандартный монтаж", "Обслуживание", "Ремонт"].map(
                (service, index) => (
                  <div
                    key={service}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="mb-3 h-1.5 w-8 rounded-full bg-blue-500" />
                    <p className="text-[9px] font-bold text-slate-800 sm:text-[10px]">
                      {service}
                    </p>
                    <p className="mt-1 text-[8px] text-slate-500">
                      от{" "}
                      {index === 0 ? "4 900" : index === 1 ? "1 500" : "2 000"}{" "}
                      ₽
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <aside
          className="hidden border-l border-[var(--border-default)] bg-white p-4 lg:block"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Первый экран</p>
            <ChevronDown className="size-3.5 text-[var(--text-tertiary)]" />
          </div>
          <label className="mt-5 block text-[10px] font-medium text-[var(--text-secondary)]">
            Заголовок
          </label>
          <div className="mt-1.5 rounded-[8px] border border-[var(--primary)] bg-white p-2 text-[10px] leading-4 text-[var(--text-primary)] ring-2 ring-[var(--primary-subtle)]">
            Прохлада дома без лишних хлопот
          </div>
          <label className="mt-4 block text-[10px] font-medium text-[var(--text-secondary)]">
            Основной цвет
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-[var(--border-default)] p-2">
            <span className="size-5 rounded-md bg-blue-600" />
            <span className="text-[10px] text-[var(--text-secondary)]">
              #2563EB
            </span>
          </div>
          <label className="mt-4 block text-[10px] font-medium text-[var(--text-secondary)]">
            Выравнивание
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-[8px] bg-[var(--surface-secondary)] p-1">
            <span className="rounded-md bg-white py-1.5 text-center text-[9px] font-semibold text-[var(--primary)] shadow-sm">
              Слева
            </span>
            <span className="py-1.5 text-center text-[9px] text-[var(--text-tertiary)]">
              Центр
            </span>
            <span className="py-1.5 text-center text-[9px] text-[var(--text-tertiary)]">
              Справа
            </span>
          </div>
          <div className="mt-7 flex items-center gap-2 rounded-[10px] border border-[var(--ai-border)] bg-[var(--ai-surface)] p-2.5 text-[10px] text-[var(--text-secondary)]">
            <Sparkles className="size-3.5 shrink-0 text-[var(--ai-accent)]" />
            Что изменить в блоке?
            <Send className="ml-auto size-3 text-[var(--ai-accent)]" />
          </div>
        </aside>
      </div>
    </div>
  );
}
