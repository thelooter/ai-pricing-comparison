'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signInWithPassword } from "@/lib/actions"
import GitHubLoginButton from "@/components/admin/github-login-button"

export default async function LoginPage({
  searchParams,
}: {
  // @ts-expect-error - Next.js App Router types
  searchParams: SearchParams
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>Sign in to access the admin panel for managing AI model pricing data</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Email/Password Login */}
            <form action={signInWithPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </div>

              {searchParams?.error && (
                <div className="text-sm text-destructive">{searchParams.error}</div>
              )}
              
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative w-full my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* GitHub Login - using client component */}
            <GitHubLoginButton />
          </CardContent>

          <div className="px-8 py-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Return to pricing comparison
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

