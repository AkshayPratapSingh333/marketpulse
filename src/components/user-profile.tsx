interface UserProfileProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: string
  }
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-slate-900">
          User Information
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Your account details and information.
        </p>
      </div>
      <div className="border-t border-slate-200">
        <dl>
          <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Full name</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              {user.name || 'Not provided'}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Email address</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              {user.email}
            </dd>
          </div>
          <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">Role</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              {user.role}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-slate-500">User ID</dt>
            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">
              {user.id}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}