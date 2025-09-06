// Variables globales de configuración
let firebaseConfig = null;
let ADMIN_UID = null;
let ADMIN_WHATSAPP_NUMBER = null;
let IMGBB_API_KEY = null;
let MIN_RECHARGE_AMOUNT = 5.00;
let isClaudeEnvironment = false;

// Función para inicializar configuración
// Función para inicializar configuración
function initializeConfig() {
    const appConfig = loadConfig();
    
    if (!appConfig) {
        // No hay configuración, mostrar formulario
        setTimeout(showInitialConfigForm, 100);
        return false;
    }

    // Usar configuración cargada
    firebaseConfig = appConfig.firebase;
    ADMIN_UID = appConfig.admin.uid;
    ADMIN_WHATSAPP_NUMBER = appConfig.admin.whatsappNumber;
    IMGBB_API_KEY = appConfig.imgbb.apiKey;
    MIN_RECHARGE_AMOUNT = appConfig.settings.minRechargeAmount;
    isClaudeEnvironment = appConfig.settings.isClaudeEnvironment;
    
    return true;
}

// Función para resetear configuración (agregar botón en configuración)
function resetConfiguration() {
    if (confirm('¿Estás seguro de que quieres resetear la configuración? Esto eliminará todas las credenciales guardadas.')) {
        localStorage.removeItem('streamingAdminConfig');
        location.reload();
    }
}

// Validar configuración
function validateConfig() {
    if (!firebaseConfig) {
        console.error('Firebase config no inicializado');
        return false;
    }

    const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId'];
    const missingFirebase = requiredFirebaseKeys.filter(key => !firebaseConfig[key]);
    
    if (missingFirebase.length > 0) {
        console.error('Configuración de Firebase incompleta. Faltan:', missingFirebase);
        return false;
    }

    if (!ADMIN_UID) {
        console.error('ADMIN_UID no configurado');
        return false;
    }

    return true;
}

