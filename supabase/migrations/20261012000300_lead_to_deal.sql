-- Leads: "Convert" turns a lead into a deal (Deals page). A converted lead leaves the Leads list but is kept, with its
-- Lead ID, and the deal points back to it through the existing Deal."leadId".
-- One new nullable column and nothing else: no existing row is changed, no data is moved.
-- Deal numbers (DL1, DL2, ...) come from a new "deal" row in the existing "Counter" table, created by the first conversion.

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);
