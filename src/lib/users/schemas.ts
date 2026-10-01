import { z } from "zod";
import { ACTIONS, MODULE_KEYS } from "@/lib/rbac/catalog";
import { PASSWORD_MAX_LENGTH } from "@/lib/password-policy";
import { USER_STATUSES } from "./service";

// .strict() everywhere: unknown fields (e.g. "isSuperAdmin", "status") are rejected

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const id = z.string().min(1).max(64);

export const overrideSchema = z.object({
  module: z.enum(MODULE_KEYS as [string, ...string[]]),
  action: z.enum(ACTIONS),
  effect: z.enum(["ALLOW", "DENY"]),
}).strict();

export const createUserSchema = z.object({
  employeeId: id.nullable().optional(),
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  employeeCode: optionalText(40),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: optionalText(30),
  departmentId: id.nullable().optional(),
  designation: optionalText(120),
  roleId: id,
  isAdmin: z.boolean().optional(),
  overrides: z.array(overrideSchema).max(500).optional(),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
}).strict();

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  employeeCode: optionalText(40),
  phone: optionalText(30),
  departmentId: id.nullable().optional(),
  designation: optionalText(120),
  roleId: id.optional(),
  isAdmin: z.boolean().optional(),
}).strict();

export const statusSchema = z.object({ status: z.enum(USER_STATUSES) }).strict();

export const resetPasswordSchema = z.object({
  password: z.string().max(PASSWORD_MAX_LENGTH).optional(),
}).strict();

export const permissionsSchema = z.object({ overrides: z.array(overrideSchema).max(500) }).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
}).strict();

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: optionalText(300),
}).strict();

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: optionalText(300),
  isActive: z.boolean().optional(),
}).strict();

export const rolePermissionsSchema = z.object({
  permissions: z.array(z.string().max(60)).max(500),
}).strict();