// Función para mostrar formulario de configuración inicial
function showInitialConfigForm() {
    document.body.innerHTML = `
        <div id="configSetup" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
            <div style="max-width: 700px; background: white; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚙️</div>
                    <h1 style="color: #1e293b; margin-bottom: 1rem;">Configuración Inicial</h1>
                    <p style="color: #64748b;">Configura tus credenciales para comenzar a usar el sistema</p>
                </div>
                
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 1rem; margin-bottom: 2rem;">
                    <h4 style="color: #0c4a6e; margin-bottom: 0.5rem;">🎯 Modo Demo Disponible</h4>
                    <p style="color: #0c4a6e; margin: 0; font-size: 0.9rem;">
                        Si solo quieres probar el sistema, puedes usar el 
                        <button onclick="setupDemoMode()" style="background: #0ea5e9; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; cursor: pointer;">Modo Demo</button>
                    </p>
                </div>
                
                <form id="initialConfigForm">
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                            🔥 Firebase Configuration
                        </h3>
                        <input type="text" id="apiKey" placeholder="Firebase API Key *" required style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="authDomain" placeholder="Auth Domain (proyecto.firebaseapp.com) *" required style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="projectId" placeholder="Project ID *" required style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="storageBucket" placeholder="Storage Bucket" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="messagingSenderId" placeholder="Messaging Sender ID" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="appId" placeholder="App ID *" required style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                            👤 Admin Configuration
                        </h3>
                        <input type="text" id="adminUid" placeholder="Admin UID (de Firebase Auth) *" required style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                        <input type="text" id="whatsappNumber" placeholder="Número WhatsApp (ej: 593984952217)" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                            📷 ImgBB Configuration (opcional)
                        </h3>
                        <input type="text" id="imgbbKey" placeholder="ImgBB API Key (para subir comprobantes)" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    
                    <button type="submit" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 16px; border-radius: 8px; font-weight: 600; margin-top: 1rem; cursor: pointer; font-size: 1rem;">
                        💾 Guardar Configuración
                    </button>
                </form>
                
                <div style="margin-top: 2rem;">
                    <details style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
                        <summary style="cursor: pointer; font-weight: 600; color: #1e293b;">📖 ¿Cómo obtener estas credenciales?</summary>
                        <div style="margin-top: 1rem; color: #64748b; font-size: 0.9rem;">
                            <p><strong>Firebase:</strong></p>
                            <ol>
                                <li>Ve a <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a></li>
                                <li>Crea un proyecto nuevo</li>
                                <li>Ve a Project Settings → General → Your apps</li>
                                <li>Agrega una Web app y copia la configuración</li>
                            </ol>
                            <p><strong>ImgBB (opcional):</strong></p>
                            <ol>
                                <li>Ve a <a href="https://imgbb.com/api" target="_blank">ImgBB API</a></li>
                                <li>Crea una cuenta y obtén tu API key</li>
                            </ol>
                        </div>
                    </details>
                </div>
                
                <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
                        <strong>Nota:</strong> Esta configuración se guardará localmente en tu navegador. 
                        Para usarla en otro dispositivo, deberás configurarla nuevamente.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('initialConfigForm').addEventListener('submit', saveInitialConfig);
}

// Función para configurar modo demo
function setupDemoMode() {
    const demoConfig = {
        firebase: {
            apiKey: "demo-firebase-key",
            authDomain: "demo-project.firebaseapp.com",
            databaseURL: "https://demo-project-default-rtdb.firebaseio.com",
            projectId: "demo-project",
            storageBucket: "demo-project.firebasestorage.app",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:demo12345678901234"
        },
        admin: {
            uid: "demo-admin-uid",
            whatsappNumber: "593000000000"
        },
        imgbb: {
            apiKey: "demo-imgbb-key"
        },
        settings: {
            minRechargeAmount: 5.00,
            isClaudeEnvironment: true
        }
    };
    
    localStorage.setItem('streamingAdminConfig', JSON.stringify(demoConfig));
    
    // Mostrar mensaje de demo y recargar
    alert('Modo Demo activado. La aplicación se reiniciará con datos de prueba.');
    location.reload();
}

// Agregar botón de reset en la sección de configuración
function updateConfigUI() {
    const configSection = document.getElementById('config');
    if (configSection && !document.getElementById('resetConfigBtn')) {
        const resetButton = document.createElement('button');
        resetButton.id = 'resetConfigBtn';
        resetButton.className = 'btn btn-danger';
        resetButton.innerHTML = '<i class="fas fa-trash"></i> Resetear Configuración';
        resetButton.onclick = resetConfiguration;
        
        const configCard = configSection.querySelector('.card');
        if (configCard) {
            const cardBody = configCard.querySelector('.card-body');
            if (cardBody) {
                cardBody.appendChild(resetButton);
            }
        }
    }
}

// Modificar la función checkAuthState para agregar el botón de reset
const originalShowSection = showSection;
function showSection(sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'config') {
        setTimeout(updateConfigUI, 100);
    }
}


// Función para guardar configuración inicial
function saveInitialConfig(e) {
    e.preventDefault();
    
    const config = {
        firebase: {
            apiKey: document.getElementById('apiKey').value.trim(),
            authDomain: document.getElementById('authDomain').value.trim(),
            databaseURL: document.getElementById('authDomain').value.trim().replace('.firebaseapp.com', '-default-rtdb.firebaseio.com').replace('https://', 'https://'),
            projectId: document.getElementById('projectId').value.trim(),
            storageBucket: document.getElementById('storageBucket').value.trim() || document.getElementById('projectId').value.trim() + '.firebasestorage.app',
            messagingSenderId: document.getElementById('messagingSenderId').value.trim() || "123456789012",
            appId: document.getElementById('appId').value.trim()
        },
        admin: {
            uid: document.getElementById('adminUid').value.trim(),
            whatsappNumber: document.getElementById('whatsappNumber').value.trim() || '593000000000'
        },
        imgbb: {
            apiKey: document.getElementById('imgbbKey').value.trim() || 'demo-imgbb-key'
        },
        settings: {
            minRechargeAmount: 5.00,
            isClaudeEnvironment: false
        }
    };
    
    // Validaciones básicas
    if (!config.firebase.apiKey || !config.firebase.authDomain || !config.firebase.projectId || !config.firebase.appId) {
        alert('Por favor completa todos los campos obligatorios de Firebase (marcados con *)');
        return;
    }
    
    if (!config.admin.uid) {
        alert('Por favor ingresa el UID del administrador');
        return;
    }
    
    // Guardar en localStorage
    localStorage.setItem('streamingAdminConfig', JSON.stringify(config));
    
    // Mostrar mensaje de éxito y recargar
    alert('Configuración guardada exitosamente. La aplicación se reiniciará.');
    location.reload();
}

// Función para cargar configuración desde localStorage o mostrar formulario
function loadConfig() {
    // Intentar cargar configuración guardada
    const savedConfig = localStorage.getItem('streamingAdminConfig');
    
    if (savedConfig) {
        try {
            return JSON.parse(savedConfig);
        } catch (error) {
            console.error('Error al cargar configuración guardada:', error);
            localStorage.removeItem('streamingAdminConfig');
        }
    }
    
    return null;
}

// REGLAS PARA PRUEBAS (NO EN PRODUCCIá“N)
// Estas reglas permiten acceso de lectura y escritura solo al administrador.
// Para un entorno de producción, necesitará­as reglas más granulares y seguras.
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Reglas para colecciones de administrador (solo admin puede leer/escribir)
//     match /{collection}/{document} {
//       allow read, write: if request.auth != null && request.auth.uid == 'TU_ADMIN_UID' &&
//                          (collection == 'accounts' || collection == 'clients' || 
//                           collection == 'sales' || collection == 'expenses' || 
//                           collection == 'rechargeRequests' || collection == 'services');
//     }
//
//     // Reglas para la colección 'users' (clientes web)
//     match /users/{userId} {
//       // Un usuario puede leer y escribir su propio documento
//       allow read, update: if request.auth != null && request.auth.uid == userId;
//       // Un usuario puede crear su propio documento al registrarse
//       allow create: if request.auth != null && request.auth.uid == userId;
//       // El administrador puede leer y escribir cualquier documento de usuario
//       allow read, write: if request.auth != null && request.auth.uid == 'TU_ADMIN_UID';
//
//       // Reglas para subcolección 'transactions' dentro de 'users'
//       match /transactions/{transactionId} {
//         // Un usuario puede leer sus propias transacciones
//         allow read: if request.auth != null && request.auth.uid == userId;
//         // El administrador puede leer y escribir transacciones de cualquier usuario
//         allow read, write: if request.auth != null && request.auth.uid == 'TU_ADMIN_UID';
//       }
//     }
//   }
// }


// ============= VARIABLES GLOBALES =============
let db; // Instancia de Firestore
let auth; // Instancia de Firebase Auth
let accounts = [];
let services = [];
let clients = []; // Clientes del admin (manuales)
let sales = [];
let users = []; // Clientes del portal web (ahora 'users' en Firestore)
let expenses = [];
let rechargeRequests = []; // Solicitudes de recarga
let currentUser = null; // Usuario logeado (admin o cliente web)
let financialManager = null;
let userManager = null;
let rechargeManager = null;

// ============= SISTEMA DE TIMEOUT DE SESIÓN =============
let inactivityTimer = null;
let warningTimer = null;
const INACTIVITY_TIME = 60000; // 1 minuto en milisegundos
const WARNING_TIME = 45000; // 45 segundos para mostrar advertencia
let isWarningShown = false;


// Función para detectar si hay conexión a internet
function isOnline() {
    return navigator.onLine;
}

// ============= HELPERS GENERALES =============
function sanitizeInput(input) {
    if (typeof input !== "string") return input;
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

function escapeHTML(unsafe) {
    if (typeof unsafe !== "string") {
        if (unsafe === null || unsafe === undefined) return "";
        return String(unsafe);
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .trim();
}

function formatEcuadorianPhone(phone) {
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("593")) {
        phone = phone.substring(3);
    }
    if (!phone.startsWith("0")) {
        phone = "0" + phone;
    }
    if (phone.length !== 10) {
        return null;
    }
    return phone;
}

function normalizeDate(value) {
    if (!value) return new Date(0); // fecha mínima
    if (typeof value.toDate === "function") return value.toDate(); // Timestamp de Firestore
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return new Date(0);
}

function getFirebaseErrorMessage(error) {
    let errorMessage = 'Error de autenticación';
    let helpMessage = '';

    switch (error.code) {
        case 'auth/network-request-failed':
            errorMessage = 'Error de conexión.';
            helpMessage = 'Verifica tu conexión a internet.';
            break;
        case 'auth/user-not-found':
            errorMessage = 'Usuario no encontrado.';
            helpMessage = 'Verifica tu email.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta.';
            helpMessage = 'Verifica tu Contraseña.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'Email inválido.';
            helpMessage = 'Verifica que el email tenga formato correcto.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos.';
            helpMessage = 'Espera unos minutos antes de intentar nuevamente.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'El email ya está registrado.';
            helpMessage = 'Intenta iniciar sesión o usa otro email.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Contraseña debil.';
            helpMessage = 'La Contraseña debe tener al menos 6 caracteres.';
            break;
        case 'permission-denied':
        case 'FirebaseError': // General FirebaseError for Firestore permissions
            errorMessage = 'Permiso denegado.';
            helpMessage = 'No tienes los permisos necesarios para realizar esta acción. Contacta al administrador.';
            break;
        default:
            errorMessage = error.message;
            helpMessage = 'Contacta a soporte si el problema persiste.';
    }
    return errorMessage + (helpMessage ? '\n\n💡' + helpMessage : '');
}

// ============= SISTEMA DE MODALES =============
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.lastFocusedElement = null;
        this.overlay = document.getElementById('modal-overlay') || this._createOverlay();
        this._debouncing = false;
        this._debounceMs = 300;
        this._autoCloseOnSubmit = true;
        this._resolveForm = null;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.activeModal) this.close(); });
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    }

    _createOverlay() {
        const el = document.createElement('div');
        el.id = 'modal-overlay';
        document.body.appendChild(el);
        return el;
    }

    _debounce() {
        if (this._debouncing) return true;
        this._debouncing = true;
        setTimeout(() => this._debouncing = false, this._debounceMs);
        return false;
    }

    open(content, { size = 'medium', ariaLabel = 'Diálogo' } = {}) {
        if (this._debounce()) return null;
        if (this.activeModal) this.close();
        this.lastFocusedElement = document.activeElement;
        this.overlay.innerHTML = `<div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${ariaLabel}" tabindex="-1">${content}</div>`;
        document.body.classList.add('modal-open');
        this.overlay.classList.add('show');
        const modal = this.overlay.querySelector('.modal');
        setTimeout(() => modal?.focus(), 0);
        this.activeModal = modal;
        this._trapFocus();
        document.body.style.overflow = 'hidden';
        return modal;
    }

    _trapFocus() {
        const modal = this.activeModal;
        if (!modal) return;
        const selectors = ['a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
        const focusables = [...modal.querySelectorAll(selectors.join(','))].filter(el => !el.disabled);
        if (focusables.length === 0) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        modal.addEventListener('keydown', handleTab);
        modal._releaseTrap = () => modal.removeEventListener('keydown', handleTab);
    }

    close() {
        if (!this.activeModal) return;
        const modal = this.activeModal;
        modal._releaseTrap?.();
        this.overlay.classList.remove('show');
        this.overlay.innerHTML = '';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        this.lastFocusedElement?.focus?.();
        this.activeModal = null;
    }

    form(config, title, options = {}) {
        this._autoCloseOnSubmit = options.autoClose !== false;
        const inputs = (config.fields || []).map(f => this.createFormField(f)).join('');
        const content = `
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" type="button" onclick="modal.close()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="modal-form" aria-label="${title}">
                            ${inputs}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" type="button" onclick="modal.close(); modal.resolveForm(null);">Cancelar</button>
                        <button class="btn btn-primary" type="button" onclick="modal.submitForm()">Enviar</button>
                    </div>
                `;
        return new Promise((resolve) => {
            this._resolveForm = resolve;
            this.open(content, { size: config.size || 'medium', ariaLabel: title });
        });
    }

    createFormField(field) {
        const type = field.type || 'text';
        const name = field.name || '';
        const id = field.id || name;
        const required = field.required ? 'required' : '';
        const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
        const value = field.value !== undefined ? `value="${escapeHTML(String(field.value))}"` : '';
        const min = field.min !== undefined ? `min="${field.min}"` : '';
        const max = field.max !== undefined ? `max="${field.max}"` : '';
        const step = field.step !== undefined ? `step="${field.step}"` : '';
        const accept = field.accept !== undefined ? `accept="${field.accept}"` : '';

        if (type === 'html') return field.value || '';
        if (type === 'select') {
            const opts = (field.options || []).map(o => `<option value="${escapeHTML(o.value)}" ${field.value === o.value ? 'selected' : ''}>${escapeHTML(o.text)}</option>`).join('');
            return `<div class="form-group"><label for="${id}">${escapeHTML(field.label || '')}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label><select class="form-control" name="${name}" id="${id}" ${required}>${opts}</select></div>`;
        }
        if (type === 'textarea') {
            return `<div class="form-group"><label for="${id}">${escapeHTML(field.label || '')}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label><textarea class="form-control" name="${name}" id="${id}" ${placeholder} ${required}>${escapeHTML(field.value || '')}</textarea></div>`;
        }
        if (type === 'file') {
            return `<div class="form-group"><label for="${id}">${escapeHTML(field.label || '')}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label><input type="file" class="form-control" name="${name}" id="${id}" ${required} ${accept}></div>`;
        }
        return `<div class="form-group"><label for="${id}">${escapeHTML(field.label || '')}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label><input type="${type}" class="form-control" name="${name}" id="${id}" ${placeholder} ${value} ${required} ${min} ${max} ${step}></div>`;
    }

    submitForm() {
        const form = document.getElementById('modal-form');
        if (!form) return;
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'proof') { // Special handling for file input
                data[key] = form.querySelector('#proof').files[0];
            } else {
                data[key] = value;
            }
        }

        if (this._autoCloseOnSubmit) this.close();
        if (typeof this._resolveForm === 'function') {
            const resolveFn = this._resolveForm;
            this._resolveForm = null;
            resolveFn(data);
        }
    }

    toast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toastNotification');
        const msg = document.getElementById('toastMessage');
        const icon = document.getElementById('toastIcon');
        if (!toast || !msg || !icon) return;

        toast.classList.remove('success', 'error', 'warning', 'info');
        icon.className = ''; // Clear previous icon

        switch (type) {
            case 'success':
                toast.classList.add('success');
                icon.classList.add('fas', 'fa-check-circle');
                break;
            case 'error':
                toast.classList.add('error');
                icon.classList.add('fas', 'fa-times-circle');
                break;
            case 'warning':
                toast.classList.add('warning');
                icon.classList.add('fas', 'fa-exclamation-triangle');
                break;
            default:
                toast.classList.add('info');
                icon.classList.add('fas', 'fa-info-circle');
                break;
        }

        msg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, duration);
    }

    alert(message, title = 'Información', type = 'info') {
        const content = `<div class="modal-header"><h3>${title}</h3><button class="modal-close" type="button" onclick="modal.close()">&times;</button></div><div class="modal-body"><p>${message}</p></div><div class="modal-footer"><button class="btn btn-primary" type="button" onclick="modal.close()">Entendido</button></div>`;
        this.open(content, { size: 'small', ariaLabel: title });
        // Optionally, you could add a toast here too, but alert is usually for more critical info.
    }

    confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const content = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" type="button" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" type="button" id="modalCancelBtn">Cancelar</button>
                <button class="btn btn-danger" type="button" id="modalConfirmBtn">Confirmar</button>
            </div>
        `;

            this.open(content, { size: 'small', ariaLabel: title });

            // Esperar que el contenido esté en el DOM
            // Por ejemplo, buscar el contenedor modal por clase
            const modalContainer = document.querySelector('.modal');

            if (!modalContainer) {
                console.error('No se encontró el contenedor del modal');
                return;
            }

            const closeBtn = modalContainer.querySelector('#modalCloseBtn');
            const cancelBtn = modalContainer.querySelector('#modalCancelBtn');
            const confirmBtn = modalContainer.querySelector('#modalConfirmBtn');

            closeBtn.onclick = () => {
                this.close();
                resolve(false);
            };

            cancelBtn.onclick = () => {
                this.close();
                resolve(false);
            };

            confirmBtn.onclick = () => {
                this.close();
                resolve(true);
            };
        });

    }
}
const modal = new ModalManager();

// ============= SISTEMA FINANCIERO (ADMIN) =============
class FinancialManager {
    constructor() {
        this.expenses = [];
    }

    calculateFinancialMetrics() {
        const metrics = {
            totalInvestment: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            averageROI: 0
        };

        accounts.forEach(account => {
            metrics.totalInvestment += parseFloat(account.acquisitionCost) || 0;

            const accountSales = sales.filter(sale => sale.accountId === account.id);
            const accountRevenue = accountSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
            account.totalEarned = accountRevenue;
        });

        metrics.totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);

        metrics.totalExpenses = this.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

        metrics.netProfit = metrics.totalRevenue - metrics.totalInvestment - metrics.totalExpenses;

        if (metrics.totalInvestment > 0) {
            metrics.averageROI = ((metrics.netProfit / metrics.totalInvestment) * 100);
        }

        return metrics;
    }

    updateFinancialDashboard() {
        const metrics = this.calculateFinancialMetrics();

        this.updateElement('netProfit', `$${metrics.netProfit.toFixed(2)}`);
        this.updateElement('totalInvestment', `$${metrics.totalInvestment.toFixed(2)}`);
        this.updateElement('financialTotalRevenue', `$${metrics.totalRevenue.toFixed(2)}`);
        this.updateElement('averageROI', `${metrics.averageROI.toFixed(1)}%`);

        this.updateTopPerformingAccounts();
        this.updateUpcomingRenewals();
        this.updateGeneralSummary();
        this.renderFinancialAccountsTable();
        this.renderExpensesTable();
        this.updateExpensesSummary();
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    getTopPerformingAccounts(limit = 5) {
        return accounts
            .map(account => ({
                ...account,
                profit: (account.totalEarned || 0) - (parseFloat(account.acquisitionCost) || 0),
                roi: (parseFloat(account.acquisitionCost) || 0) > 0 ?
                    (((account.totalEarned || 0) - (parseFloat(account.acquisitionCost) || 0)) / (parseFloat(account.acquisitionCost) || 0) * 100) : 0
            }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, limit);
    }

    getLosingAccounts() {
        return accounts
            .map(account => ({
                ...account,
                profit: (account.totalEarned || 0) - (parseFloat(account.acquisitionCost) || 0)
            }))
            .filter(account => account.profit < 0)
            .sort((a, b) => a.profit - b.profit);
    }

    updateTopPerformingAccounts() {
        const topAccounts = this.getTopPerformingAccounts(3);
        const container = document.getElementById('topProfitableAccounts');

        if (!container) return;

        if (topAccounts.length === 0 || topAccounts.every(acc => acc.profit === 0)) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-info-circle" aria-hidden="true"></i> Agrega cuentas con costos para ver análisis</div>';
            return;
        }

        container.innerHTML = topAccounts.map(account => `
                    <div class="account-profit-item">
                        <div>
                            <strong><i class="fas fa-play-circle" aria-hidden="true"></i> ${escapeHTML(account.platform)}</strong><br>
                            <small>${escapeHTML(account.email)}</small>
                        </div>
                        <div class="profit-info">
                            <div class="profit">$${account.profit.toFixed(2)}</div>
                            <div class="roi">${account.roi.toFixed(1)}% ROI</div>
                        </div>
                    </div>
                `).join('');

        const losingAccounts = this.getLosingAccounts();
        const losingContainer = document.getElementById('losingAccounts');

        if (!losingContainer) return;

        if (losingAccounts.length === 0) {
            losingContainer.innerHTML = '<div class="no-data"><i class="fas fa-check-circle" aria-hidden="true"></i> Â¡Todas las cuentas son rentables!</div>';
        } else {
            losingContainer.innerHTML = losingAccounts.map(account => `
                        <div class="account-profit-item loss">
                            <div>
                                <strong><i class="fas fa-play-circle" aria-hidden="true"></i> ${escapeHTML(account.platform)}</strong><br>
                                <small>${escapeHTML(account.email)}</small>
                            </div>
                            <div class="loss-info">
                                <div class="loss">-$${Math.abs(account.profit).toFixed(2)}</div>
                                <div class="status">Pérdida</div>
                            </div>
                        </div>
                    `).join('');
        }
    }

    getUpcomingRenewals(days = 30) {
        const now = new Date();

        return accounts
            .filter(account => account.renewalDate)
            .map(account => ({
                ...account,
                daysUntilRenewal: Math.ceil((new Date(account.renewalDate) - now) / (1000 * 60 * 60 * 24))
            }))
            .filter(account => account.daysUntilRenewal <= days && account.daysUntilRenewal >= 0)
            .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
    }

    updateUpcomingRenewals() {
        const renewals = this.getUpcomingRenewals();
        const container = document.getElementById('upcomingRenewals');

        if (!container) return;

        if (renewals.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-calendar-check" aria-hidden="true"></i> No hay renovaciones próximas</div>';
            return;
        }

        container.innerHTML = renewals.map(renewal => `
                    <div class="renewal-item ${renewal.daysUntilRenewal <= 3 ? 'urgent' : ''}">
                        <div>
                            <strong><i class="fas fa-play-circle" aria-hidden="true"></i> ${escapeHTML(renewal.platform)}</strong><br>
                            <small>${escapeHTML(renewal.email)}</small>
                        </div>
                        <div class="renewal-info">
                            <div class="cost">$${parseFloat(renewal.renewalCost || 0).toFixed(2)}</div>
                            <div class="days">${renewal.daysUntilRenewal} días</div>
                        </div>
                    </div>
                `).join('');
    }

    updateGeneralSummary() {
        const container = document.getElementById('generalSummary');
        if (!container) return;

        const totalAccounts = accounts.length;
        const rentableAccounts = accounts.filter(acc =>
            (acc.totalEarned || 0) > (parseFloat(acc.acquisitionCost) || 0)
        ).length;
        const totalClients = users.length;
        const totalSales = sales.length;
        const activeSales = sales.filter(sale => sale.status === 'Activa').length;

        container.innerHTML = `
                    <div class="summary-stats">
                        <div class="summary-item">
                            <span class="label"><i class="fas fa-tv" aria-hidden="true"></i> Total de cuentas:</span>
                            <span class="value">${totalAccounts}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label"><i class="fas fa-chart-line" aria-hidden="true"></i> Cuentas rentables:</span>
                            <span class="value">${rentableAccounts}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label"><i class="fas fa-users" aria-hidden="true"></i> Total de clientes web:</span>
                            <span class="value">${totalClients}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label"><i class="fas fa-shopping-cart" aria-hidden="true"></i> Ventas realizadas:</span>
                            <span class="value">${totalSales}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label"><i class="fas fa-check-circle" aria-hidden="true"></i> Ventas activas:</span>
                            <span class="value">${activeSales}</span>
                        </div>
                    </div>
                `;
    }

    showFinanceTab(tabName, event) {
        document.querySelectorAll('.finance-tab-content').forEach(content => {
            content.classList.remove('active');
            content.setAttribute('hidden', 'true');
        });

        document.querySelectorAll('.finance-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        const targetTab = document.getElementById(`finance-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.removeAttribute('hidden');
        }

        const clickedButton = event.currentTarget;
        if (clickedButton) {
            clickedButton.classList.add('active');
            clickedButton.setAttribute('aria-selected', 'true');
        }

        switch (tabName) {
            case 'accounts':
                this.renderFinancialAccountsTable();
                break;
            case 'expenses':
                this.renderExpensesTable();
                this.updateExpensesSummary();
                break;
            case 'overview':
                this.updateTopPerformingAccounts();
                this.updateUpcomingRenewals();
                this.updateGeneralSummary();
                break;
            case 'reports':
                break;
        }
    }

    renderFinancialAccountsTable() {
        const tbody = document.querySelector('#financialAccountsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        accounts.forEach(account => {
            const totalEarned = account.totalEarned || 0;
            const acquisitionCost = parseFloat(account.acquisitionCost) || 0;
            const profit = totalEarned - acquisitionCost;
            const roi = acquisitionCost > 0 ? ((profit / acquisitionCost) * 100) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                        <td><i class="fas fa-play-circle" aria-hidden="true"></i> ${escapeHTML(account.platform)}</td>
                        <td>${escapeHTML(account.email)}</td>
                        <td>$${acquisitionCost.toFixed(2)}</td>
                        <td>$${totalEarned.toFixed(2)}</td>
                        <td class="${profit >= 0 ? 'profit' : 'loss'}">$${profit.toFixed(2)}</td>
                        <td class="${roi >= 0 ? 'positive' : 'negative'}">${roi.toFixed(1)}%</td>
                        <td>
                            <span class="status-badge ${profit >= 0 ? 'available' : 'unavailable'}">
                                ${profit >= 0 ? 'Rentable' : 'Con pérdida'}
                            </span>
                        </td>
                    `;
            tbody.appendChild(row);
        });
    }

    openAddExpenseModal() {
        const formConfig = {
            fields: [
                {
                    type: 'select',
                    name: 'type',
                    label: 'Tipo de Gasto',
                    required: true,
                    options: [
                        { value: '', text: 'Seleccionar tipo...' },
                        { value: 'renewal', text: 'Renovación de cuenta' },
                        { value: 'acquisition', text: 'Compra de cuenta nueva' },
                        { value: 'operational', text: 'Gasto operacional' },
                        { value: 'other', text: 'Otros' }
                    ]
                },
                { type: 'text', name: 'description', label: 'Descripción', required: true },
                { type: 'number', name: 'amount', label: 'Monto ($)', required: true, placeholder: '0.00', step: '0.01', min: '0' },
                { type: 'date', name: 'date', label: 'Fecha', required: true, value: new Date().toISOString().split('T')[0] },
                { type: 'text', name: 'category', label: 'Categorá­a', placeholder: 'Ej: Suscripciones, Herramientas, etc.' }
            ]
        };

        modal.form(formConfig, 'Agregar Nuevo Gasto').then(async data => {
            if (data) {
                await this.addExpense(data);
            }
        });
    }

    async addExpense(expenseData) {
        const description = sanitizeInput(expenseData.description);
        const category = sanitizeInput(expenseData.category || 'General');

        const expense = {
            id: Date.now().toString(),
            type: expenseData.type,
            description: description,
            amount: parseFloat(expenseData.amount),
            date: expenseData.date,
            category: category,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        this.expenses.push(expense);

        try {
            await db.collection('expenses').doc(expense.id).set(expense);
            modal.toast('Gasto agregado correctamente', 'success');
        } catch (error) {
            console.error('Error saving expense to Firebase:', error);
            modal.toast('Error al guardar el gasto en la nube.', 'error');
        }

        this.renderExpensesTable();
        this.updateExpensesSummary();
        this.updateFinancialDashboard();
    }

    async loadExpensesFromFirebase() {
        if (db) {
            try {
                const expensesSnapshot = await db.collection('expenses').orderBy('createdAt', 'desc').get();
                this.expenses = [];
                expensesSnapshot.forEach((doc) => {
                    this.expenses.push({ id: doc.id, ...doc.data() });
                });
                console.log('✅ Gastos cargados desde Firebase correctamente.');
            } catch (error) {
                console.error('❌ Error al cargar gastos desde Firebase:', error);
                modal.toast('Error al cargar gastos desde la nube.', 'error');
            }
        }
    }

    renderExpensesTable() {
        const tbody = document.querySelector('#expensesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const sortedExpenses = this.expenses.sort(
            (a, b) => normalizeDate(b.createdAt) - normalizeDate(a.createdAt)
        );

        if (sortedExpenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay gastos registrados.</td></tr>';
            return;
        }

        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            const createdAtDate = normalizeDate(expense.createdAt);

            row.innerHTML = `
                        <td>${createdAtDate.toLocaleDateString()}</td>
                        <td>${escapeHTML(expense.description || "")}</td>
                        <td>$${(expense.amount || 0).toFixed(2)}</td>
                        <td><span class="status-badge">${escapeHTML(expense.category || "Sin categorá­a")}</span></td>
                        <td>
                            <button class="btn btn-danger btn-sm" 
                                    onclick="financialManager.deleteExpense('${expense.id}')"
                                    aria-label="Eliminar gasto ${escapeHTML(expense.description || "")}" 
                                    tabindex="0">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </td>
                    `;
            tbody.appendChild(row);
        });
    }

    updateExpensesSummary() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = normalizeDate(expense.createdAt);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        }).reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

        const yearlyExpenses = this.expenses.filter(expense => {
            const expenseDate = normalizeDate(expense.createdAt);
            return expenseDate.getFullYear() === currentYear;
        }).reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

        this.updateElement('monthlyExpenses', `$${monthlyExpenses.toFixed(2)}`);
        this.updateElement('yearlyExpenses', `$${yearlyExpenses.toFixed(2)}`);
    }

    async deleteExpense(id) {
        const confirmed = await modal.confirm('Â¿Estás seguro de que deseas eliminar este gasto?');
        if (confirmed) {
            try {
                this.expenses = this.expenses.filter(expense => expense.id !== id);
                await db.collection('expenses').doc(id).delete();
                this.renderExpensesTable();
                this.updateExpensesSummary();
                this.updateFinancialDashboard();
                modal.toast('Gasto eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error deleting expense:', error);
                modal.toast(`Error al eliminar el gasto: ${error.message}`, 'error');
            }
        }
    }

    generateMonthlyReport() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthSales = sales.filter(sale => {
            const saleDate = new Date(sale.startDate);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        });

        const monthlyRevenue = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);

        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = normalizeDate(expense.createdAt);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        }).reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

        const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

        const activeAccounts = accounts.filter(acc => acc.status === 'Disponible').length;
        const occupiedAccounts = accounts.filter(acc => acc.status === 'Ocupado').length;
        const unavailableAccounts = accounts.filter(acc => acc.status === 'No disponible').length;

        const reportContent = `
                    <p><strong>Mes:</strong> ${new Date(currentYear, currentMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    <p><strong>Ingresos Totales:</strong> $${monthlyRevenue.toFixed(2)}</p>
                    <p><strong>Gastos Totales:</strong> $${monthlyExpenses.toFixed(2)}</p>
                    <p><strong>Ganancia Neta:</strong> $${monthlyNetProfit.toFixed(2)}</p>
                    <br>
                    <p><strong>Cuentas Disponibles:</strong> ${activeAccounts}</p>
                    <p><strong>Cuentas Ocupadas:</strong> ${occupiedAccounts}</p>
                    <p><strong>Cuentas No Disponibles:</strong> ${unavailableAccounts}</p>
                `;

        modal.alert(reportContent, 'Reporte Mensual', 'info');
    }

    generateAccountReport() {
        modal.alert('Generando reporte por cuentas... (Funcionalidad en desarrollo)', 'Reporte por Cuentas', 'info');
    }
}


function listenUserNotifications(uid) {
    if (!db) {
        console.warn('Firestore no inicializado para notificaciones.');
        return;
    }
    db.collection('users').doc(uid).collection('notifications')
        .where('read', '==', false)
        .onSnapshot(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                modal.toast(data.message, data.type || 'info');
                // Marca como leído
                doc.ref.update({ read: true })
                    .then(() => console.log('Notificación marcada como leída:', doc.id))
                    .catch(error => console.error('Error al marcar la notificación como leída:', error));
            });
        }, error => {
            console.error('Error al escuchar las notificaciones:', error);
        });
}

// ============= GESTIá“N DE USUARIOS (ADMIN) =============
class UserManager {
    constructor() {
        this.allUsers = []; // Todos los usuarios
        this.filteredUsers = [];
        this.initAdminButtonLock();
    }

    // ðŸ”¹ Bloquear botones hasta que admin esté listo
    initAdminButtonLock() {
        document.querySelectorAll('.btn-admin').forEach(btn => btn.disabled = true);
        firebase.auth().onAuthStateChanged(user => {
            if (user && user.uid === ADMIN_UID) {
                document.querySelectorAll('.btn-admin').forEach(btn => btn.disabled = false);
            }
        });
    }

    // ðŸ”¹ Cargar todos los usuarios desde Firestore
    async loadAllUsers() {
        if (!db || !currentUser || currentUser.uid !== ADMIN_UID) {
            console.warn('âš ï¸ Solo el administrador puede cargar todos los usuarios.');
            return;
        }
        try {
            const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
            this.allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.filterAndSortUsers();
            console.log('✅ Usuarios cargados desde Firebase correctamente.');
        } catch (error) {
            console.error('âŒ Error al cargar usuarios desde Firebase:', error);
            modal.toast('Error al cargar usuarios desde la nube.', 'error');
        }
    }

    filterAndSortUsers() {
        const searchTerm = document.getElementById('clientSearchInput')?.value?.toLowerCase() || '';
        const sortBy = document.getElementById('clientSortBy')?.value || 'name';
        const sortOrder = document.getElementById('clientSortOrder')?.value || 'asc';

        this.filteredUsers = this.allUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchTerm))
        );

        this.filteredUsers.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'balance') {
                valA = a.balance || 0;
                valB = b.balance || 0;
            } else if (sortBy === 'createdAt') {
                valA = normalizeDate(a.createdAt);
                valB = normalizeDate(b.createdAt);
            } else {
                valA = a[sortBy]?.toLowerCase() || '';
                valB = b[sortBy]?.toLowerCase() || '';
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderAllUsersTable();
    }

    renderAllUsersTable() {
        const tbody = document.querySelector('#allClientsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay usuarios registrados que coincidan con la búsqueda.</td></tr>';
            return;
        }

        this.filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(user.name)} ${escapeHTML(user.lastName || '')}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>$${(user.balance || 0).toFixed(2)}</td>
                <td>${normalizeDate(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-admin" onclick="userManager.openBalanceModal('${user.id}')" title="Gestionar Saldo"><i class="fas fa-wallet"></i></button>
                    <button class="btn btn-info btn-sm btn-admin" onclick="userManager.viewBalanceHistory('${user.id}')" title="Ver Historial"><i class="fas fa-history"></i></button>
                    <button class="btn btn-warning btn-sm btn-admin" onclick="userManager.resetUserPassword('${user.id}', '${user.email}')" title="Resetear Contraseña"><i class="fas fa-key"></i></button>
                    <button class="btn btn-danger btn-sm btn-admin" onclick="userManager.deleteUser('${user.id}', '${user.email}')" title="Eliminar Usuario"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // ðŸ”¹ Modal para agregar o quitar saldo
    openBalanceModal(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        const formConfig = {
            fields: [
                { type: 'number', name: 'amount', label: 'Monto ($)', required: true, placeholder: '0.00', step: '0.01' },
                { type: 'select', name: 'type', label: 'Tipo de Transacción', required: true, options: [{ value: 'add', text: 'Agregar Saldo' }, { value: 'subtract', text: 'Quitar Saldo' }] },
                { type: 'textarea', name: 'comment', label: 'Comentario (opcional)', placeholder: 'Motivo de la transacción...' }
            ]
        };

        modal.form(formConfig, `Gestionar Saldo de ${user.name}`).then(async data => {
            if (!data) return;

            const amount = parseFloat(data.amount);
            const type = data.type;
            const comment = sanitizeInput(data.comment || '');

            if (isNaN(amount) || amount <= 0) {
                modal.alert('El monto debe ser un número positivo.', 'Error de Monto', 'error');
                return;
            }

            // ðŸ”¹ Esperar a que admin esté completamente autenticado
            await new Promise(resolve => {
                const check = setInterval(() => {
                    const currentAdmin = firebase.auth().currentUser;
                    if (currentAdmin && currentAdmin.uid === ADMIN_UID) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });

            await this.updateUserBalance(userId, amount, type, comment);
        });
    }

    // ðŸ”¹ Actualizar saldo del usuario y registrar transacción
    async updateUserBalance(userId, amount, type, comment) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            modal.toast('Usuario no encontrado.', 'error');
            return;
        }

        const userData = userDoc.data();
        let newBalance = userData.balance || 0;
        let transactionAmount = amount;
        let transactionType = type === 'add' ? 'Recarga' : 'Ajuste Negativo';

        if (type === 'add') newBalance += amount;
        else if (type === 'subtract') {
            newBalance -= amount;
            transactionAmount = -amount;
        }

        if (newBalance < 0) {
            modal.alert('El saldo no puede ser negativo.', 'Error de Saldo', 'error');
            return;
        }

        try {
            // Actualizar balance
            await userRef.update({ balance: newBalance });

            // Registrar transacción
            await userRef.collection('transactions').add({
                type: transactionType,
                amount: transactionAmount,
                comment: comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            modal.toast(`Saldo de ${userData.name} actualizado a $${newBalance.toFixed(2)}.`, 'success');
            await this.loadAllUsers(); // Recargar tabla

        } catch (error) {
            console.error('Error updating user balance:', error);
            modal.toast(`Error al actualizar saldo: ${error.message}`, 'error');
        }
    }

    // ðŸ”¹ Historial de saldo
    async viewBalanceHistory(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        let historyHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-history"></i> Historial de Transacciones de ${escapeHTML(user.name)}</h3>
                <button class="modal-close" type="button" onclick="modal.close()">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Saldo Actual:</strong> $${(user.balance || 0).toFixed(2)}</p>
                <hr>
                <div class="balance-history-list">
        `;

        try {
            const transactionsSnapshot = await db.collection('users').doc(userId).collection('transactions').orderBy('createdAt', 'desc').get();
            const transactions = transactionsSnapshot.docs.map(doc => doc.data());

            if (transactions.length === 0) {
                historyHtml += '<div class="no-data">No hay movimientos de saldo registrados.</div>';
            } else {
                transactions.forEach(entry => {
                    const amountClass = entry.amount >= 0 ? 'positive' : 'negative';
                    historyHtml += `
                        <div class="balance-history-item">
                            <div>
                                <span class="amount ${amountClass}">${entry.amount >= 0 ? '+' : ''}$${entry.amount.toFixed(2)}</span><br>
                                <span class="date">${normalizeDate(entry.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="comment">${escapeHTML(entry.comment || entry.type || 'Sin comentario')}</div>
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            historyHtml += '<div class="no-data">Error al cargar el historial de transacciones.</div>';
        }

        historyHtml += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" type="button" onclick="modal.close()">Cerrar</button>
            </div>
        `;

        modal.open(historyHtml, { size: 'medium' });
    }

    // ðŸ”¹ Resetear contraseá±a
    async resetUserPassword(userId, userEmail) {
        const confirmed = await modal.confirm(`Â¿Deseas resetear la contraseña de ${userEmail}? Se enviará un email al usuario.`, 'Resetear Contraseña');
        if (!confirmed) return;

        try {
            await auth.sendPasswordResetEmail(userEmail);
            modal.toast(`Email de restablecimiento enviado a ${userEmail}.`, 'success');
        } catch (error) {
            console.error('Error resetting password:', error);
            let msg = 'Error al resetear la contraseña.';
            if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
            modal.toast(msg, 'error');
        }
    }

    // ðŸ”¹ Eliminar usuario
    async deleteUser(userId, userEmail) {
        const confirmed = await modal.confirm(`Eliminar a ${userEmail}? Esto borrará su cuenta y transacciones. Acción irreversible.`, 'Confirmar Eliminación');
        if (!confirmed) return;

        try {
            await db.collection('users').doc(userId).delete();
            const transactionsRef = db.collection('users').doc(userId).collection('transactions');
            const transactionsSnapshot = await transactionsRef.get();
            const batch = db.batch();
            transactionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            modal.toast(`Usuario ${userEmail} eliminado correctamente.`, 'success');
            await this.loadAllUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            modal.toast(`Error al eliminar usuario: ${error.message}`, 'error');
        }
    }
}

// ============= GESTIá“N DE SOLICITUDES DE RECARGA (ADMIN) =============
class RechargeManager {
    constructor() {
        this.rechargeRequests = [];
    }

    async loadRechargeRequests() {
        if (!db || !currentUser || currentUser.uid !== ADMIN_UID) {
            console.warn('âš ï¸ Solo el administrador puede cargar solicitudes de recarga.');
            return;
        }
        try {
            const requestsSnapshot = await db.collection('rechargeRequests').orderBy('createdAt', 'desc').get();
            this.rechargeRequests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderRechargeRequests();
            console.log('✅ Solicitudes de recarga cargadas desde Firebase correctamente.');
        } catch (error) {
            console.error('âŒ Error al cargar solicitudes de recarga desde Firebase:', error);
            modal.toast('Error al cargar solicitudes de recarga desde la nube.', 'error');
        }
    }

    renderRechargeRequests() {
        const pendingContainer = document.getElementById('pendingRechargeRequests');
        const processedContainer = document.getElementById('processedRechargeRequests');

        if (!pendingContainer || !processedContainer) return;

        pendingContainer.innerHTML = '';
        processedContainer.innerHTML = '';

        const pending = this.rechargeRequests.filter(req => req.status === 'pending');
        const processed = this.rechargeRequests.filter(req => req.status !== 'pending');

        if (pending.length === 0) {
            pendingContainer.innerHTML = '<div class="no-data">No hay solicitudes de recarga pendientes.</div>';
        } else {
            pending.forEach(request => {
                pendingContainer.appendChild(this.createRequestCard(request));
            });
        }

        if (processed.length === 0) {
            processedContainer.innerHTML = '<div class="no-data">No hay historial de recargas.</div>';
        } else {
            processed.forEach(request => {
                processedContainer.appendChild(this.createRequestCard(request));
            });
        }
    }

    createRequestCard(request) {
        const card = document.createElement('div');
        card.className = 'recharge-request-item';

        const client = users.find(u => u.id === request.clientId);
        const clientName = client ? `${client.name} ${client.lastName || ''}` : 'Usuario Desconocido';
        const clientEmail = client ? client.email : 'N/A';

        const statusClass = {
            'pending': 'pending-approval',
            'approved': 'approved',
            'rejected': 'rejected'
        }[request.status];

        card.innerHTML = `
                    <div class="header">
                        <span>Solicitud de ${escapeHTML(clientName)}</span>
                        <span class="status-badge ${statusClass}">${escapeHTML(request.status)}</span>
                    </div>
                    <div class="details">
                        <div><strong>Monto:</strong> $${request.amount.toFixed(2)}</div>
                        <div><strong>Banco:</strong> ${escapeHTML(request.bank)}</div>
                        <div><strong>Email:</strong> ${escapeHTML(clientEmail)}</div>
                        <div><strong>Fecha:</strong> ${normalizeDate(request.createdAt).toLocaleString()}</div>
                        ${request.comment ? `<div><strong>Comentario:</strong> ${escapeHTML(request.comment)}</div>` : ''}
                        ${request.processedBy ? `<div><strong>Procesado por:</strong> ${escapeHTML(request.processedBy)}</div>` : ''}
                        ${request.processedAt ? `<div><strong>Fecha Proceso:</strong> ${normalizeDate(request.processedAt).toLocaleString()}</div>` : ''}
                    </div>
                    <div class="actions">
                        <a href="${escapeHTML(request.imageUrl)}" target="_blank" class="btn btn-info btn-sm">
                            <i class="fas fa-image" aria-hidden="true"></i> Ver Comprobante
                        </a>
                        ${request.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="rechargeManager.approveRequest('${request.id}', ${request.amount}, '${request.clientId}')">
                                <i class="fas fa-check" aria-hidden="true"></i> Aprobar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rechargeManager.rejectRequest('${request.id}')">
                                <i class="fas fa-times" aria-hidden="true"></i> Rechazar
                            </button>
                        ` : ''}
                    </div>
                `;
        return card;
    }

    async approveRequest(requestId, amount, clientId) {
        const confirmed = await modal.confirm(`Â¿Estás seguro de aprobar esta recarga de $${amount.toFixed(2)} para el cliente? Se agregará el saldo automáticamente.`, 'Aprobar Recarga');
        if (!confirmed) return;

        try {
            const requestRef = db.collection('rechargeRequests').doc(requestId);
            await requestRef.update({
                status: 'approved',
                processedBy: currentUser.email,
                processedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const userRef = db.collection('users').doc(clientId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + amount;
                await userRef.update({ balance: newBalance });

                await db.collection('users').doc(clientId).collection('transactions').add({
                    type: 'Recarga Aprobada',
                    amount: amount,
                    comment: `Recarga aprobada por admin. Solicitud ID: ${requestId}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                modal.toast(`Recarga aprobada y saldo de $${newBalance.toFixed(2)} agregado al cliente.`, 'success');

            } else {
                modal.toast('Cliente no encontrado, saldo no actualizado.', 'error');
            }

            await this.loadRechargeRequests();
            await userManager.loadAllUsers();
        } catch (error) {
            console.error('Error approving recharge request:', error);
            modal.toast(`Error al aprobar recarga: ${error.message}`, 'error');
        }
    }

    async rejectRequest(requestId) {
        const confirmed = await modal.confirm('Â¿Estás seguro de rechazar esta recarga? El saldo NO se agregará.', 'Rechazar Recarga');
        if (!confirmed) return;

        try {
            const requestRef = db.collection('rechargeRequests').doc(requestId);
            await requestRef.update({
                status: 'rejected',
                processedBy: currentUser.email,
                processedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            modal.toast('Recarga rechazada.', 'info');
            await this.loadRechargeRequests();
        } catch (error) {
            console.error('Error rejecting recharge request:', error);
            modal.toast(`Error al rechazar recarga: ${error.message}`, 'error');
        }
    }
}

// ============= INICIALIZACIÓN FIREBASE =============
async function initializeFirebase(config) {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        db = firebase.firestore();
        auth = firebase.auth();

        // ¡CAMBIO CRÍTICO! - No mantener sesión persistente en el navegador
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

        document.getElementById('configInfo').textContent = 'Estado: Firebase inicializado';

        // Inicializar sistema de timeout de sesión
        initInactivityTimeout();

        return true;
    } catch (error) {
        document.getElementById('configInfo').textContent = 'Error al inicializar Firebase';
        modal.toast('Error al inicializar Firebase. Verifica la configuración y conexión.', 'error');
        console.error('Error al inicializar Firebase:', error);
        return false;
    }
}

function testFirebaseConnection() {
    if (!firebaseConfig) {
        initializeConfig();
    }
    initializeFirebase(firebaseConfig);
}

// ============= SISTEMA DE TIMEOUT DE INACTIVIDAD =============
function initInactivityTimeout() {
    // Eventos que resetean el timer de inactividad
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Función para resetear el timer
    function resetInactivityTimer() {
        // Solo si hay un usuario logueado
        if (!currentUser) return;

        // Limpiar timers existentes
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (warningTimer) clearTimeout(warningTimer);

        isWarningShown = false;

        // Timer de advertencia (45 segundos)
        warningTimer = setTimeout(() => {
            if (currentUser && !isWarningShown) {
                showInactivityWarning();
            }
        }, WARNING_TIME);

        // Timer de logout automático (60 segundos)
        inactivityTimer = setTimeout(() => {
            if (currentUser) {
                autoLogout();
            }
        }, INACTIVITY_TIME);
    }

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });

    // Inicializar timer cuando se loguee un usuario
    resetInactivityTimer();
}

function showInactivityWarning() {
    if (isWarningShown) return;

    isWarningShown = true;
    modal.toast('Sesión cerrará por inactividad en 15 segundos. Haz click para continuar.', 'warning', 5000);
}

async function autoLogout() {
    if (!currentUser) return;

    console.log('Cerrando sesión por inactividad...');

    try {
        // Limpiar timers
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (warningTimer) clearTimeout(warningTimer);

        // Mostrar notificación
        modal.toast('Sesión cerrada por inactividad', 'info');

        // Cerrar sesión
        await auth.signOut();

    } catch (error) {
        console.error('Error al cerrar sesión automáticamente:', error);
    }
}

function stopInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);
    isWarningShown = false;
}

