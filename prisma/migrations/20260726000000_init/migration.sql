-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "page_version_source" AS ENUM ('manual', 'ai', 'publish');

-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('image');

-- CreateEnum
CREATE TYPE "domain_status" AS ENUM ('pending', 'verified', 'failed');

-- CreateEnum
CREATE TYPE "ssl_status" AS ENUM ('pending', 'active', 'failed');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('new', 'read', 'archived', 'spam');

-- CreateEnum
CREATE TYPE "integration_type" AS ENUM ('telegram', 'yandex_metrika');

-- CreateEnum
CREATE TYPE "integration_status" AS ENUM ('inactive', 'active', 'error');

-- CreateEnum
CREATE TYPE "subscription_provider" AS ENUM ('mock', 'yookassa');

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'past_due', 'canceled', 'incomplete');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "last_request" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(63) NOT NULL,
    "status" "project_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "draft_schema" JSONB NOT NULL,
    "published_schema" JSONB,
    "published_at" TIMESTAMPTZ(3),
    "draft_revision" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_version" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "source" "page_version_source" NOT NULL,
    "prompt" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "asset_type" NOT NULL DEFAULT 'image',
    "storage_key" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" VARCHAR(500) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "hostname" VARCHAR(253) NOT NULL,
    "status" "domain_status" NOT NULL DEFAULT 'pending',
    "verification_token" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "ssl_status" "ssl_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "block_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source_url" TEXT,
    "ip_hash" VARCHAR(128),
    "user_agent" TEXT,
    "status" "submission_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "integration_type" NOT NULL,
    "encrypted_config" JSONB NOT NULL,
    "status" "integration_status" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "subscription_provider" NOT NULL,
    "provider_customer_id" TEXT,
    "provider_payment_method_id" TEXT,
    "plan" "subscription_plan" NOT NULL DEFAULT 'free',
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "project_id" TEXT,
    "operation" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "estimated_cost" DECIMAL(18,6),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "project_id" TEXT,
    "action" VARCHAR(150) NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_expires_at_idx" ON "session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "verification_expires_at_idx" ON "verification"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "project_slug_key" ON "project"("slug");

-- CreateIndex
CREATE INDEX "project_user_id_updated_at_idx" ON "project"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "project_user_id_status_idx" ON "project"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "page_project_id_key" ON "page"("project_id");

-- CreateIndex
CREATE INDEX "page_version_page_id_created_at_idx" ON "page_version"("page_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "asset_storage_key_key" ON "asset"("storage_key");

-- CreateIndex
CREATE INDEX "asset_project_id_created_at_idx" ON "asset"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "domain_hostname_key" ON "domain"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "domain_verification_token_key" ON "domain"("verification_token");

-- CreateIndex
CREATE INDEX "domain_project_id_status_idx" ON "domain"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "form_project_id_block_id_key" ON "form"("project_id", "block_id");

-- CreateIndex
CREATE INDEX "form_project_id_created_at_idx" ON "form"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "submission_form_id_created_at_idx" ON "submission"("form_id", "created_at");

-- CreateIndex
CREATE INDEX "submission_form_id_status_idx" ON "submission"("form_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integration_project_id_type_key" ON "integration"("project_id", "type");

-- CreateIndex
CREATE INDEX "integration_project_id_status_idx" ON "integration"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_provider_customer_id_key" ON "subscription"("provider_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_provider_payment_method_id_key" ON "subscription"("provider_payment_method_id");

-- CreateIndex
CREATE INDEX "subscription_user_id_status_idx" ON "subscription"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscription_current_period_end_idx" ON "subscription"("current_period_end");

-- CreateIndex
CREATE INDEX "ai_usage_user_id_created_at_idx" ON "ai_usage"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_project_id_created_at_idx" ON "ai_usage"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_project_id_created_at_idx" ON "audit_log"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_action_created_at_idx" ON "audit_log"("action", "created_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_version" ADD CONSTRAINT "page_version_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form" ADD CONSTRAINT "form_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
