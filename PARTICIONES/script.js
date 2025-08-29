// ============= CONFIGURACIÓN FIREBASE =============
// Reemplaza esta configuración con la de tu proyecto Firebase
// Obtén los SDK que necesitas aquí: https://firebase.google.com/docs/web/setup#available-libraries

    const firebaseConfig = {
    apiKey: "AIzaSyDNINcVmzUG65S75zDp_7yPN41zyfLunr0",
    authDomain: "control-de-c.firebaseapp.com",
    databaseURL: "https://control-de-c-default-rtdb.firebaseio.com",
    projectId: "control-de-c",
    storageBucket: "control-de-c.firebasestorage.app",
    messagingSenderId: "332573734404",
    appId: "1:332573734404:web:6f2a4a064bac6febec6751"
    };
       const firebaseInitialized = initializeFirebase(firebaseConfig);
   if (firebaseInitialized) {
       checkAuthState(); // Llama a esta función solo si Firebase se inicializa correctamente
   } else {
       console.error('Firebase no se inicializó correctamente.');
   }
   
   
/* REEMPLAZAR_CON_TU_CONFIG */

// ============= CONFIGURACIÓN IMGBB =============
const IMGBB_API_KEY = "8ce353ca72771ab928e15bd597685042"; // Obtén tu API Key gratuita en https://api.imgbb.com/

// ============= VARIABLES GLOBALES =============
let activeModalInstance = null;
let db; // Instancia de Firestore
let accounts = [];
let clients = []; // Clientes del admin (manuales)
let sales = [];
let expenses = [];
let webClients = []; // Clientes del portal web (ahora 'users' en Firestore)
let rechargeRequests = []; // Solicitudes de recarga
let currentUser = null; // Usuario logeado (admin o cliente web)
let financialManager = null;
let webClientManager = null; // Renombrado a UserManager para manejar todos los usuarios
let rechargeManager = null; // Declarar rechargeManager globalmente

// UID del administrador para las reglas de Firebase (debe coincidir con el UID del usuario admin en Firebase Auth)
const ADMIN_UID = '6MoZbkXBd8QCDh3QzQwDkiviw6u2'; // REEMPLAZAR CON EL UID REAL DE TU ADMIN

// Número de WhatsApp del administrador para notificaciones
const ADMIN_WHATSAPP_NUMBER = '593984952217'; // Formato sin '+' para la URL de WhatsApp

// Monto mínimo de recarga
const MIN_RECHARGE_AMOUNT = 5.00;

// Detectar entorno (para modo demo en entornos específicos como Claude.ai o archivos locales)
const isClaudeEnvironment = window.location.hostname.includes('claude.ai') || 
                           window.location.hostname.includes('artifact') ||
                           !window.location.hostname;

                           // Función global para normalizar fechas
function normalizeDate(value) {
if (!value) return new Date(0); // fecha mínima
if (typeof value.toDate === "function") return value.toDate(); // Timestamp Firestore
if (typeof value === "string" || typeof value === "number") return new Date(value);
return new Date(0);
}

// Funciones de modales para Clientes
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

    modal.form(formConfig, `${clientId ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}`).then(async data => {
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
                    createdAt: new Date().toISOString()
                };
                clients.push(clientToSave);
            }

            try {
                await saveToFirebase('clients', clientToSave);
                renderAll();
                modal.toast(`Cliente ${clientId ? 'actualizado' : 'agregado'} correctamente.`, 'success');
            } catch (error) {
                console.error('Error saving client:', error);
                modal.toast(`Error al guardar el cliente: ${error.message}`, 'error');
            }
        }
    });
}

function editClient(id) {
    openAddClientModal(id);
}

async function deleteClient(id) {
    const confirmed = await modal.confirm('¿Estás seguro de que deseas eliminar este cliente? Esto no eliminará las ventas asociadas, pero el cliente aparecerá como "eliminado".', 'Confirmar Eliminación');
    if (confirmed) {
        try {
            clients = clients.filter(c => c.id !== id);

            await deleteFromFirebase('clients', id);
            renderAll();
            modal.toast('✅ Cliente eliminado correctamente.', 'success');
        } catch (error) {
            console.error('Error deleting client:', error);
            modal.toast(`Error al eliminar el cliente: ${error.message}`, 'error');
        }
    }
}


// Funciones de modales para Ventas
function openSaleModal(saleId = null) {
// Cerrar modal anterior si existe
if (activeModalInstance) {
    activeModalInstance.close();
    activeModalInstance = null;
}

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

if (clients.length === 0 && webClients.filter(wc => wc.status === 'approved').length === 0) {
    modal.alert('Primero debes agregar al menos un cliente (manual o web aprobado).', 'Sin Clientes', 'warning');
    return;
}

const allClients = [
    ...clients.map(c => ({ value: c.id, text: `${c.name} (Manual)` })),
    ...webClients.filter(wc => wc.status === 'approved').map(wc => ({ value: wc.id, text: `${wc.name} ${wc.lastName || ''} (Web)` }))
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
        { type: 'select', name: 'status', label: 'Estado', required: true, options: [
            { value: 'Activa', text: 'Activa' },
            { value: 'Inactiva', text: 'Inactiva' },
            { value: 'Pendiente', text: 'Pendiente' }
        ], value: sale ? sale.status : 'Activa' },
        { type: 'select', name: 'paid', label: 'Pagado', required: true, options: [
            { value: 'true', text: 'Sí' },
            { value: 'false', text: 'No' }
        ], value: sale ? sale.paid.toString() : 'false' }
    ]
};

// Abrir el modal y guardar la instancia
activeModalInstance = modal.form(formConfig, `${saleId ? 'Editar Venta' : 'Nueva Venta'}`);

activeModalInstance.then(async data => {
    // Limpiar referencia al cerrar el modal
    activeModalInstance = null;

    if (!data) return;

    // Validaciones
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

        oldClient = clients.find(c => c.id === saleToSave.clientId) || webClients.find(wc => wc.id === saleToSave.clientId);
        if (oldClient) {
            oldClient.purchases = Math.max(0, (oldClient.purchases || 0) - 1);
        }

        Object.assign(saleToSave, newSaleData);
    } else {
        saleToSave = { id: Date.now().toString(), ...newSaleData, createdAt: new Date().toISOString() };
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

        const client = clients.find(c => c.id === saleToSave.clientId) || webClients.find(wc => wc.id === saleToSave.clientId);
        if (client) {
            client.purchases = (client.purchases || 0) + 1;
            client.lastPurchase = saleToSave.startDate;
        }

        try {
            const savePromises = [
                saveToFirebase('sales', saleToSave),
                saveToFirebase('accounts', account)
            ];
            if (client) savePromises.push(saveToFirebase(client.isWebClient ? 'webClients' : 'clients', client));
            if (oldAccount && oldAccount.id !== account.id) savePromises.push(saveToFirebase('accounts', oldAccount));
            if (oldClient && oldClient.id !== client.id) savePromises.push(saveToFirebase(oldClient.isWebClient ? 'webClients' : 'clients', oldClient));

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
        modal.alert('❌ Cuenta no encontrada. No se puede completar la venta.', 'Error', 'error');
    }
});
}

// Función para eliminar venta
async function deleteSale(id) {
const confirmed = await modal.confirm('¿Estás seguro de que deseas eliminar esta venta? Esto liberará los perfiles asociados y ajustará las ganancias de la cuenta.', 'Confirmar Eliminación');
if (!confirmed) return;

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

    const client = clients.find(c => c.id === saleToDelete.clientId) || webClients.find(wc => wc.id === saleToDelete.clientId);
    if (client) {
        client.purchases = Math.max(0, (client.purchases || 0) - 1);
        const remainingSalesForClient = sales.filter(s => s.clientId === client.id && s.id !== saleToDelete.id);
        client.lastPurchase = remainingSalesForClient.length
            ? remainingSalesForClient.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0].startDate
            : null;
        await saveToFirebase(client.isWebClient ? 'webClients' : 'clients', client);
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


function generateWhatsAppFromSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        modal.alert('Venta no encontrada para generar mensaje.', 'Error', 'error');
        return;
    }

    const client = clients.find(c => c.id === sale.clientId) || webClients.find(wc => wc.id === sale.clientId);
    const account = accounts.find(acc => acc.id === sale.accountId);

    if (!client || !account) {
        modal.alert('Cliente o cuenta asociada a la venta no encontrada.', 'Error', 'error');
        return;
    }

    const assignedProfiles = account.profiles.filter(p => p.saleId === saleId);

    let message = `Hola! 😊 ${client.name},\n\n`;
    message += `Aquí tienes los datos de tu cuenta:\n\n`;
    message += `📲 *PLATAFORMA:* ${account.platform}\n`;
    message += `📧 *Usuario:* ${account.email}\n`;
    message += `🔐 *Contraseña:* ${account.password}\n`;
    message += `🆔 *Perfil${assignedProfiles.length > 1 ? 'es' : ''}:* ${assignedProfiles.map(p => p.name).join(', ')}\n`;
    message += `🔑 *PIN:* ${assignedProfiles.map(p => p.pin).join(', ')}\n`;
    message += `📅 *Vigencia:* ${new Date(sale.startDate).toLocaleDateString()} - ${new Date(sale.endDate).toLocaleDateString()}\n\n`;
    message += `¡Que disfrutes tu servicio!`;

    navigator.clipboard.writeText(message).then(() => {
        modal.toast('📱 Mensaje copiado al portapapeles. ¡Listo para enviar por WhatsApp!', 'success');
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            modal.toast('📱 Mensaje copiado al portapapeles. ¡Listo para enviar por WhatsApp!', 'success');
        } catch (ex) {
            modal.alert('No se pudo copiar automáticamente. Por favor, copia el siguiente texto manualmente:\n\n' + message, 'Error al Copiar', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    });
}

