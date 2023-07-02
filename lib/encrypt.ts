import CryptoJS from "crypto-js";

export function encrypt(value: string) {
  return CryptoJS.AES.encrypt(value, getSecret()).toString();
}

export function decrypt(encryptedValue: string) {
  const bytes = CryptoJS.AES.decrypt(encryptedValue, getSecret());
  return bytes.toString(CryptoJS.enc.Utf8);
}

function getSecret() {
  const key = process.env.AES_ENCRYPT_SECRET;

  if (!key) {
    throw new Error("process.env.AES_ENCRYPT_SECRET is not defined");
  }

  return key;
}
