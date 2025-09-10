import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { UsersTable } from "@/components/users-table"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">Manage users and system settings</p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <UsersTable />
          </div>
        </div>
      </main>
    </div>
  )
}