import { cookies } from "next/headers";
import { decrypt } from "./encrypt";

export function getCurrentConnection() {
  const cookiesStore = cookies();
  const encryptedConnection = cookiesStore.get("connection");
  if (!encryptedConnection) {
    return undefined;
  }

  const connectionString = decrypt(encryptedConnection.value);
  const [name, secret] = connectionString.split(":");
  return {
    name,
    secret,
  };
}
