// Local operator helper. Never accepts or handles a password.
import { createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
const input = createInterface({ input: process.stdin, output: process.stdout });
try {
  const username = (await input.question("Login username (not public alias): "))
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username))
    throw new Error("Use 3–24 ASCII letters, numbers or underscores.");
  console.log(
    createHash("sha256")
      .update(`amitea-username-v1:${username}`)
      .digest("hex") + "@accounts.amitea.invalid",
  );
} finally {
  input.close();
}
