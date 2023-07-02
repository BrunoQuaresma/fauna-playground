import { Client, fql, Page, NamedDocument } from "fauna";
import { Playground } from "./playground";
import "./playground.css";
import { getCurrentConnection } from "@/lib/connection";
import { redirect } from "next/navigation";

export default async function PlaygroundPage() {
  const currentConnection = getCurrentConnection();
  if (!currentConnection) {
    redirect("/");
  }

  const client = new Client({ secret: currentConnection.secret });
  const queryResult = await client.query<Page<NamedDocument>>(
    fql`Collection.all()`
  );

  return (
    <Playground
      connection={currentConnection.name}
      collections={queryResult.data.data.map((ref) => ref.name)}
    />
  );
}
