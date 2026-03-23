export const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        return fetchWithRetry(url, retries - 1, delay * 2);
      }
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    
    // TwelveData specific error handling (they return 200 with error in body)
    if (data.status === 'error' && data.message?.includes('API credits')) {
      if (data.message.includes('daily limit')) {
        throw new Error('DAILY_LIMIT_EXCEEDED');
      }
      
      if (retries > 0) {
        // Wait longer for credit reset (at least 60s for minute-based limits)
        console.warn('TwelveData Credit Limit Hit. Waiting 60s before retry...');
        await new Promise(resolve => setTimeout(resolve, 61000));
        return fetchWithRetry(url, retries - 1, delay * 2);
      }
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    if (retries > 0 && !(error as Error).message.includes('API credits')) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay);
    }
    throw error;
  }
};
