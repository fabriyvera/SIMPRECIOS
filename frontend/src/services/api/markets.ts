import { API, buildUrl } from '@/config/api';

export const marketsAPI = {
  getMarkets: async () => {
    const response = await fetch(buildUrl(API.ENDPOINTS.GET_MARKETS));
    if (!response.ok) throw new Error('Error al consultar mercados');
    return response.json();
  },
};
