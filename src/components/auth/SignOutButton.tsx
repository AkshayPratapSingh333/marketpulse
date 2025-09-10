'use client'

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface SignOutButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function SignOutButton({ variant = "outline", size = "sm" }: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ 
      callbackUrl: "/" // Redirect to home page after sign out
    })
  }

  return (
    <Button variant={variant} size={size} onClick={handleSignOut}>
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  )
}
