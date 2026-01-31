// Database schema uses snake_case
export interface InventoryItemDB {
  id: string
  business_id: string
  name: string
  quantity: number
  unit: 'pcs' | 'pack' | 'kg' | 'g' | 'l' | 'ml'
  low_stock_threshold: number | null
  cost_price: number
  selling_price: number
  created_at: string
  updated_at: string
}

// Frontend uses camelCase
export interface InventoryItem {
  id: string
  business_id: string
  name: string
  quantity: number
  unit: 'pcs' | 'pack' | 'kg' | 'g' | 'l' | 'ml'
  lowStockThreshold?: number | null
  cost_price: number
  selling_price: number
  created_at: string
  updated_at: string
}

// Helper functions to convert between DB and frontend formats
export function dbToFrontendItem(dbItem: InventoryItemDB): InventoryItem {
  return {
    ...dbItem,
    lowStockThreshold: dbItem.low_stock_threshold,
    cost_price: Number(dbItem.cost_price ?? 0),
    selling_price: Number(dbItem.selling_price ?? 0),
  }
}

export function frontendToDBItem(frontendItem: Partial<InventoryItem>): Partial<InventoryItemDB> {
  const dbItem: Partial<InventoryItemDB> = {
    name: frontendItem.name,
    quantity: frontendItem.quantity,
    unit: frontendItem.unit,
    low_stock_threshold: frontendItem.lowStockThreshold ?? null,
    cost_price: frontendItem.cost_price ?? 0,
    selling_price: frontendItem.selling_price ?? 0,
  }
  if (frontendItem.business_id) {
    dbItem.business_id = frontendItem.business_id
  }
  return dbItem
}
