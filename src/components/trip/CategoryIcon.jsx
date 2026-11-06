import React from 'react';
import { BedDouble, Bus, Utensils, Wine, Camera, ShoppingBag, Receipt } from 'lucide-react';

const MAP = { BedDouble, Bus, Utensils, Wine, Camera, ShoppingBag, Receipt };

export default function CategoryIcon({ name, className, style }) {
  const Icon = MAP[name] || Receipt;
  return <Icon className={className} style={style} />;
}