// Función para escapar HTML y prevenir XSS
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

        function renderAccounts(accounts) {
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
            <select class="form-control status-dropdown"
                    onchange="updateAccountStatus('${account.id}', this.value)">
                <option value="Disponible" ${account.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
                <option value="Ocupado" ${account.status === 'Ocupado' ? 'selected' : ''}>Ocupado</option>
                <option value="No disponible" ${account.status === 'No disponible' ? 'selected' : ''}>No disponible</option>
                <option value="Renovar" ${account.status === 'Renovar' ? 'selected' : ''}>Renovar</option>
            </select>
        </td>
        <td>
            <button class="btn btn-sm" onclick="editAccount('${account.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteAccount('${account.id}')"><i class="fas fa-trash"></i></button>
            <button class="btn btn-secondary btn-sm" onclick="viewAccountDetails('${account.id}')"><i class="fas fa-eye"></i></button>
        </td>
    `;
    tbody.appendChild(row);
});
}

    

// ============= SISTEMA DE MODALES =============
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.init();
        this.lastFocusedElement = null;
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.close();
            }
        });
    }

    open(content, options = {}) {
        // Close any existing modal before opening a new one
        if (this.activeModal) {
            this.close();
        }
        this.lastFocusedElement = document.activeElement;

        const modal = this.createModal(content, options);
        this.showModal(modal);
        activeModalInstance = this; // Set global instance
        return modal;
    }

    confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const content = `
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle" aria-hidden="true"></i> ${title}</h3>
                    <button class="modal-close" onclick="modal.close(); modal.resolveConfirm(false)" aria-label="Cerrar modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="modal.close(); modal.resolveConfirm(false)" tabindex="0">Cancelar</button>
                    <button class="btn btn-danger" onclick="modal.close(); modal.resolveConfirm(true)" tabindex="0">Confirmar</button>
                </div>
            `;

            this.resolveConfirm = resolve;
            this.open(content, { size: 'small' });
        });
    }

    toast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        toastMessage.textContent = message;
        toast.className = 'toast-notification show'; // Reset classes

        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                toast.classList.add('success');
                break;
            case 'error':
                iconClass = 'fas fa-times-circle';
                toast.classList.add('error');
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                toast.classList.add('warning');
                break;
            default:
                iconClass = 'fas fa-info-circle';
                toast.classList.add('info');
        }
        toastIcon.className = iconClass;

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.remove('success', 'error', 'warning', 'info'); // Clean up classes
        }, duration);
    }

    alert(message, title = 'Información', type = 'info') {
        const icons = {
            'info': 'fas fa-info-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle'
        };

        const content = `
            <div class="modal-header">
                <h3><i class="${icons[type]}" aria-hidden="true"></i> ${title}</h3>
                <button class="modal-close" onclick="modal.close()" aria-label="Cerrar modal">&times;</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="modal.close()" tabindex="0">Aceptar</button>
            </div>
        `;

        this.open(content, { size: 'small' });
    }

    form(config, title) {
        return new Promise((resolve) => {
            let formHTML = `
                <div class="modal-header">
                    <h3><i class="fas fa-edit" aria-hidden="true"></i> ${title}</h3>
                    <button class="modal-close" onclick="modal.close(); modal.resolveForm(null)" aria-label="Cerrar modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="modal-form" aria-label="${title}">
            `;
            
            config.fields.forEach(field => {
                formHTML += this.createFormField(field);
            });
            
            formHTML += `
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="modal.close(); modal.resolveForm(null)" tabindex="0">Cancelar</button>
                    <button class="btn" onclick="modal.submitForm()" tabindex="0">Enviar</button>
                </div>
            `;

            this.resolveForm = resolve;
            this.open(formHTML, { size: 'medium' });
        });
    }

    submitForm() {
        const form = document.getElementById('modal-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        this.close();
        this.resolveForm(data);
    }

    createFormField(field) {
        const { type, name, label, placeholder, required, options, value, min, max, step, onchange, id, className, disabled, accept, multiple, helpText } = field;
        
        let fieldHTML = `<div class="form-group">`;
        if (label) fieldHTML += `<label for="${id || name}">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>`;
        
        switch (type) {
            case 'text':
            case 'email':
            case 'password':
            case 'tel':
            case 'number':
            case 'date':
                fieldHTML += `<input type="${type}" name="${name}" id="${id || name}" class="form-control ${className || ''}" placeholder="${placeholder || ''}" ${required ? 'required' : ''} value="${value !== undefined ? escapeHTML(value) : ''}" tabindex="0" aria-required="${required ? 'true' : 'false'}" ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''} ${step !== undefined ? `step="${step}"` : ''} ${onchange ? `onchange="${onchange}"` : ''} ${disabled ? 'disabled' : ''}>`;
                break;
            case 'textarea':
                fieldHTML += `<textarea name="${name}" id="${id || name}" class="form-control ${className || ''}" rows="3" placeholder="${placeholder || ''}" ${required ? 'required' : ''} tabindex="0" aria-required="${required ? 'true' : 'false'}" ${onchange ? `onchange="${onchange}"` : ''} ${disabled ? 'disabled' : ''}>${value !== undefined ? escapeHTML(value) : ''}</textarea>`;
                break;
            case 'select':
                fieldHTML += `<select name="${name}" id="${id || name}" class="form-control ${className || ''}" ${required ? 'required' : ''} tabindex="0" aria-required="${required ? 'true' : 'false'}" ${onchange ? `onchange="${onchange}"` : ''} ${disabled ? 'disabled' : ''}>`;
                if (options) {
                    options.forEach(option => {
                        fieldHTML += `<option value="${escapeHTML(option.value)}" ${value == option.value ? 'selected' : ''}>${escapeHTML(option.text)}</option>`;
                    });
                }
                fieldHTML += `</select>`;
                break;
            case 'file':
                fieldHTML += `<input type="file" name="${name}" id="${id || name}" class="form-control ${className || ''}" ${required ? 'required' : ''} tabindex="0" aria-required="${required ? 'true' : 'false'}" ${onchange ? `onchange="${onchange}"` : ''} ${disabled ? 'disabled' : ''} ${accept ? `accept="${accept}"` : ''} ${multiple ? 'multiple' : ''}>`;
                break;
            case 'html': // For custom HTML content within a form group
                fieldHTML += value;
                break;
        }
        if (helpText) {
            fieldHTML += `<small class="form-text">${helpText}</small>`;
        }
        fieldHTML += `</div>`;
        return fieldHTML;
    }

    createModal(content, options = {}) {
        const { size = 'medium' } = options;
        
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;

        return modal;
    }

    showModal(modal) {
        this.activeModal = modal;
        const overlay = document.getElementById('modal-overlay');
        
        overlay.appendChild(modal);
        overlay.classList.add('active');
        document.body.classList.add('modal-open');

        // Add a slight delay to ensure the modal is rendered before focusing
        setTimeout(() => {
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusableElement = focusableElements[0];
            if (firstFocusableElement) {
                firstFocusableElement.focus();
            }
        }, 50); // Small delay
    }

    close() {
        if (!this.activeModal) return;

        this.activeModal.classList.remove('modal-show');
        
        setTimeout(() => {
            if (this.activeModal && this.activeModal.parentNode) {
                this.activeModal.parentNode.removeChild(this.activeModal);
            }
            this.activeModal = null;
            activeModalInstance = null; // Clear global instance
            
            const overlay = document.getElementById('modal-overlay');
            overlay.classList.remove('active');
            document.body.classList.remove('modal-open');

            if (this.lastFocusedElement) {
                this.lastFocusedElement.focus();
                this.lastFocusedElement = null;
            }
        }, 300);
    }
}


const modal = new ModalManager();

        

// ============= SISTEMA FINANCIERO (ADMIN) =============
class FinancialManager {
    constructor() {
        this.expenses = [];
        // Expenses are loaded via loadData() and loadExpensesFromFirebase()
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
            
            // Ensure totalEarned is calculated based on current sales data
            const accountSales = sales.filter(sale => sale.accountId === account.id);
            const accountRevenue = accountSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
            account.totalEarned = accountRevenue; // Update account's totalEarned
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
            losingContainer.innerHTML = '<div class="no-data"><i class="fas fa-check-circle" aria-hidden="true"></i> ¡Todas las cuentas son rentables!</div>';
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
        const totalClients = clients.length + webClients.length; // All registered users
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
                    <span class="label"><i class="fas fa-users" aria-hidden="true"></i> Total de clientes:</span>
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
        
        switch(tabName) {
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
                { type: 'text', name: 'category', label: 'Categoría', placeholder: 'Ej: Suscripciones, Herramientas, etc.' }
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

    // Función segura para normalizar la fecha
    function normalizeDate(value) {
        if (!value) return new Date(0); // fecha mínima
        if (typeof value.toDate === "function") return value.toDate(); // Timestamp de Firestore
        if (typeof value === "string" || typeof value === "number") return new Date(value);
        return new Date(0);
    }

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
            <td><span class="status-badge">${escapeHTML(expense.category || "Sin categoría")}</span></td>
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
        const confirmed = await modal.confirm('¿Estás seguro de que deseas eliminar este gasto?');
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

// ============= GESTIÓN DE USUARIOS (ADMIN) =============
class UserManager {
    constructor() {
        this.allUsers = []; // All users from Firestore 'users' collection
        this.filteredUsers = []; // Users after search/sort
    }

    async loadAllUsers() {
        if (!db || (currentUser && currentUser.uid !== ADMIN_UID && !isClaudeEnvironment)) {
            console.warn('⚠️ Solo el administrador puede cargar todos los usuarios.');
            return;
        }
        try {
            const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
            this.allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.filterAndSortUsers(); // Apply initial filter/sort
            console.log('✅ Usuarios cargados desde Firebase correctamente.');
        } catch (error) {
            console.error('❌ Error al cargar usuarios desde Firebase:', error);
            modal.toast('Error al cargar usuarios desde la nube.', 'error');
        }
    }

    showWebClientTab(tabName, event) {
        document.querySelectorAll('#webClients .finance-tab-content').forEach(content => {
            content.classList.remove('active');
            content.setAttribute('hidden', 'true');
        });
        
        document.querySelectorAll('#webClients .finance-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        const targetTab = document.getElementById(`web-clients-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.removeAttribute('hidden');
        }
        
        const clickedButton = event.currentTarget; 
        if (clickedButton) {
            clickedButton.classList.add('active');
            clickedButton.setAttribute('aria-selected', 'true');
        }

        this.renderAllUsersTable();
    }

    filterAndSortUsers() {
        const searchTerm = document.getElementById('clientSearchInput').value.toLowerCase();
        const sortBy = document.getElementById('clientSortBy').value;
        const sortOrder = document.getElementById('clientSortOrder').value;

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
                valA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                valB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
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
                <td>${(user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt)).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="webClientManager.openBalanceModal('${user.id}')" title="Gestionar Saldo" aria-label="Gestionar saldo de ${escapeHTML(user.name)}" tabindex="0"><i class="fas fa-wallet" aria-hidden="true"></i></button>
                    <button class="btn btn-info btn-sm" onclick="webClientManager.viewBalanceHistory('${user.id}')" title="Ver Historial" aria-label="Ver historial de saldo de ${escapeHTML(user.name)}" tabindex="0"><i class="fas fa-history" aria-hidden="true"></i></button>
                    <button class="btn btn-warning btn-sm" onclick="webClientManager.resetUserPassword('${user.id}', '${user.email}')" title="Resetear Contraseña" aria-label="Resetear contraseña de ${escapeHTML(user.name)}" tabindex="0"><i class="fas fa-key" aria-hidden="true"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="webClientManager.deleteUser('${user.id}', '${user.email}')" title="Eliminar Usuario" aria-label="Eliminar usuario ${escapeHTML(user.name)}" tabindex="0"><i class="fas fa-trash" aria-hidden="true"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openBalanceModal(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        const formConfig = {
            fields: [
                { type: 'number', name: 'amount', label: 'Monto ($)', required: true, placeholder: '0.00', step: '0.01' },
                { 
                    type: 'select', 
                    name: 'type', 
                    label: 'Tipo de Transacción', 
                    required: true, 
                    options: [
                        { value: 'add', text: 'Agregar Saldo' },
                        { value: 'subtract', text: 'Quitar Saldo' }
                    ]
                },
                { type: 'textarea', name: 'comment', label: 'Comentario (opcional)', placeholder: 'Motivo de la transacción...' }
            ]
        };

        modal.form(formConfig, `Gestionar Saldo de ${user.name}`).then(async data => {
            if (data) {
                const amount = parseFloat(data.amount);
                const type = data.type;
                const comment = sanitizeInput(data.comment || '');

                if (isNaN(amount) || amount <= 0) {
                    modal.alert('El monto debe ser un número positivo.', 'Error de Monto', 'error');
                    return;
                }
                await this.updateUserBalance(userId, amount, type, comment);
            }
        });
    }

    async updateUserBalance(userId, amount, type, comment) {
        if (isClaudeEnvironment) {
            modal.toast('Funcionalidad no disponible en modo demo para la gestión de saldo.', 'warning');
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
            await userRef.update({ balance: newBalance });
            await db.collection('users').doc(userId).collection('transactions').add({
                type: transactionType,
                amount: transactionAmount,
                comment: comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            modal.toast(`Saldo de ${userData.name} actualizado a $${newBalance.toFixed(2)}.`, 'success');
            await this.loadAllUsers(); // Reload users to update table
        } catch (error) {
            console.error('Error updating user balance:', error);
            modal.toast(`Error al actualizar saldo: ${error.message}`, 'error');
        }
    }

    async viewBalanceHistory(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        let historyHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-history" aria-hidden="true"></i> Historial de Transacciones de ${escapeHTML(user.name)}</h3>
                <button class="modal-close" onclick="modal.close()" aria-label="Cerrar modal">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Saldo Actual:</strong> $${(user.balance || 0).toFixed(2)}</p>
                <hr>
                <div class="balance-history-list">
        `;

        if (isClaudeEnvironment) {
            historyHtml += '<div class="no-data">Historial de transacciones no disponible en modo demo.</div>';
        } else {
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
                                    <span class="amount ${amountClass}">${entry.amount >= 0 ? '+' : ''}$${entry.amount.toFixed(2)}</span>
                                    <br>
                                    <span class="date">${(entry.createdAt?.toDate() || new Date()).toLocaleString()}</span>
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
        }

        historyHtml += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="modal.close()" tabindex="0">Cerrar</button>
            </div>
        `;

        modal.open(historyHtml, { size: 'medium' });
    }

    async deleteUser(userId, userEmail) {
        if (isClaudeEnvironment) {
            modal.toast('Funcionalidad no disponible en modo demo para eliminar usuarios.', 'warning');
            return;
        }

        const confirmed = await modal.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userEmail}? Esto eliminará su cuenta de Firebase Authentication y todos sus datos en Firestore (saldo, transacciones, etc.). Esta acción es irreversible.`, 'Confirmar Eliminación de Usuario');
        if (confirmed) {
            try {
                // 1. Delete user from Firebase Authentication
                // This requires a Cloud Function as direct client-side deletion of other users is not allowed.
                // For demo purposes, we'll simulate or skip this if Cloud Function is not deployed.
                // If you have a Cloud Function named 'deleteUser' deployed:
                // const deleteAuthUser = firebase.functions().httpsCallable('deleteUser');
                // await deleteAuthUser({ uid: userId });
                // If not, you'll need to manually delete from Firebase Auth console or deploy the function.
                modal.toast('Eliminación de usuario de Firebase Auth requiere Cloud Function. Si no la tienes, elimina manualmente desde la consola de Firebase Auth.', 'warning', 8000);

                // 2. Delete user document from Firestore
                await db.collection('users').doc(userId).delete();

                // 3. Delete all subcollection documents (transactions)
                const transactionsRef = db.collection('users').doc(userId).collection('transactions');
                const transactionsSnapshot = await transactionsRef.get();
                const batch = db.batch();
                transactionsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                modal.toast(`Usuario ${userEmail} eliminado correctamente de Firestore.`, 'success');
                await this.loadAllUsers(); // Reload users to update table
            } catch (error) {
                console.error('Error deleting user:', error);
                let errorMessage = 'Error al eliminar el usuario.';
                if (error.code === 'functions/not-found') {
                    errorMessage += ' Asegúrate de haber desplegado la función de Cloud Functions `deleteUser`.';
                } else {
                    errorMessage += ` ${error.message}`;
                }
                modal.toast(errorMessage, 'error');
            }
        }
    }

    async resetUserPassword(userId, userEmail) {
        if (isClaudeEnvironment) {
            modal.toast('Funcionalidad no disponible en modo demo para resetear contraseñas.', 'warning');
            return;
        }

        const confirmed = await modal.confirm(`¿Estás seguro de que deseas resetear la contraseña de ${userEmail}? Se enviará un email de restablecimiento de contraseña al usuario.`, 'Resetear Contraseña');
        if (confirmed) {
            try {
                await firebase.auth().sendPasswordResetEmail(userEmail);
                modal.toast(`Se ha enviado un email de restablecimiento de contraseña a ${userEmail}.`, 'success');
            } catch (error) {
                console.error('Error resetting password:', error);
                let errorMessage = 'Error al resetear la contraseña.';
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'Usuario no encontrado. Verifica el email.';
                } else {
                    errorMessage += ` ${error.message}`;
                }
                modal.toast(errorMessage, 'error');
            }
        }
    }

    async exportUsersToCsv() {
        if (this.allUsers.length === 0) {
            modal.alert('No hay usuarios para exportar.', 'Advertencia', 'warning');
            return;
        }

        const headers = ['UID', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Saldo', 'Fecha Registro'];
        const rows = this.allUsers.map(user => [
            user.id,
            user.name,
            user.lastName || '',
            user.email,
            user.phone || '',
            (user.balance || 0).toFixed(2),
            (user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt)).toISOString()
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'usuarios_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        modal.toast('Usuarios exportados a CSV correctamente.', 'success');
    }

    async exportDatabaseToJson() {
        if (!db && !isClaudeEnvironment) {
            modal.alert('Firebase no está inicializado.', 'Error', 'error');
            return;
        }

        try {
            const data = {};
            const collections = ['accounts', 'clients', 'sales', 'expenses', 'users', 'rechargeRequests']; // Add other collections if needed

            for (const collectionName of collections) {
                data[collectionName] = [];
                let snapshot;
                if (isClaudeEnvironment) {
                    // In demo mode, use local arrays
                    switch(collectionName) {
                        case 'accounts': snapshot = accounts; break;
                        case 'clients': snapshot = clients; break;
                        case 'sales': snapshot = sales; break;
                        case 'expenses': snapshot = financialManager.expenses; break;
                        case 'users': snapshot = webClients; break;
                        case 'rechargeRequests': snapshot = rechargeRequests; break;
                        default: snapshot = [];
                    }
                    snapshot.forEach(docData => {
                        const clonedData = JSON.parse(JSON.stringify(docData)); // Deep clone
                        // Convert Date objects to ISO strings for JSON export
                        for (const key in clonedData) {
                            if (clonedData[key] instanceof Date) {
                                clonedData[key] = clonedData[key].toISOString();
                            }
                        }
                        data[collectionName].push(clonedData);
                    });
                } else {
                    snapshot = await db.collection(collectionName).get();
                    for (const doc of snapshot.docs) {
                        const docData = doc.data();
                        // Convert Timestamps to ISO strings for JSON export
                        for (const key in docData) {
                            if (docData[key] && typeof docData[key].toDate === 'function') {
                                docData[key] = docData[key].toDate().toISOString();
                            }
                        }
                        data[collectionName].push({ id: doc.id, ...docData });

                        // If it's the 'users' collection, also export subcollections (e.g., 'transactions')
                        if (collectionName === 'users') {
                            const subCollections = ['transactions']; // Add other subcollections if needed
                            for (const subColName of subCollections) {
                                const subColSnapshot = await db.collection(collectionName).doc(doc.id).collection(subColName).get();
                                if (!docData[subColName]) {
                                    docData[subColName] = [];
                                }
                                for (const subDoc of subColSnapshot.docs) {
                                    const subDocData = subDoc.data();
                                    for (const key in subDocData) {
                                        if (subDocData[key] && typeof subDocData[key].toDate === 'function') {
                                            subDocData[key] = subDocData[key].toDate().toISOString();
                                        }
                                    }
                                    docData[subColName].push({ id: subDoc.id, ...subDocData });
                                }
                            }
                        }
                    }
                }
            }

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'database_export.json');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            modal.toast('Base de datos exportada a JSON correctamente.', 'success');

                } catch (error) {
                    console.error('Error exporting database:', error);
                    modal.toast(`Error al exportar la base de datos: ${error.message}`, 'error');
                }
    }

    async importDatabaseFromJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const confirmed = await modal.confirm('Importar una base de datos sobrescribirá los datos existentes. ¿Estás seguro de continuar? Esta acción es irreversible.', 'Confirmar Importación');
        if (!confirmed) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (isClaudeEnvironment) {
                    // In demo mode, directly update local arrays
                    accounts = importedData.accounts || [];
                    clients = importedData.clients || [];
                    sales = importedData.sales || [];
                    financialManager.expenses = importedData.expenses || [];
                    webClients = importedData.users || [];
                    rechargeRequests = importedData.rechargeRequests || [];
                    modal.toast('Base de datos importada en modo demo correctamente.', 'success');
                    await loadData(); // Re-render UI
                } else {
                    const batch = db.batch();

                    // For a true "overwrite", you'd need to fetch all docs and batch.delete() them first.
                    // This example merges, which is safer but might leave old data if not careful.
                    // For full overwrite, implement a delete all function for each collection.

                    for (const collectionName in importedData) {
                        if (Array.isArray(importedData[collectionName])) {
                            for (const docData of importedData[collectionName]) {
                                const docId = docData.id;
                                const dataToSet = { ...docData };
                                delete dataToSet.id; // Remove id from data to be set

                                // Convert ISO strings back to Timestamps
                                for (const key in dataToSet) {
                                    if (typeof dataToSet[key] === 'string' && dataToSet[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                        dataToSet[key] = firebase.firestore.Timestamp.fromDate(new Date(dataToSet[key]));
                                    }
                                }

                                // Handle subcollections (e.g., 'transactions' for 'users')
                                if (collectionName === 'users' && dataToSet.transactions) {
                                    const transactions = dataToSet.transactions;
                                    delete dataToSet.transactions; // Remove from main doc data

                                    // Set main user document
                                    batch.set(db.collection(collectionName).doc(docId), dataToSet, { merge: true });

                                    // Set subcollection documents
                                    for (const transaction of transactions) {
                                        const transactionId = transaction.id;
                                        const transactionData = { ...transaction };
                                        delete transactionData.id;
                                        for (const key in transactionData) {
                                            if (typeof transactionData[key] === 'string' && transactionData[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                                transactionData[key] = firebase.firestore.Timestamp.fromDate(new Date(transactionData[key]));
                                            }
                                            // Ensure createdAt is a Timestamp if it's a string
                                            if (typeof transactionData.createdAt === 'string' && transactionData.createdAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                                transactionData.createdAt = firebase.firestore.Timestamp.fromDate(new Date(transactionData.createdAt));
                                            }
                                        }
                                        batch.set(db.collection(collectionName).doc(docId).collection('transactions').doc(transactionId), transactionData, { merge: true });
                                    }
                                } else {
                                    batch.set(db.collection(collectionName).doc(docId), dataToSet, { merge: true });
                                }
                            }
                        }
                    }

                    await batch.commit();
                    modal.toast('Base de datos importada correctamente.', 'success');
                    await loadData(); // Reload all data after import
                }
            } catch (error) {
                console.error('Error importing database:', error);
                modal.toast(`Error al importar la base de datos: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }
}

// ============= GESTIÓN DE SOLICITUDES DE RECARGA (ADMIN) =============
class RechargeManager {
    constructor() {
        this.rechargeRequests = [];
    }

    async loadRechargeRequests() {
        if (!db || (currentUser && currentUser.uid !== ADMIN_UID && !isClaudeEnvironment)) {
            console.warn('⚠️ Solo el administrador puede cargar solicitudes de recarga.');
            return;
        }
        try {
            const requestsSnapshot = await db.collection('rechargeRequests').orderBy('createdAt', 'desc').get();
            this.rechargeRequests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderRechargeRequests();
            console.log('✅ Solicitudes de recarga cargadas desde Firebase correctamente.');
        } catch (error) {
            console.error('❌ Error al cargar solicitudes de recarga desde Firebase:', error);
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

        const client = webClients.find(wc => wc.id === request.clientId);
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
                <div><strong>Fecha:</strong> ${(request.createdAt?.toDate() || new Date()).toLocaleString()}</div>
                ${request.comment ? `<div><strong>Comentario:</strong> ${escapeHTML(request.comment)}</div>` : ''}
                ${request.processedBy ? `<div><strong>Procesado por:</strong> ${escapeHTML(request.processedBy)}</div>` : ''}
                ${request.processedAt ? `<div><strong>Fecha Proceso:</strong> ${(request.processedAt?.toDate() || new Date()).toLocaleString()}</div>` : ''}
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
        const confirmed = await modal.confirm(`¿Estás seguro de aprobar esta recarga de $${amount.toFixed(2)} para el cliente? Se agregará el saldo automáticamente.`, 'Aprobar Recarga');
        if (!confirmed) return;

        if (isClaudeEnvironment) {
            modal.toast('Funcionalidad no disponible en modo demo.', 'warning');
            return;
        }

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
                modal.toast(`Recarga aprobada y saldo de $${newBalance.toFixed(2)} agregado al cliente.`, 'success'); // Changed to newBalance
            } else {
                modal.toast('Cliente no encontrado, saldo no actualizado.', 'error');
            }

            await this.loadRechargeRequests();
            await webClientManager.loadAllUsers(); // Update client list for balance changes
        } catch (error) {
            console.error('Error approving recharge request:', error);
            modal.toast(`Error al aprobar recarga: ${error.message}`, 'error');
        }
    }

    async rejectRequest(requestId) {
        const confirmed = await modal.confirm('¿Estás seguro de rechazar esta recarga? El saldo NO se agregará.', 'Rechazar Recarga');
        if (!confirmed) return;

        if (isClaudeEnvironment) {
            modal.toast('Funcionalidad no disponible en modo demo.', 'warning');
            return;
        }

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
   function initializeFirebase(config) {
       try {
           if (!firebase.apps.length) {
               firebase.initializeApp(config);
           }
           db = firebase.firestore();
           console.log('✅ Firebase inicializado correctamente.');
           return true;
       } catch (error) {
           console.error('❌ Error al inicializar Firebase:', error);
           return false;
       }
   }
   

// ============= FUNCIONES DE AUTENTICACIÓN (ADMIN & CLIENT) =============
let currentAuthMode = 'admin'; // 'admin' or 'client'

function showAdminLogin() {
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('adminDemoScreen').style.display = 'none';
    document.getElementById('clientDemoScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    currentAuthMode = 'admin';
    hideLoginError('admin');
    showLoginLoading('admin', false);
}

function showClientLogin() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'flex';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('adminDemoScreen').style.display = 'none';
    document.getElementById('clientDemoScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    currentAuthMode = 'client';
    hideLoginError('client');
    showLoginLoading('client', false);
}

function showClientRegister() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'flex';
    document.getElementById('adminDemoScreen').style.display = 'none';
    document.getElementById('clientDemoScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    currentAuthMode = 'client_register';
    hideLoginError('register');
    showLoginLoading('register', false);
}

function showAdminDemoMode() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('adminDemoScreen').style.display = 'flex';
    document.getElementById('clientDemoScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    currentAuthMode = 'admin_demo';
}

function showClientDemoMode() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('adminDemoScreen').style.display = 'none';
    document.getElementById('clientDemoScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('clientApp').style.display = 'none';
    currentAuthMode = 'client_demo';
}

async function enterAdminDemoMode() {
    currentUser = { email: 'admin@demo.com', displayName: 'Admin Demo', role: 'admin', uid: ADMIN_UID }; // Assign a dummy UID for demo
    loadDemoData(); // Load demo data first
    if (!financialManager) financialManager = new FinancialManager();
    if (!webClientManager) webClientManager = new UserManager(); // Use UserManager for demo
    if (!rechargeManager) rechargeManager = new RechargeManager(); // Initialize RechargeManager
    await loadData(); // Ensure data is loaded into managers
    showMainApp('admin');
    financialManager.updateFinancialDashboard();
    webClientManager.renderAllUsersTable(); // Render all users for admin demo
    rechargeManager.renderRechargeRequests(); // Render recharge requests for admin demo
}

async function enterClientDemoMode() {
    loadDemoData(); // Load demo data first
    if (!financialManager) financialManager = new FinancialManager();
    if (!webClientManager) webClientManager = new UserManager(); // Use UserManager for demo
    if (!rechargeManager) rechargeManager = new RechargeManager(); // Initialize RechargeManager
    await loadData(); // Ensure data is loaded into managers

    // Usar un cliente demo aprobado para el portal
    const demoClient = webClients.find(c => c.email === 'cliente@demo.com'); // All demo clients are "approved" in demo
    if (!demoClient) {
        modal.alert('No se encontró un cliente demo. Asegúrate de que los datos demo estén cargados y el cliente "cliente@demo.com" exista.', 'Error Demo', 'error');
        showClientLogin();
        return;
    }
    currentUser = { email: demoClient.email, displayName: demoClient.name, role: 'client', id: demoClient.id, uid: demoClient.id }; // Use client's ID as UID for demo
    showMainApp('client');
    renderClientDashboard();
}

function checkAuthState() {
    if (isClaudeEnvironment) {
        showAdminDemoMode();
        return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Usuario autenticado:', user.email, 'UID:', user.uid);
            
            // Initialize managers if they are not already
            if (!financialManager) financialManager = new FinancialManager();
            if (!webClientManager) webClientManager = new UserManager();
            if (!rechargeManager) rechargeManager = new RechargeManager();

            if (user.uid === ADMIN_UID) {
                // Es admin - cargar todos los datos
                currentUser = { email: user.email, displayName: 'Admin', role: 'admin', uid: user.uid };
                await loadData(); // Load data after managers are initialized
                showMainApp('admin');
                financialManager.updateFinancialDashboard();
                webClientManager.loadAllUsers(); // Load all users for admin view
                rechargeManager.loadRechargeRequests(); // Load recharge requests for admin view
                // migrateExistingAccounts();
            } else {
                // Es cliente regular - solo cargar sus datos
                currentUser = { email: user.email, displayName: '', role: 'client', id: user.uid, uid: user.uid };
                
                try {
                    // Cargar solo los datos del cliente
                    await loadClientData(user.uid);
                    
                    // Verificar que el usuario existe en Firestore
                    const userData = webClients.find(u => u.id === user.uid);
                    if (userData) {
                        currentUser.displayName = userData.name;
                        showMainApp('client');
                        renderClientDashboard();
                    } else {
                        console.error('Usuario no encontrado en Firestore');
                        await firebase.auth().signOut();
                        modal.alert('Tu cuenta no está completamente configurada. Por favor, contacta a soporte o intenta registrarte de nuevo.', 'Error de Perfil', 'warning');
                        showClientLogin();
                        return;
                    }
                } catch (error) {
                    console.error('Error cargando datos del cliente:', error);
                    await firebase.auth().signOut();
                    modal.toast('Error al cargar tu perfil. Intenta de nuevo.', 'error');
                    showClientLogin();
                }
            }
        } else {
            // No hay usuario autenticado
            console.log('No hay usuario autenticado');
            currentUser = null;
            
            // Limpiar datos
            accounts = [];
            clients = [];
            sales = [];
            webClients = [];
            rechargeRequests = [];
            
            showAdminLogin();
        }
    });
}


async function loadClientData(userId) {
    if (db && !isClaudeEnvironment) {
        try {
            console.log('🔥 Cargando datos del cliente desde Firebase...');
            
            // Solo cargar el documento del usuario actual
            const userDocRef = db.collection('users').doc(userId);
            let attempts = 0;
            const maxAttempts = 5; // Número máximo de intentos
            const delay = 1000; // Retraso en milisegundos entre intentos

            while (attempts < maxAttempts) {
                const userDoc = await userDocRef.get();
                if (userDoc.exists) {
                    webClients = [{ id: userDoc.id, ...userDoc.data() }];
                    console.log('✅ Datos del cliente cargados desde Firebase correctamente.');
                    return; // Salir si se carga correctamente
                } else {
                    console.warn(`Intento ${attempts + 1}: Documento no encontrado. Reintentando...`);
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, delay)); // Esperar antes de reintentar
                }
            }

            console.error('❌ Error: No se pudo cargar el documento del cliente después de varios intentos.');
            modal.toast('Error al cargar tus datos. Por favor, intenta de nuevo.', 'error');
            throw new Error('Documento no encontrado después de varios intentos.');
        } catch (error) {
            console.error("Error cargando datos del cliente desde Firebase:", error);
            modal.toast('Error al cargar tus datos. Por favor, intenta de nuevo.', 'error');
            throw error; // Re-throw to be caught by checkAuthState
        }
    } else {
        // En modo demo, cargar todos los datos
        loadDemoData();
    }
}


