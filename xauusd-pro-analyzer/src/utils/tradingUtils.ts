export const formatNumberSafe = (value: number | string, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export const getRiskProfile = (risk: number) => {
  if (risk <= 1) return { label: 'Conservador', color: 'text-emerald-500' };
  if (risk <= 2) return { label: 'Moderado', color: 'text-amber-500' };
  return { label: 'Agressivo', color: 'text-red-500' };
};
