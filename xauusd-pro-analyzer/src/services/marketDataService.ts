import { MarketSnapshot } from '../types/market';
import { fetchWithRetry } from '../utils/apiHelpers';
import { normalizeCandles } from '../utils/dataFormatters';

const API_KEY = import.meta.env.VITE_MARKET_API_KEY;

// Fila de requisições para serialização estrita
let requestQueue: Promise<any> = Promise.resolve();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 10000; // 10 segundos para garantir segurança total (6 req/min)

const fetchWithRateLimit = async (url: string) => {
  // Enfileira a requisição
  const result = requestQueue.then(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const data = await fetchWithRetry(url);
    lastRequestTime = Date.now();
    return data;
  });

  // Atualiza a fila para a próxima requisição
  requestQueue = result.catch(() => {}); 
  return result;
};

// Cache para fallback
let lastValidPrice = 2650.00;
let isApiLimitHit = false;

export const validateMarketData = (price: any, timestamp: any) => {
  let validPrice = parseFloat(price);
  if (isNaN(validPrice) || validPrice <= 0) {
    validPrice = lastValidPrice;
  } else {
    lastValidPrice = validPrice;
  }

  let validDate: string;
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      validDate = new Date().toISOString();
    } else {
      validDate = date.toISOString();
    }
  } catch (e) {
    validDate = new Date().toISOString();
  }

  return { price: validPrice, time: validDate };
};

// Cache para evitar requisições duplicadas e estourar o limite de créditos
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 120000; // 2 minutos (TwelveData free tier é bem restrito)

const getCachedData = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};

