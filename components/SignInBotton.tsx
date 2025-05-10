'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Github, Chrome } from 'lucide-react' // Updated icon

interface SignInButtonsProps {
  callbackUrl?: string
  className?: string
}

const SignInButtons = ({ 
  callbackUrl = "/", 
  className = "" 
}: SignInButtonsProps) => {
  const [isLoading, setIsLoading] = useState<{
    google: boolean
    github: boolean
  }>({
    google: false,
    github: false
  })

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(prev => ({ ...prev, [provider]: true }))
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(error)
      toast.error(`Failed to sign in with ${provider}. Please try again.`)
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      <Button
        onClick={() => handleSocialSignIn('github')}
        variant="outline"
        size="lg"
        className="flex items-center justify-center gap-3 w-full"
        disabled={isLoading.github}
      >
        <Github className="h-5 w-5" />
        {isLoading.github ? 'Signing in...' : 'Continue with GitHub'}
      </Button>

      <Button
        onClick={() => handleSocialSignIn('google')}
        variant="outline"
        size="lg"
        className="flex items-center justify-center gap-3 w-full"
        disabled={isLoading.google}
      >
        <Chrome className="h-5 w-5" />
        {isLoading.google ? 'Signing in...' : 'Continue with Google'}
      </Button>
    </div>
  )
}

export default SignInButtons