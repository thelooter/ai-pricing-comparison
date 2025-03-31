"use client"

import { Button } from "@/components/ui/button"
import { GithubIcon } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function GitHubLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        throw error
      }
      
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error signing in with GitHub:', error)
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleGitHubLogin}
      disabled={isLoading}
    >
      <GithubIcon className="mr-2 h-4 w-4" />
      {isLoading ? 'Loading...' : 'GitHub'}
    </Button>
  )
} 