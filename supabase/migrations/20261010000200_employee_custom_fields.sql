-- Users → Edit Page Layout → New Field: values of the fields a Super Admin adds are kept per employee.
-- Additive only: one new nullable column. Nothing existing is changed or removed.
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "customFields" JSONB;
