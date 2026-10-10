import { z } from "zod";
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,24}$/,
    "Use 3–24 letters, numbers or underscores for your username.",
  );
const passwordInput = z
  .string()
  .min(1, "Enter your password.")
  .max(64, "Use at most 64 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Your password must fit within 72 UTF-8 bytes.",
  );
export const newPasswordSchema = passwordInput.refine(
  (value) => value.length >= 15,
  "Use a password of at least 15 characters.",
);
export const credentialsSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("login"),
    username: usernameSchema,
    password: passwordInput,
  }),
  z
    .object({
      intent: z.literal("signup"),
      username: usernameSchema,
      password: newPasswordSchema,
      confirmation: z.string(),
    })
    .refine((value) => value.password === value.confirmation, {
      message: "Your passwords don’t match.",
      path: ["confirmation"],
    }),
]);
export const changePasswordSchema = z
  .object({
    currentPassword: passwordInput,
    password: newPasswordSchema,
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: "Your passwords don’t match.",
    path: ["confirmation"],
  })
  .refine((value) => value.password !== value.currentPassword, {
    message: "Choose a different password.",
    path: ["password"],
  });
