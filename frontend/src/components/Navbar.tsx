import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin:   'bg-red-100 text-red-700',
  manager: 'bg-amber-100 text-amber-700',
  member:  'bg-emerald-100 text-emerald-700',
  viewer:  'bg-slate-100 text-slate-500',
};

interface MockNotification {
  id: number;
  text: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  { id: 1, text: 'Alex Admin created user sam.foster@example.com', time: '2h ago', unread: true  },
  { id: 2, text: 'Riley Thompson updated a user record',            time: '5h ago', unread: true  },
  { id: 3, text: 'System: 3 failed login attempts detected',        time: '1d ago', unread: true  },
  { id: 4, text: 'Casey Nguyen exported audit log data',            time: '2d ago', unread: false },
];

const NOTIF_STORAGE_KEY = 'authaxis_read_notifications';

function getInitialNotifications(): MockNotification[] {
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!stored) return INITIAL_NOTIFICATIONS;
    const readIds: number[] = JSON.parse(stored);
    return INITIAL_NOTIFICATIONS.map(n => ({
      ...n,
      unread: readIds.includes(n.id) ? false : n.unread,
    }));
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

interface NavbarProps {
  onMobileToggle?: () => void;
}

export function Navbar({ onMobileToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState<MockNotification[]>(getInitialNotifications);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  function markAllRead() {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated.map(n => n.id)));
    } catch { /* storage unavailable */ }
    setNotifOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="h-16 bg-white border-b border-light-gray flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
      {/* Left: hamburger (mobile) + branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="p-2 text-pewter hover:text-charcoal hover:bg-soft-white rounded-lg transition-colors duration-150 lg:hidden"
          title="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-pewter text-sm hidden sm:block">AuthAxis</span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-3">

        {/* Notifications bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 text-pewter hover:text-charcoal hover:bg-soft-white rounded-lg transition-colors duration-150"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-light-gray rounded-xl shadow-lg z-50 animate-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-light-gray">
                <span className="text-sm font-semibold text-charcoal">Notifications</span>
                <span className="text-xs text-pewter">{unreadCount} unread</span>
              </div>
              <ul className="divide-y divide-light-gray">
                {notifications.map(n => (
                  <li key={n.id} className={`px-4 py-3 ${n.unread ? 'bg-sage-50' : ''}`}>
                    <p className="text-xs text-charcoal leading-snug">{n.text}</p>
                    <p className="text-[11px] text-pewter mt-1">{n.time}</p>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2.5 border-t border-light-gray text-center">
                <button
                  onClick={markAllRead}
                  className="text-xs text-cadet-600 hover:text-cadet-700 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-light-gray" />

        {/* Avatar + name — click goes to profile */}
        <Link to="/dashboard/profile" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-sage-300 transition-all">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-charcoal truncate max-w-[140px] group-hover:text-sage-700 transition-colors">{user?.name}</p>
            <span className={`badge text-[10px] capitalize ${ROLE_BADGE_COLORS[user?.role ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
              {user?.role}
            </span>
          </div>
        </Link>

        {/* Profile link icon — visible on mobile where name is hidden */}
        <Link
          to="/dashboard/profile"
          title="My Profile"
          className="p-2 text-pewter hover:text-charcoal hover:bg-soft-white rounded-lg transition-colors duration-150 md:hidden"
        >
          <User size={16} />
        </Link>

        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 text-sm text-pewter hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors duration-150"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
