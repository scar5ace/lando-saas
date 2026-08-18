import type * as React from "react";
import {
  Check,
  Clock3,
  Heart,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  BlockOfType,
  BlockSchema,
  ButtonSchema,
  FormFieldSchema,
  ImageRef,
  LinkAction,
  PageSchema,
} from "@/types";

type RendererProps = {
  page: PageSchema;
  className?: string;
  editorMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
};

const paddingClasses = {
  none: "py-0",
  small: "py-8 @3xl:py-10",
  medium: "py-14 @3xl:py-18",
  large: "py-20 @3xl:py-28",
} as const;

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function actionHref(action: LinkAction): string {
  switch (action.type) {
    case "scroll":
      return `#${action.target}`;
    case "url":
      return action.url;
    case "email":
      return `mailto:${action.email}`;
    case "phone":
      return `tel:${action.phone.replace(/[^+\d]/g, "")}`;
  }
}

function ActionLink({
  action,
  children,
  className,
}: {
  action: LinkAction;
  children: React.ReactNode;
  className?: string;
}) {
  const opensNewTab = action.type === "url" && action.newTab === true;
  return (
    <a
      href={actionHref(action)}
      className={className}
      target={opensNewTab ? "_blank" : undefined}
      rel={opensNewTab ? "noreferrer noopener" : undefined}
    >
      {children}
    </a>
  );
}

function SiteButton({
  button,
  compact = false,
}: {
  button: ButtonSchema;
  compact?: boolean;
}) {
  const styles = {
    primary:
      "border-transparent bg-[var(--site-primary)] text-white shadow-sm hover:brightness-90",
    secondary:
      "border-transparent bg-[var(--site-surface)] text-[var(--site-text)] hover:brightness-95",
    outline: "border-current bg-transparent text-current hover:bg-black/5",
    ghost: "border-transparent bg-transparent text-current hover:bg-black/5",
  } as const;

  return (
    <ActionLink
      action={button.action}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--site-radius)] border font-semibold transition duration-150 focus-visible:ring-3 focus-visible:ring-[var(--site-primary)]/30 focus-visible:outline-none",
        compact ? "min-h-10 px-4 py-2 text-sm" : "min-h-12 px-6 py-3",
        styles[button.style],
      )}
    >
      {button.label}
    </ActionLink>
  );
}

function DemoImage({
  image,
  className,
}: {
  image: ImageRef;
  className?: string;
}) {
  const label = image.alt;
  const marker = "demoAssetKey" in image ? image.demoAssetKey : "user-image";
  return (
    <div
      role="img"
      aria-label={label}
      data-image={marker}
      className={cn(
        "relative isolate flex min-h-56 overflow-hidden rounded-[calc(var(--site-radius)+4px)] bg-gradient-to-br from-[var(--site-primary)] via-sky-400 to-cyan-200 shadow-lg",
        className,
      )}
    >
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_32%),radial-gradient(circle_at_80%_70%,white_0,transparent_27%)] opacity-35" />
      <span className="relative mt-auto p-5 text-sm font-medium text-white/90">
        {label}
      </span>
    </div>
  );
}

function SectionHeading({
  title,
  primary = false,
}: {
  title: string;
  primary?: boolean;
}) {
  const className =
    "max-w-3xl text-balance text-3xl font-bold tracking-tight @3xl:text-4xl";
  return primary ? (
    <h1 className={className}>{title}</h1>
  ) : (
    <h2 className={className}>{title}</h2>
  );
}

function Icon({
  name,
}: {
  name?:
    | "check"
    | "star"
    | "shield"
    | "clock"
    | "sparkles"
    | "heart"
    | "tools"
    | "phone";
}) {
  const icons = {
    check: Check,
    star: Star,
    shield: ShieldCheck,
    clock: Clock3,
    sparkles: Sparkles,
    heart: Heart,
    tools: Wrench,
    phone: Phone,
  } as const;
  const Component = icons[name ?? "check"];
  return <Component aria-hidden="true" className="size-5" />;
}

