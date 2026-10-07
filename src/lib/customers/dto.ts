// A customer row as the pick-lists, the quote form and the quote document use it (CustomerDto).

import type { Prisma } from "@prisma/client";
import type { CustomerDto } from "@/lib/quotes/types";
import { addressLines } from "./format";

export const CUSTOMER_SELECT = {
  id: true, customerCode: true, name: true, phone: true, email: true, address: true, gstin: true, customerType: true, status: true,
  companyName: true, firstName: true, lastName: true, gstTreatment: true, placeOfSupply: true, pan: true,
  shipAttention: true, shipCountry: true, shipStreet1: true, shipStreet2: true, shipCity: true, shipState: true, shipPinCode: true,
} as const satisfies Prisma.CustomerSelect;

export type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_SELECT }>;

export function toCustomer(c: CustomerRow): CustomerDto {
  const contact = [c.firstName, c.lastName].map(x => (x ?? "").trim()).filter(Boolean).join(" ");
  const shipping = addressLines({ attention: c.shipAttention, street1: c.shipStreet1, street2: c.shipStreet2, city: c.shipCity, state: c.shipState, pinCode: c.shipPinCode, country: c.shipCountry });
  return {
    id: c.id, code: c.customerCode, name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin, customerType: c.customerType,
    companyName: c.companyName, contactName: contact || null, shippingAddress: shipping.length ? shipping.join("\n") : null,
    gstTreatment: c.gstTreatment, placeOfSupply: c.placeOfSupply, pan: c.pan,
  };
}
