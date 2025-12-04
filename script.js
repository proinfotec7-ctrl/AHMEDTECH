// =============================================
// نظام الحماية المتقدم مع الإصلاحات الأمنية
// =============================================

// Application variables
let previousPage = 'dash';
let editingVideoIndex = -1;
let editingPortalIndex = -1;
let editingXtreamIndex = -1;
let loginAttempts = {};
let sessionStartTime = Date.now();
let lastActivityTime = Date.now();

// Variables for modals
let currentDeleteUsername = null;
let currentDeletePortalIndex = null;
let currentDeleteVideoIndex = null;
let currentDeleteXtreamIndex = null;
let currentDeleteSupervisorUsername = null;
let currentDeleteTicketIndex = null;
let currentDeleteKnowledgeIndex = null;
let currentTicketIndex = null;
let confirmCallback = null;
let currentChangeUsernameData = null;

// Constants for security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;
const SESSION_TIMEOUT = 60 * 60 * 1000;
const SECURITY_KEY = "AHMEDTECH_SECURE_2025_VIP_PROTECTED";

// Improved hash function
async function secureHash(password, salt = SECURITY_KEY) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة هاش متوافقة مع النظام القديم
function h(s) {
    let a = 0;
    for(let i = 0; i < s.length; i++) {
        a = (a << 5) - a + s.charCodeAt(i);
        a = a & a;
    }
    return a.toString(16);
}

// Constants
const K = "ahmedtech_portal_secure";
const PORTALS_KEY = "ahmedtech_portals_encrypted";
const VIDEOS_KEY = "ahmedtech_videos_encrypted";
const XTREAM_KEY = "ahmedtech_xtream_servers";
const SECURITY_LOG_KEY = "ahmedtech_security_log";
const CHAT_KEY = "ahmedtech_chat_messages";
const KNOWLEDGE_KEY = "ahmedtech_knowledge_base";
const TICKETS_KEY = "ahmedtech_support_tickets";

// تهيئة البيانات مع الإصلاح الأمني: إزالة تخزين كلمات المرور الأصلية
let users = JSON.parse(localStorage.getItem(K)) || {};
let portals = JSON.parse(localStorage.getItem(PORTALS_KEY)) || [];
let videos = JSON.parse(localStorage.getItem(VIDEOS_KEY)) || [];
let xtreams = JSON.parse(localStorage.getItem(XTREAM_KEY)) || [];
let chatMessages = JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
let knowledgeBase = JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)) || [];
let tickets = JSON.parse(localStorage.getItem(TICKETS_KEY)) || [];
let currentUser = null;

// =============================================
// دوال النوافذ المنبثقة الجديدة والمحسنة
// =============================================

// نافذة الحذف
function showDeleteModal(type, target, index = null) {
    try {
        let message = '';
        let modal = document.getElementById('deleteModal');
        let deleteMessage = document.getElementById('deleteMessage');
        
        switch(type) {
            case 'user':
                currentDeleteUsername = target;
                message = `Are you sure you want to delete user <strong>${escapeHtml(target)}</strong> permanently?`;
                break;
            case 'portal':
                currentDeletePortalIndex = target;
                message = `Are you sure you want to delete portal <strong>${escapeHtml(portals[target].name)}</strong>?`;
                break;
            case 'video':
                currentDeleteVideoIndex = target;
                message = `Are you sure you want to delete video <strong>${escapeHtml(videos[target].title)}</strong>?`;
                break;
            case 'xtream':
                currentDeleteXtreamIndex = target;
                message = `Are you sure you want to delete Xtream server <strong>${escapeHtml(xtreams[target].name)}</strong>?`;
                break;
            case 'supervisor':
                currentDeleteSupervisorUsername = target;
                message = `Are you sure you want to delete supervisor <strong>${escapeHtml(target)}</strong>?`;
                break;
            case 'ticket':
                currentDeleteTicketIndex = target;
                message = `Are you sure you want to delete ticket <strong>${escapeHtml(tickets[target].subject)}</strong>?`;
                break;
            case 'knowledge':
                currentDeleteKnowledgeIndex = target;
                message = `Are you sure you want to delete knowledge article <strong>${escapeHtml(knowledgeBase[target].title)}</strong>?`;
                break;
            case 'all_data':
                message = `⚠️ <strong>WARNING:</strong> This will delete ALL data including users, portals, and videos. This action cannot be undone.<br><br>
                          ‼️ <strong>LAST WARNING:</strong> All data will be permanently lost.`;
                break;
            case 'security_logs':
                message = `Are you sure you want to clear all security logs?`;
                break;
            default:
                throw new Error('Unknown delete type');
        }
        
        deleteMessage.innerHTML = message;
        modal.classList.remove('hidden');
    } catch (error) {
        handleError('showDeleteModal', error);
    }
}

function closeDeleteModal() {
    try {
        document.getElementById('deleteModal').classList.add('hidden');
        currentDeleteUsername = null;
        currentDeletePortalIndex = null;
        currentDeleteVideoIndex = null;
        currentDeleteXtreamIndex = null;
        currentDeleteSupervisorUsername = null;
        currentDeleteTicketIndex = null;
        currentDeleteKnowledgeIndex = null;
    } catch (error) {
        handleError('closeDeleteModal', error);
    }
}

function confirmDelete() {
    try {
        const modal = document.getElementById('deleteModal');
        const message = document.getElementById('deleteMessage').textContent;
        
        if (message.includes('LAST WARNING')) {
            // حذف جميع البيانات
            if (requireAdmin()) {
                showConfirmModal(
                    'Final Confirmation',
                    'This is your LAST chance to cancel. All data will be PERMANENTLY deleted. Are you absolutely sure?',
                    function() {
                        localStorage.removeItem(K);
                        localStorage.removeItem(PORTALS_KEY);
                        localStorage.removeItem(VIDEOS_KEY);
                        localStorage.removeItem(XTREAM_KEY);
                        localStorage.removeItem(SECURITY_LOG_KEY);
                        localStorage.removeItem('login_attempts');
                        localStorage.removeItem(CHAT_KEY);
                        localStorage.removeItem(KNOWLEDGE_KEY);
                        localStorage.removeItem(TICKETS_KEY);
                        
                        // إنشاء حسابات افتراضية جديدة بدون تخزين كلمات المرور الأصلية
                        users = { 
                            admin: { p: h("admin123" + SECURITY_KEY), r: "admin" },
                            supervisor: { p: h("super123" + SECURITY_KEY), r: "supervisor" }
                        };
                        portals = [];
                        videos = [];
                        xtreams = [];
                        chatMessages = [];
                        knowledgeBase = [];
                        tickets = [];
                        
                        localStorage.setItem(K, JSON.stringify(users));
                        localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
                        
                        logSecurityEvent('all_data_reset', { resetBy: currentUser });
                        n("All data has been reset successfully!", "#00ff80");
                        closeDeleteModal();
                        setTimeout(() => {
                            location.reload();
                        }, 2000);
                    }
                );
            }
        } else if (currentDeleteUsername) {
            // حذف مستخدم
            if (requireAdmin()) {
                delete users[currentDeleteUsername];
                localStorage.setItem(K, JSON.stringify(users));
                
                logSecurityEvent('user_deleted', { deletedUser: currentDeleteUsername, admin: currentUser });
                n("User deleted successfully!");
                loadUsers();
                closeDeleteModal();
            }
        } else if (currentDeletePortalIndex !== null) {
            // حذف بوابة
            if (requireAdminOrSupervisor()) {
                const portalName = portals[currentDeletePortalIndex].name;
                portals.splice(currentDeletePortalIndex, 1);
                localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
                
                logSecurityEvent('portal_deleted', { portalName: portalName, deletedBy: currentUser });
                n("Portal deleted successfully!");
                loadPortals();
                closeDeleteModal();
            }
        } else if (currentDeleteVideoIndex !== null) {
            // حذف فيديو
            if (requireAdminOrSupervisor()) {
                const videoTitle = videos[currentDeleteVideoIndex].title;
                videos.splice(currentDeleteVideoIndex, 1);
                localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
                logSecurityEvent('youtube_video_deleted', { videoTitle: videoTitle, deletedBy: currentUser });
                n("Video deleted successfully!");
                loadVideos();
                closeDeleteModal();
            }
        } else if (currentDeleteXtreamIndex !== null) {
            // حذف سيرفر Xtream
            if (requireAdminOrSupervisor()) {
                const xtreamName = xtreams[currentDeleteXtreamIndex].name;
                xtreams.splice(currentDeleteXtreamIndex, 1);
                localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
                
                logSecurityEvent('xtream_server_deleted', { serverName: xtreamName, deletedBy: currentUser });
                n("Xtream server deleted successfully!");
                loadXtreams();
                closeDeleteModal();
            }
        } else if (currentDeleteSupervisorUsername) {
            // حذف مشرف
            if (requireAdmin()) {
                delete users[currentDeleteSupervisorUsername];
                localStorage.setItem(K, JSON.stringify(users));
                
                logSecurityEvent('supervisor_deleted', { 
                    deletedSupervisor: currentDeleteSupervisorUsername, 
                    deletedBy: currentUser 
                });
                
                n("Supervisor deleted successfully!", "#00ff80");
                loadSupervisorsList();
                loadSettings();
                closeDeleteModal();
            }
        } else if (currentDeleteTicketIndex !== null) {
            // حذف تذكرة
            if (requireAdminOrSupervisor()) {
                const ticketSubject = tickets[currentDeleteTicketIndex].subject;
                tickets.splice(currentDeleteTicketIndex, 1);
                localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
                
                logSecurityEvent('ticket_deleted', { 
                    ticketSubject: ticketSubject, 
                    deletedBy: currentUser 
                });
                
                n("Ticket deleted successfully!");
                loadTickets();
                closeDeleteModal();
            }
        } else if (currentDeleteKnowledgeIndex !== null) {
            // حذف مقال معرفي
            if (requireAdminOrSupervisor()) {
                const knowledgeTitle = knowledgeBase[currentDeleteKnowledgeIndex].title;
                knowledgeBase.splice(currentDeleteKnowledgeIndex, 1);
                localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledgeBase));
                
                logSecurityEvent('knowledge_deleted', { 
                    knowledgeTitle: knowledgeTitle, 
                    deletedBy: currentUser 
                });
                
                n("Knowledge article deleted successfully!");
                loadKnowledgeBase();
                closeDeleteModal();
            }
        } else {
            // حذف سجلات الأمان
            if (requireAdmin()) {
                localStorage.removeItem(SECURITY_LOG_KEY);
                localStorage.removeItem('login_attempts');
                n("Security logs cleared successfully!", "#00ff80");
                loadSettings();
                closeDeleteModal();
            }
        }
    } catch (error) {
        handleError('confirmDelete', error);
    }
}