async function loginAdmin() {
    const email = document.getElementById('adminLoginEmail').value.trim();
    const password = document.getElementById('adminLoginPassword').value.trim();
    
    if (!email || !password) {
        showLoginError('Por favor completa todos los campos.', 'admin');
        return;
    }

    showLoginLoading('admin', true);
    hideLoginError('admin');

    if (isClaudeEnvironment) {
        if (email === 'admin@demo.com' && password === 'admin123') {
            await enterAdminDemoMode(); // Use await here
        } else {
            showLoginError('Credenciales de demo incorrectas. Usa admin@demo.com / admin123', 'admin');
        }
        showLoginLoading('admin', false);
        return;
    }

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        if (userCredential.user.uid !== ADMIN_UID) { // Ensure only specific admin email can log in as admin
            await firebase.auth().signOut();
            showLoginError('Acceso denegado. Este email no es un administrador.', 'admin');
            return;
        }
        console.log('Admin autenticado con éxito.');
        // The onAuthStateChanged listener will handle the rest
    } catch (error) {
        console.error('Error de autenticación admin:', error);
        showLoginLoading('admin', false);
        showLoginError(getFirebaseErrorMessage(error), 'admin');
    }
}

async function loginClient() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('clientLoginPassword').value.trim();

    if (!email || !password) {
        showLoginError('Por favor completa todos los campos.', 'client');
        return;
    }

    showLoginLoading('client', true);
    hideLoginError('client');

    if (isClaudeEnvironment) {
        const demoClient = webClients.find(c => c.email === email && c.password === password);
        if (demoClient) {
            currentUser = { email: demoClient.email, displayName: demoClient.name, role: 'client', id: demoClient.id, uid: demoClient.id };
            showMainApp('client');
            renderClientDashboard();
        } else {
            showLoginError('Credenciales de demo incorrectas. Prueba cliente@demo.com / password123', 'client');
        }
        showLoginLoading('client', false);
        return;
    }

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Verificar si el usuario existe en Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
            // Usuario existe en Auth y Firestore, proceder con el login
            console.log('Cliente autenticado y datos en Firestore encontrados.');
            // onAuthStateChanged se encargará de cargar los datos y mostrar la app
        } else {
            // Usuario existe en Auth pero no en Firestore (posiblemente un registro incompleto o borrado manual)
            await firebase.auth().signOut(); // Desconectar al usuario de Auth
            showLoginError('Tu cuenta no está completamente configurada. Por favor, contacta a soporte o intenta registrarte de nuevo.', 'client');
        }
    } catch (error) {
        console.error('Error de autenticación cliente:', error);
        showLoginLoading('client', false);
        showLoginError(getFirebaseErrorMessage(error), 'client');
    }
}