// Recordatorio de seguridad para admin
function showAdminSecurityReminder() {
    if (currentUser && currentUser.role === 'admin') {
        modal.toast('Admin: No olvides cerrar sesión al terminar para proteger la seguridad del sistema', 'warning', 8000);
    }
}

// ============= FUNCIONES DE AUTENTICACIá“N (ADMIN & CLIENT) =============
function showAdminLogin() {
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    hideLoginError('admin');
    showLoginLoading('admin', false);
}

function showClientLogin() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'flex';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    hideLoginError('client');
    showLoginLoading('client', false);
}

function showClientRegister() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    hideLoginError('register');
    showLoginLoading('register', false);
}

// ======================= CHECK AUTH STATE =======================
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => { // <--- CAMBIO AQUÍ (añadir async)
        // ... código existente ...
        if (user) {
            console.log('Usuario autenticado:', user.email, 'UID:', user.uid);

            if (!financialManager) financialManager = new FinancialManager();
            if (!userManager) userManager = new UserManager();
            if (!rechargeManager) rechargeManager = new RechargeManager();

            try {
                await db.collection('services').limit(1).get(); // Probar conexión
                console.log('✅ Firebase inicializado correctamente.');

                // Añade esta línea para las notificaciones
                listenUserNotifications(user.uid); // Llama al listener de notificaciones

                if (user.uid === ADMIN_UID) {
                    currentUser = { email: user.email, displayName: 'Admin', role: 'admin', uid: user.uid };

                    await loadData();
                    showMainApp('admin');
                    financialManager.updateFinancialDashboard();
                    userManager.loadAllUsers();
                    rechargeManager.loadRechargeRequests();

                    // ✅ Habilitar botones de admin solo después de inicializar todo
                    enableAdminButtons();

                    // NUEVO: Mostrar advertencia de seguridad para admin
                    setTimeout(() => {
                        showAdminSecurityReminder();
                    }, 2000);

                } else {
                    currentUser = { email: user.email, displayName: '', role: 'client', id: user.uid, uid: user.uid };

                    // --- Bloque de cambios principal ---
                    await loadClientData(user.uid);
                    await loadServices();
                    await loadAccounts();
                    await loadClientSales(user.uid); // <--- CAMBIO AQUÍ (Añadir esta línea)
                    // --- Fin del bloque de cambios ---

                    const userData = users.find(u => u.id === user.uid);
                    if (userData) {
                        currentUser.displayName = userData.name;
                        showMainApp('client');
                        renderClientDashboard();
                    } else {
                        console.error('Usuario no encontrado en Firestore');
                        await auth.signOut();
                        modal.alert('Tu cuenta no está completamente configurada. Por favor, contacta a soporte o intenta registrarte de nuevo.', 'Error de Perfil', 'warning');
                        showClientLogin();
                        // Al final de checkAuthState, en el else (cuando no hay usuario), agregar:
                        // Detener timers de inactividad
                        stopInactivityTimer();
                    }
                }
            } catch (error) {
                console.error('Error al probar conexión o cargar datos:', error);
                await auth.signOut();
                modal.toast('Error de permisos o conexión a Firestore. Intenta iniciar sesión de nuevo.', 'error');
                showClientLogin();
            }

        } else {
            // ... resto de checkAuthState ...

            console.log('No hay usuario autenticado');
            currentUser = null;
            accounts = [];
            services = [];
            clients = [];
            sales = [];
            users = [];
            expenses = [];
            rechargeRequests = [];
            showClientLogin(); // o showAdminLogin() si prefieres que por defecto sea admin
        }
    });
}

// ======================= HABILITAR BOTONES ADMIN =======================
function enableAdminButtons() {
    // Por ejemplo, botón de agregar saldo
    const addBalanceBtn = document.getElementById('addBalanceButton');
    if (addBalanceBtn) addBalanceBtn.disabled = false;
}

