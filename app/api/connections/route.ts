import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/encrypt";
import { IS_PROD } from "@/constants";

export async function POST(request: Request) {
  const { name, secret } = await request.json();
  const connectionValue = `${name}:${secret}`;
  const cookieStore = cookies();
  cookieStore.set("connection", encrypt(connectionValue), {
    secure: IS_PROD,
    httpOnly: true,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("connection");
  return NextResponse.json({ ok: true }, { status: 200 });
}
