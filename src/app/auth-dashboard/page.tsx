import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserProfile } from "@/components/user-profile"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-slate-600">Welcome back, {session.user.name}!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-slate-200 rounded-md flex items-center justify-center">
                      <span className="text-slate-600 font-medium">
                        {session.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">
                        Your Role
                      </dt>
                      <dd className="text-lg font-medium text-slate-900">
                        {session.user.role}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 font-medium">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">
                        Account Status
                      </dt>
                      <dd className="text-lg font-medium text-slate-900">
                        Active
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {session.user.role === 'ADMIN' && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <span className="text-blue-600 font-medium">⚙</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">
                          Admin Access
                        </dt>
                        <dd className="text-lg font-medium text-slate-900">
                          Available
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <UserProfile user={session.user} />
          </div>
        </div>
      </main>
    </div>
  )
}