// نافذة نسيان كلمة المرور
function showForgotPasswordModal() {
    try {
        document.getElementById('forgotPasswordModal').classList.remove('hidden');
        document.getElementById('forgotUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    } catch (error) {
        handleError('showForgotPasswordModal', error);
    }
}

function closeForgotPasswordModal() {
    try {
        document.getElementById('forgotPasswordModal').classList.add('hidden');
    } catch (error) {
        handleError('closeForgotPasswordModal', error);
    }
}

function resetPassword() {
    try {
        const username = document.getElementById('forgotUsername').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if(!username || !newPassword || !confirmPassword) {
            return n("Please fill all fields", "#ff4444");
        }
        
        if(!users[username]) {
            logSecurityEvent('password_reset_failed', { username: username });
            return n("Username not found", "#ff4444");
        }
        
        if(newPassword !== confirmPassword) {
            return n("Passwords don't match", "#ff4444");
        }
        
        if(newPassword.length < 4) {
            return n("Password must be at least 4 characters", "#ff4444");
        }
        
        // تغيير كلمة المرور بدون تخزين الأصلية
        users[username].p = h(newPassword + SECURITY_KEY);
        localStorage.setItem(K, JSON.stringify(users));
        
        logSecurityEvent('password_reset', { username: username });
        n("Password changed successfully!");
        closeForgotPasswordModal();
    } catch (error) {
        handleError('resetPassword', error);
    }
}

// نافذة التأكيد العامة
function showConfirmModal(title, message, callback) {
    try {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;
        confirmCallback = callback;
        document.getElementById('confirmModal').classList.remove('hidden');
    } catch (error) {
        handleError('showConfirmModal', error);
    }
}

function closeConfirmModal() {
    try {
        document.getElementById('confirmModal').classList.add('hidden');
        confirmCallback = null;
    } catch (error) {
        handleError('closeConfirmModal', error);
    }
}

function confirmAction() {
    try {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirmModal();
    } catch (error) {
        handleError('confirmAction', error);
    }
}

// نافذة تغيير اسم المدير
function showChangeUsernameModal() {
    try {
        document.getElementById('changeUsernameModal').classList.remove('hidden');
        document.getElementById('modalNewUsername').value = '';
        document.getElementById('modalConfirmPassword').value = '';
    } catch (error) {
        handleError('showChangeUsernameModal', error);
    }
}

function closeChangeUsernameModal() {
    try {
        document.getElementById('changeUsernameModal').classList.add('hidden');
    } catch (error) {
        handleError('closeChangeUsernameModal', error);
    }
}

function confirmChangeUsername() {
    try {
        const newUsername = document.getElementById('modalNewUsername').value.trim();
        const confirmPassword = document.getElementById('modalConfirmPassword').value;
        
        if (!newUsername) {
            return n("Please enter a new username", "#ff4444");
        }
        
        if (!confirmPassword) {
            return n("Please enter your password to confirm", "#ff4444");
        }
        
        const currentAdminKey = Object.keys(users).find(key => users[key].r === "admin");
        if (!currentAdminKey) {
            return n("Admin account not found", "#ff4444");
        }
        
        if (h(confirmPassword + SECURITY_KEY) !== users[currentAdminKey].p) {
            logSecurityEvent('admin_username_change_failed', { reason: 'wrong_password' });
            return n("Password is incorrect", "#ff4444");
        }
        
        if (users[newUsername]) {
            return n("Username already exists", "#ff4444");
        }
        
        if (newUsername.length < 3) {
            return n("Username must be at least 3 characters", "#ff4444");
        }
        
        // تأكيد نهائي
        showConfirmModal(
            'Final Confirmation',
            `Are you sure you want to change admin username from "${currentAdminKey}" to "${newUsername}"?`,
            function() {
                const adminData = users[currentAdminKey];
                users[newUsername] = {
                    p: adminData.p,
                    r: "admin"
                };
                
                delete users[currentAdminKey];
                localStorage.setItem(K, JSON.stringify(users));
                
                if (currentUser === currentAdminKey) {
                    currentUser = newUsername;
                    document.getElementById("welcomeUser").textContent = newUsername;
                }
                
                closeChangeUsernameModal();
                logSecurityEvent('admin_username_changed', { oldUsername: currentAdminKey, newUsername: newUsername });
                loadSettings();
                n("Admin username changed successfully!");
            }
        );
    } catch (error) {
        handleError('confirmChangeUsername', error);
    }
}

// نافذة إنشاء تذكرة جديدة
function showNewTicketModal() {
    try {
        document.getElementById('newTicketModal').classList.remove('hidden');
        document.getElementById('ticketSubject').value = '';
        document.getElementById('ticketDescription').value = '';
        document.getElementById('ticketPriority').value = 'medium';
    } catch (error) {
        handleError('showNewTicketModal', error);
    }
}

function closeNewTicketModal() {
    try {
        document.getElementById('newTicketModal').classList.add('hidden');
    } catch (error) {
        handleError('closeNewTicketModal', error);
    }
}

function createNewTicket() {
    try {
        const subject = document.getElementById('ticketSubject').value.trim();
        const description = document.getElementById('ticketDescription').value.trim();
        const priority = document.getElementById('ticketPriority').value;
        
        if (!subject || !description) {
            return n("Please fill all fields", "#ff4444");
        }
        
        const newTicket = {
            id: Date.now(),
            subject: subject,
            description: description,
            priority: priority,
            status: 'open',
            user: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            responses: []
        };
        
        tickets.push(newTicket);
        localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
        
        logSecurityEvent('ticket_created', { 
            ticketId: newTicket.id, 
            subject: subject, 
            user: currentUser 
        });
        
        n("Ticket created successfully!");
        closeNewTicketModal();
        loadTickets();
    } catch (error) {
        handleError('createNewTicket', error);
    }
}

// نافذة عرض تفاصيل التذكرة
function showTicketDetailsModal(ticketIndex) {
    try {
        const ticket = tickets[ticketIndex];
        document.getElementById('ticketDetailsTitle').textContent = ticket.subject;
        
        let priorityClass = '';
        switch(ticket.priority) {
            case 'low': priorityClass = 'priority-low'; break;
            case 'medium': priorityClass = 'priority-medium'; break;
            case 'high': priorityClass = 'priority-high'; break;
        }
        
        let statusClass = '';
        switch(ticket.status) {
            case 'open': statusClass = 'status-open'; break;
            case 'pending': statusClass = 'status-pending'; break;
            case 'closed': statusClass = 'status-closed'; break;
        }
        
        let responsesHTML = '';
        if (ticket.responses && ticket.responses.length > 0) {
            responsesHTML = '<h4 style="color:var(--accent);margin-top:20px;">Responses:</h4>';
            ticket.responses.forEach(response => {
                responsesHTML += `
                    <div style="background:rgba(0,0,0,0.1); padding:10px; border-radius:8px; margin:10px 0;">
                        <div style="color:var(--primary); font-weight:bold;">${response.responder} <span style="color:var(--secondary); font-size:0.8rem;">(${new Date(response.date).toLocaleString()})</span></div>
                        <div style="color:var(--secondary); margin-top:5px;">${escapeHtml(response.message)}</div>
                    </div>
                `;
            });
        }
        
        const content = `
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <span class="ticket-priority ${priorityClass}">${ticket.priority.toUpperCase()} Priority</span>
                    <span class="ticket-status ${statusClass}">${ticket.status.toUpperCase()}</span>
                </div>
                
                <div style="background:rgba(0,0,0,0.1); padding:15px; border-radius:10px; margin-bottom:15px;">
                    <div style="color:var(--primary); font-weight:bold; margin-bottom:10px;">Description:</div>
                    <div style="color:var(--secondary);">${escapeHtml(ticket.description)}</div>
                </div>
                
                <div style="display:flex; justify-content:space-between; color:var(--secondary); font-size:0.9rem;">
                    <div>Created by: <span style="color:var(--accent);">${ticket.user}</span></div>
                    <div>${new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
                
                ${responsesHTML}
            </div>
        `;
        
        document.getElementById('ticketDetailsContent').innerHTML = content;
        
        // إظهار زر إغلاق التذكرة فقط للمسؤولين والمشرفين
        const closeTicketBtn = document.getElementById('closeTicketBtn');
        if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor") && ticket.status !== 'closed') {
            closeTicketBtn.style.display = 'block';
            closeTicketBtn.onclick = function() { closeTicketWithResponse(ticketIndex); };
        } else {
            closeTicketBtn.style.display = 'none';
        }
        
        document.getElementById('ticketDetailsModal').classList.remove('hidden');
        currentTicketIndex = ticketIndex;
    } catch (error) {
        handleError('showTicketDetailsModal', error);
    }
}

function closeTicketDetailsModal() {
    try {
        document.getElementById('ticketDetailsModal').classList.add('hidden');
        currentTicketIndex = null;
    } catch (error) {
        handleError('closeTicketDetailsModal', error);
    }
}

