export const CATEGORIES = [
  { value: 'Hospedagem', label: 'Hospedagem', icon: 'BedDouble', color: '#0ea5a4' },
  { value: 'Transporte', label: 'Transporte', icon: 'Bus', color: '#3b82f6' },
  { value: 'Alimentação', label: 'Alimentação', icon: 'Utensils', color: '#f97316' },
  { value: 'Bebidas', label: 'Bebidas', icon: 'Wine', color: '#ec4899' },
  { value: 'Passeios', label: 'Passeios', icon: 'Camera', color: '#8b5cf6' },
  { value: 'Compras', label: 'Compras', icon: 'ShoppingBag', color: '#eab308' },
  { value: 'Outros', label: 'Outros', icon: 'Receipt', color: '#64748b' },
];

export const categoryMeta = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];