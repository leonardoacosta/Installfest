# react-hook-form Patterns

## Basic Form Setup

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## With ShadCN Form Components

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>Your display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
```

## With tRPC Mutation

```typescript
"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

export function CreatePostForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(createPostSchema),
  });

  const mutation = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created!");
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create Post"}
      </Button>
    </form>
  );
}
```

## Dynamic Field Arrays

```typescript
import { useFieldArray } from "react-hook-form";

export function InvoiceForm() {
  const form = useForm<InvoiceFormData>({
    defaultValues: { items: [{ name: "", quantity: 1, price: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input {...form.register(`items.${index}.name`)} />
          <Input type="number" {...form.register(`items.${index}.quantity`)} />
          <Input type="number" {...form.register(`items.${index}.price`)} />
          <Button type="button" onClick={() => remove(index)}>Remove</Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ name: "", quantity: 1, price: 0 })}>
        Add Item
      </Button>
    </form>
  );
}
```

## Select and Checkbox

```typescript
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="terms"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel>Accept terms and conditions</FormLabel>
    </FormItem>
  )}
/>
```

## Form with File Upload

```typescript
<FormField
  control={form.control}
  name="avatar"
  render={({ field: { onChange, value, ...field } }) => (
    <FormItem>
      <FormLabel>Avatar</FormLabel>
      <FormControl>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0])}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Watch and Conditional Fields

```typescript
const watchCategory = form.watch("category");

return (
  <form>
    <FormField name="category" ... />

    {watchCategory === "other" && (
      <FormField name="customCategory" ... />
    )}
  </form>
);
```
