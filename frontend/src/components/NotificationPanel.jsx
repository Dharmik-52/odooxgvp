import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle, X } from "lucide-react";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    generateNotifications,
} from "../api/notifications";

const TYPE_CONFIG = {
    info: { icon: Info, color: "#60a5fa", bg: "rgba(96,165,250,0.10)" },
    warning: { icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.10)" },
    alert: { icon: AlertCircle, color: "#f87171", bg: "rgba(248,113,113,0.10)" },
    success: { icon: CheckCircle, color: "#4ade80", bg: "rgba(74,222,128,0.10)" },
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const prevIdsRef = useRef(new Set());
    const permissionGranted = useRef(false);

    // Request browser notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then((p) => {
                permissionGranted.current = p === "granted";
            });
        } else if ("Notification" in window) {
            permissionGranted.current = Notification.permission === "granted";
        }
    }, []);

    const fireBrowserNotification = useCallback((notif) => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        try {
            new Notification(notif.title, {
                body: notif.message,
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔔</text></svg>",
                tag: `ff-notif-${notif.id}`,
            });
        } catch (e) {
            // Silently fail on environments that don't support Notification constructor
        }
    }, []);

    const loadData = useCallback(async (isInitial = false) => {
        try {
            // Auto-generate notifications from system data first
            await generateNotifications();

            const [notifs, countData] = await Promise.all([
                getNotifications(),
                getUnreadCount(),
            ]);

            setNotifications(notifs);
            setUnreadCount(countData.unread_count);

            // Fire browser notifications for NEW unread items
            const currentIds = new Set(prevIdsRef.current);
            for (const n of notifs) {
                if (!n.is_read && !currentIds.has(n.id) && !isInitial) {
                    fireBrowserNotification(n);
                }
            }
            prevIdsRef.current = new Set(notifs.map((n) => n.id));
        } catch (err) {
            console.error("Failed to load notifications:", err);
        }
    }, [fireBrowserNotification]);

    // Initial load + polling every 30s
    useEffect(() => {
        loadData(true);
        const interval = setInterval(() => loadData(false), 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Close panel on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handleMarkRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    return (
        <div ref={panelRef} style={{ position: "relative" }}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setOpen((prev) => !prev);
                    if (!open) loadData(false);
                }}
                style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: open ? "#4ade80" : "#9ca3af",
                    transition: "color 0.2s",
                    padding: "4px",
                }}
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "-2px",
                            right: "-4px",
                            minWidth: "16px",
                            height: "16px",
                            background: "#f87171",
                            borderRadius: "8px",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                            lineHeight: 1,
                            border: "2px solid #161B22",
                        }}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        right: 0,
                        width: "380px",
                        maxHeight: "480px",
                        background: "#161B22",
                        border: "1px solid #30363D",
                        borderRadius: "12px",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: "notifSlideIn 0.2s ease-out",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 16px",
                            borderBottom: "1px solid #30363D",
                        }}
                    >
                        <span style={{ color: "white", fontWeight: 600, fontSize: "15px" }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        marginLeft: "8px",
                                        fontSize: "11px",
                                        color: "#161B22",
                                        background: "#4ade80",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {unreadCount} new
                                </span>
                            )}
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#4ade80",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "rgba(74,222,128,0.1)")}
                                    onMouseLeave={(e) => (e.target.style.background = "none")}
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={14} /> Read all
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#6b7280",
                                    cursor: "pointer",
                                    padding: "2px",
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div
                        style={{
                            overflowY: "auto",
                            flex: 1,
                        }}
                    >
                        {notifications.length === 0 ? (
                            <div
                                style={{
                                    padding: "40px 20px",
                                    textAlign: "center",
                                    color: "#6b7280",
                                }}
                            >
                                <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: "14px" }}>No notifications yet</p>
                                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#4b5563" }}>
                                    You're all caught up!
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                                        style={{
                                            display: "flex",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #21262D",
                                            cursor: notif.is_read ? "default" : "pointer",
                                            background: notif.is_read ? "transparent" : "rgba(74,222,128,0.03)",
                                            transition: "background 0.15s",
                                            opacity: notif.is_read ? 0.55 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!notif.is_read) e.currentTarget.style.background = "rgba(74,222,128,0.07)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = notif.is_read
                                                ? "transparent"
                                                : "rgba(74,222,128,0.03)";
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "8px",
                                                background: cfg.bg,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                marginTop: "2px",
                                            }}
                                        >
                                            <Icon size={16} color={cfg.color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    gap: "8px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: "white",
                                                        fontWeight: notif.is_read ? 400 : 600,
                                                        fontSize: "13px",
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {notif.title}
                                                </span>
                                                {!notif.is_read && (
                                                    <span
                                                        style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            borderRadius: "50%",
                                                            background: "#4ade80",
                                                            flexShrink: 0,
                                                            marginTop: "5px",
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <p
                                                style={{
                                                    margin: "3px 0 0",
                                                    fontSize: "12px",
                                                    color: "#9ca3af",
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {notif.message}
                                            </p>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#4b5563",
                                                    marginTop: "4px",
                                                    display: "inline-block",
                                                }}
                                            >
                                                {timeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Animation keyframes */}
            <style>{`
        @keyframes notifSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