export const getCurrentPrice = async (): Promise<number> => {
  if (!API_KEY || isApiLimitHit) return lastValidPrice;

  const cached = getCachedData('quote_XAU/USD');
  if (cached) return cached.price;

  try {
    const quote = await fetchWithRateLimit(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${API_KEY}`);
    const { price } = validateMarketData(quote.close, new Date());
    setCachedData('quote_XAU/USD', quote);
    return price;
  } catch (error: any) {
    if (error.message === 'DAILY_LIMIT_EXCEEDED') {
      console.warn('TwelveData Daily Limit Hit. Switching to mock data.');
      isApiLimitHit = true;
    }
    console.error('Error fetching current price:', error);
    return lastValidPrice;
  }
};

export const getHistoricalData = async (timeframe: string = '5min'): Promise<{ time: string; price: number }[]> => {
  if (!API_KEY || isApiLimitHit) {
    return Array.from({ length: 20 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (20 - i) * 5);
      return {
        time: date.toISOString(),
        price: 2640 + Math.random() * 20
      };
    });
  }

  const cacheKey = `time_series_XAU/USD_${timeframe}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached.values.map((v: any) => {
      const { price, time } = validateMarketData(v.close, v.datetime);
      return { time, price };
    });
  }

  try {
    const series = await fetchWithRateLimit(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${timeframe}&outputsize=100&apikey=${API_KEY}`);
    setCachedData(cacheKey, series);
    const data = series.values.map((v: any) => {
      const { price, time } = validateMarketData(v.close, v.datetime);
      return { time, price };
    });
    return data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

export const getMultiTimeframeData = async (): Promise<Record<string, { time: string; price: number; candles: any[] }>> => {
  const intervals = ['5min', '15min', '1h', '4h'];
  const results: Record<string, any> = {};

  if (!API_KEY || isApiLimitHit) {
    intervals.forEach(tf => {
      results[tf] = {
        time: new Date().toISOString(),
        price: 2650 + Math.random() * 10,
        candles: Array.from({ length: 100 }, (_, i) => ({
          timestamp: new Date().getTime() - (100 - i) * 300000,
          open: 2640 + Math.random() * 10,
          high: 2650 + Math.random() * 10,
          low: 2630 + Math.random() * 10,
          close: 2645 + Math.random() * 10,
        }))
      };
    });
    return results;
  }

  try {
    for (let i = 0; i < intervals.length; i++) {
      const tf = intervals[i];
      const cacheKey = `time_series_XAU/USD_${tf}`;
      const cached = getCachedData(cacheKey);

      if (cached) {
        const candles = normalizeCandles(cached.values).map(c => {
          const { price, time } = validateMarketData(c.close, c.timestamp);
          return { ...c, close: price, timestamp: time };
        });
        results[tf] = {
          time: candles[0]?.timestamp || new Date().toISOString(),
          price: candles[0]?.close || lastValidPrice,
          candles
        };
        continue;
      }

      const res = await fetchWithRateLimit(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${tf}&outputsize=100&apikey=${API_KEY}`);
      
      if (res.status === 'error') {
        if (res.message?.includes('daily limit')) {
          console.warn('TwelveData Daily Limit Hit. Switching to mock data.');
          isApiLimitHit = true;
          return getMultiTimeframeData(); // Retry with mock data
        }
        console.error(`Error fetching ${tf}:`, res.message);
        results[tf] = { time: new Date().toISOString(), price: lastValidPrice, candles: [] };
      } else {
        setCachedData(cacheKey, res);
        const candles = normalizeCandles(res.values).map(c => {
          const { price, time } = validateMarketData(c.close, c.timestamp);
          return { ...c, close: price, timestamp: time };
        });
        results[tf] = {
          time: candles[0]?.timestamp || new Date().toISOString(),
          price: candles[0]?.close || lastValidPrice,
          candles
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching multi-timeframe data:', error);
    return {};
  }
};

export const getMarketSnapshot = async (timeframe: string = '5min'): Promise<MarketSnapshot> => {
  if (!API_KEY || isApiLimitHit) {
    console.warn('API_KEY not set or limit hit, using mock data');
    const now = new Date();
    const candles = Array.from({ length: 20 }, (_, i) => ({
      timestamp: now.getTime() - (20 - i) * 300000,
      open: 2640 + Math.random() * 10,
      high: 2650 + Math.random() * 10,
      low: 2630 + Math.random() * 10,
      close: 2645 + Math.random() * 10,
    }));
    
    const lastCandle = candles[candles.length - 1];
    
    return {
      price: lastCandle.close,
      variation: 12.5,
      variationPercent: 0.47,
      high: 2655.00,
      low: 2640.00,
      sentiment: 'NEUTRAL',
      volatility: 'MEDIUM',
      session: 'NY',
      lastUpdate: now,
      timeframe,
      candles: candles.map(c => ({ ...c, timestamp: new Date(c.timestamp).toISOString() })),
    };
  }

  try {
    const quoteKey = 'quote_XAU/USD';
    const seriesKey = `time_series_XAU/USD_${timeframe}`;
    
    let quote = getCachedData(quoteKey);
    if (!quote) {
      quote = await fetchWithRateLimit(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${API_KEY}`);
      setCachedData(quoteKey, quote);
    }

    let series = getCachedData(seriesKey);
    if (!series) {
      series = await fetchWithRateLimit(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${timeframe}&outputsize=100&apikey=${API_KEY}`);
      setCachedData(seriesKey, series);
    }

    const validatedQuote = validateMarketData(quote.close, new Date());
    
    const candles = normalizeCandles(series.values).map(c => {
      const { price, time } = validateMarketData(c.close, c.timestamp);
      return {
        ...c,
        close: price,
        timestamp: time
      };
    });

    return {
      price: validatedQuote.price,
      variation: parseFloat(quote.change),
      variationPercent: parseFloat(quote.percent_change),
      high: parseFloat(quote.high),
      low: parseFloat(quote.low),
      sentiment: parseFloat(quote.percent_change) > 0 ? 'BULLISH' : 'BEARISH' as any,
      volatility: Math.abs(parseFloat(quote.percent_change)) > 1 ? 'HIGH' : 'MEDIUM' as any,
      session: 'NY',
      lastUpdate: new Date(),
      timeframe,
      candles,
    };
  } catch (error: any) {
    if (error.message === 'DAILY_LIMIT_EXCEEDED') {
      console.warn('TwelveData Daily Limit Hit. Switching to mock data.');
      isApiLimitHit = true;
      return getMarketSnapshot(timeframe); // Retry with mock data
    }
    console.error('Error fetching market snapshot:', error);
    throw error;
  }
};
