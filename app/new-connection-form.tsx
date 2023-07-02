"use client";

import { Button } from "@/components/ui/button";
import {
  FormItem,
  FormLabel,
  FormControl,
  Form,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  name: z.string(),
  secret: z.string(),
});

export function NewConnectionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      secret: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          setIsSubmitting(true);
          await fetch("/api/connections", {
            method: "POST",
            body: JSON.stringify(values),
          });
          router.push("/playground");
        })}
      >
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection name</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Database secret</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button className="w-full">Go to playground</Button>
        </fieldset>
      </form>
    </Form>
  );
}
