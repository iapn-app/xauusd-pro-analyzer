export const formatPrice = (price: number) => `$${price.toFixed(2)}`;
export const formatPercentage = (percent: number) => `${percent.toFixed(2)}%`;
export const formatTime = (timestamp: string | number) => {
  try {
    const date = new Date(typeof timestamp === 'number' && timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};
export const normalizeCandles = (data: any[] | undefined): any[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(c => ({
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    timestamp: c.datetime || c.timestamp // API might return datetime
  }));
};
