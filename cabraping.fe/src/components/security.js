import { showNotification } from "./showNotification.js";

// Función para escapar caracteres HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return unsafe;
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Función para validar y sanitizar la entrada del usuario
export function validateAndSanitizeInput(userInput) {
    // Validación básica para entradas vacías o demasiado largas
    // if (typeof userInput !== 'string') {
    //     // throw new Error("Input is not a valid string");
    //     showNotification("Input is not a valid string", "error");
    //     return;
    // }
    if (userInput.trim() === "" || userInput.length > 1000) {
        // throw new Error("Input is either empty or too long");
        showNotification("Input is either empty or too long", "error");
        return;
    }

    // Comprobar patrones sospechosos de SQL Injection (esto es solo un ejemplo simple)
    const sqlInjectionPattern = /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|CREATE|REPLACE|RENAME|TRUNCATE|MERGE|CALL|EXPLAIN|LOCK|UNLOCK|GRANT|REVOKE|SHOW|DESCRIBE|USE|HELP|SOURCE)\b|--|\/\*|\*\/|;|=|<|>|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b|\bALTER\b|\bCREATE\b|\bREPLACE\b|\bRENAME\b|\bTRUNCATE\b|\bMERGE\b|\bCALL\b|\bEXPLAIN\b|\bLOCK\b|\bUNLOCK\b|\bGRANT\b|\bREVOKE\b|\bSHOW\b|\bDESCRIBE\b|\bUSE\b|\bHELP\b|\bSOURCE\b)/gi;
    if (sqlInjectionPattern.test(userInput)) {
        showNotification("Input contains potential SQL injection patterns", "error");
        return null;
    }

    // Escapar caracteres HTML para prevenir XSS
    const sanitizedInput = escapeHtml(userInput);

    return sanitizedInput;
}