function closeTicketWithResponse(ticketIndex = currentTicketIndex) {
    try {
        if (ticketIndex === null || ticketIndex === undefined) return;
        
        const response = prompt("Please enter a closing message for the ticket:");
        if (response === null) return;
        
        tickets[ticketIndex].status = 'closed';
        tickets[ticketIndex].updatedAt = new Date().toISOString();
        tickets[ticketIndex].responses.push({
            message: response,
            responder: currentUser,
            date: new Date().toISOString()
        });
        
        localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
        
        logSecurityEvent('ticket_closed', { 
            ticketId: tickets[ticketIndex].id, 
            closedBy: currentUser 
        });
        
        n("Ticket closed successfully!");
        closeTicketDetailsModal();
        loadTickets();
    } catch (error) {
        handleError('closeTicketWithResponse', error);
    }
}

// =============================================
// نظام تسجيل الأحداث الأمنية
// =============================================

function logSecurityEvent(event, details = {}) {
    try {
        const logs = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY)) || [];
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            user: currentUser || 'unknown',
            ip: 'local',
            details: details
        };
        
        logs.unshift(logEntry);
        if (logs.length > 100) logs.pop();
        
        localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

// نظام منع هجمات Brute Force
function checkLoginAttempts(username) {
    try {
        const attempts = JSON.parse(localStorage.getItem('login_attempts')) || {};
        const userAttempts = attempts[username];
        
        if (!userAttempts) return true;
        
        if (userAttempts.count >= MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - userAttempts.lastAttempt;
            if (timeSinceLastAttempt < LOCKOUT_TIME) {
                const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000);
                n(`Account temporarily locked. Try again in ${remainingTime} minutes.`, "#ff4444");
                return false;
            } else {
                delete attempts[username];
                localStorage.setItem('login_attempts', JSON.stringify(attempts));
            }
        }
        
        return true;
    } catch (error) {
        console.error('Failed to check login attempts:', error);
        return true;
    }
}

function recordLoginAttempt(username, success) {
    try {
        const attempts = JSON.parse(localStorage.getItem('login_attempts')) || {};
        
        if (!attempts[username]) {
            attempts[username] = { count: 0, lastAttempt: Date.now() };
        }
        
        if (success) {
            delete attempts[username];
        } else {
            attempts[username].count++;
            attempts[username].lastAttempt = Date.now();
        }
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    } catch (error) {
        console.error('Failed to record login attempt:', error);
    }
}

// نظام إدارة الجلسات
function updateSessionTimer() {
    try {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);
        const sessionElement = document.getElementById('sessionDuration');
        if (sessionElement) {
            sessionElement.textContent = `${sessionDuration} minutes`;
        }
        
        if (Date.now() - lastActivityTime > SESSION_TIMEOUT) {
            n("Session expired due to inactivity", "#ff4444");
            logout();
        }
    } catch (error) {
        console.error('Failed to update session timer:', error);
    }
}

function updateActivity() {
    lastActivityTime = Date.now();
}

document.addEventListener('click', updateActivity);
document.addEventListener('keypress', updateActivity);
document.addEventListener('mousemove', updateActivity);

// =============================================
// تهيئة الحسابات الافتراضية مع الإصلاح الأمني
// =============================================

if(!users.admin){
    users.admin = { p: h("admin123" + SECURITY_KEY), r: "admin" };
    localStorage.setItem(K, JSON.stringify(users));
    logSecurityEvent('admin_account_created');
}

if(!users.supervisor){
    users.supervisor = { p: h("super123" + SECURITY_KEY), r: "supervisor" };
    localStorage.setItem(K, JSON.stringify(users));
    logSecurityEvent('supervisor_account_created');
}

// تهيئة Xtream servers إذا كانت فارغة
if (xtreams.length === 0) {
    xtreams.push({
        name: "Premium Xtream",
        server: "http://premium-server.com:8080",
        username: "user123",
        password: "pass123"
    });
    localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
}

// تهيئة قاعدة المعارف إذا كانت فارغة
if (knowledgeBase.length === 0) {
    knowledgeBase = [
        {
            id: 1,
            title: "How to Use IPTV",
            category: "tutorial",
            content: "IPTV (Internet Protocol Television) allows you to stream TV channels over the internet. To use it, you need a compatible device and a valid subscription.",
            tags: ["iptv", "tutorial", "beginner"]
        },
        {
            id: 2,
            title: "Common IPTV Issues",
            category: "troubleshooting",
            content: "If you're experiencing buffering or connection issues, try restarting your device, checking your internet connection, or clearing the app cache.",
            tags: ["iptv", "troubleshooting", "issues"]
        },
        {
            id: 3,
            title: "Setting Up MAC Address",
            category: "setup",
            content: "To set up your MAC address, go to your device's network settings and enter the provided MAC address. Then restart your device for changes to take effect.",
            tags: ["mac", "setup", "configuration"]
        },
        {
            id: 4,
            title: "Portal Configuration Guide",
            category: "configuration",
            content: "Portal configuration requires the server URL and portal code. Enter these details in your IPTV app's settings under 'Portal Setup' or 'Xtream Codes'.",
            tags: ["portal", "configuration", "setup"]
        },
        {
            id: 5,
            title: "Troubleshooting Buffering",
            category: "performance",
            content: "Buffering issues can be caused by slow internet, server load, or device limitations. Try lowering video quality, using Ethernet instead of WiFi, or contacting support.",
            tags: ["buffering", "performance", "troubleshooting"]
        }
    ];
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledgeBase));
}

// =============================================
// وظائف التاريخ والوقت
// =============================================