function sanitizeInput(input) {
    if (typeof input !== "string") return input;
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
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


async function registerClient() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    let phone = document.getElementById('registerPhone').value.trim();

    // Validaciones
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showLoginError('El formato del email es inválido.', 'register');
        return;
    }

    phone = formatEcuadorianPhone(phone);
    if (!phone) {
        showLoginError('Formato de teléfono ecuatoriano inválido. Ej: 09XXXXXXXX o +593XXXXXXXXX', 'register');
        return;
    }

    showLoginLoading('register', true);
    hideLoginError('register');

    try {
        if (!isClaudeEnvironment) {
            // 1. Crear usuario en Firebase Authentication
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // 2. Guardar información adicional en Firestore
            const newUserData = {
                id: uid,
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                phone: phone,
                balance: 0,
                role: 'client',
                adminUID: ADMIN_UID, // Asignar el UID del admin
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                purchases: [] // Inicializar array de compras
            };
            
            await db.collection('users').doc(uid).set(newUserData);

            modal.toast('Registro exitoso. Ya puedes iniciar sesión.', 'success');
            showClientLogin();
        } else {
            // Modo demo: simular registro
            if (webClients.some(c => c.email === email)) {
                showLoginError('Este email ya está registrado en modo demo.', 'register');
                return;
            }
            const newUserData = {
                id: Date.now().toString(),
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                password: password, // En demo, guardamos la contraseña para simular login
                phone: phone,
                balance: 0,
                role: 'client',
                adminUID: ADMIN_UID,
                createdAt: new Date().toISOString(),
                purchases: []
            };
            webClients.push(newUserData);
            modal.toast('Registro exitoso (Modo Demo). Ya puedes iniciar sesión.', 'success');
            showClientLogin();
        }
    } catch (error) {
        console.error('Error al registrar cliente:', error);
        // Si falla la creación en Auth, no se intenta guardar en Firestore
        showLoginError(getFirebaseErrorMessage(error), 'register');
    } finally {
        showLoginLoading('register', false);
    }
}


