const DB_NAME = "EstagioDB";
const DB_VERSION = 1;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (e) => reject("Erro ao abrir banco de dados");
        
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('ficha1')) {
                database.createObjectStore('ficha1', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('ficha3')) {
                database.createObjectStore('ficha3', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('ficha4')) {
                database.createObjectStore('ficha4', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

const salvarRegistro = async (storeName, data) => {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const listarRegistros = async (storeName) => {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};