function HeaderBlock({ block }: { block: BlockOfType<"header"> }) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 @3xl:px-8">
      <a href="#" className="text-xl font-extrabold tracking-tight">
        {block.content.logoText}
      </a>
      <nav
        aria-label="Навигация по странице"
        className="hidden items-center gap-6 @3xl:flex"
      >
        {block.content.navLinks.map((link) => (
          <ActionLink
            key={`${link.label}-${actionHref(link.action)}`}
            action={link.action}
            className="text-sm font-medium opacity-70 hover:opacity-100"
          >
            {link.label}
          </ActionLink>
        ))}
      </nav>
      {block.content.cta ? (
        <SiteButton button={block.content.cta} compact />
      ) : null}
    </header>
  );
}

function HeroBlock({
  block,
  primary,
}: {
  block: BlockOfType<"hero">;
  primary: boolean;
}) {
  const image = block.content.image;
  const hasImage = image !== undefined;
  const imageLeft = block.variant === "image-left";
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl items-center gap-12 px-5 @3xl:px-8",
        hasImage &&
          block.variant !== "centered" &&
          block.variant !== "full-background"
          ? "@5xl:grid-cols-2"
          : "place-items-center text-center",
      )}
    >
      {image && imageLeft ? (
        <DemoImage image={image} className="min-h-80 w-full" />
      ) : null}
      <div className={cn("space-y-6", hasImage ? "max-w-2xl" : "max-w-4xl")}>
        {block.content.eyebrow ? (
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--site-primary)] uppercase">
            {block.content.eyebrow}
          </p>
        ) : null}
        <SectionHeading title={block.content.title} primary={primary} />
        <p className="max-w-2xl text-lg leading-8 text-[var(--site-muted)] @3xl:text-xl">
          {block.content.description}
        </p>
        <div
          className={cn(
            "flex flex-wrap gap-3",
            !hasImage || block.variant === "centered"
              ? "justify-center"
              : "justify-start",
          )}
        >
          <SiteButton button={block.content.primaryButton} />
          {block.content.secondaryButton ? (
            <SiteButton button={block.content.secondaryButton} />
          ) : null}
        </div>
      </div>
      {image && !imageLeft ? (
        <DemoImage image={image} className="min-h-80 w-full" />
      ) : null}
    </div>
  );
}