async function logoutAdmin() {
    const confirmed = await modal.confirm('¿Estás seguro de que deseas cerrar sesión del administrador?');
    if (confirmed) {
        if (isClaudeEnvironment) {
            currentUser = null;
            showAdminDemoMode();
        } else {
            try {
                await firebase.auth().signOut();
                console.log('Admin desconectado.');
            } catch (error) {
                console.error('Error al cerrar sesión admin:', error);
                modal.alert('Error al cerrar sesión: ' + error.message, 'Error', 'error');
            }
        }
    }
}

async function logoutClient() {
    const confirmed = await modal.confirm('¿Estás seguro de que deseas cerrar sesión de tu portal?');
    if (confirmed) {
        if (isClaudeEnvironment) {
            currentUser = null;
            showClientDemoMode();
        } else {
            try {
                await firebase.auth().signOut();
                console.log('Cliente desconectado.');
            } catch (error) {
                console.error('Error al cerrar sesión cliente:', error);
                modal.alert('Error al cerrar sesión: ' + error.message, 'Error', 'error');
            }
        }
    }
}

function showMainApp(role) {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('clientLoginScreen').style.display = 'none';
    document.getElementById('clientRegisterScreen').style.display = 'none';
    document.getElementById('adminDemoScreen').style.display = 'none';
    document.getElementById('clientDemoScreen').style.display = 'none';

    if (role === 'admin') {
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('clientApp').style.display = 'none';
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = currentUser.email;
        }
        updateDashboard();
        // Use setTimeout to ensure the DOM is ready and sections are properly displayed
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

function getFirebaseErrorMessage(error) {
    let errorMessage = 'Error de autenticación';
    let helpMessage = '';
    
    switch(error.code) {
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
            helpMessage = 'Verifica tu contraseña.';
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
            errorMessage = 'Contraseña débil.';
            helpMessage = 'La contraseña debe tener al menos 6 caracteres.';
            break;
        default:
            errorMessage = error.message;
            helpMessage = 'Contacta a soporte si el problema persiste.';
    }
    return errorMessage + (helpMessage ? '\n\n💡 ' + helpMessage : '');
}

// ============= FUNCIONES DE DATOS (CRUD) =============
async function loadData() {
    // Ensure managers are initialized before attempting to use them
    if (!financialManager) financialManager = new FinancialManager();
    if (!webClientManager) webClientManager = new UserManager();
    if (!rechargeManager) rechargeManager = new RechargeManager();
    
    if (db && !isClaudeEnvironment) {
        try {
            await loadFromFirebase();
        } catch (error) {
            console.error("Error cargando datos desde Firebase:", error);
            // Fallback to demo data if Firebase fails in non-Claude env (e.g., bad config)
            loadDemoData(); 
        }
    } else {
        loadDemoData(); // Always load demo data in Claude environment
    }
    
    // migrateExistingAccounts(); // Comentado porque no existe



    renderAll();
    updateDashboard();
    financialManager.updateFinancialDashboard();
    if (currentUser && currentUser.role === 'admin') {
        webClientManager.loadAllUsers(); // Load all users for admin view
        rechargeManager.loadRechargeRequests(); // Load recharge requests for admin view
    }
}

async function loadFromFirebase() {
    console.log('🔥 Cargando datos desde Firebase...');
    
    // Verificar que el usuario actual es admin
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        console.warn('⚠️ Solo el administrador puede cargar todos los datos.');
        return;
    }
    
    try {
        const [accountsSnapshot, clientsSnapshot, salesSnapshot, usersSnapshot, rechargeRequestsSnapshot] = await Promise.all([
            db.collection('accounts').orderBy('createdAt', 'desc').get(),
            db.collection('clients').orderBy('createdAt', 'desc').get(),
            db.collection('sales').orderBy('createdAt', 'desc').get(),
            db.collection('users').orderBy('createdAt', 'desc').get(),
            db.collection('rechargeRequests').orderBy('createdAt', 'desc').get()
        ]);

        accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        webClients = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rechargeRequests = rechargeRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (financialManager) {
            await financialManager.loadExpensesFromFirebase();
        }

        console.log('✅ Datos cargados desde Firebase correctamente.');
    } catch (error) {
        console.error('❌ Error al cargar datos desde Firebase:', error);
        modal.toast('Error al cargar datos desde la nube.', 'error');
        throw error;
    }
}

