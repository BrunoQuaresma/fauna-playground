"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveConnectionButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger>
        <button
          title="Remove connection"
          className="top-3 right-3 absolute text-slate-500 hover:text-slate-900"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="leading-tight">
            Are you sure you want to remove this connection?
          </DialogTitle>
          <DialogDescription>
            By removing the connection you will no longer be able to access the
            previous queries and their results.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isRemoving}
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={isRemoving}
            className="w-full"
            onClick={async () => {
              setIsRemoving(true);
              await fetch("/api/connections", { method: "DELETE" });
              router.push("/");
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