// ======================= AGREGAR / AJUSTAR SALDO =======================
async function updateUserBalance(userId, amount, type, comment) {
    // ✅ Esperar a que admin esté autenticado
    const admin = firebase.auth().currentUser;
    if (!admin || admin.uid !== ADMIN_UID) {
        modal.toast('Admin no autenticado aún.', 'error');
        return;
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        modal.toast('Usuario no encontrado.', 'error');
        return;
    }

    const userData = userDoc.data();
    let newBalance = userData.balance || 0;
    let transactionAmount = amount;
    let transactionType = type === 'add' ? 'Recarga' : 'Ajuste Negativo';

    if (type === 'add') {
        newBalance += amount;
    } else if (type === 'subtract') {
        newBalance -= amount;
        transactionAmount = -amount;
    }

    if (newBalance < 0) {
        modal.alert('El saldo no puede ser negativo.', 'Error de Saldo', 'error');
        return;
    }

    try {
        // Actualizar balance
        await userRef.update({ balance: newBalance });

        // Registrar transacción
        await userRef.collection('transactions').add({
            type: transactionType,
            amount: transactionAmount,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        modal.toast(`Saldo de ${userData.name} actualizado a $${newBalance.toFixed(2)}.`, 'success');

        // Recargar tabla de usuarios o datos necesarios
        if (userManager && typeof userManager.loadAllUsers === 'function') {
            await userManager.loadAllUsers();
        }

    } catch (error) {
        console.error('Error updating user balance:', error);
        modal.toast(`Error al actualizar saldo: ${error.message}`, 'error');
    }
}

// ======================= EJEMPLO DE BOTá“N PARA ADMIN =======================
document.getElementById('addBalanceButton')?.addEventListener('click', async () => {
    if (!currentUser || currentUser.role !== 'admin') {
        modal.toast('Admin no autenticado aún.', 'error');
        return;
    }

    // Abrir modal de saldo
    const { userId, amount } = await modal.promptAdminAddBalance(); // tu modal personalizado
    if (!userId || !amount) return;

    await updateUserBalance(userId, parseFloat(amount), 'add', 'Recarga realizada por admin');
});


async function loginAdmin() {
    const email = document.getElementById('adminLoginEmail').value.trim();
    const password = document.getElementById('adminLoginPassword').value.trim();

    if (!email || !password) {
        showLoginError('Por favor completa todos los campos.', 'admin');
        return;
    }

    showLoginLoading('admin', true);
    hideLoginError('admin');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (userCredential.user.uid !== ADMIN_UID) {
            await auth.signOut();
            showLoginError('Acceso denegado. Este email no es un administrador.', 'admin');
            return;
        }
        console.log('Admin autenticado con éxito.');
    } catch (error) {
        console.error('Error de autenticación admin:', error);
        showLoginLoading('admin', false);
        showLoginError(getFirebaseErrorMessage(error), 'admin');
    }
}

function updateAdminNotifications() {
    // Contador de recargas pendientes
    const pendingRecharges = rechargeRequests.filter(req => req.status === 'pending').length;
    const rechargeBadge = document.getElementById('rechargeNotificationBadge');
    if (rechargeBadge) {
        if (pendingRecharges > 0) {
            rechargeBadge.textContent = pendingRecharges;
            rechargeBadge.style.display = 'inline-flex';
        } else {
            rechargeBadge.style.display = 'none';
        }
    }

    // Aquí podríamos añadir un contador para clientes nuevos si tuviéramos un estado "pendiente de aprobación"
    // Por ahora, lo dejamos listo para el futuro.
    const webClientsBadge = document.getElementById('webClientsNotificationBadge');
    // const newClients = users.filter(u => u.status === 'pending_approval').length;
    // if(newClients > 0) { ... }
}

async function loginClient() {
    const emailInput = document.getElementById('clientLoginEmail');
    const passwordInput = document.getElementById('clientLoginPassword');

    if (!emailInput || !passwordInput) {
        console.error('No se encontraron los campos de email o contraseña en el DOM.');
        modal.toast('Error interno: campos de login no encontrados.', 'error');
        return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showLoginError('Por favor completa todos los campos.', 'client');
        return;
    }

    showLoginLoading('client', true);
    hideLoginError('client');

    try {
        console.log("Intentando login de cliente con email:", email);

        if (!auth) {
            throw new Error('Firebase Auth no está inicializado');
        }

        // Inicia sesión en Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log("Cliente autenticado en Firebase Auth:", user.uid);

        // Verificar si existe en Firestore con reintentos
        let userDoc;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    break;
                }
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`Intento ${attempts}: Documento no encontrado, esperando...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (firestoreError) {
                console.error(`Error en Firestore intento ${attempts + 1}:`, firestoreError);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        if (!userDoc || !userDoc.exists) {
            console.error('Usuario no encontrado en Firestore después de varios intentos');
            await auth.signOut();
            showLoginError('Tu cuenta no está configurada en la base de datos. Contacta al administrador.', 'client');
            return;
        }

        console.log('Cliente autenticado correctamente con Firestore.');
        
        // El resto del flujo lo maneja checkAuthState()
        
    } catch (error) {
        console.error('Error en loginClient:', error);
        
        let errorMessage = 'Error al iniciar sesión.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este email. Regístrate primero.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del email es inválido.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Espera unos minutos.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Error de permisos. Verifica la configuración de Firestore.';
        } else {
            errorMessage = error.message || 'Error desconocido al iniciar sesión.';
        }
        
        showLoginError(errorMessage, 'client');
    } finally {
        showLoginLoading('client', false);
    }
}

async function registerClient() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    let phone = document.getElementById('registerPhone').value.trim();

    // Validaciones básicas
    if (!name || !email || !password || !confirmPassword || !phone) {
        showLoginError('Por favor completa todos los campos obligatorios.', 'register');
        return;
    }

    if (password !== confirmPassword) {
        showLoginError('Las contraseñas no coinciden.', 'register');
        return;
    }

    if (password.length < 6) {
        showLoginError('La contraseña debe tener al menos 6 caracteres.', 'register');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showLoginError('El formato del email es inválido.', 'register');
        return;
    }

    // Validación y formato de teléfono ecuatoriano
    phone = formatEcuadorianPhone(phone);
    if (!phone) {
        showLoginError('Formato de teléfono ecuatoriano inválido. Ej: 09XXXXXXXX o +593XXXXXXXXX', 'register');
        return;
    }

    showLoginLoading('register', true);
    hideLoginError('register');

    try {
        console.log("Registrando usuario con email:", email);

        // IMPORTANTE: Verificar que Firebase Auth permite registro
        if (!auth) {
            throw new Error('Firebase Auth no está inicializado');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        console.log("Usuario creado en Auth con UID:", uid);

        // Datos que se guardarán en Firestore
        const newUserData = {
            id: uid,
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            phone: phone,
            balance: 0,
            role: 'client',
            adminUID: ADMIN_UID, // Referencia al admin
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            purchases: []
        };

        console.log("Guardando usuario en Firestore:", uid);

        // Guardar usuario en Firestore usando UID como ID del documento
        await db.collection('users').doc(uid).set(newUserData);

        console.log("Usuario registrado correctamente en Auth y Firestore:", uid);
        modal.toast('Registro exitoso. Ya puedes iniciar sesión.', 'success');
        showClientLogin();
    } catch (error) {
        console.error('Error al registrar cliente:', error);
        
        // Manejo específico de errores de Firebase
        let errorMessage = 'Error al registrar usuario.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del email es inválido.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Error de permisos. Verifica la configuración de Firestore.';
        } else {
            errorMessage = error.message || 'Error desconocido al registrar.';
        }
        
        showLoginError(errorMessage, 'register');
    } finally {
        showLoginLoading('register', false);
    }
}

async function logoutAdmin() {
    // Logout explícito sin confirmación para admin
    try {
        // Detener timers de inactividad
        stopInactivityTimer();

        // Cerrar sesión
        await auth.signOut();
        console.log('Admin desconectado exitosamente.');
        modal.toast('Sesión de administrador cerrada correctamente', 'success');
    } catch (error) {
        console.error('Error al cerrar sesión admin:', error);
        modal.alert('Error al cerrar sesión: ' + error.message, 'Error', 'error');
    }
}

async function logoutClient() {
    const confirmed = await modal.confirm('¿Estás seguro de que deseas cerrar sesión de tu portal?');
    if (confirmed) {
        try {
            // Detener timers de inactividad
            stopInactivityTimer();

            await auth.signOut();
            console.log('Cliente desconectado.');
        } catch (error) {
            console.error('Error al cerrar sesión cliente:', error);
            modal.alert('Error al cerrar sesión: ' + error.message, 'Error', 'error');
        }
    }
}

function showMainApp(role) {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';

    if (role === 'admin') {
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('clientApp').style.display = 'none';
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = currentUser.email;
        }

        // Inicializar timer de inactividad para admin
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (warningTimer) clearTimeout(warningTimer);
        initInactivityTimeout();

        updateDashboard();
        setTimeout(() => {
            showSection('dashboard');
        }, 100);
    } else if (role === 'client') {
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('clientApp').style.display = 'block';
        const clientDisplayNameElement = document.getElementById('clientDisplayName');
        if (clientDisplayNameElement) {
            clientDisplayNameElement.textContent = currentUser.displayName;
        }

        // Inicializar timer de inactividad para cliente
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (warningTimer) clearTimeout(warningTimer);
        initInactivityTimeout();

        renderClientDashboard();
    }
}

function showLoginError(message, type) {
    const errorDiv = document.getElementById(`${type}LoginError`) || document.getElementById(`${type}RegisterError`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideLoginError(type) {
    const errorDiv = document.getElementById(`${type}LoginError`) || document.getElementById(`${type}RegisterError`);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showLoginLoading(type, show) {
    const loadingDiv = document.getElementById(`${type}LoginLoading`) || document.getElementById(`${type}RegisterLoading`);
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// ============= FUNCIONES DE DATOS (CRUD) =============
async function loadData() {
    if (!financialManager) financialManager = new FinancialManager();
    if (!userManager) userManager = new UserManager();
    if (!rechargeManager) rechargeManager = new RechargeManager();

    await loadFromFirebase();

    renderAll();
    updateDashboard();
    updateAdminNotifications(); // <--- AÑADE ESTA LÍNEA
    financialManager.updateFinancialDashboard();
    if (currentUser && currentUser.role === 'admin') {
        userManager.loadAllUsers();
        rechargeManager.loadRechargeRequests();
    }
}

async function loadFromFirebase() {
    console.log('🔥 Cargando datos desde Firebase...');

    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        console.warn('âš ï¸ Solo el administrador puede cargar todos los datos.');
        return;
    }

    try {
        const [accountsSnapshot, clientsSnapshot, salesSnapshot, usersSnapshot, rechargeRequestsSnapshot, servicesSnapshot] = await Promise.all([
            db.collection('accounts').orderBy('createdAt', 'desc').get(),
            db.collection('clients').orderBy('createdAt', 'desc').get(),
            db.collection('sales').orderBy('createdAt', 'desc').get(),
            db.collection('users').orderBy('createdAt', 'desc').get(),
            db.collection('rechargeRequests').orderBy('createdAt', 'desc').get(),
            db.collection('services').orderBy('createdAt', 'desc').get()
        ]);

        accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rechargeRequests = rechargeRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (financialManager) {
            await financialManager.loadExpensesFromFirebase();
        }

        console.log('✅ Datos cargados desde Firebase correctamente.');
    } catch (error) {
        console.error('âŒ Error al cargar datos desde Firebase:', error);
        modal.toast('Error al cargar datos desde la nube.', 'error');
        throw error;
    }
}

async function loadClientData(userId) {
    if (!db) {
        console.error('Firestore no está inicializado');
        throw new Error('Base de datos no disponible');
    }
    
    try {
        console.log('🔥 Cargando datos del cliente desde Firebase:', userId);
        
        const userDocRef = db.collection('users').doc(userId);
        let attempts = 0;
        const maxAttempts = 5;
        const delay = 1000;

        while (attempts < maxAttempts) {
            try {
                const userDoc = await userDocRef.get();
                if (userDoc.exists) {
                    const userData = { id: userDoc.id, ...userDoc.data() };
                    users = [userData];
                    console.log('✅ Datos del cliente cargados desde Firebase correctamente.');
                    return;
                } else {
                    console.warn(`Intento ${attempts + 1}: Documento de usuario no encontrado.`);
                    attempts++;
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            } catch (firestoreError) {
                console.error(`Error en Firestore intento ${attempts + 1}:`, firestoreError);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        console.error('❌ Error: No se pudo cargar el documento del cliente después de varios intentos.');
        throw new Error('No se pudieron cargar los datos del usuario');
        
    } catch (error) {
        console.error("Error cargando datos del cliente desde Firebase:", error);
        modal.toast('Error al cargar tus datos. Por favor, intenta de nuevo.', 'error');
        throw error;
    }
}

async function verifyFirebaseAuthConfig() {
    try {
        console.log('🔍 Verificando configuración de Firebase Auth...');
        
        // Verificar si Auth está inicializado
        if (!auth) {
            console.error('❌ Firebase Auth no está inicializado');
            return false;
        }
        
        // Verificar configuración de Auth
        const authSettings = await auth.fetchSignInMethodsForEmail('test@example.com').catch(() => []);
        console.log('✅ Firebase Auth está funcionando');
        
        // Verificar si Firestore está accesible
        if (!db) {
            console.error('❌ Firestore no está inicializado');
            return false;
        }
        
        // Intentar una operación de lectura básica
        await db.collection('users').limit(1).get();
        console.log('✅ Firestore está funcionando');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en verificación de Firebase:', error);
        return false;
    }
}

async function loadAccounts() {
    const snapshot = await db.collection('accounts').get();
    accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function loadClientSales(userId) {
    if (!db) return;
    try {
        console.log(`🔥 Cargando ventas para el cliente: ${userId}...`);
        const salesSnapshot = await db.collection('sales')
            .where('clientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${sales.length} ventas cargadas para el cliente.`);
    } catch (error) {
        console.error("❌ Error cargando las ventas del cliente desde Firebase:", error);
        modal.toast('Error al cargar tu historial de compras.', 'error');
    }
}

async function loadServices() {
    const snapshot = await db.collection('services').get();
    services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAvailableAccountsCatalog();
}

async function saveToFirebase(collectionName, data) {
    if (!db) {
        console.warn(`Saltando guardado en Firebase para ${collectionName}/${data.id}. No conectado.`);
        return Promise.resolve();
    }

    if (collectionName === 'users') {
        if (!currentUser) {
            console.warn('No hay usuario autenticado para guardar en la colección users.');
            modal.toast('No tienes permiso para modificar datos de usuarios.', 'error');
            return Promise.reject(new Error('Permission denied: No authenticated user.'));
        }
        if (currentUser.uid !== ADMIN_UID && currentUser.uid !== data.id) {
            console.warn(`Usuario ${currentUser.uid} intentó guardar datos de otro usuario ${data.id}. Operación denegada.`);
            modal.toast('No tienes permiso para modificar datos de otros usuarios.', 'error');
            return Promise.reject(new Error('Permission denied: Cannot modify other users.'));
        }
        // For non-admin users, restrict fields they can update if needed
        // Example: if (currentUser.uid !== ADMIN_UID) { delete data.balance; }
    } else { // For other collections (accounts, clients, sales, expenses, rechargeRequests, services)
        if (!currentUser || currentUser.uid !== ADMIN_UID) {
            console.warn(`Usuario ${currentUser.uid} intentó guardar en ${collectionName}. Operación denegada.`);
            modal.toast('No tienes permiso para modificar estos datos.', 'error');
            return Promise.reject(new Error('Permission denied: Not admin.'));
        }
    }

    console.log(`ðŸ’¾ Guardando en Firebase: ${collectionName}/${data.id}`);

    try {
        await db.collection(collectionName).doc(data.id).set(data, { merge: true });
        console.log(`✅ Guardado en Firebase: ${collectionName}/${data.id}`);
    } catch (error) {
        console.error(`âŒ Error guardando en Firebase ${collectionName}/${data.id}:`, error);
        modal.toast(`Error al guardar en la nube: ${error.message}`, 'error');
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    if (!db) {
        console.warn(`Saltando eliminación en Firebase para ${collectionName}/${id}. No conectado.`);
        return Promise.resolve();
    }

    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        console.warn(`Usuario ${currentUser.uid} intentó eliminar de ${collectionName}/${id}. Operación denegada.`);
        modal.toast('No tienes permiso para eliminar datos.', 'error');
        return Promise.reject(new Error('Permission denied: Not admin.'));
    }

    console.log(`ðŸ—‘ï¸ Eliminando de Firebase: ${collectionName}/${id}`);
    try {
        await db.collection(collectionName).doc(id).delete();
        console.log(`✅ Eliminado de Firebase: ${collectionName}/${id}`);
    } catch (error) {
        console.error(`âŒ Error eliminando de Firebase ${collectionName}/${id}:`, error);
        modal.toast(`Error al eliminar en la nube: ${error.message}`, 'error');
        throw error;
    }
}

// ============= FUNCIONES DE UI (ADMIN) =============
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const buttons = document.querySelectorAll('.nav-btn');

    if (sections.length === 0 || buttons.length === 0) {
        console.warn('DOM elements not ready yet, retrying...');
        setTimeout(() => showSection(sectionId), 100);
        return;
    }

    sections.forEach(section => {
        section.classList.remove('active');
        section.setAttribute('hidden', 'true');
    });

    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.removeAttribute('hidden');
    }

    const activeButton = Array.from(buttons).find(btn => {
        const controls = btn.getAttribute('onclick');
        return controls && controls.includes(`'${sectionId}'`);
    });

    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-selected', 'true');
    }

    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'finances' && financialManager) {
        financialManager.updateFinancialDashboard();
        financialManager.showFinanceTab('overview', { currentTarget: document.querySelector('.finance-tabs .tab-btn.active') });
    } else if (sectionId === 'webClients' && userManager) {
        userManager.loadAllUsers();
    } else if (sectionId === 'rechargeRequests' && rechargeManager) {
        rechargeManager.loadRechargeRequests();
    }
}

function updateDashboard() {
    document.getElementById('totalAccounts').textContent = accounts.length;
    document.getElementById('totalClients').textContent = users.length;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.startDate);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    });

    document.getElementById('totalSales').textContent = monthSales.length;

    const totalRevenue = monthSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;

    updatePlatformStats();
}

function updatePlatformStats() {
    const platforms = {};
    accounts.forEach(account => {
        const platform = account.platform;
        platforms[platform] = (platforms[platform] || 0) + 1;
    });

    const statsHtml = Object.entries(platforms)
        .map(([platform, count]) => `<div><strong>${escapeHTML(platform)}:</strong> ${count}</div>`)
        .join('') || '<div>No hay cuentas registradas</div>';

    document.getElementById('platformStats').innerHTML = statsHtml;
}