function updateDateTime() {
    try {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateElements = document.querySelectorAll('.current-date');
        const timeElements = document.querySelectorAll('.current-time');
        
        dateElements.forEach(el => el.textContent = dateString);
        timeElements.forEach(el => el.textContent = timeString);
    } catch (error) {
        console.error('Failed to update date/time:', error);
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);
setInterval(updateSessionTimer, 60000);

// =============================================
// دوال معالجة الأخطاء المحسنة
// =============================================

function handleError(context, error) {
    console.error(`Error in ${context}:`, error);
    logSecurityEvent('system_error', { context: context, error: error.message });
    n(`An error occurred: ${error.message}`, "#ff4444");
}

function safeExecute(func, context, ...args) {
    try {
        return func(...args);
    } catch (error) {
        handleError(context, error);
        return null;
    }
}

// =============================================
// دوال الإحصائيات
// =============================================

function loadStatistics() {
    try {
        const statsContent = document.getElementById('statsContent');
        const totalUsers = Object.keys(users).length;
        const totalPortals = portals.length;
        const totalVideos = videos.length;
        const totalXtreams = xtreams.length;
        const totalTickets = tickets.length;
        const totalKnowledge = knowledgeBase.length;
        
        const storageData = JSON.stringify({users, portals, videos, xtreams, tickets, knowledgeBase});
        const storageSize = (new Blob([storageData]).size / 1024).toFixed(2);
        
        const securityLogs = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY)) || [];
        const failedAttempts = JSON.parse(localStorage.getItem('login_attempts')) || {};
        const totalFailedAttempts = Object.values(failedAttempts).reduce((sum, attempt) => sum + attempt.count, 0);

        const supervisorCount = Object.values(users).filter(user => user.r === "supervisor").length;
        const adminCount = Object.values(users).filter(user => user.r === "admin").length;
        const userCount = Object.values(users).filter(user => user.r === "user").length;

        statsContent.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-users stat-icon" style="color:var(--primary)"></i>
                <div class="stat-number">${totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-user-shield stat-icon" style="color:var(--info)"></i>
                <div class="stat-number">${adminCount}</div>
                <div class="stat-label">Admins</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-user-tie stat-icon" style="color:var(--success)"></i>
                <div class="stat-number">${supervisorCount}</div>
                <div class="stat-label">Supervisors</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-satellite-dish stat-icon" style="color:var(--accent)"></i>
                <div class="stat-number">${totalPortals}</div>
                <div class="stat-label">Total Portals</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-server stat-icon" style="color:var(--primary)"></i>
                <div class="stat-number">${totalXtreams}</div>
                <div class="stat-label">Xtream Servers</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-video stat-icon" style="color:var(--warning)"></i>
                <div class="stat-number">${totalVideos}</div>
                <div class="stat-label">Total Videos</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-ticket-alt stat-icon" style="color:var(--primary)"></i>
                <div class="stat-number">${totalTickets}</div>
                <div class="stat-label">Total Tickets</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-book stat-icon" style="color:var(--success)"></i>
                <div class="stat-number">${totalKnowledge}</div>
                <div class="stat-label">Knowledge Articles</div>
            </div>
            
            <div class="stat-card">
                <i class="fas fa-database stat-icon" style="color:var(--secondary)"></i>
                <div class="stat-number">${storageSize} KB</div>
                <div class="stat-label">Storage Used</div>
            </div>
        `;
    } catch (error) {
        handleError('loadStatistics', error);
    }
}

// =============================================
// دوال الإعدادات مع الإصلاحات الأمنية
// =============================================

function loadSettings() {
    try {
        const settingsContent = document.getElementById('settingsContent');
        const currentUserRole = users[currentUser]?.r || "user";
        const securityLogs = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY)) || [];
        const recentLogs = securityLogs.slice(0, 10);

        const adminUsername = Object.keys(users).find(key => users[key].r === "admin") || 'admin';

        settingsContent.innerHTML = `
            <div class="setting-card">
                <div class="setting-title">Security Center</div>
                <div class="security-features">
                    <div class="security-status">
                        <span>Password Encryption</span>
                        <div class="status-indicator status-active"></div>
                    </div>
                    <div class="security-status">
                        <span>Brute Force Protection</span>
                        <div class="status-indicator status-active"></div>
                    </div>
                    <div class="security-status">
                        <span>Session Management</span>
                        <div class="status-indicator status-active"></div>
                    </div>
                    <div class="security-status">
                        <span>XSS Protection</span>
                        <div class="status-indicator status-active"></div>
                    </div>
                </div>
            </div>

            ${currentUserRole === "admin" ? `
            <div class="setting-card">
                <div class="setting-title">Admin Account Information</div>
                <div class="admin-info">
                    <div class="info-item">
                        <span class="info-label">Username:</span>
                        <span class="info-value">${adminUsername}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Password:</span>
                        <span class="info-value">********</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Role:</span>
                        <span class="info-value">Admin</span>
                    </div>
                </div>
                
                <div class="sensitive-action">
                    <div class="sensitive-action-title">Change Admin Username <span class="warning-badge">SENSITIVE</span></div>
                    <div class="input-group">
                        <label>New Username</label>
                        <input type="text" id="newAdminUsername" placeholder="Enter new username">
                    </div>
                    <button class="neon-btn" onclick="showChangeUsernameModal()">
                        <i class="fas fa-user-edit"></i> Change Username
                    </button>
                </div>
            </div>
            
            <div class="setting-card">
                <div class="setting-title">Change Admin Password</div>
                <div class="sensitive-action">
                    <div class="sensitive-action-title">Change Password <span class="warning-badge">SENSITIVE</span></div>
                    <div class="input-group">
                        <label>Current Password</label>
                        <input type="password" id="currentAdminPassword" placeholder="Enter current password">
                    </div>
                    <div class="input-group">
                        <label>New Password</label>
                        <input type="password" id="newAdminPassword" placeholder="Enter new password">
                    </div>
                    <div class="input-group">
                        <label>Confirm New Password</label>
                        <input type="password" id="confirmAdminPassword" placeholder="Confirm new password">
                    </div>
                    <button class="neon-btn" onclick="changeAdminPassword()">
                        <i class="fas fa-key"></i> Change Password
                    </button>
                </div>
            </div>
            
            <div class="setting-card">
                <div class="setting-title">Manage Supervisors</div>
                <div style="margin-bottom: 15px;">
                    <button class="neon-btn" onclick="showCreateSupervisorForm()" style="background: linear-gradient(45deg, rgba(0, 255, 157, 0.8), rgba(0, 204, 255, 0.8));">
                        <i class="fas fa-user-plus"></i> Add New Supervisor
                    </button>
                </div>
                <div id="supervisorsList">
                    <!-- قائمة المشرفين سيتم تحميلها هنا -->
                </div>
            </div>
            ` : ''}
            
            <div class="setting-card">
                <div class="setting-title">Security Logs</div>
                <div style="max-height: 200px; overflow-y: auto; margin: 10px 0;">
                    ${recentLogs.length > 0 ? recentLogs.map(log => `
                        <div style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem;">
                            <div style="color: var(--success); text-shadow: 0 0 8px rgba(0, 255, 157, 0.6);">${new Date(log.timestamp).toLocaleString()}</div>
                            <div>${log.event} - ${log.user}</div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: rgba(170,170,170,0.8); text-shadow: 0 0 5px rgba(255,255,255,0.2);">No security events</p>'}
                </div>
            </div>
            
            ${currentUserRole === "admin" ? `
            <div class="setting-card">
                <div class="setting-title">Data Management</div>
                <div style="display: flex; gap: 10px; margin: 15px 0;">
                    <button class="neon-btn" onclick="exportData()" style="flex: 1;">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    <button class="neon-btn" onclick="importData()" style="flex: 1; background: linear-gradient(45deg, rgba(0, 204, 255, 0.8), rgba(51, 221, 255, 0.8));">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                </div>
                <div style="display: flex; gap: 10px; margin: 15px 0;">
                    <button class="neon-btn" onclick="showDeleteModal('security_logs')" style="flex: 1; background: linear-gradient(45deg, rgba(255, 255, 0, 0.8), rgba(255, 255, 51, 0.8));">
                        <i class="fas fa-trash"></i> Clear Logs
                    </button>
                </div>
            </div>
            
            <div class="danger-zone">
                <div class="danger-title">Danger Zone</div>
                <p style="color: rgba(255, 136, 170, 0.9); text-align: center; margin-bottom: 15px; font-size: 0.9rem; text-shadow: 0 0 10px rgba(255, 0, 102, 0.4);">
                    These actions cannot be undone. Proceed with caution.
                </p>
                <button class="neon-btn" onclick="showDeleteModal('all_data')" style="background: linear-gradient(45deg, rgba(255, 0, 102, 0.8), rgba(255, 51, 133, 0.8));">
                    <i class="fas fa-trash"></i> Reset All Data
                </button>
            </div>
            ` : ''}
        `;
        
        if (currentUserRole === "admin") {
            loadSupervisorsList();
        }
    } catch (error) {
        handleError('loadSettings', error);
    }
}

// تحميل قائمة المشرفين
function loadSupervisorsList() {
    try {
        const supervisorsList = document.getElementById('supervisorsList');
        if (!supervisorsList) return;
        
        const supervisors = Object.keys(users).filter(username => users[username].r === "supervisor");
        
        if (supervisors.length === 0) {
            supervisorsList.innerHTML = '<p style="text-align: center; color: rgba(170,170,170,0.8); text-shadow: 0 0 5px rgba(255,255,255,0.2);">No supervisors yet</p>';
            return;
        }
        
        supervisorsList.innerHTML = supervisors.map(supervisor => `
            <div class="user-card" style="margin: 10px 0;">
                <div class="user-details">
                    <div class="user-name">${escapeHtml(supervisor)}</div>
                    <div class="user-role" style="color: var(--success);">Supervisor</div>
                </div>
                <button class="delete-btn" onclick="showDeleteModal('supervisor', '${escapeHtml(supervisor)}')">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        handleError('loadSupervisorsList', error);
    }
}

// عرض نموذج إنشاء مشرف جديد
function showCreateSupervisorForm() {
    try {
        if (!requireAdmin()) return;
        
        const supervisorsList = document.getElementById('supervisorsList');
        const formHTML = `
            <div class="portal-form" style="margin-top: 15px;">
                <h4 style="color:var(--success);margin-bottom:12px; font-size:0.95rem; text-shadow: 0 0 10px rgba(0, 255, 157, 0.6);">Create New Supervisor</h4>
                <input type="text" id="newSupervisorUsername" placeholder="Supervisor username">
                <input type="password" id="newSupervisorPassword" placeholder="Password">
                <input type="password" id="newSupervisorConfirmPassword" placeholder="Confirm Password">
                <div class="portal-form-buttons">
                    <button class="save-portal-btn" onclick="createSupervisor()">Create Supervisor</button>
                    <button class="cancel-portal-btn" onclick="loadSupervisorsList()">Cancel</button>
                </div>
            </div>
        `;
        
        supervisorsList.innerHTML = formHTML + supervisorsList.innerHTML;
    } catch (error) {
        handleError('showCreateSupervisorForm', error);
    }
}

// إنشاء مشرف جديد
function createSupervisor() {
    try {
        if (!requireAdmin()) return;
        
        const username = document.getElementById('newSupervisorUsername').value.trim();
        const password = document.getElementById('newSupervisorPassword').value;
        const confirmPassword = document.getElementById('newSupervisorConfirmPassword').value;
        
        if (!username || !password || !confirmPassword) {
            return n("Please fill all fields", "#ff4444");
        }
        
        if (password !== confirmPassword) {
            return n("Passwords don't match", "#ff4444");
        }
        
        if (users[username]) {
            return n("Username already exists", "#ff4444");
        }
        
        if (username.length < 3) {
            return n("Username must be at least 3 characters", "#ff4444");
        }
        
        // إنشاء المشرف بدون تخزين كلمة المرور الأصلية
        users[username] = {
            p: h(password + SECURITY_KEY),
            r: "supervisor"
        };
        
        localStorage.setItem(K, JSON.stringify(users));
        
        logSecurityEvent('supervisor_created', { 
            username: username, 
            createdBy: currentUser 
        });
        
        n("Supervisor created successfully!", "#00ff80");
        loadSupervisorsList();
        loadSettings();
    } catch (error) {
        handleError('createSupervisor', error);
    }
}

// =============================================
// دوال المصادقة المحسنة
// =============================================

async function auth(){
    try {
        const u = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        
        if (!u || !password) {
            return n("Please enter username and password", "#ff4444");
        }
        
        if (!checkLoginAttempts(u)) {
            return;
        }
        
        const p = h(password + SECURITY_KEY);
        
        if(!users[u] || users[u].p !== p) {
            recordLoginAttempt(u, false);
            logSecurityEvent('failed_login', { username: u });
            return n("Invalid credentials", "#ff4444");
        }
        
        recordLoginAttempt(u, true);
        currentUser = u;
        
        document.getElementById("welcomeUser").textContent = u;
        
        sessionStartTime = Date.now();
        lastActivityTime = Date.now();
        document.getElementById('lastLoginTime').textContent = new Date().toLocaleString();
        
        const userRole = users[u].r;
        
        document.getElementById("adminSection").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        document.getElementById("statsSection").style.display = userRole === "admin" ? "block" : "none";
        document.getElementById("settingsSection").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        document.getElementById("addPortalBtn").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        document.getElementById("addVideoBtn").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        document.getElementById("addXtreamBtn").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        
        document.getElementById("loginSecurity").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        document.getElementById("dashboardSecurity").style.display = (userRole === "admin" || userRole === "supervisor") ? "block" : "none";
        
        if (userRole === "admin" || userRole === "supervisor") {
            loadPortals();
            loadXtreams();
        }
        
        logSecurityEvent('successful_login', { username: u, role: userRole });
        show("dash");
    } catch (error) {
        handleError('auth', error);
    }
}

function logout(){
    try {
        logSecurityEvent('user_logout', { username: currentUser });
        currentUser = null;
        show("auth");
        document.querySelector('input[value="login"]').checked = true;
        document.getElementById('confirmDiv').style.display = "none";
        document.querySelector('.neon-btn').textContent = "Login";
    } catch (error) {
        handleError('logout', error);
    }
}

// حماية ضد XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// دوال التحكم في الوصول
function requireAdmin() {
    if (!currentUser || users[currentUser].r !== "admin") {
        n("Access denied: Admin privileges required", "#ff4444");
        logSecurityEvent('unauthorized_access', { user: currentUser, action: 'admin_function' });
        return false;
    }
    return true;
}

function requireAdminOrSupervisor() {
    if (!currentUser || (users[currentUser].r !== "admin" && users[currentUser].r !== "supervisor")) {
        n("Access denied: Admin or Supervisor privileges required", "#ff4444");
        logSecurityEvent('unauthorized_access', { user: currentUser, action: 'admin_or_supervisor_function' });
        return false;
    }
    return true;
}

// =============================================
// دوال إدارة المستخدمين مع الحماية
// =============================================

function loadUsers(){
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const list = document.getElementById("userList");
        list.innerHTML = "";
        
        const currentUserRole = users[currentUser].r;
        
        if (currentUserRole === "admin") {
            const addUserForm = document.createElement('div');
            addUserForm.className = 'user-card';
            addUserForm.style.flexDirection = 'column';
            addUserForm.innerHTML = `
                <h3 class="section-title" style="margin-bottom:10px;">Create New User</h3>
                <div style="width:100%;">
                    <div class="input-group">
                        <label>Username</label>
                        <input type="text" id="newUsername" placeholder="Enter username">
                    </div>
                    <div class="input-group">
                        <label>Password</label>
                        <input type="password" id="newPassword" placeholder="Enter password">
                    </div>
                    <div class="input-group">
                        <label>Confirm Password</label>
                        <input type="password" id="newConfirmPassword" placeholder="Confirm password">
                    </div>
                    <div class="input-group">
                        <label>Role</label>
                        <select id="newUserRole" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.08); color:white; border:2px solid var(--accent);">
                            <option value="user">User</option>
                            ${currentUserRole === "admin" ? '<option value="supervisor">Supervisor</option>' : ''}
                        </select>
                    </div>
                    <button class="neon-btn" onclick="createUser()" style="margin-top:10px;">Create User</button>
                </div>
            `;
            list.appendChild(addUserForm);
        }
        
        for(let u in users){
            if(u === currentUser) continue;
            
            const userRole = users[u].r;
            
            if (currentUserRole === "supervisor" && (userRole === "admin" || userRole === "supervisor")) {
                continue;
            }
            
            const div = document.createElement("div");
            div.className = "user-card";
            
            div.innerHTML = `
                <div class="user-details">
                    <div class="user-name">${escapeHtml(u)}</div>
                    <div class="user-role">Role: ${escapeHtml(userRole)}</div>
                </div>
                ${currentUserRole === "admin" ? `<button class="delete-btn" onclick="showDeleteModal('user', '${escapeHtml(u)}')">Delete</button>` : ''}
            `;
            list.appendChild(div);
        }
        
        if(list.innerHTML === "") list.innerHTML = "<p class='empty-users'>No users yet</p>";
    } catch (error) {
        handleError('loadUsers', error);
    }
}

function createUser() {
    try {
        const currentUserRole = users[currentUser].r;
        
        if (currentUserRole !== "admin") {
            n("Access denied: Only admin can create users", "#ff4444");
            logSecurityEvent('unauthorized_access', { user: currentUser, action: 'create_user' });
            return;
        }
        
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('newConfirmPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        if (!username || !password || !confirmPassword) {
            return n("Please fill all fields", "#ff4444");
        }
        
        if (password !== confirmPassword) {
            return n("Passwords don't match", "#ff4444");
        }
        
        if (users[username]) {
            return n("Username already exists", "#ff4444");
        }
        
        // إنشاء المستخدم بدون تخزين كلمة المرور الأصلية
        users[username] = { p: h(password + SECURITY_KEY), r: role };
        localStorage.setItem(K, JSON.stringify(users));
        
        logSecurityEvent('user_created', { username: username, role: role, createdBy: currentUser });
        n("User created successfully!");
        
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newConfirmPassword').value = '';
        
        loadUsers();
    } catch (error) {
        handleError('createUser', error);
    }
}

// =============================================
// دوال البوابات
// =============================================

function loadPortals() {
    try {
        const adminPortalsDiv = document.getElementById('adminPortals');
        adminPortalsDiv.innerHTML = '';
        
        portals.forEach((portal, index) => {
            const portalDiv = document.createElement('div');
            portalDiv.className = 'mac-item';
            
            let actionButtons = '';
            if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                actionButtons = `
                    <button class="edit-portal-btn" onclick="editPortal(${index})" title="Edit Portal">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-portal-btn" onclick="showDeleteModal('portal', ${index})" title="Delete Portal">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            portalDiv.innerHTML = `
                ${actionButtons}
                <h3 class="section-title">${escapeHtml(portal.name)}</h3>
                
                <div class="server-mac-box">
                    <div class="server-url">${escapeHtml(portal.server)}</div>
                    <div class="mac-address">${escapeHtml(portal.mac)}</div>
                    
                    <div class="copy-buttons">
                        <button class="copy-btn" onclick="copy('${escapeHtml(portal.server)}')">Copy Server URL</button>
                        <button class="copy-btn" onclick="copy('${escapeHtml(portal.mac)}')">Copy MAC</button>
                    </div>
                </div>
            `;
            adminPortalsDiv.appendChild(portalDiv);
        });
        
        if (portals.length === 0) {
            adminPortalsDiv.innerHTML = '<p class="empty-users">No portals available yet</p>';
        }
    } catch (error) {
        handleError('loadPortals', error);
    }
}

// =============================================
// نظام إدارة Server Xtream - الإصلاحات
// =============================================

// تحميل قائمة Xtream مع إصلاح مشكلة كلمة المرور
function loadXtreams() {
    try {
        const xtreamListDiv = document.getElementById('xtreamList');
        xtreamListDiv.innerHTML = '';
        
        if (xtreams.length === 0) {
            xtreamListDiv.innerHTML = '<p class="empty-users">No Xtream servers available yet</p>';
            return;
        }
        
        xtreams.forEach((xtream, index) => {
            const xtreamDiv = document.createElement('div');
            xtreamDiv.className = 'mac-item';
            
            let actionButtons = '';
            if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                actionButtons = `
                    <button class="edit-xtream-btn" onclick="editXtream(${index})" title="Edit Xtream Server">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-xtream-btn" onclick="showDeleteModal('xtream', ${index})" title="Delete Xtream Server">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            // إنشاء معرف فريد لعنصر كلمة المرور
            const passwordId = `xtream-password-${index}`;
            
            xtreamDiv.innerHTML = `
                ${actionButtons}
                <h3 class="section-title">${escapeHtml(xtream.name)}</h3>
                
                <div class="server-mac-box">
                    <div class="server-url">${escapeHtml(xtream.server)}</div>
                    <div class="mac-address">Username: ${escapeHtml(xtream.username)}</div>
                    <div class="mac-address">
                        Password: <span id="${passwordId}" data-password="${escapeHtml(xtream.password)}" data-visible="false">${'•'.repeat(xtream.password.length)}</span>
                        <button onclick="toggleXtreamPassword('${passwordId}')" style="background:none; border:none; color:var(--accent); margin-left:10px; cursor:pointer;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    
                    <div class="copy-buttons">
                        <button class="copy-btn" onclick="copy('${escapeHtml(xtream.server)}')">Copy Server URL</button>
                        <button class="copy-btn" onclick="copy('${escapeHtml(xtream.username)}')">Copy Username</button>
                        <button class="copy-btn" onclick="copy('${escapeHtml(xtream.password)}')">Copy Password</button>
                    </div>
                </div>
            `;
            xtreamListDiv.appendChild(xtreamDiv);
        });
    } catch (error) {
        handleError('loadXtreams', error);
    }
}