async function saveToFirebase(collectionName, data) {
    if (!db || isClaudeEnvironment) {
        console.warn(`Saltando guardado en Firebase para ${collectionName}/${data.id}. No conectado o modo demo.`);
        return Promise.resolve();
    }

    // Special handling for 'users' collection: only admin can update all fields, user can only update specific fields (e.g., purchases)
    if (collectionName === 'users' && currentUser && currentUser.uid !== ADMIN_UID && currentUser.uid !== data.id) {
        console.warn(`Usuario ${currentUser.uid} intentó guardar datos de otro usuario ${data.id}. Operación denegada.`);
        modal.toast('No tienes permiso para modificar datos de otros usuarios.', 'error');
        return Promise.reject(new Error('Permission denied'));
    }

    console.log(`💾 Guardando en Firebase: ${collectionName}/${data.id}`);
    
    try {
        await db.collection(collectionName).doc(data.id).set(data, { merge: true }); // Use merge to avoid overwriting
        console.log(`✅ Guardado en Firebase: ${collectionName}/${data.id}`);
    } catch (error) {
        console.error(`❌ Error guardando en Firebase ${collectionName}/${data.id}:`, error);
        modal.toast(`Error al guardar en la nube: ${error.message}`, 'error');
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    if (!db || isClaudeEnvironment) {
        console.warn(`Saltando eliminación en Firebase para ${collectionName}/${id}. No conectado o modo demo.`);
        return Promise.resolve();
    }

    // Only admin can delete
    if (currentUser && currentUser.uid !== ADMIN_UID) {
        console.warn(`Usuario ${currentUser.uid} intentó eliminar de ${collectionName}/${id}. Operación denegada.`);
        modal.toast('No tienes permiso para eliminar datos.', 'error');
        return Promise.reject(new Error('Permission denied'));
    }

    console.log(`🗑️ Eliminando de Firebase: ${collectionName}/${id}`);
    try {
        await db.collection(collectionName).doc(id).delete();
        console.log(`✅ Eliminado de Firebase: ${collectionName}/${id}`);
    } catch (error) {
        console.error(`❌ Error eliminando de Firebase ${collectionName}/${id}:`, error);
        modal.toast(`Error al eliminar en la nube: ${error.message}`, 'error');
        throw error;
    }
}

function loadDemoData() {
    // Only load if data is empty or explicitly requested for demo mode
    if (accounts.length === 0 || isClaudeEnvironment) {
        accounts = [
            {
                id: "demo1",
                platform: "Netflix",
                email: "netflix@ejemplo.com",
                password: "password123",
                devices: 4,
                pricePerProfile: 2.50,
                fullAccountPrice: 8.00,
                profiles: [
                    { name: "Perfil 1", pin: "Sin pin", available: true, soldTo: null, saleId: null },
                    { name: "Perfil 2", pin: "1234", available: true, soldTo: null, saleId: null },
                    { name: "Perfil 3", pin: "Sin pin", available: false, soldTo: "web-client-1", saleId: "auto-sale-1" },
                    { name: "Perfil 4", pin: "5678", available: true, soldTo: null, saleId: null }
                ],
                status: "Disponible",
                acquisitionCost: 5.00,
                supplier: "Proveedor Demo",
                renewalCost: 8.00,
                renewalDate: "2024-12-15",
                totalEarned: 7.50,
                createdAt: new Date().toISOString()
            },
            {
                id: "demo2",
                platform: "HBO Max",
                email: "hbo@ejemplo.com",
                password: "hbopass456",
                devices: 3,
                pricePerProfile: 3.00,
                fullAccountPrice: 10.00,
                profiles: [
                    { name: "Usuario 1", pin: "Sin pin", available: true, soldTo: null, saleId: null },
                    { name: "Usuario 2", pin: "9999", available: true, soldTo: null, saleId: null },
                    { name: "Usuario 3", pin: "Sin pin", available: true, soldTo: null, saleId: null }
                ],
                status: "Disponible",
                acquisitionCost: 7.00,
                supplier: "Proveedor Demo",
                renewalCost: 0,
                renewalDate: null,
                totalEarned: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: "demo3",
                platform: "Spotify",
                email: "spotify@ejemplo.com",
                password: "spotifypass",
                devices: 1,
                pricePerProfile: 5.00,
                fullAccountPrice: 5.00,
                profiles: [
                    { name: "Usuario Principal", pin: "N/A", available: false, soldTo: "web-client-3", saleId: "auto-sale-2" }
                ],
                status: "Ocupado",
                acquisitionCost: 6.00,
                supplier: "Proveedor Demo",
                renewalCost: 5.00,
                renewalDate: "2024-11-01",
                totalEarned: 5.00,
                createdAt: new Date().toISOString()
            },
            {
                id: "demo4",
                platform: "Disney+",
                email: "disney@ejemplo.com",
                password: "disneypass",
                devices: 5,
                pricePerProfile: 2.00,
                fullAccountPrice: 7.00,
                profiles: [
                    { name: "Perfil A", pin: "1111", available: true, soldTo: null, saleId: null },
                    { name: "Perfil B", pin: "2222", available: true, soldTo: null, saleId: null },
                    { name: "Perfil C", pin: "3333", available: true, soldTo: null, saleId: null },
                    { name: "Perfil D", pin: "4444", available: true, soldTo: null, saleId: null },
                    { name: "Perfil E", pin: "5555", available: true, soldTo: null, saleId: null }
                ],
                status: "Disponible",
                acquisitionCost: 4.00,
                supplier: "Proveedor Demo",
                renewalCost: 6.00,
                renewalDate: "2025-01-20",
                totalEarned: 0,
                createdAt: new Date().toISOString()
            }
        ];

        clients = [ // Manual clients (not used in new user management)
            {
                id: "demo-client-1",
                name: "Juan Pérez",
                whatsApp: "+593991234567",
                email: "juan@ejemplo.com",
                notes: "Cliente frecuente",
                purchases: 1,
                lastPurchase: "2024-08-20",
                createdAt: new Date().toISOString()
            },
            {
                id: "demo-client-2",
                name: "María García",
                whatsApp: "+593987654321",
                email: "maria@ejemplo.com",
                notes: "Nuevo cliente",
                purchases: 1,
                lastPurchase: "2024-09-01",
                createdAt: new Date().toISOString()
            }
        ];

        sales = [
            {
                id: "demo-sale-1",
                clientId: "demo-client-1",
                accountId: "demo1",
                profilesCount: 1,
                startDate: "2024-08-20",
                endDate: "2024-09-19",
                total: 2.50,
                status: "Activa",
                paid: true,
                isAutoPurchase: false,
                createdAt: new Date().toISOString()
            },
            {
                id: "demo-sale-2",
                clientId: "demo-client-2",
                accountId: "demo3",
                profilesCount: 1,
                startDate: "2024-09-01",
                endDate: "2024-09-30",
                total: 5.00,
                status: "Activa",
                paid: true,
                isAutoPurchase: false,
                createdAt: new Date().toISOString()
            },
            // Add demo auto purchases to sales array
            {
                id: "auto-sale-1",
                clientId: "web-client-1", // This is a web client ID
                accountId: "demo1",
                profilesCount: 1,
                startDate: "2024-09-10",
                endDate: "2024-10-09",
                total: 2.50,
                status: "Activa",
                paid: true,
                isAutoPurchase: true, // Mark as auto purchase
                createdAt: "2024-09-10T10:00:00Z"
            },
            {
                id: "auto-sale-2",
                clientId: "web-client-3",
                accountId: "demo3",
                profilesCount: 1,
                startDate: "2024-08-05",
                endDate: "2024-09-04",
                total: 5.00,
                status: "Inactiva", // Mark as inactive/expired
                paid: true,
                isAutoPurchase: true,
                createdAt: "2024-08-05T11:00:00Z"
            },
            {
                id: "auto-sale-3",
                clientId: "web-client-3",
                accountId: "demo2", // Assuming HBO Max has a profile sold
                profilesCount: 1,
                startDate: "2024-08-10",
                endDate: "2024-09-09",
                total: 5.00,
                status: "Inactiva", // Mark as inactive/expired
                paid: true,
                isAutoPurchase: true,
                createdAt: "2024-08-10T12:00:00Z"
            }
        ];

        webClients = [ // These are now 'users' in Firestore
            {
                id: "web-client-1",
                name: "Cliente",
                lastName: "Demo",
                email: "cliente@demo.com",
                password: "password123", // Only for demo mode
                phone: "+593987654321",
                balance: 50.00,
                purchases: [ // This is for demo display, actual purchases are in sales collection
                    {
                        saleId: "auto-sale-1",
                        platform: "Netflix",
                        email: "netflix@ejemplo.com",
                        password: "password123",
                        profileName: "Perfil 3",
                        profilePin: "Sin pin",
                        startDate: "2024-09-10",
                        endDate: "2024-10-09",
                        total: 2.50,
                        status: "Activa"
                    }
                ],
                createdAt: new Date("2024-01-01T09:00:00Z").toISOString()
            },
            {
                id: "web-client-2",
                name: "Usuario",
                lastName: "Nuevo",
                email: "nuevo@demo.com",
                password: "password123", // Only for demo mode
                phone: "+593999888777",
                balance: 0,
                purchases: [],
                createdAt: new Date("2024-09-15T14:00:00Z").toISOString()
            },
            {
                id: "web-client-3",
                name: "Comprador",
                lastName: "Frecuente",
                email: "comprador@demo.com",
                password: "password123", // Only for demo mode
                phone: "+593976543210",
                balance: 10.00,
                purchases: [ // This is for demo display, actual purchases are in sales collection
                    {
                        saleId: "auto-sale-2",
                        platform: "Spotify",
                        email: "spotify@ejemplo.com",
                        password: "password123", // Added password for demo consistency
                        profileName: "Usuario Principal",
                        profilePin: "N/A",
                        startDate: "2024-08-05",
                        endDate: "2024-09-04",
                        total: 5.00,
                        status: "Vencida"
                    },
                    {
                        saleId: "auto-sale-3",
                        platform: "HBO Max",
                        email: "hbo@ejemplo.com",
                        password: "hbopass456", // Added password for demo consistency
                        profileName: "Usuario 1",
                        profilePin: "Sin pin",
                        startDate: "2024-08-10",
                        endDate: "2024-09-09",
                        total: 5.00,
                        status: "Vencida"
                    }
                ],
                createdAt: new Date("2024-07-30T08:00:00Z").toISOString()
            }
        ];

        if (financialManager) {
            financialManager.expenses = [
                {
                    id: "exp1",
                    type: "acquisition",
                    description: "Compra de cuenta Netflix",
                    amount: 5.00,
                    createdAt: new Date("2024-08-15T10:00:00Z").toISOString(),
                    category: "Cuentas"
                },
                {
                    id: "exp2",
                    type: "operational",
                    description: "Herramienta de gestión",
                    amount: 10.00,
                    createdAt: new Date("2024-09-05T11:30:00Z").toISOString(),
                    category: "Software"
                }
            ];
        }

        rechargeRequests = [
            {
                id: "recharge1",
                clientId: "web-client-1",
                amount: 10.00,
                bank: "Pichincha",
                imageUrl: "https://i.ibb.co/XYZ123/comprobante1.jpg",
                status: "pending",
                comment: "Transferencia desde mi cuenta personal",
                createdAt: new Date("2024-09-20T10:00:00Z").toISOString()
            },
            {
                id: "recharge2",
                clientId: "web-client-3",
                amount: 5.00,
                bank: "Guayaquil",
                imageUrl: "https://i.ibb.co/ABC456/comprobante2.jpg",
                status: "approved",
                comment: "Pago de recarga",
                createdAt: new Date("2024-09-18T15:00:00Z").toISOString(),
                processedBy: "admin@demo.com",
                processedAt: new Date("2024-09-18T16:00:00Z").toISOString()
            },
            {
                id: "recharge3",
                clientId: "web-client-2",
                amount: 20.00,
                bank: "Pichincha",
                imageUrl: "https://i.ibb.co/DEF789/comprobante3.jpg",
                status: "rejected",
                comment: "Monto incorrecto",
                createdAt: new Date("2024-09-17T09:00:00Z").toISOString(),
                processedBy: "admin@demo.com",
                processedAt: new Date("2024-09-17T10:00:00Z").toISOString()
            }
        ];
    }
}

// ============= FUNCIONES DE UI (ADMIN) =============
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const buttons = document.querySelectorAll('.nav-btn');
    
    // Validar que existan los elementos
    if (sections.length === 0 || buttons.length === 0) {
        console.warn('DOM elements not ready yet, retrying...');
        setTimeout(() => showSection(sectionId), 100);
        return;
    }
    
    sections.forEach(section => {
        if (section.classList) {
            section.classList.remove('active');
            section.setAttribute('hidden', 'true');
        }
    });
    
    buttons.forEach(btn => {
        if (btn.classList) {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        }
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection && targetSection.classList) {
        targetSection.classList.add('active');
        targetSection.removeAttribute('hidden');
    }
    
    // Encontrar el botón activo de manera más segura
    const activeButton = Array.from(buttons).find(btn => {
        const controls = btn.getAttribute('onclick');
        return controls && controls.includes(`'${sectionId}'`);
    });
    
    if (activeButton && activeButton.classList) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-selected', 'true');
    }
    
    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'finances' && financialManager) {
        financialManager.updateFinancialDashboard();
        financialManager.showFinanceTab('overview', { currentTarget: document.querySelector('.finance-tabs .tab-btn.active') }); // Pass event object for tab activation
    } else if (sectionId === 'webClients' && webClientManager) {
        webClientManager.loadAllUsers(); // Ensure latest users are loaded
    } else if (sectionId === 'rechargeRequests' && rechargeManager) {
        rechargeManager.loadRechargeRequests(); // Ensure latest requests are loaded
    }
}

