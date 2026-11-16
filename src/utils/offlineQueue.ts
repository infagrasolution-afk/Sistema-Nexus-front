/**
 * Motor Universal de Contingencia Offline / Online (APEX ERP Venezuela)
 * - Guarda ventas del POS y cualquier operación de escritura (POST, PUT, PATCH, DELETE)
 *   cuando falla el internet o la electricidad.
 * - Almacena caché local de lecturas (GET) para que todas las pantallas funcionen sin conexión.
 * - Cuando regresa el internet, sincroniza automáticamente toda la cola con la Base de Datos.
 */

export interface OfflineSale {
  local_id: string;
  created_at: string;
  sale_data: any;
  totals: {
    subtotal: number;
    tax: number;
    igtf: number;
    total: number;
    currency: string;
  };
}

export interface OfflineMutationItem {
  id: string;
  created_at: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data: any;
  headers?: Record<string, string>;
  description?: string;
}

const OFFLINE_QUEUE_KEY = 'apex_pos_offline_sales_queue';
const UNIVERSAL_MUTATION_QUEUE_KEY = 'apex_universal_offline_mutations_v1';
const OFFLINE_GET_CACHE_PREFIX = 'apex_offline_cache_v1:';

function notifyQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex-offline-queue-updated'));
  }
}

// ── 1. Cola de Ventas POS ─────────────────────────────────────────────────────

export const getOfflineSales = (): OfflineSale[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo cola offline POS:', e);
    return [];
  }
};

export const saveOfflineSale = (saleData: any, totals: any): OfflineSale => {
  const queue = getOfflineSales();
  const localId = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item: OfflineSale = {
    local_id: localId,
    created_at: new Date().toISOString(),
    sale_data: saleData,
    totals: totals,
  };
  queue.push(item);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  notifyQueueChanged();
  return item;
};

export const removeOfflineSale = (localId: string): void => {
  const queue = getOfflineSales();
  const filtered = queue.filter((item) => item.local_id !== localId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  notifyQueueChanged();
};

export const clearOfflineSales = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  notifyQueueChanged();
};

// ── 2. Cola Universal de Escrituras Offline (Todos los Módulos del ERP) ───────

export const getOfflineMutations = (): OfflineMutationItem[] => {
  try {
    const raw = localStorage.getItem(UNIVERSAL_MUTATION_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const enqueueOfflineMutation = (
  method: string,
  url: string,
  data: any,
  headers?: Record<string, string>
): OfflineMutationItem => {
  const queue = getOfflineMutations();
  const item: OfflineMutationItem = {
    id: `MUT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    created_at: new Date().toISOString(),
    method: method.toLowerCase() as OfflineMutationItem['method'],
    url,
    data: typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return data; } })() : data,
    headers,
    description: `${method.toUpperCase()} ${url}`,
  };
  queue.push(item);
  localStorage.setItem(UNIVERSAL_MUTATION_QUEUE_KEY, JSON.stringify(queue));
  notifyQueueChanged();
  return item;
};

export const removeOfflineMutation = (id: string): void => {
  const queue = getOfflineMutations().filter((item) => item.id !== id);
  localStorage.setItem(UNIVERSAL_MUTATION_QUEUE_KEY, JSON.stringify(queue));
  notifyQueueChanged();
};

export const getTotalPendingOfflineCount = (): number => {
  return getOfflineSales().length + getOfflineMutations().length;
};

// ── 3. Sincronización Automática con la Base de Datos al Volver Internet ─────

let isCurrentlySyncing = false;

export const syncOfflineSales = async (
  apiClient: any
): Promise<{ synced: number; failed: number }> => {
  if (isCurrentlySyncing) return { synced: 0, failed: 0 };
  isCurrentlySyncing = true;

  let synced = 0;
  let failed = 0;

  try {
    // A) Sincronizar cola de ventas POS
    const posQueue = getOfflineSales();
    for (const item of posQueue) {
      try {
        await apiClient.post('/sales/', item.sale_data, { headers: { 'X-Bypass-Offline-Queue': '1' } });
        removeOfflineSale(item.local_id);
        synced++;
      } catch (e) {
        console.error(`Error sincronizando venta offline ${item.local_id}:`, e);
        failed++;
      }
    }

    // B) Sincronizar cola universal de mutaciones (Productos, Clientes, Compras, Inventario, Pagos, etc.)
    const mutQueue = getOfflineMutations();
    for (const mut of mutQueue) {
      try {
        await apiClient.request({
          method: mut.method,
          url: mut.url,
          data: mut.data,
          headers: { ...(mut.headers || {}), 'X-Bypass-Offline-Queue': '1' },
        });
        removeOfflineMutation(mut.id);
        synced++;
      } catch (e) {
        console.error(`Error sincronizando operación offline ${mut.id} (${mut.url}):`, e);
        failed++;
      }
    }
  } finally {
    isCurrentlySyncing = false;
    notifyQueueChanged();
  }

  return { synced, failed };
};

// ── 4. Caché Local para Consultas GET en Modo Offline ─────────────────────────

export const saveOfflineGetCache = (key: string, data: any): void => {
  try {
    localStorage.setItem(
      `${OFFLINE_GET_CACHE_PREFIX}${key}`,
      JSON.stringify({ updated_at: Date.now(), data })
    );
  } catch {
    // Si localStorage se llena, ignorar silenciosamente
  }
};

export const loadOfflineGetCache = (key: string): any | null => {
  try {
    const raw = localStorage.getItem(`${OFFLINE_GET_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
};
