import { getCurrentConnection } from "@/lib/connection";
import { Client, fql } from "fauna";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const query = body.query as string;
  const currentConnection = getCurrentConnection();
  if (!currentConnection) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const client = new Client({ secret: currentConnection.secret });
  try {
    const result = await client.query(fql([query]));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  } finally {
    client.close();
  }
}