// إظهار/إخفاء كلمة المرور - الإصدار المحسن
function toggleXtreamPassword(passwordId) {
    try {
        const passwordElement = document.getElementById(passwordId);
        const isVisible = passwordElement.getAttribute('data-visible') === 'true';
        const actualPassword = passwordElement.getAttribute('data-password');
        
        if (!isVisible) {
            // إظهار كلمة المرور
            passwordElement.textContent = actualPassword;
            passwordElement.setAttribute('data-visible', 'true');
            // تغيير الأيقونة
            passwordElement.parentElement.querySelector('button i').className = 'fas fa-eye-slash';
        } else {
            // إخفاء كلمة المرور
            passwordElement.textContent = '•'.repeat(actualPassword.length);
            passwordElement.setAttribute('data-visible', 'false');
            // تغيير الأيقونة
            passwordElement.parentElement.querySelector('button i').className = 'fas fa-eye';
        }
    } catch (error) {
        handleError('toggleXtreamPassword', error);
    }
}

// عرض/إخفاء نموذج إضافة Xtream
function toggleXtreamForm() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const form = document.getElementById('xtreamForm');
        const isShowing = form.style.display === 'block';
        form.style.display = isShowing ? 'none' : 'block';
        
        if (!isShowing) {
            resetXtreamForm();
        } else {
            editingXtreamIndex = -1;
        }
    } catch (error) {
        handleError('toggleXtreamForm', error);
    }
}

// إعادة تعيين نموذج Xtream
function resetXtreamForm() {
    try {
        document.getElementById('xtreamName').value = '';
        document.getElementById('xtreamServer').value = '';
        document.getElementById('xtreamUsername').value = '';
        document.getElementById('xtreamPassword').value = '';
        document.getElementById('xtreamFormTitle').textContent = 'Add New Xtream Server';
        document.getElementById('saveXtreamBtn').style.display = 'block';
        document.getElementById('updateXtreamBtn').style.display = 'none';
        editingXtreamIndex = -1;
    } catch (error) {
        handleError('resetXtreamForm', error);
    }
}

