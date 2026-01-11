export default function UserCard({ user }: { user: any }) {
    if (!user) return null;
    return (
        <div className="card flex flex-col items-center gap-4">
            <img src={user.image || '/default-avatar.png'} alt={user.name} className="avatar" style={{ width: '100px', height: '100px' }} />
            <div className="flex flex-col items-center">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.name}</h2>
                <p className="text-secondary">{user.bio || 'No bio yet.'}</p>
                {user.location && <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>📍 {user.location}</p>}
            </div>
            <div className="flex gap-4 w-full">
                <button className="btn-primary w-full">Message</button>
            </div>
        </div>
    )
}
