-- Run AFTER the dropdown-management release is deployed. There is no enable/disable state for dropdown options.
DROP INDEX IF EXISTS "LeadOption_type_isActive_sortOrder_idx";
ALTER TABLE "LeadOption" DROP COLUMN IF EXISTS "isActive";