// حفظ Xtream جديد
function saveXtream() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const name = document.getElementById('xtreamName').value.trim();
        const server = document.getElementById('xtreamServer').value.trim();
        const username = document.getElementById('xtreamUsername').value.trim();
        const password = document.getElementById('xtreamPassword').value.trim();
        
        if (!name || !server || !username || !password) {
            return n("Please fill all fields", "#ff4444");
        }
        
        // تحقق من صحة تنسيق السيرفر
        if (!server.startsWith('http://') && !server.startsWith('https://')) {
            return n("Server URL must start with http:// or https://", "#ff4444");
        }
        
        xtreams.push({ name, server, username, password });
        localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
        
        logSecurityEvent('xtream_server_added', { serverName: name, addedBy: currentUser });
        n("Xtream server added successfully!");
        toggleXtreamForm();
        loadXtreams();
    } catch (error) {
        handleError('saveXtream', error);
    }
}

// تعديل Xtream موجود
function editXtream(index) {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        editingXtreamIndex = index;
        const xtream = xtreams[index];
        
        document.getElementById('xtreamName').value = xtream.name;
        document.getElementById('xtreamServer').value = xtream.server;
        document.getElementById('xtreamUsername').value = xtream.username;
        document.getElementById('xtreamPassword').value = xtream.password;
        
        document.getElementById('xtreamFormTitle').textContent = 'Edit Xtream Server';
        document.getElementById('saveXtreamBtn').style.display = 'none';
        document.getElementById('updateXtreamBtn').style.display = 'block';
        document.getElementById('xtreamForm').style.display = 'block';
    } catch (error) {
        handleError('editXtream', error);
    }
}

// تحديث Xtream
function updateXtream() {
    try {
        if (!requireAdminOrSupervisor() || editingXtreamIndex === -1) return;
        
        const name = document.getElementById('xtreamName').value.trim();
        const server = document.getElementById('xtreamServer').value.trim();
        const username = document.getElementById('xtreamUsername').value.trim();
        const password = document.getElementById('xtreamPassword').value.trim();
        
        if (!name || !server || !username || !password) {
            return n("Please fill all fields", "#ff4444");
        }
        
        // تحقق من صحة تنسيق السيرفر
        if (!server.startsWith('http://') && !server.startsWith('https://')) {
            return n("Server URL must start with http:// or https://", "#ff4444");
        }
        
        xtreams[editingXtreamIndex] = { name, server, username, password };
        localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
        
        logSecurityEvent('xtream_server_updated', { serverName: name, updatedBy: currentUser });
        n("Xtream server updated successfully!");
        toggleXtreamForm();
        loadXtreams();
    } catch (error) {
        handleError('updateXtream', error);
    }
}

// =============================================
// دوال الفيديوهات
// =============================================

function loadVideos() {
    try {
        const videosListDiv = document.getElementById('videosList');
        videosListDiv.innerHTML = '';
        
        if (videos.length === 0) {
            videosListDiv.innerHTML = '<p class="empty-users">No videos available yet</p>';
            return;
        }
        
        videos.forEach((video, index) => {
            const videoDiv = document.createElement('div');
            videoDiv.className = 'video-item';
            
            let actionButtons = '';
            if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                actionButtons = `
                    <button class="edit-video-btn" onclick="editVideo(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-video-btn" onclick="showDeleteModal('video', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            const youtubeId = extractYouTubeId(video.url);
            const thumbnail = video.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '');
            
            let thumbnailContent = thumbnail ? `
                <div class="video-preview" onclick="playVideo(${index})">
                    <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(video.title)}" onerror="this.style.display='none'">
                    <div class="play-overlay">
                        <i class="fas fa-play play-icon"></i>
                    </div>
                </div>
            ` : '';
            
            videoDiv.innerHTML = `
                ${actionButtons}
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-description">${escapeHtml(video.description)}</div>
                ${thumbnailContent}
                <div class="video-actions">
                    <button class="watch-btn" onclick="playVideo(${index})">
                        <i class="fas fa-play"></i> Play Video
                    </button>
                </div>
            `;
            videosListDiv.appendChild(videoDiv);
        });
    } catch (error) {
        handleError('loadVideos', error);
    }
}

// =============================================
// دوال الدردشة المباشرة
// =============================================

function loadLiveChat() {
    try {
        // تحديث قائمة المستخدمين المتصلين
        loadOnlineUsers();
        
        // تحميل الرسائل
        loadChatMessages();
        
        // تحديث تلقائي للدردشة كل 5 ثواني
        setTimeout(loadLiveChat, 5000);
    } catch (error) {
        handleError('loadLiveChat', error);
    }
}

function loadOnlineUsers() {
    try {
        const onlineUsersList = document.getElementById('onlineUsersList');
        if (!onlineUsersList) return;
        
        // في نظام حقيقي، ستكون هناك طريقة لتحديد المستخدمين المتصلين
        // هنا سنعرض جميع المستخدمين كمثال
        let usersHTML = '';
        for (let username in users) {
            const role = users[username].r;
            const isCurrentUser = username === currentUser;
            
            usersHTML += `
                <div class="user-status">
                    <div class="status-dot ${isCurrentUser ? 'online' : 'offline'}"></div>
                    <div>
                        <div style="color:${isCurrentUser ? 'var(--accent)' : 'var(--primary)'}; font-weight:${isCurrentUser ? 'bold' : 'normal'}">
                            ${escapeHtml(username)} ${isCurrentUser ? '(You)' : ''}
                        </div>
                        <div style="color:var(--secondary); font-size:0.8rem;">${role}</div>
                    </div>
                </div>
            `;
        }
        
        onlineUsersList.innerHTML = usersHTML;
    } catch (error) {
        handleError('loadOnlineUsers', error);
    }
}

function loadChatMessages() {
    try {
        const chatMessagesDiv = document.getElementById('chatMessages');
        if (!chatMessagesDiv) return;
        
        let messagesHTML = '';
        
        if (chatMessages.length === 0) {
            messagesHTML = `
                <div style="text-align:center; padding:40px; color:var(--secondary);">
                    <i class="fas fa-comments" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <div>No messages yet. Start the conversation!</div>
                </div>
            `;
        } else {
            chatMessages.forEach(msg => {
                const isCurrentUser = msg.sender === currentUser;
                const isAdmin = users[msg.sender] && users[msg.sender].r === "admin";
                const isSupervisor = users[msg.sender] && users[msg.sender].r === "supervisor";
                
                let messageClass = 'message user';
                let senderName = msg.sender;
                
                if (isAdmin) {
                    messageClass = 'message admin';
                    senderName += ' (Admin)';
                } else if (isSupervisor) {
                    messageClass = 'message admin';
                    senderName += ' (Supervisor)';
                } else if (!isCurrentUser) {
                    messageClass = 'message';
                }
                
                messagesHTML += `
                    <div class="${messageClass}">
                        <div style="font-weight:bold; margin-bottom:5px; color:${isCurrentUser ? 'var(--accent)' : isAdmin || isSupervisor ? 'var(--warning)' : 'var(--primary)'}">
                            ${escapeHtml(senderName)}
                        </div>
                        <div>${escapeHtml(msg.message)}</div>
                        <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                `;
            });
        }
        
        chatMessagesDiv.innerHTML = messagesHTML;
        
        // التمرير إلى الأسفل لعرض أحدث الرسائل
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    } catch (error) {
        handleError('loadChatMessages', error);
    }
}

function sendChatMessage() {
    try {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) {
            return n("Please enter a message", "#ff4444");
        }
        
        if (!currentUser) {
            return n("You must be logged in to send messages", "#ff4444");
        }
        
        const newMessage = {
            sender: currentUser,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        chatMessages.push(newMessage);
        
        // حفظ فقط آخر 100 رسالة
        if (chatMessages.length > 100) {
            chatMessages.shift();
        }
        
        localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
        
        logSecurityEvent('chat_message_sent', { 
            sender: currentUser, 
            messageLength: message.length 
        });
        
        chatInput.value = '';
        loadChatMessages();
        
        // إشعار للمستخدمين الآخرين (في نظام حقيقي، سيكون هناك WebSocket)
        n("Message sent!");
    } catch (error) {
        handleError('sendChatMessage', error);
    }
}

// =============================================
// دوال قاعدة المعارف
// =============================================

function loadKnowledgeBase() {
    try {
        const knowledgeContent = document.getElementById('knowledgeContent');
        if (!knowledgeContent) return;
        
        let knowledgeHTML = '';
        
        if (knowledgeBase.length === 0) {
            knowledgeHTML = `
                <div style="text-align:center; padding:40px; color:var(--secondary);">
                    <i class="fas fa-book" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <div>No knowledge articles yet.</div>
                </div>
            `;
        } else {
            knowledgeBase.forEach((article, index) => {
                let categoryClass = '';
                switch(article.category) {
                    case 'tutorial': categoryClass = 'knowledge-category'; break;
                    case 'troubleshooting': categoryClass = 'knowledge-category'; break;
                    case 'setup': categoryClass = 'knowledge-category'; break;
                    case 'configuration': categoryClass = 'knowledge-category'; break;
                    case 'performance': categoryClass = 'knowledge-category'; break;
                }
                
                let actionButtons = '';
                if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                    actionButtons = `
                        <button class="delete-btn" onclick="showDeleteModal('knowledge', ${index})" style="margin-top:10px; padding:5px 10px; font-size:0.7rem;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `;
                }
                
                knowledgeHTML += `
                    <div class="knowledge-item">
                        <div class="${categoryClass}">${article.category.toUpperCase()}</div>
                        <h3 style="color:var(--accent); margin-bottom:10px;">${escapeHtml(article.title)}</h3>
                        <p style="color:var(--secondary); margin-bottom:15px;">${escapeHtml(article.content)}</p>
                        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">
                            ${article.tags.map(tag => `
                                <span style="background:rgba(0,255,255,0.2); color:var(--accent); padding:2px 8px; border-radius:12px; font-size:0.7rem;">
                                    ${escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                        ${actionButtons}
                    </div>
                `;
            });
        }
        
        knowledgeContent.innerHTML = knowledgeHTML;
    } catch (error) {
        handleError('loadKnowledgeBase', error);
    }
}

function searchKnowledge() {
    try {
        const searchInput = document.getElementById('knowledgeSearch');
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            loadKnowledgeBase();
            return;
        }
        
        const knowledgeContent = document.getElementById('knowledgeContent');
        const filteredArticles = knowledgeBase.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            article.category.toLowerCase().includes(searchTerm)
        );
        
        if (filteredArticles.length === 0) {
            knowledgeContent.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--secondary);">
                    <i class="fas fa-search" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <div>No results found for "${escapeHtml(searchTerm)}"</div>
                </div>
            `;
            return;
        }
        
        let knowledgeHTML = '';
        filteredArticles.forEach((article, index) => {
            let categoryClass = '';
            switch(article.category) {
                case 'tutorial': categoryClass = 'knowledge-category'; break;
                case 'troubleshooting': categoryClass = 'knowledge-category'; break;
                case 'setup': categoryClass = 'knowledge-category'; break;
                case 'configuration': categoryClass = 'knowledge-category'; break;
                case 'performance': categoryClass = 'knowledge-category'; break;
            }
            
            let actionButtons = '';
            if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                actionButtons = `
                    <button class="delete-btn" onclick="showDeleteModal('knowledge', ${knowledgeBase.indexOf(article)})" style="margin-top:10px; padding:5px 10px; font-size:0.7rem;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `;
            }
            
            knowledgeHTML += `
                <div class="knowledge-item">
                    <div class="${categoryClass}">${article.category.toUpperCase()}</div>
                    <h3 style="color:var(--accent); margin-bottom:10px;">${escapeHtml(article.title)}</h3>
                    <p style="color:var(--secondary); margin-bottom:15px;">${escapeHtml(article.content)}</p>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">
                        ${article.tags.map(tag => `
                            <span style="background:rgba(0,255,255,0.2); color:var(--accent); padding:2px 8px; border-radius:12px; font-size:0.7rem;">
                                ${escapeHtml(tag)}
                            </span>
                        `).join('')}
                    </div>
                    ${actionButtons}
                </div>
            `;
        });
        
        knowledgeContent.innerHTML = knowledgeHTML;
    } catch (error) {
        handleError('searchKnowledge', error);
    }
}

