"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Users } from "lucide-react"

export function DashboardNav() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-slate-900">
              Auth System
            </Link>
            
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              
              {session?.user.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">
              {session?.user.name} ({session?.user.role})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}