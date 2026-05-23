import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";

const getKey = () => {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("APP_ENCRYPTION_KEY is required to encrypt provider API keys.");
  }

  return createHash("sha256").update(secret).digest();
};

export const encryptApiKey = (plainText: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
};

export const decryptApiKey = (payload: string) => {
  const [ivValue, authTagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Invalid encrypted API key payload.");
  }

  const decipher = createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(ivValue, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
};