// =============================================
// دوال نظام التذاكر
// =============================================

function loadTickets() {
    try {
        const ticketsListDiv = document.getElementById('ticketsList');
        if (!ticketsListDiv) return;
        
        let ticketsHTML = '';
        
        if (tickets.length === 0) {
            ticketsListDiv.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--secondary);">
                    <i class="fas fa-ticket-alt" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <div>No tickets yet. Create your first ticket!</div>
                </div>
            `;
            return;
        }
        
        // تصفية التذاكر بناءً على دور المستخدم
        let filteredTickets = tickets;
        const currentUserRole = users[currentUser]?.r || "user";
        
        if (currentUserRole === "user") {
            filteredTickets = tickets.filter(ticket => ticket.user === currentUser);
        }
        
        if (filteredTickets.length === 0) {
            ticketsListDiv.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--secondary);">
                    <i class="fas fa-ticket-alt" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                    <div>No tickets found.</div>
                </div>
            `;
            return;
        }
        
        filteredTickets.forEach((ticket, index) => {
            let priorityClass = '';
            switch(ticket.priority) {
                case 'low': priorityClass = 'priority-low'; break;
                case 'medium': priorityClass = 'priority-medium'; break;
                case 'high': priorityClass = 'priority-high'; break;
            }
            
            let statusClass = '';
            switch(ticket.status) {
                case 'open': statusClass = 'status-open'; break;
                case 'pending': statusClass = 'status-pending'; break;
                case 'closed': statusClass = 'status-closed'; break;
            }
            
            const ticketIndex = tickets.indexOf(ticket);
            
            let actionButtons = '';
            if (currentUser && (users[currentUser].r === "admin" || users[currentUser].r === "supervisor")) {
                actionButtons = `
                    <button class="delete-btn" onclick="showDeleteModal('ticket', ${ticketIndex})" style="margin-top:10px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `;
            }
            
            ticketsHTML += `
                <div class="ticket-item" onclick="showTicketDetailsModal(${ticketIndex})" style="cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="color:var(--accent); margin-bottom:5px;">${escapeHtml(ticket.subject)}</h3>
                            <div style="color:var(--secondary); font-size:0.9rem; margin-bottom:10px;">
                                ${escapeHtml(ticket.description.length > 100 ? ticket.description.substring(0, 100) + '...' : ticket.description)}
                            </div>
                        </div>
                        <span class="ticket-status ${statusClass}">${ticket.status.toUpperCase()}</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; margin-top:15px;">
                        <div>
                            <span class="ticket-priority ${priorityClass}">${ticket.priority.toUpperCase()} Priority</span>
                            <span style="color:var(--secondary); margin-left:10px; font-size:0.8rem;">
                                ${ticket.user === currentUser ? 'Your ticket' : 'By: ' + escapeHtml(ticket.user)}
                            </span>
                        </div>
                        <div style="color:var(--secondary); font-size:0.8rem;">
                            ${new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    
                    ${actionButtons}
                </div>
            `;
        });
        
        ticketsListDiv.innerHTML = ticketsHTML;
    } catch (error) {
        handleError('loadTickets', error);
    }
}

// =============================================
// دوال تغيير كلمة مرور المدير مع التأكيدات
// =============================================

function changeAdminPassword() {
    try {
        if (!requireAdmin()) return;
        
        const currentPassword = document.getElementById('currentAdminPassword').value;
        const newPassword = document.getElementById('newAdminPassword').value;
        const confirmPassword = document.getElementById('confirmAdminPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return n("Please fill all fields", "#ff4444");
        }
        
        // عرض نافذة تأكيد
        showConfirmModal(
            "Change Admin Password",
            "Are you sure you want to change the admin password?",
            function() {
                try {
                    const adminUser = Object.keys(users).find(key => users[key].r === "admin");
                    if (!adminUser) {
                        return n("Admin account not found", "#ff4444");
                    }
                    
                    if (h(currentPassword + SECURITY_KEY) !== users[adminUser].p) {
                        logSecurityEvent('admin_password_change_failed', { reason: 'wrong_current_password' });
                        return n("Current password is incorrect", "#ff4444");
                    }
                    
                    if (newPassword !== confirmPassword) {
                        return n("New passwords don't match", "#ff4444");
                    }
                    
                    if (newPassword.length < 4) {
                        return n("Password must be at least 4 characters", "#ff4444");
                    }
                    
                    // تغيير كلمة المرور بدون تخزين الأصلية
                    users[adminUser].p = h(newPassword + SECURITY_KEY);
                    localStorage.setItem(K, JSON.stringify(users));
                    
                    document.getElementById('currentAdminPassword').value = '';
                    document.getElementById('newAdminPassword').value = '';
                    document.getElementById('confirmAdminPassword').value = '';
                    
                    logSecurityEvent('admin_password_changed');
                    n("Admin password changed successfully!");
                } catch (error) {
                    handleError('changeAdminPassword-confirm', error);
                }
            }
        );
    } catch (error) {
        handleError('changeAdminPassword', error);
    }
}

// =============================================
// دوال النسخ الاحتياطي
// =============================================

function exportData() {
    try {
        if (!requireAdmin()) return;
        
        const allData = {
            users: users,
            portals: portals,
            videos: videos,
            xtreams: xtreams,
            chatMessages: chatMessages,
            knowledgeBase: knowledgeBase,
            tickets: tickets,
            exportDate: new Date().toISOString(),
            exportedBy: currentUser
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ahmedtech_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        logSecurityEvent('data_exported');
        n('Data exported successfully!');
    } catch (error) {
        handleError('exportData', error);
    }
}

function importData() {
    try {
        if (!requireAdmin()) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    showConfirmModal(
                        'Import Data',
                        'This will replace all current data. Are you sure you want to continue?',
                        function() {
                            try {
                                users = importedData.users || users;
                                portals = importedData.portals || portals;
                                videos = importedData.videos || videos;
                                xtreams = importedData.xtreams || xtreams;
                                chatMessages = importedData.chatMessages || chatMessages;
                                knowledgeBase = importedData.knowledgeBase || knowledgeBase;
                                tickets = importedData.tickets || tickets;
                                
                                // تنظيف بيانات المستخدمين (إزالة أي تخزين لكلمات المرور الأصلية)
                                Object.keys(users).forEach(username => {
                                    if (users[username].originalPassword) {
                                        delete users[username].originalPassword;
                                    }
                                });
                                
                                localStorage.setItem(K, JSON.stringify(users));
                                localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
                                localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
                                localStorage.setItem(XTREAM_KEY, JSON.stringify(xtreams));
                                localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
                                localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledgeBase));
                                localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
                                
                                logSecurityEvent('data_imported', { importedBy: currentUser });
                                n('Data imported successfully!');
                                setTimeout(() => location.reload(), 1000);
                            } catch (error) {
                                handleError('importData-confirm', error);
                            }
                        }
                    );
                } catch (error) {
                    logSecurityEvent('data_import_failed', { error: error.message });
                    n('Error importing data: Invalid file format', '#ff4444');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    } catch (error) {
        handleError('importData', error);
    }
}

// =============================================
// دوال النظام الأساسي الأخرى
// =============================================

