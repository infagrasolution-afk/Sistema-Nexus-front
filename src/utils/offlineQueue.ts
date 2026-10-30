/**
 * Gestor de Cola de Ventas Offline (Contingencia ante Caídas de Internet y Electricidad)
 * Diseñado específicamente para la resiliencia operativa en comercios de Venezuela.
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

const OFFLINE_QUEUE_KEY = 'apex_pos_offline_sales_queue';

export const getOfflineSales = (): OfflineSale[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo cola offline:', e);
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
    totals: totals
  };
  queue.push(item);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return item;
};

export const removeOfflineSale = (localId: string): void => {
  const queue = getOfflineSales();
  const filtered = queue.filter(item => item.local_id !== localId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
};

export const clearOfflineSales = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const syncOfflineSales = async (apiClient: any): Promise<{ synced: number; failed: number }> => {
  const queue = getOfflineSales();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await apiClient.post('/sales/', item.sale_data);
      removeOfflineSale(item.local_id);
      synced++;
    } catch (e) {
      console.error(`Error sincronizando venta offline ${item.local_id}:`, e);
      failed++;
    }
  }

  return { synced, failed };
};
