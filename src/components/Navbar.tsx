import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3, Upload, Home, User } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';

export async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">MarketPulse</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link href="/upload" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Link>
            <Link href="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <Link href="/auth-dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <User className="h-4 w-4" />
                  <span>{session.user.name || 'Profile'}</span>
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}