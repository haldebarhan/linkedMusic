import crypto from "crypto";

export const verifyJekoSignature = (
  rawPayload: string | Buffer, // Accepter string ou Buffer au lieu de any
  signature: string | string[] | undefined,
  secret: string
): boolean => {
  if (!signature || !secret || !rawPayload) return false;

  const sig = Array.isArray(signature) ? signature[0] : signature;
  if (typeof sig !== "string" || sig.length === 0) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawPayload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
};
