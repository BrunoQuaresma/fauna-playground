import { Metadata } from "next";
import { NewConnectionForm } from "./new-connection-form";
import screenshot from "./screenshot.webp";
import Image from "next/image";
import { getCurrentConnection } from "@/lib/connection";
import { redirect } from "next/navigation";
import { BRUNO_TWITTER, GITHUB_REPO } from "@/constants";

export const metadata: Metadata = {
  title: "Perfect Reddit Screenshots - RedditPik",
  description:
    "RedditPik is a simple tool that makes it easy to capture and share professional screenshots of Reddit posts and comments.",
};

export default async function Home() {
  const currentConnection = getCurrentConnection();
  if (currentConnection) {
    redirect("/playground");
  }

  return (
    <div className="overflow-x-hidden">
      <main className="container mx-auto px-6 pt-20 lg:pb-20 flex items-center gap-20 flex-col lg:flex-row">
        <div className="shrink-0 w-full max-w-md">
          <h1>Fauna Playground</h1>
          <h2 className="font-bold text-2xl mb-4">Add connection</h2>
          <NewConnectionForm />
          <div className="text-xs flex items-center gap-2 py-4 mt-2 text-slate-600">
            <span>
              Developed by{" "}
              <a
                href={BRUNO_TWITTER}
                target="_blank"
                className="font-medium hover:underline"
              >
                Bruno Quaresma
              </a>
            </span>
            <span className="text-slate-400">•</span>
            <a
              href={GITHUB_REPO}
              target="_blank"
              className="font-medium hover:underline"
            >
              See the code on GitHub
            </a>
          </div>
        </div>
        <div className="rounded shadow-lg border min-w-full">
          <Image
            src={screenshot}
            alt="Fauna Playground screenshot showing a query with results"
          />
        </div>
      </main>
    </div>
  );
}