function updateDashboard() {
    document.getElementById('totalAccounts').textContent = accounts.length;
    document.getElementById('totalClients').textContent = webClients.length; // All registered users
    
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
        accounts[accountIndex].status = oldStatus; // Revert on error
        renderAccounts();
        modal.toast(`Error al actualizar el estado: ${error.message}`, 'error');
    }
}

function renderClientDashboard() {
    const userCurrentBalanceElement = document.getElementById('userCurrentBalance');
    const clientBalanceElement = document.getElementById('clientBalance');
    const clientDisplayNameElement = document.getElementById('clientDisplayName');
    const transactionHistoryElement = document.getElementById('transactionHistory');
    const availableAccountsCatalogElement = document.getElementById('availableAccountsCatalog');
    const clientPurchaseHistoryElement = document.getElementById('clientPurchaseHistory');

    if (!currentUser || currentUser.role !== 'client') {
        console.error('No hay un usuario cliente logeado.');
        return;
    }

    const clientData = webClients.find(u => u.id === currentUser.uid);
    if (!clientData) {
        console.error('Datos del cliente no encontrados en webClients.');
        return;
    }

    // Update balance and display name
    if (userCurrentBalanceElement) userCurrentBalanceElement.textContent = `$${(clientData.balance || 0).toFixed(2)}`;
    if (clientBalanceElement) clientBalanceElement.textContent = `$${(clientData.balance || 0).toFixed(2)}`;
    if (clientDisplayNameElement) clientDisplayNameElement.textContent = clientData.name;

    // Render transaction history
    renderClientTransactionHistory(clientData.id);

    // Render available accounts
    renderAvailableAccountsCatalog();

    // Render client purchase history
    renderClientPurchaseHistory(clientData.id);
}