function FeaturesBlock({
  block,
  primary,
}: {
  block: BlockOfType<"features">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div
        className={cn(
          "grid gap-5",
          block.variant === "numbered-list"
            ? "@3xl:grid-cols-2"
            : "@3xl:grid-cols-3",
        )}
      >
        {block.content.items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="rounded-[var(--site-radius)] border border-black/8 bg-[var(--site-surface)] p-6 shadow-sm"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-[var(--site-primary)]/10 text-[var(--site-primary)]">
              {block.variant === "numbered-list" ? (
                <span className="font-bold">{index + 1}</span>
              ) : (
                <Icon name={item.icon} />
              )}
            </div>
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="mt-2 leading-7 text-[var(--site-muted)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ServicesBlock({
  block,
  primary,
}: {
  block: BlockOfType<"services">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div
        className={cn(
          "grid gap-5",
          block.variant === "compact-list"
            ? "@3xl:grid-cols-2"
            : "@3xl:grid-cols-3",
        )}
      >
        {block.content.items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="flex flex-col rounded-[var(--site-radius)] border border-black/8 bg-[var(--site-surface)] p-6"
          >
            {item.image ? (
              <DemoImage image={item.image} className="mb-5 min-h-40" />
            ) : null}
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="mt-2 flex-1 leading-7 text-[var(--site-muted)]">
              {item.description}
            </p>
            {item.price ? (
              <p className="mt-5 text-lg font-bold text-[var(--site-primary)]">
                {item.price}
              </p>
            ) : null}
            {item.button ? (
              <div className="mt-5">
                <SiteButton button={item.button} compact />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function AboutBlock({
  block,
  primary,
}: {
  block: BlockOfType<"about">;
  primary: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl items-center gap-10 px-5 @3xl:px-8",
        block.content.image ? "@5xl:grid-cols-2" : "grid-cols-1",
      )}
    >
      <div className="space-y-5">
        <SectionHeading title={block.content.title} primary={primary} />
        <p className="max-w-3xl text-lg leading-8 whitespace-pre-line text-[var(--site-muted)]">
          {block.content.text}
        </p>
        {block.content.stats ? (
          <dl className="grid grid-cols-2 gap-4 pt-4 @2xl:grid-cols-3">
            {block.content.stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`}>
                <dt className="text-2xl font-bold">{stat.value}</dt>
                <dd className="text-sm text-[var(--site-muted)]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {block.content.image ? (
        <DemoImage image={block.content.image} className="min-h-80" />
      ) : null}
    </div>
  );
}

function StepsBlock({
  block,
  primary,
}: {
  block: BlockOfType<"steps">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <ol className="grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-4">
        {block.content.items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6"
          >
            <span className="text-sm font-bold text-[var(--site-primary)]">
              Шаг {index + 1}
            </span>
            <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
            <p className="mt-2 leading-7 text-[var(--site-muted)]">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GalleryBlock({
  block,
  primary,
}: {
  block: BlockOfType<"gallery">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {block.content.images.map((image, index) => (
          <DemoImage
            key={`${image.alt}-${index}`}
            image={image}
            className="min-h-64"
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialsBlock({
  block,
  primary,
}: {
  block: BlockOfType<"testimonials">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div className="grid gap-5 @3xl:grid-cols-3">
        {block.content.items.map((item, index) => (
          <figure
            key={`${item.author}-${index}`}
            className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6 shadow-sm"
          >
            <blockquote className="text-lg leading-8">
              «{item.quote}»
            </blockquote>
            <figcaption className="mt-5 text-sm">
              <strong>{item.author}</strong>
              {item.role ? (
                <span className="block text-[var(--site-muted)]">
                  {item.role}
                </span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function PricingBlock({
  block,
  primary,
}: {
  block: BlockOfType<"pricing">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div className="grid gap-5 @3xl:grid-cols-3">
        {block.content.plans.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "rounded-[var(--site-radius)] border bg-[var(--site-surface)] p-7",
              plan.featured
                ? "border-[var(--site-primary)] shadow-lg"
                : "border-black/8",
            )}
          >
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-3 text-3xl font-black">{plan.priceText}</p>
            {plan.description ? (
              <p className="mt-3 text-[var(--site-muted)]">
                {plan.description}
              </p>
            ) : null}
            <ul className="my-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check
                    className="mt-0.5 size-5 text-[var(--site-primary)]"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <SiteButton button={plan.button} />
          </article>
        ))}
      </div>
    </div>
  );
}

function TeamBlock({
  block,
  primary,
}: {
  block: BlockOfType<"team">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div className="grid gap-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {block.content.members.map((member) => (
          <article
            key={member.name}
            className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6"
          >
            {member.image ? (
              <DemoImage image={member.image} className="mb-5 min-h-48" />
            ) : null}
            <h3 className="text-xl font-bold">{member.name}</h3>
            <p className="text-sm font-semibold text-[var(--site-primary)]">
              {member.role}
            </p>
            {member.bio ? (
              <p className="mt-3 leading-7 text-[var(--site-muted)]">
                {member.bio}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function FaqBlock({
  block,
  primary,
}: {
  block: BlockOfType<"faq">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 @3xl:px-8">
      <SectionHeading title={block.content.title} primary={primary} />
      <div className="space-y-3">
        {block.content.items.map((item) => (
          <details
            key={item.question}
            className="group rounded-[var(--site-radius)] bg-[var(--site-surface)] p-5"
          >
            <summary className="cursor-pointer list-none pr-6 font-bold">
              {item.question}
            </summary>
            <p className="mt-3 leading-7 text-[var(--site-muted)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function CtaBlock({
  block,
  primary,
}: {
  block: BlockOfType<"cta">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 @3xl:px-8 @5xl:grid-cols-[1fr_auto]">
      <div className="space-y-4">
        <SectionHeading title={block.content.title} primary={primary} />
        <p className="max-w-2xl text-lg leading-8 text-[var(--site-muted)]">
          {block.content.description}
        </p>
      </div>
      <SiteButton button={block.content.button} />
    </div>
  );
}

function ContactsBlock({
  block,
  primary,
}: {
  block: BlockOfType<"contacts">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 @3xl:px-8 @5xl:grid-cols-2">
      <div className="space-y-5">
        <SectionHeading title={block.content.title} primary={primary} />
        {block.content.address ? (
          <p className="text-lg">{block.content.address}</p>
        ) : null}
        {block.content.hours ? (
          <p className="text-[var(--site-muted)]">{block.content.hours}</p>
        ) : null}
      </div>
      <dl className="space-y-4 rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6">
        {block.content.contacts.map((contact) => (
          <div key={`${contact.label}-${contact.value}`}>
            <dt className="text-sm text-[var(--site-muted)]">
              {contact.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {contact.action ? (
                <ActionLink
                  action={contact.action}
                  className="hover:text-[var(--site-primary)]"
                >
                  {contact.value}
                </ActionLink>
              ) : (
                contact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FormField({ field }: { field: FormFieldSchema }) {
  if (field.type === "checkbox" || field.type === "consent") {
    return (
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          required={field.required}
          disabled
          className="mt-1"
        />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <label className="grid gap-2 text-sm font-medium">
        <span>{field.label}</span>
        <select
          disabled
          required={field.required}
          className="h-12 rounded-[var(--site-radius)] border border-black/15 bg-white px-3 text-slate-900"
        >
          <option>{field.placeholder ?? "Выберите вариант"}</option>
          {field.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }
  const isTextarea = field.type === "textarea";
  const type =
    field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{field.label}</span>
      {isTextarea ? (
        <textarea
          disabled
          required={field.required}
          placeholder={field.placeholder}
          className="min-h-28 rounded-[var(--site-radius)] border border-black/15 bg-white p-3 text-slate-900"
        />
      ) : (
        <input
          disabled
          type={type}
          required={field.required}
          placeholder={field.placeholder}
          className="h-12 rounded-[var(--site-radius)] border border-black/15 bg-white px-3 text-slate-900"
        />
      )}
    </label>
  );
}

function LeadFormBlock({
  block,
  primary,
}: {
  block: BlockOfType<"leadForm">;
  primary: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 @3xl:px-8 @5xl:grid-cols-2">
      <div className="space-y-4">
        <SectionHeading title={block.content.title} primary={primary} />
        <p className="text-lg leading-8 text-[var(--site-muted)]">
          {block.content.description}
        </p>
        <p className="rounded-lg bg-[var(--site-primary)]/10 p-3 text-sm">
          Форма показана в прототипе. Приём заявок подключается на этапе форм.
        </p>
      </div>
      <form
        aria-label={block.content.title}
        className="space-y-4 rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6 shadow-sm"
        onSubmit={undefined}
      >
        {block.content.fields.map((field) => (
          <FormField key={field.key} field={field} />
        ))}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required={block.content.consent.required}
            disabled
            className="mt-1"
          />
          <span>{block.content.consent.label}</span>
        </label>
        <button
          type="button"
          disabled
          className="h-12 w-full rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 font-semibold text-white opacity-60"
        >
          {block.content.submitLabel}
        </button>
      </form>
    </div>
  );
}

function FooterBlock({ block }: { block: BlockOfType<"footer"> }) {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:px-8">
      <strong>{block.content.brand}</strong>
      <nav aria-label="Ссылки в подвале" className="flex flex-wrap gap-4">
        {block.content.links.map((link) => (
          <ActionLink
            key={`${link.label}-${actionHref(link.action)}`}
            action={link.action}
            className="text-sm opacity-70 hover:opacity-100"
          >
            {link.label}
          </ActionLink>
        ))}
      </nav>
      {block.content.legalText ? (
        <small className="opacity-60">{block.content.legalText}</small>
      ) : null}
    </footer>
  );
}

function RenderBlock({
  block,
  primary,
}: {
  block: BlockSchema;
  primary: boolean;
}) {
  switch (block.type) {
    case "header":
      return <HeaderBlock block={block} />;
    case "hero":
      return <HeroBlock block={block} primary={primary} />;
    case "features":
      return <FeaturesBlock block={block} primary={primary} />;
    case "services":
      return <ServicesBlock block={block} primary={primary} />;
    case "about":
      return <AboutBlock block={block} primary={primary} />;
    case "steps":
      return <StepsBlock block={block} primary={primary} />;
    case "gallery":
      return <GalleryBlock block={block} primary={primary} />;
    case "testimonials":
      return <TestimonialsBlock block={block} primary={primary} />;
    case "pricing":
      return <PricingBlock block={block} primary={primary} />;
    case "team":
      return <TeamBlock block={block} primary={primary} />;
    case "faq":
      return <FaqBlock block={block} primary={primary} />;
    case "cta":
      return <CtaBlock block={block} primary={primary} />;
    case "contacts":
      return <ContactsBlock block={block} primary={primary} />;
    case "leadForm":
      return <LeadFormBlock block={block} primary={primary} />;
    case "footer":
      return <FooterBlock block={block} />;
  }
}

function blockInlineStyle(block: BlockSchema): React.CSSProperties {
  return {
    backgroundColor: block.style?.background,
    color: block.style?.textColor,
  };
}

export function SiteRenderer({
  page,
  className,
  editorMode = false,
  selectedBlockId,
  onSelectBlock,
}: RendererProps) {
  const theme = page.site.theme;
  const visibleBlocks = page.blocks.filter((block) => !block.hidden);
  const firstHeadingBlock = visibleBlocks.find(
    (block) => block.type !== "header" && block.type !== "footer",
  );
  const radius =
    theme.borderRadius === "small"
      ? "6px"
      : theme.borderRadius === "medium"
        ? "10px"
        : "14px";
  const rootStyle = {
    "--site-primary": theme.primaryColor,
    "--site-background": theme.backgroundColor,
    "--site-surface": theme.surfaceColor,
    "--site-text": theme.textColor,
    "--site-muted": theme.mutedTextColor,
    "--site-radius": radius,
    "--site-heading-font": `${theme.headingFont}, Arial, Helvetica, sans-serif`,
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: `${theme.bodyFont}, Arial, Helvetica, sans-serif`,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "lando-site-renderer @container min-h-full overflow-hidden bg-[var(--site-background)] text-[var(--site-text)]",
        className,
      )}
      style={rootStyle}
      onClickCapture={
        editorMode
          ? (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a")
              ) {
                event.preventDefault();
              }
            }
          : undefined
      }
    >
      {visibleBlocks.map((block) => {
        const selected = editorMode && selectedBlockId === block.id;
        const padding =
          block.type === "header" || block.type === "footer"
            ? "none"
            : (block.style?.padding ?? "large");
        return (
          <section
            id={block.id}
            key={block.id}
            data-block-id={block.id}
            data-block-type={block.type}
            style={blockInlineStyle(block)}
            className={cn(
              paddingClasses[padding],
              alignmentClasses[block.style?.alignment ?? "left"],
              editorMode &&
                "relative cursor-pointer outline-offset-[-3px] transition duration-150 hover:outline-2 hover:outline-[var(--primary-border)]",
              selected && "z-10 outline-3 outline-[var(--primary)]",
            )}
            onClick={onSelectBlock ? () => onSelectBlock(block.id) : undefined}
          >
            <RenderBlock
              block={block}
              primary={firstHeadingBlock?.id === block.id}
            />
          </section>
        );
      })}
    </div>
  );
}
