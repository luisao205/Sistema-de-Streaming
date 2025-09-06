// config.template.js - Plantilla de configuración pública
const config = {
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.firebasestorage.app",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    },
    admin: {
        uid: "YOUR_ADMIN_UID_FROM_FIREBASE_AUTH",
        whatsappNumber: "YOUR_WHATSAPP_NUMBER"
    },
    imgbb: {
        apiKey: "YOUR_IMGBB_API_KEY"
    },
    settings: {
        minRechargeAmount: 5.00,
        isClaudeEnvironment: false // Cambiar a true para demo
    }
};

// Sistema de exportación
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else if (typeof window !== 'undefined') {
    window.AppConfig = config;
}