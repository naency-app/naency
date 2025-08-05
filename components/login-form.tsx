"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { FormField, FormLabel, FormItem, FormControl, FormDescription, FormMessage, Form } from "./ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn, signUp } from "@/server/user"
import { toast } from "sonner"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { GoogleIcon } from "./icons"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  })

  const signWithGoogle = async () => {
    try {
      const data = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
      toast.success("Login successful")
    } catch (error) {
      console.error(error)
      toast.error("Failed to login with Google")
    }
  }
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isSignUp) {
        if (!values.name) {
          toast.error("Name is required for sign up")
          return
        }
        await signUp(values.email, values.password, values.name)
        toast.success("Account created successfully")
      } else {
        await signIn(values.email, values.password)
        toast.success("Login successful")
      }
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error(isSignUp ? "Failed to create account" : "Invalid email or password")
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)} {...props}>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">
              {isSignUp ? "Create your account" : "Login to your account"}
            </h1>
            <p className="text-muted-foreground text-sm text-balance">
              {isSignUp
                ? "Enter your details below to create your account"
                : "Enter your email below to login to your account"
              }
            </p>
          </div>
          <div className="grid gap-6">
            {isSignUp && (
              <div className="grid gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} type="email" />
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
                      <Input placeholder="********" {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              {isSignUp ? "Sign up" : "Login"}
            </Button>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <Button variant="outline" className="w-full" type="button" onClick={signWithGoogle}>
              <GoogleIcon className="size-4" />
              {isSignUp ? "Sign up" : "Login"} with Google
            </Button>
          </div>
          <div className="text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Button
              type="button"
              variant='link'
              onClick={() => setIsSignUp(!isSignUp)}
              className="px-0"
            >
              {isSignUp ? "Login" : "Sign up"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
