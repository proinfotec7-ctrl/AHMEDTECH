// AHMEDTECH PORTAL - Firebase Integration
// تم التحديث بنظام حماية البيانات للمستخدمين

let currentUser = null;
let currentAction = null;
let currentItemId = null;

// دالة تسجيل الدخول
async function auth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification("Please enter username and password", "error");
        return;
    }
    
    try {
        const email = username.includes('@') ? username : `${username}@ahmedtech.com`;
        const userCredential = await window.firebase.authMethods.signInWithEmailAndPassword(
            window.firebase.auth, email, password
        );
        
        currentUser = userCredential.user;
        
        // حفظ بيانات المستخدم في Firestore
        await window.firebase.firestore.setDoc(
            window.firebase.firestore.doc(window.firebase.db, "users", currentUser.uid),
            {
                email: currentUser.email,
                username: username,
                lastLogin: window.firebase.firestore.serverTimestamp(),
                isAdmin: currentUser.email === 'admin@ahmedtech.com'
            },
            { merge: true }
        );
        
        showNotification("Login successful!", "success");
        
        // تحديث الواجهة
        document.getElementById('auth').style.display = 'none';
        document.getElementById('dash').classList.remove('hidden');
        document.getElementById('welcomeUser').textContent = username;
        
        // إظهار أقسام المدير إذا كان مسؤولاً
        const isAdmin = currentUser.email === 'admin@ahmedtech.com';
        if (isAdmin) {
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('statsSection').style.display = 'block';
            document.getElementById('settingsSection').style.display = 'block';
            document.getElementById('addPortalBtn').style.display = 'inline-block';
            document.getElementById('addXtreamBtn').style.display = 'inline-block';
            document.getElementById('addVideoBtn').style.display = 'inline-block';
        }
        
    } catch (error) {
        console.error("Login error:", error);
        showNotification("Login failed. Check credentials.", "error");
    }
}

// دالة تسجيل الخروج
async function logout() {
    try {
        await window.firebase.authMethods.signOut(window.firebase.auth);
        currentUser = null;
        showNotification("Logged out successfully", "success");
        
        // إعادة تعيين الواجهة
        document.getElementById('auth').style.display = 'block';
        document.querySelectorAll('.dashboard').forEach(page => {
            page.classList.add('hidden');
        });
        
        // مسح الحقول
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
    } catch (error) {
        console.error("Logout error:", error);
        showNotification("Logout failed", "error");
    }
}

// ==================== FREE MACs SECTION ====================

