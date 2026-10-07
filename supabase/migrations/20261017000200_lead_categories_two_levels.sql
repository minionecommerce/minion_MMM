-- Leads: the Category level is taken off the lead form (Main Category and Subcategory stay), so a Subcategory now belongs directly to a Main Category.
-- Until now a Subcategory belonged to a Category, which belonged to a Main Category: each Subcategory moves up to that Main Category.
-- Nothing is deleted. The Category options and the Category value stored on old leads stay in the database; they are simply no longer shown or used.
-- Safe to run twice: after the first run no Subcategory has a Category as its parent any more.

UPDATE "LeadOption" AS s
SET "parentId" = c."parentId", "updatedAt" = now()
FROM "LeadOption" AS c
WHERE s."type" = 'SUBCATEGORY'
  AND c."id" = s."parentId"
  AND c."type" = 'CATEGORY'
  AND c."parentId" IS NOT NULL;
