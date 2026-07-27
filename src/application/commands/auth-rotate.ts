import { defineCommand } from "citty";
import path from "node:path";
import {
  ensureDirectory,
  parsePositiveInt,
  relativeToCwd,
  resolveDirectory,
} from "./cli-helpers.ts";

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";

export interface AuthRotateCommandArgs {
  path?: string | null;
  length?: string | number | null;
}

export async function runAuthRotateCommand(
  args: AuthRotateCommandArgs,
): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const length = parsePositiveInt(args.length, "password length", 24, 8);
  const password = generatePassword(length);
  const passwordFile = path.join(contentDir, ".readrun", "pw.txt");

  await ensureDirectory(path.dirname(passwordFile));
  await Bun.write(passwordFile, `${password}\n`);

  console.log(`wrote ${relativeToCwd(passwordFile)}`);
  console.log(`password ${password}`);
}

export function generatePassword(length: number): string {
  const size = Math.max(8, Math.floor(length));
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let password = "";

  for (const byte of bytes) {
    password += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]!;
  }

  return password;
}

export const authRotateCommand = defineCommand({
  meta: {
    name: "rotate",
    description: "Generate and write a new .readrun/pw.txt password.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Content folder (default: cwd)",
    },
    length: {
      type: "string",
      required: false,
      default: "24",
      description: "Password length (default: 24)",
    },
  },
  async run({ args }) {
    await runAuthRotateCommand(args as AuthRotateCommandArgs);
  },
});