function togglePortalForm() {
    const form = document.getElementById('portalForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    
    // إعادة تعيين الحقول
    document.getElementById('portalName').value = '';
    document.getElementById('portalServer').value = '';
    document.getElementById('portalMac').value = '';
    
    // إعادة تعيين الأزرار
    document.getElementById('savePortalBtn').style.display = 'inline-block';
    document.getElementById('updatePortalBtn').style.display = 'none';
    currentItemId = null;
}

async function savePortal() {
    if (!currentUser) {
        showNotification("Please login first", "error");
        return;
    }
    
    const name = document.getElementById('portalName').value;
    const server = document.getElementById('portalServer').value;
    const mac = document.getElementById('portalMac').value;
    
    if (!name || !server || !mac) {
        showNotification("Please fill all fields", "error");
        return;
    }
    
    try {
        const portalData = {
            name: name,
            server: server,
            mac: mac,
            userId: currentUser.uid,  // 🔐 معرف المستخدم المالك
            userEmail: currentUser.email,
            createdAt: window.firebase.firestore.serverTimestamp(),
            updatedAt: window.firebase.firestore.serverTimestamp()
        };
        
        await window.firebase.firestore.addDoc(
            window.firebase.firestore.collection(window.firebase.db, "portals"),
            portalData
        );
        
        showNotification("Portal saved successfully!");
        togglePortalForm();
        loadPortals();
        
    } catch (error) {
        console.error("Save error:", error);
        showNotification("Error saving portal", "error");
    }
}

async function loadPortals() {
    if (!currentUser) return;
    
    const container = document.getElementById('adminPortals');
    container.innerHTML = '<div class="loading">Loading portals...</div>';
    
    try {
        const portalsRef = window.firebase.firestore.collection(window.firebase.db, "portals");
        
        // بناء الاستعلام بناءً على دور المستخدم
        let query;
        if (currentUser.email === 'admin@ahmedtech.com') {
            // المدير يرى كل البوابات
            query = window.firebase.firestore.query(
                portalsRef,
                window.firebase.firestore.orderBy("createdAt", "desc")
            );
        } else {
            // المستخدم العادي يرى بواباته فقط
            query = window.firebase.firestore.query(
                portalsRef,
                window.firebase.firestore.where("userId", "==", currentUser.uid),
                window.firebase.firestore.orderBy("createdAt", "desc")
            );
        }
        
        const querySnapshot = await window.firebase.firestore.getDocs(query);
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No portals found</p>
                    <p>${currentUser.email === 'admin@ahmedtech.com' ? 
                        'Add your first portal using the button above' : 
                        'You haven\'t added any portals yet'}</p>
                </div>`;
            return;
        }
        
        let html = '<div class="portals-grid">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            
            html += `
                <div class="portal-card">
                    <h4>${data.name}</h4>
                    <p><strong>Server:</strong> ${data.server}</p>
                    <p><strong>MAC:</strong> ${data.mac}</p>
                    <p class="portal-meta">
                        <small>Added by: ${data.userEmail || 'Unknown'}</small><br>
                        <small>Date: ${createdAt.toLocaleDateString()}</small>
                    </p>
                    
                    ${(currentUser.email === 'admin@ahmedtech.com' || currentUser.uid === data.userId) ? `
                        <div class="portal-actions">
                            <button onclick="editPortal('${doc.id}', '${data.name}', '${data.server}', '${data.mac}')" 
                                    class="edit-btn">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="showDeleteModal('portal', '${doc.id}')" 
                                    class="delete-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load error:", error);
        container.innerHTML = '<div class="error">Error loading portals</div>';
    }
}

function editPortal(id, name, server, mac) {
    currentItemId = id;
    document.getElementById('portalName').value = name;
    document.getElementById('portalServer').value = server;
    document.getElementById('portalMac').value = mac;
    
    document.getElementById('portalForm').style.display = 'block';
    document.getElementById('portalFormTitle').textContent = 'Edit Portal';
    document.getElementById('savePortalBtn').style.display = 'none';
    document.getElementById('updatePortalBtn').style.display = 'inline-block';
}

async function updatePortal() {
    if (!currentUser || !currentItemId) return;
    
    const name = document.getElementById('portalName').value;
    const server = document.getElementById('portalServer').value;
    const mac = document.getElementById('portalMac').value;
    
    try {
        await window.firebase.firestore.updateDoc(
            window.firebase.firestore.doc(window.firebase.db, "portals", currentItemId),
            {
                name: name,
                server: server,
                mac: mac,
                updatedAt: window.firebase.firestore.serverTimestamp()
            }
        );
        
        showNotification("Portal updated successfully!");
        togglePortalForm();
        loadPortals();
        
    } catch (error) {
        console.error("Update error:", error);
        showNotification("Error updating portal", "error");
    }
}

// ==================== XTREAM SERVERS SECTION ====================

function toggleXtreamForm() {
    const form = document.getElementById('xtreamForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    
    document.getElementById('xtreamName').value = '';
    document.getElementById('xtreamServer').value = '';
    document.getElementById('xtreamUsername').value = '';
    document.getElementById('xtreamPassword').value = '';
    
    document.getElementById('saveXtreamBtn').style.display = 'inline-block';
    document.getElementById('updateXtreamBtn').style.display = 'none';
    currentItemId = null;
}

async function saveXtream() {
    if (!currentUser) {
        showNotification("Please login first", "error");
        return;
    }
    
    const name = document.getElementById('xtreamName').value;
    const server = document.getElementById('xtreamServer').value;
    const username = document.getElementById('xtreamUsername').value;
    const password = document.getElementById('xtreamPassword').value;
    
    if (!name || !server || !username || !password) {
        showNotification("Please fill all fields", "error");
        return;
    }
    
    try {
        const xtreamData = {
            name: name,
            server: server,
            username: username,
            password: password,
            userId: currentUser.uid,  // 🔐 معرف المستخدم المالك
            userEmail: currentUser.email,
            createdAt: window.firebase.firestore.serverTimestamp()
        };
        
        await window.firebase.firestore.addDoc(
            window.firebase.firestore.collection(window.firebase.db, "xtreamServers"),
            xtreamData
        );
        
        showNotification("Xtream server saved successfully!");
        toggleXtreamForm();
        loadXtreamServers();
        
    } catch (error) {
        console.error("Save error:", error);
        showNotification("Error saving server", "error");
    }
}

async function loadXtreamServers() {
    if (!currentUser) return;
    
    const container = document.getElementById('xtreamList');
    container.innerHTML = '<div class="loading">Loading servers...</div>';
    
    try {
        const serversRef = window.firebase.firestore.collection(window.firebase.db, "xtreamServers");
        
        let query;
        if (currentUser.email === 'admin@ahmedtech.com') {
            query = window.firebase.firestore.query(
                serversRef,
                window.firebase.firestore.orderBy("createdAt", "desc")
            );
        } else {
            query = window.firebase.firestore.query(
                serversRef,
                window.firebase.firestore.where("userId", "==", currentUser.uid),
                window.firebase.firestore.orderBy("createdAt", "desc")
            );
        }
        
        const querySnapshot = await window.firebase.firestore.getDocs(query);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="empty-state">No servers found</div>';
            return;
        }
        
        let html = '<div class="xtream-grid">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            
            html += `
                <div class="xtream-card">
                    <h4>${data.name}</h4>
                    <p><strong>Server:</strong> ${data.server}</p>
                    <p><strong>Username:</strong> ${data.username}</p>
                    <p><strong>Password:</strong> ••••••••</p>
                    <p class="xtream-meta">
                        <small>Added by: ${data.userEmail || 'Unknown'}</small><br>
                        <small>Date: ${createdAt.toLocaleDateString()}</small>
                    </p>
                    
                    ${(currentUser.email === 'admin@ahmedtech.com' || currentUser.uid === data.userId) ? `
                        <div class="xtream-actions">
                            <button onclick="editXtream('${doc.id}', '${data.name}', '${data.server}', '${data.username}', '${data.password}')" 
                                    class="edit-btn">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="showDeleteModal('xtream', '${doc.id}')" 
                                    class="delete-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load error:", error);
        container.innerHTML = '<div class="error">Error loading servers</div>';
    }
}

function editXtream(id, name, server, username, password) {
    currentItemId = id;
    document.getElementById('xtreamName').value = name;
    document.getElementById('xtreamServer').value = server;
    document.getElementById('xtreamUsername').value = username;
    document.getElementById('xtreamPassword').value = password;
    
    document.getElementById('xtreamForm').style.display = 'block';
    document.getElementById('xtreamFormTitle').textContent = 'Edit Xtream Server';
    document.getElementById('saveXtreamBtn').style.display = 'none';
    document.getElementById('updateXtreamBtn').style.display = 'inline-block';
}

async function updateXtream() {
    if (!currentUser || !currentItemId) return;
    
    const name = document.getElementById('xtreamName').value;
    const server = document.getElementById('xtreamServer').value;
    const username = document.getElementById('xtreamUsername').value;
    const password = document.getElementById('xtreamPassword').value;
    
    try {
        await window.firebase.firestore.updateDoc(
            window.firebase.firestore.doc(window.firebase.db, "xtreamServers", currentItemId),
            {
                name: name,
                server: server,
                username: username,
                password: password,
                updatedAt: window.firebase.firestore.serverTimestamp()
            }
        );
        
        showNotification("Xtream server updated successfully!");
        toggleXtreamForm();
        loadXtreamServers();
        
    } catch (error) {
        console.error("Update error:", error);
        showNotification("Error updating server", "error");
    }
}

// ==================== NAVIGATION & UTILITY FUNCTIONS ====================

function show(pageId) {
    document.querySelectorAll('.dashboard').forEach(page => {
        page.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // تحميل البيانات عند عرض الصفحة
    if (pageId === 'macs') {
        loadPortals();
    } else if (pageId === 'xtream') {
        loadXtreamServers();
    } else if (pageId === 'videos') {
        loadVideos();
    } else if (pageId === 'users') {
        loadUsers();
    }
}

function goBack() {
    show('dash');
}

function showDeleteModal(type, id) {
    currentAction = 'delete';
    currentItemId = id;
    
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    
    let itemName = '';
    if (type === 'portal') itemName = 'portal';
    if (type === 'xtream') itemName = 'Xtream server';
    if (type === 'video') itemName = 'video';
    if (type === 'user') itemName = 'user';
    
    message.textContent = `Are you sure you want to delete this ${itemName}?`;
    modal.classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    currentAction = null;
    currentItemId = null;
}

async function confirmDelete() {
    if (!currentAction || !currentItemId || !currentUser) return;
    
    try {
        let collectionName = '';
        if (currentAction.includes('portal')) collectionName = 'portals';
        if (currentAction.includes('xtream')) collectionName = 'xtreamServers';
        if (currentAction.includes('video')) collectionName = 'videos';
        if (currentAction.includes('user')) collectionName = 'users';
        
        // التحقق من الملكية قبل الحذف (ما عدا المدير)
        if (currentUser.email !== 'admin@ahmedtech.com') {
            const docRef = window.firebase.firestore.doc(window.firebase.db, collectionName, currentItemId);
            const docSnap = await window.firebase.firestore.getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().userId !== currentUser.uid) {
                showNotification("You don't have permission to delete this item", "error");
                closeDeleteModal();
                return;
            }
        }
        
        await window.firebase.firestore.deleteDoc(
            window.firebase.firestore.doc(window.firebase.db, collectionName, currentItemId)
        );
        
        showNotification("Item deleted successfully");
        
        // إعادة تحميل البيانات
        if (collectionName === 'portals') loadPortals();
        if (collectionName === 'xtreamServers') loadXtreamServers();
        if (collectionName === 'videos') loadVideos();
        if (collectionName === 'users') loadUsers();
        
        closeDeleteModal();
        
    } catch (error) {
        console.error("Delete error:", error);
        showNotification("Error deleting item", "error");
        closeDeleteModal();
    }
}

function showNotification(message, type = "success") {
    const notif = document.getElementById('notif');
    notif.textContent = message;
    notif.className = 'notif ' + type;
    notif.style.display = 'block';
    
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log("AHMEDTECH Portal initialized");
    
    // التحقق من حالة تسجيل الدخول
    if (window.firebase && window.firebase.auth) {
        window.firebase.authMethods.onAuthStateChanged(window.firebase.auth, (user) => {
            if (user) {
                currentUser = user;
                console.log("User auto-logged in:", user.email);
                
                // إذا كان المستخدم مسجلاً، أظهر لوحة التحكم مباشرة
                document.getElementById('auth').style.display = 'none';
                document.getElementById('dash').classList.remove('hidden');
                document.getElementById('welcomeUser').textContent = user.email.split('@')[0];
                
                // إذا كان مديراً، أظهر الأقسام الإدارية
                if (user.email === 'admin@ahmedtech.com') {
                    document.getElementById('adminSection').style.display = 'block';
                    document.getElementById('statsSection').style.display = 'block';
                    document.getElementById('settingsSection').style.display = 'block';
                    document.getElementById('addPortalBtn').style.display = 'inline-block';
                    document.getElementById('addXtreamBtn').style.display = 'inline-block';
                    document.getElementById('addVideoBtn').style.display = 'inline-block';
                }
            } else {
                console.log("No user logged in");
                // التأكد من عرض صفحة التسجيل
                document.getElementById('auth').style.display = 'block';
                document.getElementById('dash').classList.add('hidden');
            }
        });
    }
    
    // تحديث التاريخ والوقت
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        const timeStr = now.toLocaleTimeString('en-US', timeOptions);
        
        document.querySelectorAll('.current-date').forEach(el => {
            el.textContent = dateStr;
        });
        
        document.querySelectorAll('.current-time').forEach(el => {
            el.textContent = timeStr;
        });
    }
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// ==================== ADDITIONAL FUNCTIONS (PLACEHOLDERS) ====================

async function loadVideos() {
    // سيتم تنفيذها لاحقاً
    document.getElementById('videosList').innerHTML = '<div class="empty-state">Videos section coming soon</div>';
}

async function loadUsers() {
    if (!currentUser || currentUser.email !== 'admin@ahmedtech.com') return;
    
    const container = document.getElementById('userList');
    container.innerHTML = '<div class="loading">Loading users...</div>';
    
    try {
        const usersRef = window.firebase.firestore.collection(window.firebase.db, "users");
        const querySnapshot = await window.firebase.firestore.getDocs(usersRef);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="empty-state">No users found</div>';
            return;
        }
        
        let html = '<div class="users-grid">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const lastLogin = data.lastLogin?.toDate ? data.lastLogin.toDate().toLocaleString() : 'Never';
            
            html += `
                <div class="user-card">
                    <h4>${data.username || data.email}</h4>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Last Login:</strong> ${lastLogin}</p>
                    <p><strong>Role:</strong> ${data.isAdmin ? 'Admin' : 'User'}</p>
                    <div class="user-actions">
                        <button onclick="editUser('${doc.id}')" class="edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="showDeleteModal('user', '${doc.id}')" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load users error:", error);
        container.innerHTML = '<div class="error">Error loading users</div>';
    }
}

// دوال أخرى (يمكن تنفيذها لاحقاً)
function editUser(userId) {
    showNotification("User edit feature coming soon", "info");
}

function showForgotPasswordModal() {
    showNotification("Password reset feature coming soon", "info");
}

function resetPassword() {
    // سيتم تنفيذها لاحقاً
}

function searchKnowledge() {
    // سيتم تنفيذها لاحقاً
}

function sendChatMessage() {
    // سيتم تنفيذها لاحقاً
}

function createNewTicket() {
    // سيتم تنفيذها لاحقاً
}

// إغلاق مشغل الفيديو
function closeVideoPlayer() {
    document.getElementById('videoPlayer').classList.add('hidden');
}