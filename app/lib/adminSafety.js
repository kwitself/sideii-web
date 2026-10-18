export const isAdminUser = user => user?.app_metadata?.role === 'admin';

export function isQaFixture(product = {}) {
  product = product || {};
  return [product.slug, product.catalogue_no, ...(product.product_variants || []).map(v => v.sku)]
    .some(value => /^qa-/i.test(String(value || '').trim()));
}

export function inventorySummary(variants = []) {
  const physical = variants.filter(v => v.format !== 'digital');
  const active = physical.filter(v => v.active !== false);
  return {
    physical,
    stock: active.reduce((sum, v) => sum + Number(v.stock_qty || 0), 0),
    reserved: active.reduce((sum, v) => sum + Number(v.reserved_qty || 0), 0),
    available: active.reduce((sum, v) => sum + Math.max(0, Number(v.stock_qty || 0) - Number(v.reserved_qty || 0)), 0),
    low: active.filter(v => Math.max(0, Number(v.stock_qty || 0) - Number(v.reserved_qty || 0)) <= Number(v.low_stock_threshold || 0)),
  };
}

export function stockAdjustment(variant) {
  const stock = Number(variant.stock_qty);
  const reserved = Number(variant.reserved_qty);
  const threshold = Number(variant.low_stock_threshold);
  if ([variant.stock_qty, variant.low_stock_threshold].some(v => v == null || String(v).trim() === '') ||
      ![stock, reserved, threshold].every(v => Number.isSafeInteger(v) && v >= 0)) {
    throw new Error('Stock and threshold must be non-negative whole numbers.');
  }
  if (stock < reserved) throw new Error('Stock cannot be lower than units reserved by orders.');
  return {stock_qty: stock, low_stock_threshold: threshold, manufactured_qty: Math.max(stock, Number(variant.manufactured_qty || 0))};
}

// The conditional update must return a row. Otherwise a concurrent reservation or
// stock change would be overwritten by an editor opened before that change.
export async function updateStockSafely(client, variant) {
  const payload = stockAdjustment(variant);
  const {data, error} = await client.from('product_variants').update(payload)
    .eq('id', variant.id).eq('stock_qty', variant.originalStock)
    .eq('reserved_qty', variant.reserved_qty).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Inventory changed while you were editing. Refresh and try again.');
  const ledger = await client.from('inventory_movements').insert({
    variant_id: variant.id, movement_type: 'adjustment',
    quantity: payload.stock_qty - Number(variant.originalStock), note: 'Control room stock adjustment',
  });
  return {stock: payload.stock_qty, ledgerError: ledger.error};
}