async function renderClientTransactionHistory(clientId) {
    const transactionHistoryElement = document.getElementById('transactionHistory');
    if (!transactionHistoryElement) return;

    transactionHistoryElement.innerHTML = '<div class="loading">Cargando historial...</div>';

    if (isClaudeEnvironment) {
        transactionHistoryElement.innerHTML = '<div class="no-data">Historial de transacciones no disponible en modo demo.</div>';
        return;
    }

    try {
        const transactionsSnapshot = await db.collection('users').doc(clientId).collection('transactions').orderBy('createdAt', 'desc').get();
        const transactions = transactionsSnapshot.docs.map(doc => doc.data());

        if (transactions.length === 0) {
            transactionHistoryElement.innerHTML = '<div class="no-data">No hay transacciones registradas.</div>';
        } else {
            let historyHtml = '';
            transactions.forEach(entry => {
                const amountClass = entry.amount >= 0 ? 'positive' : 'negative';
                historyHtml += `
                    <div class="balance-history-item">
                        <div>
                            <span class="amount ${amountClass}">${entry.amount >= 0 ? '+' : ''}$${entry.amount.toFixed(2)}</span>
                            <br>
                            <span class="date">${(entry.createdAt?.toDate() || new Date()).toLocaleString()}</span>
                        </div>
                        <div class="comment">${escapeHTML(entry.comment || entry.type || 'Sin comentario')}</div>
                    </div>
                `;
            });
            transactionHistoryElement.innerHTML = historyHtml;
        }
    } catch (error) {
        console.error('Error fetching client transactions:', error);
        transactionHistoryElement.innerHTML = '<div class="no-data">Error al cargar el historial de transacciones.</div>';
    }
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
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <h3><i class="fas fa-play-circle" aria-hidden="true"></i> ${escapeHTML(account.platform)}</h3>
            <p class="description">Usuario: ${escapeHTML(account.email)}</p>
            <p class="price">Precio por perfil: $${(account.pricePerProfile || 0).toFixed(2)}</p>
            <p class="description">Perfiles disponibles: ${availableProfilesCount}</p>
            <button class="btn btn-success buy-btn" onclick="openPurchaseModal('${account.id}')">
                <i class="fas fa-shopping-cart" aria-hidden="true"></i> Comprar Perfil
            </button>
        `;
        catalogElement.appendChild(card);
    });
}

async function renderClientPurchaseHistory(clientId) {
    const historyElement = document.getElementById('clientPurchaseHistory');
    if (!historyElement) return;

    historyElement.innerHTML = '<div class="loading">Cargando historial de compras...</div>';

    try {
        // Filter sales by the current client's ID and mark auto purchases
        const clientSales = sales.filter(sale => sale.clientId === clientId && sale.isAutoPurchase);

        if (clientSales.length === 0) {
            historyElement.innerHTML = '<div class="no-data">No tienes compras registradas aún.</div>';
            return;
        }

        let historyHtml = '';
        for (const sale of clientSales) {
            const account = accounts.find(acc => acc.id === sale.accountId);
            if (!account) continue; // Skip if account not found

            const profile = account.profiles.find(p => p.saleId === sale.id); // Find the specific profile sold in this sale

            const today = new Date();
            const endDate = new Date(sale.endDate);
            let statusText = sale.status;
            let statusClass = sale.status === 'Activa' ? 'active' : 'unavailable';

            if (sale.status === 'Activa' && today > endDate) {
                statusText = 'Vencida';
                statusClass = 'unavailable';
            }

            historyHtml += `
                <div class="purchase-history-item">
                    <p><strong>Plataforma:</strong> ${escapeHTML(account.platform)}</p>
                    <p><strong>Perfiles:</strong> ${sale.profilesCount}</p>
                    <p><strong>Total:</strong> $${(sale.total || 0).toFixed(2)}</p>
                    <p><strong>Periodo:</strong> ${new Date(sale.startDate).toLocaleDateString()} - ${new Date(sale.endDate).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                    <div class="access-details">
                        <p><strong>Usuario:</strong> ${escapeHTML(account.email)}</p>
                        <p><strong>Contraseña:</strong> ${escapeHTML(account.password)}</p>
                        ${profile ? `<p><strong>Perfil Asignado:</strong> ${escapeHTML(profile.name)} (PIN: ${escapeHTML(profile.pin)})</p>` : ''}
                    </div>
                </div>
            `;
        }
        historyElement.innerHTML = historyHtml;
    } catch (error) {
        console.error('Error rendering client purchase history:', error);
        historyElement.innerHTML = '<div class="no-data">Error al cargar el historial de compras.</div>';
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

    modal.form(formConfig, `Comprar Perfil de ${account.platform}`).then(async data => {
        if (data) {
            const profilesToBuy = parseInt(data.profilesToBuy);
            if (isNaN(profilesToBuy) || profilesToBuy <= 0 || profilesToBuy > availableProfiles.length) {
                modal.alert('Cantidad de perfiles inválida.', 'Error', 'error');
                return;
            }

            const totalCost = profilesToBuy * (account.pricePerProfile || 0);
            const clientData = webClients.find(u => u.id === currentUser.uid);

            if (!clientData || (clientData.balance || 0) < totalCost) {
                modal.alert(`Saldo insuficiente. Necesitas $${totalCost.toFixed(2)} y tienes $${(clientData?.balance || 0).toFixed(2)}.`, 'Saldo Insuficiente', 'error');
                return;
            }

            const confirmed = await modal.confirm(`Confirmar compra de ${profilesToBuy} perfil(es) de ${account.platform} por $${totalCost.toFixed(2)}?`, 'Confirmar Compra');
            if (!confirmed) return;

            await processPurchase(accountId, profilesToBuy, totalCost);
        }
    });
}

async function processPurchase(accountId, profilesToBuy, totalCost) {
    if (isClaudeEnvironment) {
        modal.toast('Funcionalidad de compra no disponible en modo demo.', 'warning');
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

        modal.toast('Compra realizada con éxito!', 'success');
        await loadData(); // Reload all data to update UI
        renderClientDashboard(); // Re-render client dashboard
    } catch (error) {
        console.error('Error processing purchase:', error);
        modal.toast(`Error al procesar la compra: ${error.message}`, 'error');
    }
}

async function openRechargeModal() {
    const formConfig = {
        fields: [
            { type: 'number', name: 'amount', label: 'Monto a Recargar ($)', required: true, placeholder: '0.00', step: '0.01', min: MIN_RECHARGE_AMOUNT.toString() },
            { type: 'select', name: 'bank', label: 'Banco de Origen', required: true, options: [
                { value: '', text: 'Seleccionar banco...' },
                { value: 'Pichincha', text: 'Banco Pichincha' },
                { value: 'Guayaquil', text: 'Banco de Guayaquil' },
                { value: 'Produbanco', text: 'Produbanco' },
                { value: 'Pacifico', text: 'Banco del Pacífico' },
                { value: 'Otro', text: 'Otro' }
            ]},
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
            <p class="recharge-min-amount">Monto mínimo de recarga: $${MIN_RECHARGE_AMOUNT.toFixed(2)}</p>
        </div>
    `;

    modal.form(formConfig, 'Solicitar Recarga de Saldo').then(async data => {
        if (data) {
            const amount = parseFloat(data.amount);
            const bank = sanitizeInput(data.bank);
            const proofFile = data.proof;
            const comment = sanitizeInput(data.comment || '');

            if (isNaN(amount) || amount < MIN_RECHARGE_AMOUNT) {
                modal.alert(`El monto mínimo de recarga es $${MIN_RECHARGE_AMOUNT.toFixed(2)}.`, 'Monto Inválido', 'error');
                return;
            }
            if (!proofFile) {
                modal.alert('Debes adjuntar un comprobante de pago.', 'Comprobante Requerido', 'error');
                return;
            }

            await submitRechargeRequest(amount, bank, proofFile, comment);
        }
    });

    // Add bank info section to the modal body after it's opened
    const modalBody = document.querySelector('#modal-form').closest('.modal-body');
    if (modalBody) {
        modalBody.insertAdjacentHTML('afterbegin', bankInfoHtml);
    }
}

async function submitRechargeRequest(amount, bank, proofFile, comment) {
    if (isClaudeEnvironment) {
        modal.toast('Funcionalidad de recarga no disponible en modo demo.', 'warning');
        return;
    }

    try {
        // Upload image to ImgBB
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

        // Save recharge request to Firestore
        const newRechargeRequest = {
            clientId: currentUser.uid,
            amount: amount,
            bank: bank,
            imageUrl: imageUrl,
            status: 'pending', // pending, approved, rejected
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('rechargeRequests').add(newRechargeRequest);

        modal.toast('Solicitud de recarga enviada con éxito. Esperando aprobación del administrador.', 'success');
        modal.close();
        renderClientDashboard(); // Refresh client dashboard to show pending request (if implemented)
    } catch (error) {
        console.error('Error submitting recharge request:', error);
        modal.toast(`Error al enviar la solicitud de recarga: ${error.message}`, 'error');
    }
}


function renderClientData(client) {
    // This function is now largely replaced by renderClientDashboard
    // but kept for potential specific data rendering needs.
    const dashboard = document.querySelector('#clientDashboard');
    if (!dashboard) return;

    // Example of updating specific elements if needed
    // document.getElementById('clientDisplayName').textContent = client.name;
    // document.getElementById('clientBalance').textContent = `$${(client.balance || 0).toFixed(2)}`;
}

async function loadAllClientsForAdmin() {
    // This function is now handled by webClientManager.loadAllUsers()
    // and webClientManager.renderAllUsersTable()
    if (webClientManager) {
        await webClientManager.loadAllUsers();
    }
}

function renderClientsForAdmin(clients) {
    // This function is now handled by webClientManager.renderAllUsersTable()
    // It's kept as a placeholder but won't be directly called for the main table.
    const tbody = document.querySelector('#clientsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay clientes registrados.</td></tr>';
        return;
    }

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHTML(client.name)}</td>
            <td>${escapeHTML(client.phone)}</td>
            <td>${escapeHTML(client.email)}</td>
            <td>${client.purchases || 0}</td>
            <td>${client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString() : 'Nunca'}</td>
            <td>
                <button class="btn btn-sm" onclick="editClient('${client.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteClient('${client.id}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}


function renderClients() {
    // This function is for manual clients, which are now deprecated in favor of 'users'
    // Keeping it for compatibility with existing demo data, but it won't be directly called for new registrations.
    const tbody = document.querySelector('#clientsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay clientes registrados.</td></tr>';
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
                <button class="btn btn-sm" onclick="editClient('${client.id}')" title="Editar" aria-label="Editar cliente ${escapeHTML(client.name)}" tabindex="0"><i class="fas fa-edit" aria-hidden="true"></i></button>
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
        const client = clients.find(c => c.id === sale.clientId) || webClients.find(wc => wc.id === sale.clientId);
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
        sales[saleIndex].paid = oldSale.paid; // Revert on error
        renderSales();
        modal.toast(`Error al actualizar el estado de pago: ${error.message}`, 'error');
    }
}

function renderAll() {
    renderAccounts();
    renderClients(); // For manual clients (if any)
    renderSales();
    if (financialManager) {
        financialManager.renderExpensesTable();
        financialManager.renderFinancialAccountsTable();
    }
    if (webClientManager) {
        webClientManager.renderAllUsersTable(); // Render all users for admin view
    }
    if (rechargeManager) {
        rechargeManager.renderRechargeRequests(); // Render recharge requests for admin view
    }
    updateDashboard();
}

// Funciones de modales para Cuentas
function openAddAccountModal(accountId = null) {
    let account = null;
    
    // Verificar que accounts esté definido y sea un array
    if (!Array.isArray(accounts)) {
        console.error('La variable accounts no está definida o no es un array.');
        modal.alert('Error al cargar cuentas. Por favor, intenta de nuevo.', 'Error', 'error');
        return;
    }

    // Si se proporciona un accountId, buscar la cuenta correspondiente
    if (accountId) {
        account = accounts.find(acc => acc.id === accountId);
        if (!account) {
            modal.alert(`Cuenta con ID ${accountId} no encontrada para editar.`, 'Error', 'error');
            return;
        }
    }

    // Configuración del formulario del modal
    const formConfig = {
        fields: [
            { type: 'text', name: 'platform', label: 'Plataforma', required: true, value: account ? account.platform : '' },
            { type: 'email', name: 'email', label: 'Email', required: true, value: account ? account.email : '' },
            { type: 'password', name: 'password', label: 'Contraseña', required: true, value: account ? account.password : '' },
            { type: 'number', name: 'pricePerProfile', label: 'Precio por Perfil ($)', required: true, value: account ? account.pricePerProfile : '' },
            { type: 'number', name: 'fullAccountPrice', label: 'Precio Total ($)', required: true, value: account ? account.fullAccountPrice : '' },
            { type: 'textarea', name: 'notes', label: 'Notas', placeholder: 'Información adicional...', value: account ? account.notes : '' }
        ]
    };

    // Abrir el modal con el formulario configurado
    modal.form(formConfig, `${accountId ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}`).then(async data => {
        if (data) {
            // Validaciones
            const { platform, email, password, pricePerProfile, fullAccountPrice, notes } = data;

            if (!platform || !email || !password || !pricePerProfile || !fullAccountPrice) {
                modal.alert('Por favor completa todos los campos obligatorios.', 'Campos Incompletos', 'warning');
                return;
            }

            // Crear o actualizar la cuenta
            let accountToSave;
            if (accountId) {
                accountToSave = accounts.find(acc => acc.id === accountId);
                Object.assign(accountToSave, {
                    platform: platform,
                    email: email,
                    password: password,
                    pricePerProfile: parseFloat(pricePerProfile),
                    fullAccountPrice: parseFloat(fullAccountPrice),
                    notes: notes
                });
            } else {
                accountToSave = {
                    id: Date.now().toString(),
                    platform: platform,
                    email: email,
                    password: password,
                    pricePerProfile: parseFloat(pricePerProfile),
                    fullAccountPrice: parseFloat(fullAccountPrice),
                    notes: notes,
                    profiles: [], // Inicializar perfiles vacíos
                    status: 'Disponible', // Estado inicial
                    createdAt: new Date().toISOString()
                };
                accounts.push(accountToSave);
            }

            // Guardar en Firebase
            try {
                await saveToFirebase('accounts', accountToSave);
                renderAccounts(); // Actualizar la tabla de cuentas
                modal.toast(`Cuenta ${accountId ? 'actualizada' : 'agregada'} correctamente.`, 'success');
            } catch (error) {
                console.error('Error saving account:', error);
                modal.toast(`Error al guardar la cuenta: ${error.message}`, 'error');
            }
        }
    });
}