function show(page){
    try {
        const currentPage = document.querySelector('.container:not(.hidden), .dashboard:not(.hidden)').id;
        if (currentPage !== 'auth') {
            previousPage = currentPage;
        }
        
        // التحكم في الوصول
        if (page === "stats" || page === "settings") {
            if (!currentUser || (users[currentUser].r !== "admin" && users[currentUser].r !== "supervisor")) {
                n("Access denied: Admin or Supervisor only", "#ff4444");
                return;
            }
        }
        
        if (page === "users") {
            if (!currentUser || (users[currentUser].r !== "admin" && users[currentUser].r !== "supervisor")) {
                n("Access denied: Admin or Supervisor only", "#ff4444");
                return;
            }
        }
        
        document.querySelectorAll('.container,.dashboard').forEach(e => e.classList.add('hidden'));
        document.getElementById(page).classList.remove('hidden');
        
        if(page === "users") {
            loadUsers();
        } else if(page === "videos") {
            loadVideos();
        } else if(page === "stats") {
            loadStatistics();
        } else if(page === "settings") {
            loadSettings();
        } else if(page === "macs") {
            loadPortals();
        } else if(page === "xtream") {
            loadXtreams();
        } else if(page === "liveChat") {
            loadLiveChat();
        } else if(page === "knowledgeBase") {
            loadKnowledgeBase();
        } else if(page === "ticketSystem") {
            loadTickets();
        }
    } catch (error) {
        handleError('show', error);
    }
}

function goBack(){
    try {
        show(previousPage);
    } catch (error) {
        handleError('goBack', error);
    }
}

function copy(t){
    try {
        navigator.clipboard.writeText(t);
        n("Copied!");
    } catch (error) {
        handleError('copy', error);
        n("Failed to copy", "#ff4444");
    }
}

function n(m, c = "#00ff80"){
    try {
        const x = document.getElementById("notif");
        x.textContent = m;
        x.style.background = c;
        x.style.display = "block";
        setTimeout(() => { 
            x.style.display = "none"; 
            x.style.background = "#00ff80";
        }, 3000);
    } catch (error) {
        console.error('Failed to show notification:', error);
    }
}

// دوال الفيديوهات الأخرى
function extractYouTubeId(url) {
    try {
        if (!url) return '';
        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/embed\/([^"&?\/\s]{11})/,
            /youtube\.com\/watch\?v=([^"&?\/\s]{11})/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return '';
    } catch (error) {
        console.error('Failed to extract YouTube ID:', error);
        return '';
    }
}

// دوال البوابات الأخرى
function togglePortalForm() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const form = document.getElementById('portalForm');
        const isShowing = form.style.display === 'block';
        form.style.display = isShowing ? 'none' : 'block';
        if (!isShowing) {
            resetPortalForm();
        } else {
            editingPortalIndex = -1;
        }
    } catch (error) {
        handleError('togglePortalForm', error);
    }
}

function resetPortalForm() {
    try {
        document.getElementById('portalName').value = '';
        document.getElementById('portalServer').value = '';
        document.getElementById('portalMac').value = '';
        document.getElementById('portalFormTitle').textContent = 'Add New Portal';
        document.getElementById('savePortalBtn').style.display = 'block';
        document.getElementById('updatePortalBtn').style.display = 'none';
        editingPortalIndex = -1;
    } catch (error) {
        handleError('resetPortalForm', error);
    }
}

function savePortal() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const name = document.getElementById('portalName').value.trim();
        const server = document.getElementById('portalServer').value.trim();
        const mac = document.getElementById('portalMac').value.trim();
        
        if (!name || !server || !mac) {
            return n("Please fill all fields", "#ff4444");
        }
        
        portals.push({ name, server, mac });
        localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
        
        logSecurityEvent('portal_added', { portalName: name, addedBy: currentUser });
        n("Portal added successfully!");
        togglePortalForm();
        loadPortals();
    } catch (error) {
        handleError('savePortal', error);
    }
}

function editPortal(index) {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const portal = portals[index];
        document.getElementById('portalName').value = portal.name;
        document.getElementById('portalServer').value = portal.server;
        document.getElementById('portalMac').value = portal.mac;
        document.getElementById('portalFormTitle').textContent = 'Edit Portal';
        document.getElementById('savePortalBtn').style.display = 'none';
        document.getElementById('updatePortalBtn').style.display = 'block';
        editingPortalIndex = index;
        
        document.getElementById('portalForm').style.display = 'block';
    } catch (error) {
        handleError('editPortal', error);
    }
}

function updatePortal() {
    try {
        if (!requireAdminOrSupervisor() || editingPortalIndex === -1) return;
        
        const name = document.getElementById('portalName').value.trim();
        const server = document.getElementById('portalServer').value.trim();
        const mac = document.getElementById('portalMac').value.trim();
        
        if (!name || !server || !mac) {
            return n("Please fill all fields", "#ff4444");
        }
        
        portals[editingPortalIndex] = { name, server, mac };
        localStorage.setItem(PORTALS_KEY, JSON.stringify(portals));
        
        logSecurityEvent('portal_updated', { portalName: name, updatedBy: currentUser });
        n("Portal updated successfully!");
        togglePortalForm();
        loadPortals();
    } catch (error) {
        handleError('updatePortal', error);
    }
}

// دوال الفيديوهات
function toggleVideoForm() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const form = document.getElementById('videoForm');
        const isShowing = form.style.display === 'block';
        form.style.display = isShowing ? 'none' : 'block';
        if (!isShowing) {
            resetVideoForm();
        } else {
            editingVideoIndex = -1;
        }
    } catch (error) {
        handleError('toggleVideoForm', error);
    }
}

function resetVideoForm() {
    try {
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoDescription').value = '';
        document.getElementById('videoUrl').value = '';
        document.getElementById('videoThumbnail').value = '';
        document.getElementById('videoFormTitle').textContent = 'Add New Video';
        document.getElementById('saveVideoBtn').style.display = 'block';
        document.getElementById('updateVideoBtn').style.display = 'none';
        editingVideoIndex = -1;
    } catch (error) {
        handleError('resetVideoForm', error);
    }
}

function saveVideo() {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        const title = document.getElementById('videoTitle').value.trim();
        const description = document.getElementById('videoDescription').value.trim();
        const url = document.getElementById('videoUrl').value.trim();
        const thumbnail = document.getElementById('videoThumbnail').value.trim();
        
        if (!title || !description || !url) {
            return n("Please fill all required fields", "#ff4444");
        }
        
        videos.push({ title, description, url, thumbnail });
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
        
        logSecurityEvent('youtube_video_added', { videoTitle: title, addedBy: currentUser });
        n("YouTube video added successfully!");
        toggleVideoForm();
        loadVideos();
    } catch (error) {
        handleError('saveVideo', error);
    }
}

function updateVideo() {
    try {
        if (!requireAdminOrSupervisor() || editingVideoIndex === -1) return;
        
        const title = document.getElementById('videoTitle').value.trim();
        const description = document.getElementById('videoDescription').value.trim();
        const url = document.getElementById('videoUrl').value.trim();
        const thumbnail = document.getElementById('videoThumbnail').value.trim();
        
        if (!title || !description || !url) {
            return n("Please fill all required fields", "#ff4444");
        }
        
        videos[editingVideoIndex] = { title, description, url, thumbnail };
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
        
        logSecurityEvent('youtube_video_updated', { videoTitle: title, updatedBy: currentUser });
        n("YouTube video updated successfully!");
        toggleVideoForm();
        loadVideos();
    } catch (error) {
        handleError('updateVideo', error);
    }
}

function editVideo(index) {
    try {
        if (!requireAdminOrSupervisor()) return;
        
        editingVideoIndex = index;
        const video = videos[index];
        
        document.getElementById('videoTitle').value = video.title;
        document.getElementById('videoDescription').value = video.description;
        document.getElementById('videoUrl').value = video.url;
        document.getElementById('videoThumbnail').value = video.thumbnail || '';
        
        document.getElementById('videoFormTitle').textContent = 'Edit Video';
        document.getElementById('saveVideoBtn').style.display = 'none';
        document.getElementById('updateVideoBtn').style.display = 'block';
        document.getElementById('videoForm').style.display = 'block';
    } catch (error) {
        handleError('editVideo', error);
    }
}

function playVideo(index) {
    try {
        const video = videos[index];
        const youtubeId = extractYouTubeId(video.url);
        
        if (!youtubeId) {
            document.getElementById('playerContent').innerHTML = `
                <div class="video-error">
                    <div class="error-message">Invalid YouTube URL</div>
                    <a href="${video.url}" target="_blank" class="external-link">
                        <i class="fas fa-external-link-alt"></i> Open in YouTube
                    </a>
                </div>
            `;
        } else {
            document.getElementById('playerContent').innerHTML = `
                <iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            `;
        }
        
        document.getElementById('playerTitle').textContent = video.title;
        document.getElementById('playerDescription').textContent = video.description;
        document.getElementById('videoPlayer').classList.remove('hidden');
    } catch (error) {
        handleError('playVideo', error);
    }
}

function closeVideoPlayer() {
    try {
        document.getElementById('videoPlayer').classList.add('hidden');
        document.getElementById('playerContent').innerHTML = '';
    } catch (error) {
        handleError('closeVideoPlayer', error);
    }
}

// إضافة فيديوهات افتراضية
if (videos.length === 0) {
    videos.push({
        title: "Introduction to IPTV",
        description: "Basic explanation of IPTV concept and how to use it",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    });
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

// =============================================
// معالجة الأحداث
// =============================================

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeVideoPlayer();
        closeDeleteModal();
        closeForgotPasswordModal();
        closeConfirmModal();
        closeChangeUsernameModal();
        closeNewTicketModal();
        closeTicketDetailsModal();
    }
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', function(e) {
    if (e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
    }
});

// =============================================
// التهيئة النهائية
// =============================================

console.log("AHMEDTECH Portal loaded successfully with enhanced security features and new modules.");
