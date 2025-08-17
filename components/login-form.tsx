"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { FormField, FormLabel, FormItem, FormControl, FormMessage, Form } from "./ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "@/server/user"
import { toast } from "sonner"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { GoogleIcon } from "./icons"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signWithGoogle = async () => {
    try {
      setIsLoading(true)
      const { data: session } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
      toast.success("Login successful")
    } catch (error) {
      console.error("Google login error:", error)
      toast.error("Failed to login with Google")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true)
      await signIn(values.email, values.password)
      toast.success("Login successful")
      router.push("/dashboard")
    } catch (error) {
      console.error("Authentication error:", error)
      toast.error("Invalid email or password. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = form.handleSubmit(onSubmit, (errors) => {
    toast.error("Please check your input and try again")
  })

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={handleFormSubmit}
          className={cn("flex flex-col gap-6", className)}
          {...props}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">
              Login to your account
            </h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to login to your account
            </p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        {...field}
                        type="email"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="********"
                        {...field}
                        type="password"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={form.formState.isSubmitting}
              disabled={isLoading}
            >
              Login
            </Button>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={signWithGoogle}
              isLoading={isLoading}
              disabled={isLoading}
            >
              <GoogleIcon className="size-4" />
              Login with Google
            </Button>
          </div>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </Form>
    </>
  )
}
