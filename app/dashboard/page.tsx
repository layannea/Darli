import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LogoutButton from '@/components/LogoutButton'
import LandlordDashboard from '@/components/LandlordDashboard'
import TenantDashboard from '@/components/TenantDashboard'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/auth')

  const userId = session.userId as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const profile = await prisma.profile.findUnique({ where: { userId } })

  if (!profile) redirect('/profile/create')

  return (
    <div className="dash-wrapper">
      <header className="dash-header">
  <div className="dash-header-logo">
    <span className="brand-dot" />
    Darli
  </div>
  <div className="dash-header-right">
    <div className="dash-user">
      <a href={`/profile/${userId}`} className="dash-avatar-link" title="View profile">
        {user?.avatar
          ? <img src={user.avatar} alt="avatar" className="dash-avatar" />
          : (
            <div className="dash-avatar-placeholder">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
      </a>
      <div className="dash-user-info">
        <div className="dash-user-name">{user?.name || 'User'}</div>
        <div className="dash-user-role">{profile.role}</div>
      </div>
    </div>
    <a href="/settings" className="icon-btn" title="Settings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </a>
    <LogoutButton />
  </div>
</header>

      <main className="dash-main">
        {profile.role === 'landlord'
          ? <LandlordDashboard userId={userId} profileStatus={profile.status} />
          : <TenantDashboard userId={userId} profileStatus={profile.status} />}
      </main>
    </div>
  )
}