function renderAccounts() {
    const tbody = document.querySelector('#accountsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay cuentas registradas.</td></tr>';
        return;
    }

    accounts.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${escapeHTML(account.platform)}</td>
                    <td>${escapeHTML(account.email)}</td>
                    <td>${account.profiles.length}</td>
                    <td>$${(account.pricePerProfile || 0).toFixed(2)}</td>
                    <td>$${(account.fullAccountPrice || 0).toFixed(2)}</td>
                    <td>
                        <select class="form-control status-dropdown" onchange="updateAccountStatus('${account.id}', this.value)" aria-label="Cambiar estado de cuenta">
                            <option value="Disponible" ${account.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
                            <option value="Ocupado" ${account.status === 'Ocupado' ? 'selected' : ''}>Ocupado</option>
                            <option value="No disponible" ${account.status === 'No disponible' ? 'selected' : ''}>No disponible</option>
                            <option value="Renovar" ${account.status === 'Renovar' ? 'selected' : ''}>Renovar</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm" onclick="editAccount('${account.id}')" title="Editar" aria-label="Editar cuenta ${escapeHTML(account.platform)} ${escapeHTML(account.email)}" tabindex="0"><i class="fas fa-edit" aria-hidden="true"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteAccount('${account.id}')" title="Eliminar" aria-label="Eliminar cuenta ${escapeHTML(account.platform)} ${escapeHTML(account.email)}" tabindex="0"><i class="fas fa-trash" aria-hidden="true"></i></button>
                        <button class="btn btn-secondary btn-sm" onclick="viewAccountDetails('${account.id}')" title="Ver Detalles" aria-label="Ver detalles de cuenta ${escapeHTML(account.platform)} ${escapeHTML(account.email)}" tabindex="0"><i class="fas fa-eye" aria-hidden="true"></i></button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

async function updateAccountStatus(accountId, newStatus) {
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
        modal.toast('Cuenta no encontrada.', 'error');
        return;
    }

    const oldStatus = accounts[accountIndex].status;
    accounts[accountIndex].status = newStatus;

    try {
        await saveToFirebase('accounts', accounts[accountIndex]);
        renderAccounts();
        modal.toast(`Estado de cuenta actualizado a "${newStatus}"`, 'success');
    } catch (error) {
        console.error('Error updating account status:', error);
        accounts[accountIndex].status = oldStatus;
        renderAccounts();
        modal.toast(`Error al actualizar el estado: ${error.message}`, 'error');
    }
}

function renderClients() {
    const tbody = document.querySelector('#clientsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay clientes manuales registrados.</td></tr>';
        return;
    }

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${escapeHTML(client.name)}</td>
                    <td>${escapeHTML(client.whatsApp)}</td>
                    <td>${escapeHTML(client.email || 'No especificado')}</td>
                    <td>${client.purchases}</td>
                    <td>${client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString() : 'Nunca'}</td>
                    <td>
                        <button class="btn btn-sm" onclick="openAddClientModal('${client.id}')" title="Editar" aria-label="Editar cliente ${escapeHTML(client.name)}" tabindex="0"><i class="fas fa-edit" aria-hidden="true"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteClient('${client.id}')" title="Eliminar" aria-label="Eliminar cliente ${escapeHTML(client.name)}" tabindex="0"><i class="fas fa-trash" aria-hidden="true"></i></button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

function renderSales() {
    const tbody = document.querySelector('#salesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay ventas registradas.</td></tr>';
        return;
    }

    sales.forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId) || users.find(u => u.id === sale.clientId);
        const account = accounts.find(a => a.id === sale.accountId);

        const today = new Date();
        const endDate = new Date(sale.endDate);
        let paymentStatus = 'pending';
        let paymentStatusText = 'Pendiente';
        let paymentStatusIcon = 'fas fa-hourglass-half';

        if (sale.paid) {
            paymentStatus = 'paid';
            paymentStatusText = 'Pagado';
            paymentStatusIcon = 'fas fa-check-circle';
        } else if (today > endDate) {
            paymentStatus = 'overdue';
            paymentStatusText = 'Atrasado';
            paymentStatusIcon = 'fas fa-exclamation-circle';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${escapeHTML(client ? (client.name + (client.lastName ? ' ' + client.lastName : '')) : 'Cliente eliminado')}</td>
                    <td>${escapeHTML(account ? account.platform : 'Cuenta eliminada')}</td>
                    <td>${sale.profilesCount}</td>
                    <td>${new Date(sale.startDate).toLocaleDateString()}</td>
                    <td>${new Date(sale.endDate).toLocaleDateString()}</td>
                    <td>$${(sale.total || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${sale.status === 'Activa' ? 'active' : 'unavailable'}">${escapeHTML(sale.status)}</span></td>
                    <td>
                        <span class="status-badge ${paymentStatus}">
                            <i class="${paymentStatusIcon}" aria-hidden="true"></i> ${paymentStatusText}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="generateWhatsAppFromSale('${sale.id}')" title="Generar WhatsApp" aria-label="Generar mensaje de WhatsApp para venta ${sale.id}" tabindex="0"><i class="fab fa-whatsapp" aria-hidden="true"></i></button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleSalePaymentStatus('${sale.id}', ${sale.paid})" title="${sale.paid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}" aria-label="${sale.paid ? 'Marcar venta como Pendiente' : 'Marcar venta como Pagado'}" tabindex="0">
                            <i class="fas ${sale.paid ? 'fa-undo' : 'fa-dollar-sign'}" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSale('${sale.id}')" title="Eliminar" aria-label="Eliminar venta ${sale.id}" tabindex="0"><i class="fas fa-trash" aria-hidden="true"></i></button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

async function toggleSalePaymentStatus(saleId, currentPaidStatus) {
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) {
        modal.toast('Venta no encontrada.', 'error');
        return;
    }

    const newPaidStatus = !currentPaidStatus;
    const oldSale = { ...sales[saleIndex] };
    sales[saleIndex].paid = newPaidStatus;

    try {
        await saveToFirebase('sales', sales[saleIndex]);
        renderSales();
        modal.toast(`Estado de pago de venta actualizado a "${newPaidStatus ? 'Pagado' : 'Pendiente'}"`, 'success');
    } catch (error) {
        console.error('Error updating sale payment status:', error);
        sales[saleIndex].paid = oldSale.paid;
        renderSales();
        modal.toast(`Error al actualizar el estado de pago: ${error.message}`, 'error');
    }
}

function renderServices() {
    const tbody = document.querySelector('#servicesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay servicios registrados.</td></tr>';
        return;
    }

    services.forEach(service => {
        const availableProfilesCount = accounts.filter(acc =>
            acc.platform === service.platform && acc.status === 'Disponible' && acc.profiles.some(p => p.available)
        ).reduce((sum, acc) => sum + acc.profiles.filter(p => p.available).length, 0);

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td><img src="${escapeHTML(service.imageUrl)}" alt="${escapeHTML(service.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                    <td>${escapeHTML(service.name)}</td>
                    <td>$${(service.price || 0).toFixed(2)}</td>
                    <td>${escapeHTML(service.description.substring(0, 50))}...</td>
                    <td>${availableProfilesCount}</td>
                    <td>
                        <button class="btn btn-sm" onclick="openAddServiceModal('${service.id}')" title="Editar" aria-label="Editar servicio ${escapeHTML(service.name)}" tabindex="0"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteService('${service.id}')" title="Eliminar" aria-label="Eliminar servicio ${escapeHTML(service.name)}" tabindex="0"><i class="fas fa-trash"></i></button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

function renderAll() {
    renderAccounts();
    renderClients();
    renderSales();
    renderServices();
    if (financialManager) {
        financialManager.renderExpensesTable();
        financialManager.renderFinancialAccountsTable();
    }
    if (userManager) {
        userManager.renderAllUsersTable();
    }
    if (rechargeManager) {
        rechargeManager.renderRechargeRequests();
    }
    updateDashboard();
}

// ============= FUNCIONES DE UI (CLIENT) =============
function renderClientDashboard() {
    const userCurrentBalanceElement = document.getElementById('userCurrentBalance');
    const clientBalanceElement = document.getElementById('clientBalance');
    const clientDisplayNameElement = document.getElementById('clientDisplayName');

    if (!currentUser || currentUser.role !== 'client') {
        console.error('No hay un usuario cliente logeado.');
        return;
    }

    const clientData = users.find(u => u.id === currentUser.uid);
    if (!clientData) {
        console.error('Datos del cliente no encontrados en users.');
        return;
    }

    if (userCurrentBalanceElement) userCurrentBalanceElement.textContent = `$${(clientData.balance || 0).toFixed(2)}`;
    if (clientBalanceElement) clientBalanceElement.textContent = `$${(clientData.balance || 0).toFixed(2)}`;
    if (clientDisplayNameElement) clientDisplayNameElement.textContent = clientData.name;

    renderClientTransactionHistory(clientData.id);
    renderAvailableAccountsCatalog();
    renderClientPurchaseHistory(clientData.id);
}

async function renderClientTransactionHistory(clientId) {
    const container = document.getElementById('transactionHistory');
    if (!container) return;

    container.innerHTML = '<div class="loading">Cargando historial...</div>';

    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            container.innerHTML = '<div class="no-data">No autenticado.</div>';
            return;
        }

        // ⚡ Claims para admin
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = idTokenResult.claims.role === 'admin';

        let transactionsRef;
        if (isAdmin) {
            transactionsRef = db.collection('users').doc(clientId).collection('transactions');
        } else {
            transactionsRef = db.collection('users').doc(user.uid).collection('transactions');
        }

        const snapshot = await transactionsRef.orderBy('createdAt', 'desc').get();
        window.allTransactions = snapshot.docs.map(doc => doc.data());

        if (allTransactions.length === 0) {
            container.innerHTML = '<div class="no-data">No hay transacciones registradas.</div>';
            return;
        }

        // Render filtros + lista vacía
        renderTransactionFilters(container);

        // Render inicial (todas)
        applyTransactionFilters();

    } catch (error) {
        console.error('Error fetching client transactions:', error);
        container.innerHTML = '<div class="no-data">Error al cargar el historial de transacciones.</div>';
    }
}


function renderTransactionFilters(container) {
    container.innerHTML = `
      <div class="transaction-filters" style="margin-bottom:1rem;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <div class="filter-group" style="position:relative;flex:1;min-width:200px;">
          <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#888;"></i>
          <input id="searchTransaction" type="text" placeholder="Buscar comentario..." 
            oninput="applyTransactionFilters()" 
            style="width:100%;padding:8px 12px 8px 32px;border-radius:8px;border:1px solid #ddd;">
        </div>

        <select id="typeFilter" onchange="applyTransactionFilters()" 
          style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;cursor:pointer;">
          <option value="">Todos</option>
          <option value="Recarga">Recargas</option>
          <option value="Compra">Compras</option>
          <option value="Ajuste">Ajustes</option>
        </select>

        <select id="sortFilter" onchange="applyTransactionFilters()" 
          style="padding:8px 12px;border-radius:8px;border:1px solid #ddd;cursor:pointer;">
          <option value="dateDesc">Más recientes</option>
          <option value="dateAsc">Más antiguos</option>
          <option value="amountDesc">Monto mayor</option>
          <option value="amountAsc">Monto menor</option>
        </select>
      </div>

      <!-- Aquí pintaremos la lista -->
      <div id="transactionList"></div>
    `;
}


function applyTransactionFilters() {
    const type = document.getElementById('typeFilter').value;
    const term = document.getElementById('searchTransaction').value.toLowerCase();
    const sort = document.getElementById('sortFilter').value;

    let filtered = window.allTransactions.filter(tx => {
        return (!type || tx.type === type) &&
            (!term || (tx.comment && tx.comment.toLowerCase().includes(term)));
    });

    // Ordenamiento
    if (sort === 'dateAsc') {
        filtered.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
    } else if (sort === 'dateDesc') {
        filtered.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    } else if (sort === 'amountAsc') {
        filtered.sort((a, b) => a.amount - b.amount);
    } else if (sort === 'amountDesc') {
        filtered.sort((a, b) => b.amount - a.amount);
    }

    renderTransactionsList(filtered);
}

function renderTransactionsList(transactions) {
    const container = document.getElementById('transactionList');
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = '<div class="no-data">No hay transacciones con esos filtros.</div>';
        return;
    }

    let html = '';
    transactions.forEach(entry => {
        const amountClass = entry.amount >= 0 ? 'positive' : 'negative';
        const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);

        html += `
          <div class="transaction-card" style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                  <span class="amount ${amountClass}" style="font-weight:bold;color:${entry.amount >= 0 ? '#16a34a' : '#dc2626'};">
                      ${entry.amount >= 0 ? '+' : ''}$${entry.amount.toFixed(2)}
                  </span>
                  <div class="date" style="font-size:0.85rem;color:#666;">
                      ${normalizeDate(date).toLocaleString()}
                  </div>
              </div>
              <div class="comment" style="flex:1;text-align:right;color:#334155;">
                  ${escapeHTML(entry.comment || entry.type || 'Sin comentario')}
              </div>
          </div>
        `;
    });

    container.innerHTML = html;
}

function renderAvailableAccountsCatalog() {
    const catalogElement = document.getElementById('availableAccountsCatalog');
    if (!catalogElement) return;

    catalogElement.innerHTML = '';

    const availableAccounts = accounts.filter(acc => acc.status === 'Disponible' && acc.profiles.some(p => p.available));

    if (availableAccounts.length === 0) {
        catalogElement.innerHTML = '<div class="no-data">No hay cuentas disponibles en este momento.</div>';
        return;
    }

    availableAccounts.forEach(account => {
        const availableProfilesCount = account.profiles.filter(p => p.available).length;

        // --- INICIO DE LA MODIFICACIá“N ---
        // 1. Encontrar el servicio asociado a la plataforma de esta cuenta
        const associatedService = services.find(s => s.platform === account.platform);
        // 2. Obtener la descripción del servicio, o un mensaje por defecto si no se encuentra
        const serviceDescription = associatedService ? associatedService.description : 'Descripción no disponible.';
        // --- FIN DE LA MODIFICACIá“N ---

        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <h3><img src="${escapeHTML(services.find(s => s.platform === account.platform)?.imageUrl || '')}" alt="${escapeHTML(account.platform)}" style="width: 30px; height: 30px; object-fit: contain; margin-right: 10px;"> ${escapeHTML(account.platform)}</h3>
            <p class="description">Usuario: ${escapeHTML(account.email)}</p>
            <p class="price">Precio por perfil: $${(account.pricePerProfile || 0).toFixed(2)}</p>
            <p class="description">Perfiles disponibles</p>
            
            <!-- AñADIR ESTA LíNEA PARA MOSTRAR LA DESCRIPCIá“N DEL SERVICIO -->
            <p class="description">Detalles: ${escapeHTML(serviceDescription)}</p> 

            <button class="btn btn-success buy-btn" onclick="openPurchaseModal('${account.id}')">
                <i class="fas fa-shopping-cart" aria-hidden="true"></i> Comprar Perfil
            </button>
        `;
        catalogElement.appendChild(card);
    });
}

let allAvailableAccounts = []; // guardamos todas las cuentas disponibles

function renderAvailableAccountsCatalog() {
    const catalogElement = document.getElementById('availableAccountsCatalog');
    if (!catalogElement) return;

    catalogElement.innerHTML = '';

    // Filtramos las disponibles
    allAvailableAccounts = accounts.filter(acc => acc.status === 'Disponible' && acc.profiles.some(p => p.available));

    if (allAvailableAccounts.length === 0) {
        catalogElement.innerHTML = '<div class="no-data">No hay cuentas disponibles en este momento.</div>';
        return;
    }

    // Render inicial con todo
    applyCatalogFilters();
}

function applyCatalogFilters() {
    const catalogElement = document.getElementById('availableAccountsCatalog');
    if (!catalogElement) return;

    const platform = document.getElementById('platformFilter').value;
    const term = document.getElementById('searchCatalog').value.toLowerCase();
    const sort = document.getElementById('priceSort').value;

    let filtered = allAvailableAccounts.filter(account => {
        const associatedService = services.find(s => s.platform === account.platform);
        const serviceDescription = associatedService ? associatedService.description.toLowerCase() : '';

        return (!platform || account.platform === platform) &&
            (!term || account.platform.toLowerCase().includes(term) ||
                (associatedService?.name && associatedService.name.toLowerCase().includes(term)) ||
                (serviceDescription && serviceDescription.includes(term)));
    });

    if (sort === 'asc') {
        filtered = filtered.sort((a, b) => (a.pricePerProfile || 0) - (b.pricePerProfile || 0));
    } else if (sort === 'desc') {
        filtered = filtered.sort((a, b) => (b.pricePerProfile || 0) - (a.pricePerProfile || 0));
    }

    catalogElement.innerHTML = '';

    if (filtered.length === 0) {
        catalogElement.innerHTML = '<div class="no-data">No hay servicios que coincidan con los filtros.</div>';
        return;
    }

    filtered.forEach(account => {
        const availableProfilesCount = account.profiles.filter(p => p.available).length;
        const associatedService = services.find(s => s.platform === account.platform);
        const serviceDescription = associatedService ? associatedService.description : 'Descripción no disponible.';

        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <img src="${escapeHTML(associatedService?.imageUrl || 'default.jpg')}" alt="${escapeHTML(associatedService?.name || account.platform)}" style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;">
            <div style="padding: var(--spacing-md);">
                <h4 style="font-size: 1.2rem; margin-bottom: var(--spacing-xs);">${escapeHTML(associatedService?.name || account.platform)}</h4>
                <div style="display: flex; align-items: center; margin-bottom: var(--spacing-sm); gap: 8px;">
                    <div style="position: relative; display: inline-block;">
                        <button class="info-btn" tabindex="0" aria-label="Detalles del servicio">!</button>
                        <div class="tooltip">${escapeHTML(serviceDescription)}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <span class="status-badge" style="background: var(--gradient-primary); color: white;">Desde $${(account.pricePerProfile || 0).toFixed(2)}</span>
                    <span class="status-badge" style="background: var(--light-color); color: var(--dark-color);">${availableProfilesCount} perfiles disponibles</span>
                </div>
                <button class="btn btn-success btn-full" onclick="openPurchaseModal('${account.id}')">
                    <i class="fas fa-shopping-cart"></i> Comprar
                </button>
            </div>
        `;
        catalogElement.appendChild(card);
    });
}


async function renderClientPurchaseHistory(clientId) {
    const historyElement = document.getElementById('clientPurchaseHistory');
    if (!historyElement) return;

    historyElement.innerHTML = '<div class="loading">Cargando historial de compras...</div>';

    try {
        const clientSales = sales.filter(sale => sale.clientId === clientId && sale.isAutoPurchase);

        if (clientSales.length === 0) {
            historyElement.innerHTML = '<div class="no-data">No tienes compras registradas aún.</div>';
            return;
        }

        let historyHtml = '';
        for (const sale of clientSales) {
            const account = accounts.find(acc => acc.id === sale.accountId);
            if (!account) continue;

            const profile = account.profiles.find(p => p.saleId === sale.id);

            const today = new Date();
            const endDate = new Date(sale.endDate);
            let statusText = sale.status;
            let statusClass = sale.status === 'Activa' ? 'active' : 'unavailable';

            if (sale.status === 'Activa' && today > endDate) {
                statusText = 'Vencida';
                statusClass = 'unavailable';
            }

            // Calcula días restantes y progreso
            const startDate = new Date(sale.startDate);
            const daysLeft = Math.max(0, Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24)));
            const totalDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
            const progressPct = 100 - Math.round((daysLeft / totalDays) * 100);

            historyHtml += `
                <div class="purchase-history-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <p><strong>Plataforma:</strong> ${escapeHTML(account.platform)}</p>
                            <p><strong>Total:</strong> $${(sale.total || 0).toFixed(2)}</p>
                            <p><strong>Periodo:</strong> ${new Date(sale.startDate).toLocaleDateString()} - ${new Date(sale.endDate).toLocaleDateString()}</p>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>

                    <div class="access-details">
                        <h5 style="margin-bottom: 10px;">Datos de Acceso:</h5>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span><strong>Usuario:</strong> ${escapeHTML(account.email)}</span>
                            <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${escapeHTML(account.email)}', 'Email copiado')"><i class="fas fa-copy"></i></button>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span><strong>Contraseña:</strong> ${escapeHTML(account.password)}</span>
                            <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${escapeHTML(account.password)}', 'Contraseña copiada')"><i class="fas fa-copy"></i></button>
                        </div>
                        ${profile ? `
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span><strong>Perfil:</strong> ${escapeHTML(profile.name)} (PIN: ${escapeHTML(profile.pin)})</span>
                            <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${escapeHTML(profile.name)}', 'Nombre del perfil copiado')"><i class="fas fa-copy"></i></button>
                        </div>
                        ` : ''}
                    </div>

                    <div class="progress" style="width: 100%; background-color: #e0e0e0; border-radius: 5px; overflow: hidden; margin-top: 10px;">
                        <div class="bar" style="width:${progressPct}%; height: 15px; background-color: var(--primary-color); border-radius: 5px; transition: width 0.5s ease-in-out;"></div>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--secondary-color); margin-top: 5px;">${daysLeft} días restantes</p>
                    <button class="btn btn-primary btn-sm" style="margin-top: 10px;" onclick="renewService('${sale.id}')">
                        <i class="fas fa-sync-alt"></i> Renovar
                    </button>
                </div>
            `;
        }
        historyElement.innerHTML = historyHtml;
    } catch (error) {
        console.error('Error rendering client purchase history:', error);
        historyElement.innerHTML = '<div class="no-data">Error al cargar el historial de compras.</div>';
    }
}

// ============= HELPERS GENERALES =============
function copyToClipboard(text, message = 'Copiado al portapapeles') {
    navigator.clipboard.writeText(text).then(() => {
        modal.toast(message, 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        modal.toast('Error al intentar copiar.', 'error');
    });
}

async function renewService(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        modal.alert('Venta no encontrada para renovar.', 'Error', 'error');
        return;
    }

    const account = accounts.find(acc => acc.id === sale.accountId);
    if (!account) {
        modal.alert('Cuenta asociada no encontrada.', 'Error', 'error');
        return;
    }

    const clientData = users.find(u => u.id === currentUser.uid);
    if (!clientData) {
        modal.alert('Datos del cliente no encontrados.', 'Error', 'error');
        return;
    }

    const renewalCost = sale.total; // Asumiendo que el costo de renovación es el mismo que el precio de venta original
    if ((clientData.balance || 0) < renewalCost) {
        modal.alert(`Saldo insuficiente para renovar. Necesitas $${renewalCost.toFixed(2)} y tienes $${(clientData?.balance || 0).toFixed(2)}.`, 'Saldo Insuficiente', 'error');
        return;
    }

    const confirmed = await modal.confirm(`¿Estás seguro de renovar este servicio por $${renewalCost.toFixed(2)}?`, 'Confirmar Renovación');
    if (!confirmed) return;

    try {
        // Deduce el saldo
        const newClientBalance = (clientData.balance || 0) - renewalCost;
        await db.collection('users').doc(currentUser.uid).update({ balance: newClientBalance });

        // Registra la transacción
        await db.collection('users').doc(currentUser.uid).collection('transactions').add({
            type: 'Renovación de Servicio',
            amount: -renewalCost,
            comment: `Renovación de ${account.platform}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualiza la fecha de finalización de la venta (por ejemplo, añade otro mes)
        const currentEndDate = new Date(sale.endDate);
        const newEndDate = new Date(currentEndDate.setMonth(currentEndDate.getMonth() + 1));

        await db.collection('sales').doc(saleId).update({
            endDate: newEndDate.toISOString().split('T')[0],
            status: 'Activa', // Asegura que el estado sea activo después de la renovación
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        modal.toast('Servicio renovado con éxito.', 'success');
        await loadClientData(currentUser.uid); // Recarga los datos del cliente
        await loadAccounts(); // Recarga las cuentas para actualizar cualquier información relacionada
        renderClientDashboard(); // Vuelve a renderizar el dashboard para reflejar los cambios
    } catch (error) {
        console.error('Error al renovar el servicio:', error);
        modal.toast(`Error al renovar el servicio: ${error.message}`, 'error');
    }
}


async function openPurchaseModal(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        modal.alert('Cuenta no encontrada.', 'Error', 'error');
        return;
    }

    const availableProfiles = account.profiles.filter(p => p.available);
    if (availableProfiles.length === 0) {
        modal.alert('No hay perfiles disponibles en esta cuenta.', 'Sin Perfiles', 'warning');
        return;
    }

    const formConfig = {
        fields: [
            { type: 'html', value: `<p>Estás a punto de comprar un perfil de <strong>${escapeHTML(account.platform)}</strong>.</p>` },
            { type: 'html', value: `<p><strong>Precio por perfil:</strong> $${(account.pricePerProfile || 0).toFixed(2)}</p>` },
            { type: 'html', value: `<p><strong>Perfiles disponibles:</strong> ${availableProfiles.length}</p>` },
            { type: 'number', name: 'profilesToBuy', label: 'Cantidad de perfiles a comprar', required: true, value: '1', min: '1', max: availableProfiles.length.toString() }
        ]
    };

    // Abrir el modal del formulario
    modal.form(formConfig, `Comprar Perfil de ${account.platform}`, { autoClose: false }).then(async data => {
        if (!data) return;

        const profilesToBuy = parseInt(data.profilesToBuy);
        if (isNaN(profilesToBuy) || profilesToBuy <= 0 || profilesToBuy > availableProfiles.length) {
            modal.alert('Cantidad de perfiles inválida.', 'Error', 'error');
            return;
        }

        const totalCost = profilesToBuy * (account.pricePerProfile || 0);
        const clientData = users.find(u => u.id === currentUser.uid);

        if (!clientData || (clientData.balance || 0) < totalCost) {
            modal.alert(`Saldo insuficiente. Necesitas $${totalCost.toFixed(2)} y tienes $${(clientData?.balance || 0).toFixed(2)}.`, 'Saldo Insuficiente', 'error');
            return;
        }

        const confirmed = await modal.confirm(`Confirmar compra de ${profilesToBuy} perfil(es) de ${account.platform} por $${totalCost.toFixed(2)}?`, 'Confirmar Compra');
        if (!confirmed) return;

        // Llamar a la función de compra completa
        await processPurchase(accountId, profilesToBuy, totalCost);
    });
}


async function processPurchase(accountId, profilesToBuy, totalCost) {
    if (isClaudeEnvironment) {
        // Demo mode simulation
        const account = accounts.find(acc => acc.id === accountId);
        const clientData = webClients.find(u => u.id === currentUser.uid);

        if (!account || !clientData) {
            modal.toast('Error: Cuenta o cliente no encontrados.', 'error');
            return;
        }

        if ((clientData.balance || 0) < totalCost) {
            modal.toast('Saldo insuficiente. Por favor, recarga tu saldo.', 'error');
            return;
        }

        const availableProfiles = account.profiles.filter(p => p.available);
        if (availableProfiles.length < profilesToBuy) {
            modal.toast('No hay suficientes perfiles disponibles en este momento.', 'warning');
            return;
        }

        // Simulate purchase in demo mode
        const profilesToAssign = availableProfiles.slice(0, profilesToBuy);

        // Update demo data
        clientData.balance = (clientData.balance || 0) - totalCost;

        const newSale = {
            id: Date.now().toString(),
            clientId: currentUser.uid,
            accountId: accountId,
            profilesCount: profilesToBuy,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            total: totalCost,
            status: 'Activa',
            paid: true,
            isAutoPurchase: true,
            createdAt: new Date().toISOString()
        };
        sales.push(newSale);

        // Update profiles in demo
        account.profiles.forEach(p => {
            const assigned = profilesToAssign.find(ap => ap.name === p.name && ap.pin === p.pin);
            if (assigned) {
                p.available = false;
                p.soldTo = currentUser.uid;
                p.saleId = newSale.id;
            }
        });

        account.status = account.profiles.some(p => p.available) ? 'Disponible' : 'Ocupado';
        account.totalEarned = (account.totalEarned || 0) + totalCost;

        // Show purchase success modal with account details
        showPurchaseSuccessModal(account, profilesToAssign, newSale);
        renderAvailableAccountsCatalog();
        renderClientDashboard();
        return;
    }

    try {
        const accountRef = db.collection('accounts').doc(accountId);
        const clientRef = db.collection('users').doc(currentUser.uid);

        const accountDoc = await accountRef.get();
        const clientDoc = await clientRef.get();

        if (!accountDoc.exists || !clientDoc.exists) {
            modal.toast('Error: Cuenta o cliente no encontrados.', 'error');
            return;
        }

        const accountData = accountDoc.data();
        const clientData = clientDoc.data();

        if ((clientData.balance || 0) < totalCost) {
            modal.toast('Saldo insuficiente. Por favor, recarga tu saldo.', 'error');
            return;
        }

        const availableProfiles = accountData.profiles.filter(p => p.available);
        if (availableProfiles.length < profilesToBuy) {
            modal.toast('No hay suficientes perfiles disponibles en este momento.', 'warning');
            return;
        }

        // Deduct balance
        const newClientBalance = (clientData.balance || 0) - totalCost;
        await clientRef.update({ balance: newClientBalance });

        // Record transaction
        await clientRef.collection('transactions').add({
            type: 'Compra de Perfil',
            amount: -totalCost,
            comment: `Compra de ${profilesToBuy} perfil(es) de ${accountData.platform}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Assign profiles and create sale record
        const profilesToAssign = availableProfiles.slice(0, profilesToBuy);
        const updatedProfiles = accountData.profiles.map(p => {
            const assigned = profilesToAssign.find(ap => ap.name === p.name && ap.pin === p.pin);
            if (assigned) {
                return {
                    ...p,
                    available: false,
                    soldTo: currentUser.uid,
                    saleId: '' // Will be updated with actual sale ID
                };
            }
            return p;
        });

        const newSale = {
            clientId: currentUser.uid,
            accountId: accountId,
            profilesCount: profilesToBuy,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // 1 month duration
            total: totalCost,
            status: 'Activa',
            paid: true,
            isAutoPurchase: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const saleRef = await db.collection('sales').add(newSale);
        const saleId = saleRef.id;

        // Update saleId in assigned profiles
        const finalUpdatedProfiles = updatedProfiles.map(p => {
            if (p.soldTo === currentUser.uid && p.saleId === '') { // Only update newly assigned profiles
                return { ...p, saleId: saleId };
            }
            return p;
        });

        // Update account status if all profiles are now occupied
        const newAccountStatus = finalUpdatedProfiles.some(p => p.available) ? 'Disponible' : 'Ocupado';
        await accountRef.update({
            profiles: finalUpdatedProfiles,
            status: newAccountStatus,
            totalEarned: (accountData.totalEarned || 0) + totalCost // Update total earned for the account
        });

        // Show purchase success modal with account details
        const updatedAccountData = { ...accountData, profiles: finalUpdatedProfiles };
        const saleData = { ...newSale, id: saleId };
        sales.push(saleData); // <-- ESTA LíNEA ES LA QUE FALTA
        showPurchaseSuccessModal(updatedAccountData, profilesToAssign, saleData);

        await loadServices();
        await loadAccounts();
        renderAvailableAccountsCatalog();
        renderClientDashboard();
    } catch (error) {
        console.error('Error processing purchase:', error);
        modal.toast(`Error al procesar la compra: ${error.message}`, 'error');
    }
}

function showPurchaseSuccessModal(account, assignedProfiles, sale) {
    const profilesText = assignedProfiles.map(p => `${p.name} (PIN: ${p.pin})`).join(', ');
    const endDate = new Date(sale.endDate);
    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    const modalContent = `
        <div class="modal-header" style="background: var(--gradient-success); color: white; border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;">
            <h3><i class="fas fa-check-circle" aria-hidden="true"></i> Â¡Compra Realizada con á‰xito!</h3>
            <button class="modal-close" onclick="modal.close()" aria-label="Cerrar modal" style="color: white;">&times;</button>
        </div>
        <div class="modal-body" style="padding: var(--spacing-2xl);">
            <div class="purchase-success-content">
                <div class="success-message">
                    <div class="success-icon">
                        <i class="fas fa-gift" aria-hidden="true" style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;"></i>
                    </div>
                    <p style="font-size: 1.2rem; color: var(--dark-color); margin-bottom: 2rem; text-align: center;">
                        Ya tienes acceso a <strong>${escapeHTML(account.platform)}</strong>
                    </p>
                </div>
                
                <div class="account-access-card" style="background: #f8fafc; border-radius: var(--border-radius-lg); padding: var(--spacing-xl); border: 2px solid var(--success-color); margin-bottom: 2rem;">
                    <h4 style="color: var(--success-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-key" aria-hidden="true"></i> Datos de Acceso
                    </h4>
                    <div class="access-details-grid" style="display: grid; gap: 1rem;">
                        <div class="access-item">
                            <label style="font-weight: 600; color: var(--dark-color); display: block; margin-bottom: 4px;">
                                <i class="fas fa-tv" aria-hidden="true"></i> Plataforma:
                            </label>
                            <div class="access-value" style="background: white; padding: 12px; border-radius: var(--border-radius); border: 1px solid #e2e8f0; font-family: monospace; font-size: 1.1rem;">
                                ${escapeHTML(account.platform)}
                            </div>
                        </div>
                        
                        <div class="access-item">
                            <label style="font-weight: 600; color: var(--dark-color); display: block; margin-bottom: 4px;">
                                <i class="fas fa-user" aria-hidden="true"></i> Usuario/Email:
                            </label>
                            <div class="access-value" style="background: white; padding: 12px; border-radius: var(--border-radius); border: 1px solid #e2e8f0; font-family: monospace; font-size: 1.1rem;">
                                ${escapeHTML(account.email)}
                            </div>
                        </div>
                        
                        <div class="access-item">
                            <label style="font-weight: 600; color: var(--dark-color); display: block; margin-bottom: 4px;">
                                <i class="fas fa-lock" aria-hidden="true"></i> Contraseña:
                            </label>
                            <div class="access-value" style="background: white; padding: 12px; border-radius: var(--border-radius); border: 1px solid #e2e8f0; font-family: monospace; font-size: 1.1rem;">
                                ${escapeHTML(account.password)}
                            </div>
                        </div>
                        
                        <div class="access-item">
                            <label style="font-weight: 600; color: var(--dark-color); display: block; margin-bottom: 4px;">
                                <i class="fas fa-user-friends" aria-hidden="true"></i> Perfil${assignedProfiles.length > 1 ? 'es' : ''} Asignado${assignedProfiles.length > 1 ? 's' : ''}:
                            </label>
                            <div class="access-value" style="background: white; padding: 12px; border-radius: var(--border-radius); border: 1px solid #e2e8f0; font-family: monospace; font-size: 1.1rem;">
                                ${escapeHTML(profilesText)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="purchase-info" style="background: #eff6ff; border-radius: var(--border-radius-lg); padding: var(--spacing-lg); margin-bottom: 2rem; border: 1px solid #bfdbfe;">
                    <h4 style="color: var(--info-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-info-circle" aria-hidden="true"></i> Información de tu Compra
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <strong>Total Pagado:</strong> $${(sale.total || 0).toFixed(2)}
                        </div>
                        <div>
                            <strong>Perfiles:</strong> ${sale.profilesCount}
                        </div>
                        <div>
                            <strong>Fecha de Inicio:</strong> ${new Date(sale.startDate).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>Vence el:</strong> ${endDate.toLocaleDateString()} (${daysRemaining} días)
                        </div>
                    </div>
                </div>
                
                <div class="important-notice" style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--border-radius); padding: var(--spacing-lg); margin-bottom: 2rem;">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <i class="fas fa-exclamation-triangle" aria-hidden="true" style="color: var(--warning-color); font-size: 1.5rem; margin-top: 2px;"></i>
                        <div>
                            <h5 style="color: var(--warning-color); margin: 0 0 8px 0;">Importante - Guarda esta información</h5>
                            <p style="margin: 0; color: #92400e;">
                                Copia y guarda estos datos en un lugar seguro. Los necesitarás para acceder a tu cuenta de ${escapeHTML(account.platform)}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer" style="gap: 1rem;">
            <button class="btn btn-success" onclick="copyAccountDataToClipboard('${account.id}', '${sale.id}')" tabindex="0">
                <i class="fas fa-copy" aria-hidden="true"></i> Copiar Datos
            </button>
            <a href="https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, acabo de comprar una cuenta de ' + account.platform + ' y necesito ayuda.')}" target="_blank" class="whatsapp-button">
                <i class="fab fa-whatsapp" aria-hidden="true"></i> Contactar Soporte
            </a>
            <button class="btn btn-primary" onclick="modal.close()" tabindex="0">
                <i class="fas fa-check" aria-hidden="true"></i> Entendido
            </button>
        </div>
    `;

    modal.open(modalContent, { size: 'large', ariaLabel: 'Confirmación de compra exitosa' });
}

function copyAccountDataToClipboard(accountId, saleId) {
    const account = accounts.find(acc => acc.id === accountId);
    const sale = sales.find(s => s.id === saleId);

    if (!account || !sale) {
        modal.toast('Error al encontrar los datos de la cuenta.', 'error');
        return;
    }

    const assignedProfiles = account.profiles.filter(p => p.saleId === saleId);
    const profilesText = assignedProfiles.map(p => `${p.name} (PIN: ${p.pin})`).join(', ');

    const message = `🎉 ¡Tu cuenta de ${account.platform} está lista!

📱 PLATAFORMA: ${account.platform}
📧 Usuario: ${account.email}
🔐 Contraseña: ${account.password}
👤 Perfil(es): ${profilesText}
📅 Vigencia: ${new Date(sale.startDate).toLocaleDateString()} - ${new Date(sale.endDate).toLocaleDateString()}

¡Disfruta tu servicio! 🍿✨`;

    navigator.clipboard.writeText(message).then(() => {
        modal.toast('📋 Datos copiados al portapapeles correctamente', 'success');
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            modal.toast('📋 Datos copiados al portapapeles correctamente', 'success');
        } catch (ex) {
            modal.alert('No se pudo copiar automáticamente. Aquí están tus datos:\n\n' + message, 'Datos de tu Cuenta', 'info');
        } finally {
            document.body.removeChild(textArea);
        }
    });
}
async function openRechargeModal() {
    const formConfig = {
        fields: [
            { type: 'number', name: 'amount', label: 'Monto a Recargar ($)', required: true, placeholder: '0.00', step: '0.01', min: MIN_RECHARGE_AMOUNT.toString() },
            {
                type: 'select', name: 'bank', label: 'Banco de Origen', required: true, options: [
                    { value: '', text: 'Seleccionar banco...' },
                    { value: 'Pichincha', text: 'Banco Pichincha' },
                    { value: 'Guayaquil', text: 'Banco de Guayaquil' },
                    { value: 'Produbanco', text: 'Produbanco' },
                    { value: 'Pacifico', text: 'Banco del Pací­fico' },
                    { value: 'Otro', text: 'Otro' }
                ]
            },
            { type: 'file', name: 'proof', label: 'Comprobante de Pago (Imagen)', required: true, accept: 'image/*' },
            { type: 'textarea', name: 'comment', label: 'Comentario (opcional)', placeholder: 'Número de referencia, nombre del titular, etc.' }
        ]
    };

    const bankInfoHtml = `
                <div class="bank-info-section">
                    <h4>Datos Bancarios para Transferencia</h4>
                    <p><strong>Banco:</strong> Banco Pichincha</p>
                    <p><strong>Tipo de Cuenta:</strong> Ahorros</p>
                    <p><strong>Número de Cuenta:</strong> <strong>XXXXXXXXXX</strong></p>
                    <p><strong>Titular:</strong> Tu Nombre / Nombre de Empresa</p>
                    <p><strong>Cédula/RUC:</strong> XXXXXXXXXX</p>
                    <p class="warning-text">¡Importante! Realiza la transferencia a estos datos y adjunta el comprobante.</p>
                    <p class="recharge-min-amount">Monto mí­nimo de recarga: $${MIN_RECHARGE_AMOUNT.toFixed(2)}</p>
                </div>
            `;

    modal.form(formConfig, 'Solicitar Recarga de Saldo').then(async data => {
        if (data) {
            const amount = parseFloat(data.amount);
            const bank = sanitizeInput(data.bank);
            const proofFile = data.proof;
            const comment = sanitizeInput(data.comment || '');

            if (isNaN(amount) || amount < MIN_RECHARGE_AMOUNT) {
                modal.alert(`El monto má­nimo de recarga es $${MIN_RECHARGE_AMOUNT.toFixed(2)}.`, 'Monto Inválido', 'error');
                return;
            }
            if (!proofFile) {
                modal.alert('Debes adjuntar un comprobante de pago.', 'Comprobante Requerido', 'error');
                return;
            }

            await submitRechargeRequest(amount, bank, proofFile, comment);
        }
    });

    const modalBody = document.querySelector('#modal-form').closest('.modal-body');
    if (modalBody) {
        modalBody.insertAdjacentHTML('afterbegin', bankInfoHtml);
    }
}

async function submitRechargeRequest(amount, bank, proofFile, comment) {
    try {
        // ImgBB API Key is not provided in the context, so this part will fail without it.
        // For a real application, you would need to replace this with a valid ImgBB API Key
        // or use Firebase Storage for image uploads.
        // For now, this will be a placeholder.
        const IMGBB_API_KEY = "8ce353ca72771ab928e15bd597685042"; // Replace with your actual ImgBB API Key

        if (IMGBB_API_KEY === "YOUR_IMGBB_API_KEY") {
            modal.alert('La clave API de ImgBB no está configurada. La carga de comprobantes no funcionará.', 'Error de Configuración', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', proofFile);

        const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
            throw new Error(uploadData.error.message || 'Error al subir la imagen del comprobante.');
        }

        const imageUrl = uploadData.data.url;

        const newRechargeRequest = {
            clientId: currentUser.uid,
            amount: amount,
            bank: bank,
            imageUrl: imageUrl,
            status: 'pending',
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('rechargeRequests').add(newRechargeRequest);

        modal.toast('Solicitud de recarga enviada con éxito. Esperando aprobación del administrador.', 'success');
        modal.close();
        renderClientDashboard();
    } catch (error) {
        console.error('Error submitting recharge request:', error);
        modal.toast(`Error al enviar la solicitud de recarga: ${error.message}`, 'error');
    }
}

// ============= FUNCIONES DE MODALES (ADMIN) =============
function openAddAccountModal(accountId = null) {
    let account = null;
    if (accountId) {
        account = accounts.find(acc => acc.id === accountId);
        if (!account) {
            modal.alert('Cuenta no encontrada para editar.', 'Error', 'error');
            return;
        }
    }

    const modalContent = `
                <div class="modal-header">
                    <h3 id="modal-title">${accountId ? 'Editar Cuenta Existente' : 'Agregar Nueva Cuenta'}</h3>
                    <button class="modal-close" type="button" onclick="modal.close()" aria-label="Cerrar modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="account-form" aria-label="${accountId ? 'Formulario para editar cuenta' : 'Formulario para agregar nueva cuenta'}">
                        <div class="form-section">
                            <h4><i class="fas fa-info-circle" aria-hidden="true"></i> Información de la Cuenta</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="platform">Plataforma: <span aria-hidden="true">*</span></label>
                                    <select id="platform" name="platform" class="form-control" required onchange="toggleCustomPlatform()" tabindex="0" aria-required="true">
                                        <option value="">Seleccionar plataforma</option>
                                        <option value="Netflix" ${account && account.platform === 'Netflix' ? 'selected' : ''}>Netflix</option>
                                        <option value="HBO Max" ${account && account.platform === 'HBO Max' ? 'selected' : ''}>HBO Max</option>
                                        <option value="Disney+" ${account && account.platform === 'Disney+' ? 'selected' : ''}>Disney+</option>
                                        <option value="Prime Video" ${account && account.platform === 'Prime Video' ? 'selected' : ''}>Prime Video</option>
                                        <option value="Spotify" ${account && account.platform === 'Spotify' ? 'selected' : ''}>Spotify</option>
                                        <option value="YouTube Premium" ${account && account.platform === 'YouTube Premium' ? 'selected' : ''}>YouTube Premium</option>
                                        <option value="Otro" ${account && !['Netflix', 'HBO Max', 'Disney+', 'Prime Video', 'Spotify', 'YouTube Premium'].includes(account.platform) ? 'selected' : ''}>Otro</option>
                                    </select>
                                </div>
                                <div class="form-group" id="custom-platform-group" style="display: ${account && !['Netflix', 'HBO Max', 'Disney+', 'Prime Video', 'Spotify', 'YouTube Premium'].includes(account.platform) ? 'block' : 'none'};">
                                    <label for="customPlatform">Plataforma Personalizada:</label>
                                    <input type="text" id="customPlatform" name="customPlatform" class="form-control" value="${account && !['Netflix', 'HBO Max', 'Disney+', 'Prime Video', 'Spotify', 'YouTube Premium'].includes(account.platform) ? escapeHTML(account.platform) : ''}" tabindex="0">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="email">Usuario/Email: <span aria-hidden="true">*</span></label>
                                    <input type="email" id="email" name="email" class="form-control" required value="${account ? escapeHTML(account.email) : ''}" tabindex="0" aria-required="true">
                                </div>
                                <div class="form-group">
                                    <label for="password">Contraseña: <span aria-hidden="true">*</span></label>
                                    <input id="password" name="password" class="form-control" required value="${account ? escapeHTML(account.password) : ''}" tabindex="0" aria-required="true">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-dollar-sign" aria-hidden="true"></i> Información Financiera</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="acquisitionCost">Costo de Adquisición: <span aria-hidden="true">*</span></label>
                                    <input type="number" id="acquisitionCost" name="acquisitionCost" class="form-control" step="0.01" min="0" placeholder="0.00" required value="${account ? (account.acquisitionCost || 0).toFixed(2) : ''}" onchange="calculateProfitMargin()" tabindex="0" aria-required="true">
                                    <small class="form-text">Costo inicial de compra de la cuenta.</small>
                                </div>
                                <div class="form-group">
                                    <label for="supplier">Proveedor:</label>
                                    <input type="text" id="supplier" name="supplier" class="form-control" placeholder="Nombre del vendedor" value="${account ? escapeHTML(account.supplier || '') : ''}" tabindex="0">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="renewalCost">Costo de Renovación Mensual:</label>
                                    <input type="number" id="renewalCost" name="renewalCost" class="form-control" step="0.01" min="0" placeholder="0.00" value="${account ? (account.renewalCost || 0).toFixed(2) : ''}" tabindex="0">
                                    <small class="form-text">Solo si pagas renovaciones mensuales.</small>
                                </div>
                                <div class="form-group">
                                    <label for="renewalDate">Próxima Renovación:</label>
                                    <input type="date" id="renewalDate" name="renewalDate" class="form-control" value="${account ? (account.renewalDate || '') : ''}" tabindex="0">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-tags" aria-hidden="true"></i> Precios de Venta</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="pricePerProfile">Precio por Perfil: <span aria-hidden="true">*</span></label>
                                    <input type="number" id="pricePerProfile" name="pricePerProfile" class="form-control" step="0.01" min="0" required value="${account ? (account.pricePerProfile || 0).toFixed(2) : ''}" tabindex="0" aria-required="true">
                                </div>
                                <div class="form-group">
                                    <label for="fullAccountPrice">Precio Cuenta Completa: <span aria-hidden="true">*</span></label>
                                    <input type="number" id="fullAccountPrice" name="fullAccountPrice" class="form-control" step="0.01" min="0" required value="${account ? (account.fullAccountPrice || 0).toFixed(2) : ''}" tabindex="0" aria-required="true">
                                </div>
                            </div>
                            
                            <div class="profit-indicator" id="profitIndicator" style="display: none;" role="status" aria-live="polite">
                                <strong>Análisis de Rentabilidad:</strong>
                                <div id="profitAnalysis"></div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-user-friends" aria-hidden="true"></i> Configuración de Perfiles</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="devices">Número de Perfiles: <span aria-hidden="true">*</span></label>
                                    <input type="number" id="devices" name="devices" class="form-control" min="1" max="10" required value="${account ? (account.devices || 1) : 1}" onchange="updateProfilesSection(); calculateProfitMargin();" tabindex="0" aria-required="true">
                                </div>
                            </div>
                            
                            <div id="profiles-container" role="group" aria-label="Perfiles de la cuenta">
                            </div>
                            <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addProfile()" tabindex="0">
                                <i class="fas fa-plus" aria-hidden="true"></i> Agregar Perfil
                            </button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" type="button" onclick="modal.close()" tabindex="0">Cancelar</button>
                    <button class="btn btn-success" type="button" onclick="saveAccount('${accountId || ''}')" tabindex="0">
                        <i class="fas fa-save" aria-hidden="true"></i> ${accountId ? 'Guardar Cambios' : 'Guardar Cuenta'}
                    </button>
                </div>
            `;

    modal.open(modalContent, { size: 'large' });

    setTimeout(() => {
        updateProfilesSection(account ? account.profiles : null);
        toggleCustomPlatform();
        calculateProfitMargin();
    }, 100);
}

function toggleCustomPlatform() {
    const platformSelect = document.getElementById('platform');
    const customGroup = document.getElementById('custom-platform-group');
    const customInput = document.getElementById('customPlatform');

    if (platformSelect && customGroup && customInput) {
        if (platformSelect.value === 'Otro') {
            customGroup.style.display = 'block';
            customInput.required = true;
            customInput.setAttribute('aria-required', 'true');
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            customInput.removeAttribute('aria-required');
            customInput.value = '';
        }
    }
}

function calculateProfitMargin() {
    const acquisitionCostInput = document.getElementById('acquisitionCost');
    const pricePerProfileInput = document.getElementById('pricePerProfile');
    const devicesInput = document.getElementById('devices');

    if (!acquisitionCostInput || !pricePerProfileInput || !devicesInput) return;

    const acquisitionCost = parseFloat(acquisitionCostInput.value) || 0;
    const pricePerProfile = parseFloat(pricePerProfileInput.value) || 0;
    const devices = parseInt(devicesInput.value) || 1;

    if (acquisitionCost > 0 || pricePerProfile > 0) {
        const maxRevenue = pricePerProfile * devices;
        const profit = maxRevenue - acquisitionCost;
        const margin = maxRevenue > 0 ? ((profit / maxRevenue) * 100).toFixed(1) : 0;
        const roi = acquisitionCost > 0 ? ((profit / acquisitionCost) * 100).toFixed(1) : 0;

        let analysis = `
                    <div class="profit-breakdown">
                        <div class="metric">
                            <span class="label">Inversión inicial:</span>
                            <span class="value">$${acquisitionCost.toFixed(2)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Ingresos máximos potenciales:</span>
                            <span class="value">$${maxRevenue.toFixed(2)}</span>
                        </div>
                        <div class="metric ${profit >= 0 ? 'profit' : 'loss'}">
                            <span class="label">Ganancia estimada:</span>
                            <span class="value">$${profit.toFixed(2)}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Margen de ganancia:</span>
                            <span class="value ${margin >= 0 ? 'positive' : 'negative'}">${margin}%</span>
                        </div>
                        <div class="metric">
                            <span class="label">ROI:</span>
                            <span class="value ${roi >= 0 ? 'positive' : 'negative'}">${roi}%</span>
                        </div>
                    </div>
                `;

        const profitAnalysis = document.getElementById('profitAnalysis');
        const profitIndicator = document.getElementById('profitIndicator');

        if (profitAnalysis && profitIndicator) {
            profitAnalysis.innerHTML = analysis;
            profitIndicator.style.display = 'block';
        }
    } else {
        document.getElementById('profitIndicator').style.display = 'none';
    }
}

function updateProfilesSection(existingProfiles = null) {
    const deviceCount = parseInt(document.getElementById('devices').value) || 1;
    const container = document.getElementById('profiles-container');

    container.innerHTML = '';

    for (let i = 0; i < deviceCount; i++) {
        const profile = existingProfiles && existingProfiles[i] ? existingProfiles[i] : { name: `Perfil ${i + 1}`, pin: 'Sin pin', available: true };

        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile-item';
        profileDiv.innerHTML = `
                    <div class="profile-fields">
                        <input type="text" class="form-control profile-name" placeholder="Nombre del perfil" value="${escapeHTML(profile.name)}" aria-label="Nombre del perfil ${i + 1}" tabindex="0">
                        <input type="text" class="form-control profile-pin" placeholder="PIN (opcional)" value="${escapeHTML(profile.pin)}" aria-label="PIN del perfil ${i + 1}" tabindex="0">
                        <button type="button" class="btn btn-danger btn-sm remove-profile" onclick="removeProfile(this)" ${i === 0 && deviceCount === 1 ? 'style="display: none;"' : ''} aria-label="Eliminar perfil" tabindex="0">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                `;
        container.appendChild(profileDiv);
    }
}

function addProfile() {
    const container = document.getElementById('profiles-container');
    const profileCount = container.children.length + 1;

    const profileDiv = document.createElement('div');
    profileDiv.className = 'profile-item';
    profileDiv.innerHTML = `
                <div class="profile-fields">
                    <input type="text" class="form-control profile-name" placeholder="Nombre del perfil" value="Perfil ${profileCount}" aria-label="Nombre del perfil ${profileCount}" tabindex="0">
                    <input type="text" class="form-control profile-pin" placeholder="PIN (opcional)" value="Sin pin" aria-label="PIN del perfil ${profileCount}" tabindex="0">
                    <button type="button" class="btn btn-danger btn-sm remove-profile" onclick="removeProfile(this)" aria-label="Eliminar perfil" tabindex="0">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            `;
    container.appendChild(profileDiv);

    document.getElementById('devices').value = container.children.length;
    calculateProfitMargin();
}

function removeProfile(button) {
    const container = document.getElementById('profiles-container');
    if (container.children.length > 1) {
        button.closest('.profile-item').remove();

        const profiles = container.querySelectorAll('.profile-item');
        profiles.forEach((profile, index) => {
            const nameInput = profile.querySelector('.profile-name');
            if (nameInput.value.startsWith('Perfil ')) {
                nameInput.value = `Perfil ${index + 1}`;
            }
        });

        document.getElementById('devices').value = profiles.length;
        calculateProfitMargin();
    }
}

async function saveAccount(accountId) {
    const form = document.getElementById('account-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const formData = new FormData(form);

    const platform = sanitizeInput(formData.get('platform'));
    const customPlatform = sanitizeInput(formData.get('customPlatform'));
    const email = sanitizeInput(formData.get('email'));
    const password = sanitizeInput(formData.get('password'));
    const devices = parseInt(formData.get('devices'));
    const pricePerProfile = parseFloat(formData.get('pricePerProfile'));
    const fullAccountPrice = parseFloat(formData.get('fullAccountPrice'));
    const acquisitionCost = parseFloat(formData.get('acquisitionCost'));
    const renewalCost = parseFloat(formData.get('renewalCost'));
    const supplier = sanitizeInput(formData.get('supplier') || '');
    const renewalDate = formData.get('renewalDate') || null;

    if (platform === 'Otro' && !customPlatform) {
        modal.alert('Por favor especifica el nombre de la plataforma personalizada.', 'Plataforma Personalizada', 'warning');
        return;
    }

    const profiles = [];
    const profileItems = document.querySelectorAll('.profile-item');
    profileItems.forEach(item => {
        const nameInput = item.querySelector('.profile-name');
        const pinInput = item.querySelector('.profile-pin');
        if (nameInput) {
            const name = sanitizeInput(nameInput.value) || 'Sin nombre';
            const pin = sanitizeInput(pinInput ? pinInput.value : '') || 'Sin pin';
            profiles.push({
                name: name,
                pin: pin,
                available: true
            });
        }
    });

    let accountToSave;

    if (accountId) {
        accountToSave = accounts.find(acc => acc.id === accountId);
        if (!accountToSave) {
            modal.alert('Error: Cuenta no encontrada para actualizar.', 'Error', 'error');
            return;
        }
        Object.assign(accountToSave, {
            platform: platform === 'Otro' ? customPlatform : platform,
            email: email,
            password: password,
            devices: devices,
            pricePerProfile: pricePerProfile,
            fullAccountPrice: fullAccountPrice,
            acquisitionCost: acquisitionCost,
            supplier: supplier,
            renewalCost: renewalCost,
            renewalDate: renewalDate,
        });

        const existingProfilesMap = new Map(accountToSave.profiles.map(p => [p.name, p]));
        accountToSave.profiles = profiles.map(newProfile => {
            const existing = existingProfilesMap.get(newProfile.name);
            if (existing) {
                return {
                    ...existing,
                    name: newProfile.name,
                    pin: newProfile.pin
                };
            }
            return newProfile;
        });

    } else {
        accountToSave = {
            id: Date.now().toString(),
            platform: platform === 'Otro' ? customPlatform : platform,
            email: email,
            password: password,
            devices: devices,
            pricePerProfile: pricePerProfile,
            fullAccountPrice: fullAccountPrice,
            profiles: profiles,
            status: 'Disponible',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            acquisitionCost: acquisitionCost,
            supplier: supplier,
            renewalCost: renewalCost,
            renewalDate: renewalDate,
            totalEarned: 0
        };
        accounts.push(accountToSave);
    }

    try {
        await saveToFirebase('accounts', accountToSave);
        renderAll();
        financialManager.updateFinancialDashboard();
        modal.close();
        modal.toast(`Cuenta ${accountId ? 'actualizada' : 'agregada'} correctamente.`, 'success');
    } catch (error) {
        console.error('Error saving account:', error);
        modal.toast(`Error al guardar la cuenta: ${error.message}`, 'error');
    }
}

function editAccount(id) {
    openAddAccountModal(id);
}

async function deleteAccount(id) {
    const confirmed = await modal.confirm('Â¿Estás seguro de que deseas eliminar esta cuenta? Esta acción es irreversible.', 'Eliminar Cuenta');
    if (confirmed) {
        try {
            await deleteFromFirebase('accounts', id);
            accounts = accounts.filter(acc => acc.id !== id);
            renderAll();
            modal.toast('Cuenta eliminada correctamente.', 'success');
        } catch (error) {
            console.error('Error deleting account:', error);
            modal.toast(`Error al eliminar la cuenta: ${error.message}`, 'error');
        }
    }
}

function viewAccountDetails(id) {
    const account = accounts.find(acc => acc.id === id);
    if (!account) {
        modal.alert('Cuenta no encontrada.', 'Error', 'error');
        return;
    }

    const detailsHtml = `
                <div class="modal-header">
                    <h3><i class="fas fa-info-circle" aria-hidden="true"></i> Detalles de la Cuenta</h3>
                    <button class="modal-close" type="button" onclick="modal.close()" aria-label="Cerrar modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Plataforma:</strong> ${escapeHTML(account.platform)}</p>
                    <p><strong>Email:</strong> ${escapeHTML(account.email)}</p>
                    <p><strong>Contraseña:</strong> ${escapeHTML(account.password)}</p>
                    <p><strong>Precio por Perfil:</strong> $${(account.pricePerProfile || 0).toFixed(2)}</p>
                    <p><strong>Precio Total:</strong> $${(account.fullAccountPrice || 0).toFixed(2)}</p>
                    <p><strong>Costo de Adquisición:</strong> $${(account.acquisitionCost || 0).toFixed(2)}</p>
                    <p><strong>Proveedor:</strong> ${escapeHTML(account.supplier || 'No especificado')}</p>
                    <p><strong>Costo de Renovación:</strong> $${(account.renewalCost || 0).toFixed(2)}</p>
                    <p><strong>Próxima Renovación:</strong> ${account.renewalDate ? new Date(account.renewalDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Estado:</strong> ${escapeHTML(account.status)}</p>
                    <p><strong>Perfiles:</strong></p>
                    <ul>
                        ${account.profiles.map(profile => `<li>${escapeHTML(profile.name)} (PIN: ${escapeHTML(profile.pin)}) - ${profile.available ? 'Disponible' : 'Ocupado'}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="btn" type="button" onclick="modal.close()" tabindex="0">Cerrar</button>
                </div>
            `;

    modal.open(detailsHtml, { size: 'medium' });
}

function openAddClientModal(clientId = null) {
    let client = null;
    if (clientId) {
        client = clients.find(c => c.id === clientId);
        if (!client) {
            modal.alert('Cliente no encontrado para editar.', 'Error', 'error');
            return;
        }
    }

    const formConfig = {
        fields: [
            { type: 'text', name: 'name', label: 'Nombre Completo', required: true, value: client ? client.name : '' },
            { type: 'tel', name: 'whatsApp', label: 'WhatsApp', required: true, placeholder: '+593 99 123 4567', value: client ? client.whatsApp : '' },
            { type: 'email', name: 'email', label: 'Email (opcional)', value: client ? client.email : '' },
            { type: 'textarea', name: 'notes', label: 'Notas', placeholder: 'Información adicional del cliente...', value: client ? client.notes : '' }
        ]
    };

    modal.form(formConfig, `${clientId ? 'Editar Cliente Manual' : 'Agregar Nuevo Cliente Manual'}`).then(async data => {
        if (data) {
            const name = sanitizeInput(data.name);
            const whatsApp = formatEcuadorianPhone(data.whatsApp);
            const email = sanitizeInput(data.email || '');
            const notes = sanitizeInput(data.notes || '');

            if (!whatsApp) {
                modal.alert('Formato de teléfono ecuatoriano inválido. Ej: 09XXXXXXXX o +593XXXXXXXXX', 'Error de Teléfono', 'error');
                return;
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                modal.alert('El formato del email es inválido.', 'Error de Email', 'error');
                return;
            }

            let clientToSave;
            if (clientId) {
                clientToSave = clients.find(c => c.id === clientId);
                Object.assign(clientToSave, {
                    name: name,
                    whatsApp: whatsApp,
                    email: email,
                    notes: notes
                });
            } else {
                clientToSave = {
                    id: Date.now().toString(),
                    name: name,
                    whatsApp: whatsApp,
                    email: email,
                    notes: notes,
                    purchases: 0,
                    lastPurchase: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                clients.push(clientToSave);
            }

            try {
                await saveToFirebase('clients', clientToSave);
                renderAll();
                modal.toast(`Cliente manual ${clientId ? 'actualizado' : 'agregado'} correctamente.`, 'success');
            } catch (error) {
                console.error('Error saving client:', error);
                modal.toast(`Error al guardar el cliente manual: ${error.message}`, 'error');
            }
        }
    });
}

async function deleteClient(id) {
    const confirmed = await modal.confirm('¿Estás seguro de que deseas eliminar este cliente manual? Esto no eliminar las ventas asociadas, pero el cliente aparecerá como "eliminado".', 'Confirmar Eliminación');
    if (confirmed) {
        try {
            clients = clients.filter(c => c.id !== id);

            await deleteFromFirebase('clients', id);
            renderAll();
            modal.toast('✅ Cliente manual eliminado correctamente.', 'success');
        } catch (error) {
            console.error('Error deleting client:', error);
            modal.toast(`Error al eliminar el cliente manual: ${error.message}`, 'error');
        }
    }
}

function openSaleModal(saleId = null) {
    let sale = null;
    if (saleId) {
        sale = sales.find(s => s.id === saleId);
        if (!sale) {
            modal.alert('Venta no encontrada para editar.', 'Error', 'error');
            return;
        }
    }

    if (accounts.length === 0) {
        modal.alert('Primero debes agregar al menos una cuenta.', 'Sin Cuentas', 'warning');
        return;
    }

    if (clients.length === 0 && users.length === 0) {
        modal.alert('Primero debes agregar al menos un cliente (manual o web).', 'Sin Clientes', 'warning');
        return;
    }

    const allClients = [
        ...clients.map(c => ({ value: c.id, text: `${c.name} (Manual)` })),
        ...users.map(u => ({ value: u.id, text: `${u.name} ${u.lastName || ''} (Web)` }))
    ];

    const clientOptions = allClients.map(c => ({ value: c.value, text: c.text }));
    const accountOptions = accounts.map(a => ({
        value: a.id,
        text: `${a.platform} - ${a.email}`
    }));

    const today = new Date();
    const endDateDefault = new Date();
    endDateDefault.setDate(today.getDate() + 30);

    const formConfig = {
        fields: [
            { type: 'select', name: 'clientId', label: 'Cliente', required: true, options: [{ value: '', text: 'Seleccionar cliente...' }, ...clientOptions], value: sale ? sale.clientId : '' },
            { type: 'select', name: 'accountId', label: 'Cuenta', required: true, options: [{ value: '', text: 'Seleccionar cuenta...' }, ...accountOptions], value: sale ? sale.accountId : '' },
            { type: 'number', name: 'profilesCount', label: 'Número de Perfiles', required: true, placeholder: '1', value: sale ? sale.profilesCount : '1', min: '1' },
            { type: 'date', name: 'startDate', label: 'Fecha de Inicio', required: true, value: sale ? sale.startDate : today.toISOString().split('T')[0] },
            { type: 'date', name: 'endDate', label: 'Fecha de Fin', required: true, value: sale ? sale.endDate : endDateDefault.toISOString().split('T')[0] },
            { type: 'number', name: 'total', label: 'Total ($)', required: true, placeholder: '0.00', value: sale ? (sale.total || 0).toFixed(2) : '', step: '0.01', min: '0' },
            {
                type: 'select', name: 'status', label: 'Estado', required: true, options: [
                    { value: 'Activa', text: 'Activa' },
                    { value: 'Inactiva', text: 'Inactiva' },
                    { value: 'Pendiente', text: 'Pendiente' }
                ], value: sale ? sale.status : 'Activa'
            },
            {
                type: 'select', name: 'paid', label: 'Pagado', required: true, options: [
                    { value: 'true', text: 'Sá­' },
                    { value: 'false', text: 'No' }
                ], value: sale ? sale.paid.toString() : 'false'
            }
        ]
    };

    modal.form(formConfig, `${saleId ? 'Editar Venta' : 'Nueva Venta'}`).then(async data => {
        if (!data) return;

        if (!data.clientId || !data.accountId || !data.profilesCount || !data.startDate || !data.endDate || !data.total || !data.status || !data.paid) {
            modal.alert('Por favor, completa todos los campos obligatorios.', 'Campos Incompletos', 'warning');
            return;
        }
        if (isNaN(parseFloat(data.total)) || parseFloat(data.total) < 0) {
            modal.alert('El total debe ser un número positivo.', 'Error de Monto', 'error');
            return;
        }
        if (parseInt(data.profilesCount) <= 0) {
            modal.alert('El número de perfiles debe ser al menos 1.', 'Error de Perfiles', 'error');
            return;
        }

        const newSaleData = {
            clientId: data.clientId,
            accountId: data.accountId,
            profilesCount: parseInt(data.profilesCount),
            startDate: data.startDate,
            endDate: data.endDate,
            total: parseFloat(data.total),
            status: sanitizeInput(data.status),
            paid: data.paid === 'true',
            isAutoPurchase: false
        };

        let saleToSave;
        let oldAccount = null;
        let oldClient = null;

        if (saleId) {
            saleToSave = sales.find(s => s.id === saleId);
            if (!saleToSave) {
                modal.alert('Error: Venta no encontrada para actualizar.', 'Error', 'error');
                return;
            }

            oldAccount = accounts.find(acc => acc.id === saleToSave.accountId);
            if (oldAccount) {
                oldAccount.totalEarned = (oldAccount.totalEarned || 0) - saleToSave.total;
                oldAccount.profiles.forEach(p => {
                    if (p.saleId === saleToSave.id) {
                        p.available = true;
                        delete p.soldTo;
                        delete p.saleId;
                    }
                });
                oldAccount.status = oldAccount.profiles.some(p => p.available) ? 'Disponible' : 'Ocupado';
            }

            oldClient = clients.find(c => c.id === saleToSave.clientId) || users.find(u => u.id === saleToSave.clientId);
            if (oldClient) {
                oldClient.purchases = Math.max(0, (oldClient.purchases || 0) - 1);
            }

            Object.assign(saleToSave, newSaleData);
        } else {
            saleToSave = { id: Date.now().toString(), ...newSaleData, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            sales.push(saleToSave);
        }

        const account = accounts.find(acc => acc.id === saleToSave.accountId);
        if (account) {
            account.totalEarned = (account.totalEarned || 0) + saleToSave.total;

            const availableProfiles = account.profiles.filter(p => p.available);
            let profilesAssigned = 0;
            for (let i = 0; i < availableProfiles.length && profilesAssigned < saleToSave.profilesCount; i++) {
                availableProfiles[i].available = false;
                availableProfiles[i].soldTo = saleToSave.clientId;
                availableProfiles[i].saleId = saleToSave.id;
                profilesAssigned++;
            }
            if (profilesAssigned < saleToSave.profilesCount) {
                modal.alert('No hay suficientes perfiles disponibles en esta cuenta. Se asignaron los disponibles.', 'Advertencia', 'warning');
            }
            account.status = account.profiles.some(p => p.available) ? 'Disponible' : 'Ocupado';

            const client = clients.find(c => c.id === saleToSave.clientId) || users.find(u => u.id === saleToSave.clientId);
            if (client) {
                client.purchases = (client.purchases || 0) + 1;
                client.lastPurchase = saleToSave.startDate;
            }

            try {
                const savePromises = [
                    saveToFirebase('sales', saleToSave),
                    saveToFirebase('accounts', account)
                ];
                if (client) savePromises.push(saveToFirebase(client.isWebClient ? 'users' : 'clients', client));
                if (oldAccount && oldAccount.id !== account.id) savePromises.push(saveToFirebase('accounts', oldAccount));
                if (oldClient && oldClient.id !== client.id) savePromises.push(saveToFirebase(oldClient.isWebClient ? 'users' : 'clients', oldClient));

                await Promise.all(savePromises);
                renderAll();
                financialManager.updateFinancialDashboard();
                modal.close();
                modal.toast(`Venta ${saleId ? 'actualizada' : 'completada'} correctamente.`, 'success');

                if (!saleId) generateWhatsAppFromSale(saleToSave.id);

            } catch (error) {
                console.error('Error al guardar la venta:', error);
                modal.toast(`Error al completar/actualizar la venta: ${error.message}`, 'error');
            }
        } else {
            modal.alert('âŒ Cuenta no encontrada. No se puede completar la venta.', 'Error', 'error');
        }
    });
}

async function deleteSale(id) {
    const confirmed = await modal.confirm('Â¿Estás seguro de que deseas eliminar esta venta? Esto liberará los perfiles asociados y ajustará las ganancias de la cuenta.', 'Confirmar Eliminación');
    if (confirmed) {
        try {
            const saleToDelete = sales.find(s => s.id === id);
            if (!saleToDelete) return modal.alert('Venta no encontrada.', 'error');

            const account = accounts.find(acc => acc.id === saleToDelete.accountId);
            if (account) {
                account.totalEarned = (account.totalEarned || 0) - saleToDelete.total;
                account.profiles.forEach(p => {
                    if (p.saleId === saleToDelete.id) {
                        p.available = true;
                        delete p.soldTo;
                        delete p.saleId;
                    }
                });
                account.status = account.profiles.some(p => p.available) ? 'Disponible' : 'Ocupado';
                await saveToFirebase('accounts', account);
            }

            const client = clients.find(c => c.id === saleToDelete.clientId) || users.find(u => u.id === saleToDelete.clientId);
            if (client) {
                client.purchases = Math.max(0, (client.purchases || 0) - 1);
                const remainingSalesForClient = sales.filter(s => s.clientId === client.id && s.id !== saleToDelete.id);
                client.lastPurchase = remainingSalesForClient.length
                    ? remainingSalesForClient.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0].startDate
                    : null;
                await saveToFirebase(client.isWebClient ? 'users' : 'clients', client);
            }

            sales = sales.filter(s => s.id !== id);
            await deleteFromFirebase('sales', id);

            renderAll();
            financialManager.updateFinancialDashboard();
            modal.toast('✅ Venta eliminada correctamente.', 'success');
        } catch (error) {
            console.error('Error deleting sale:', error);
            modal.toast(`Error al eliminar la venta: ${error.message}`, 'error');
        }
    }
}

function generateWhatsAppFromSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        modal.alert('Venta no encontrada para generar mensaje.', 'Error', 'error');
        return;
    }

    const client = clients.find(c => c.id === sale.clientId) || users.find(u => u.id === sale.clientId);
    const account = accounts.find(acc => acc.id === sale.accountId);

    if (!client || !account) {
        modal.alert('Cliente o cuenta asociada a la venta no encontrada.', 'Error', 'error');
        return;
    }

    const assignedProfiles = account.profiles.filter(p => p.saleId === saleId);

    let message = `Hola!😊 ${client.name},\n\n`;
    message += `Aquí tienes los datos de tu cuenta:\n\n`;
    message += `📲 *PLATAFORMA:* ${account.platform}\n`;
    message += `📧 *Usuario:* ${account.email}\n`;
    message += `🔐 *Contraseña:* ${account.password}\n`;
    message += `🆔 *Perfil${assignedProfiles.length > 1 ? 'es' : ''}:* ${assignedProfiles.map(p => p.name).join(', ')}\n`;
    message += `🔑  *PIN:* ${assignedProfiles.map(p => p.pin).join(', ')}\n`;
    message += `📅 *Vigencia:* ${new Date(sale.startDate).toLocaleDateString()} - ${new Date(sale.endDate).toLocaleDateString()}\n\n`;
    message += `¡Que disfrutes tu servicio!`;

    navigator.clipboard.writeText(message).then(() => {
        modal.toast('Mensaje copiado al portapapeles. ¡Listo para enviar por WhatsApp!', 'success');
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            modal.toast('Mensaje copiado al portapapeles. ¡Listo para enviar por WhatsApp!', 'success');
        } finally {
            document.body.removeChild(textArea);
        }
    });
}

function openAddServiceModal(serviceId = null) {
    let service = null;
    if (serviceId) {
        service = services.find(s => s.id === serviceId);
        if (!service) {
            modal.alert('Servicio no encontrado para editar.', 'Error', 'error');
            return;
        }
    }

    const platforms = [...new Set(accounts.map(acc => acc.platform))];
    const platformOptions = [
        { value: '', text: 'Seleccionar plataforma...' },
        ...platforms.map(platform => ({ value: platform, text: platform }))
    ];

    const formConfig = {
        fields: [
            { type: 'text', name: 'name', label: 'Nombre del Servicio', required: true, value: service ? service.name : '', placeholder: 'Ej: Netflix Premium' },
            { type: 'textarea', name: 'description', label: 'Descripción', required: true, value: service ? service.description : '', placeholder: 'Describe las caracterá­sticas del servicio...' },
            { type: 'number', name: 'price', label: 'Precio ($)', required: true, value: service ? (service.price || 0).toFixed(2) : '', step: '0.01', min: '0', placeholder: '0.00' },
            { type: 'select', name: 'platform', label: 'Plataforma Asociada', required: true, options: platformOptions, value: service ? service.platform : '' },
            { type: 'number', name: 'profilesPerPurchase', label: 'Perfiles por Compra', required: true, value: service ? (service.profilesPerPurchase || 1) : '1', min: '1', placeholder: '1' },
            { type: 'text', name: 'imageUrl', label: 'URL de Imagen', required: true, value: service ? service.imageUrl : '', placeholder: 'https://ejemplo.com/imagen.jpg' }
        ]
    };

    modal.form(formConfig, `${serviceId ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}`).then(async data => {
        if (data) {
            const name = sanitizeInput(data.name);
            const description = sanitizeInput(data.description);
            const price = parseFloat(data.price);
            const platform = sanitizeInput(data.platform);
            const profilesPerPurchase = parseInt(data.profilesPerPurchase);
            const imageUrl = sanitizeInput(data.imageUrl);

            if (isNaN(price) || price < 0) {
                modal.alert('El precio debe ser un número positivo.', 'Error de Precio', 'error');
                return;
            }
            if (isNaN(profilesPerPurchase) || profilesPerPurchase < 1) {
                modal.alert('El número de perfiles por compra debe ser al menos 1.', 'Error de Perfiles', 'error');
                return;
            }
            if (!imageUrl.startsWith('http')) {
                modal.alert('La URL de la imagen debe comenzar con http:// o https://', 'URL Inválida', 'error');
                return;
            }

            let serviceToSave;
            if (serviceId) {
                serviceToSave = services.find(s => s.id === serviceId);
                Object.assign(serviceToSave, {
                    name: name,
                    description: description,
                    price: price,
                    platform: platform,
                    profilesPerPurchase: profilesPerPurchase,
                    imageUrl: imageUrl
                });
            } else {
                serviceToSave = {
                    id: Date.now().toString(),
                    name: name,
                    description: description,
                    price: price,
                    platform: platform,
                    profilesPerPurchase: profilesPerPurchase,
                    imageUrl: imageUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                services.push(serviceToSave);
            }

            try {
                await saveToFirebase('services', serviceToSave);
                renderServices();
                renderAvailableAccountsCatalog();
                modal.toast(`Servicio ${serviceId ? 'actualizado' : 'agregado'} correctamente.`, 'success');
            } catch (error) {
                console.error('Error saving service:', error);
                modal.toast(`Error al guardar el servicio: ${error.message}`, 'error');
            }
        }
    });
}

async function deleteService(id) {
    const confirmed = await modal.confirm('Â¿Estás seguro de que deseas eliminar este servicio? Esta acción es irreversible.', 'Eliminar Servicio');
    if (confirmed) {
        try {
            await deleteFromFirebase('services', id);
            services = services.filter(s => s.id !== id);
            renderServices();
            modal.toast('Servicio eliminado correctamente.', 'success');
        } catch (error) {
            console.error('Error deleting service:', error);
            modal.toast(`Error al eliminar el servicio: ${error.message}`, 'error');
        }
    }
}

// ============= INICIALIZACIÓN =============
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar configuración
    const configLoaded = initializeConfig();
    
    if (!configLoaded) {
        console.warn('Config.js no encontrado, usando configuración de respaldo');
    }

    // Validar configuración
    if (!validateConfig()) {
        return;
    }

    const firebaseInitialized = await initializeFirebase(firebaseConfig);
    if (firebaseInitialized) {
        checkAuthState();
    } else {
        modal.alert('Error al inicializar Firebase. Verifica la configuración.', 'Error de Inicialización', 'error');
    }
});

// Función para alternar visibilidad de contraseña
function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = input.nextElementSibling;
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}