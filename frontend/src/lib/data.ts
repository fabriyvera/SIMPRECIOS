import { Market, PriceHistory } from "@/types";

// Precios de referencia establecidos por el mercado
export const REFERENCE_PRICES: Record<string, number> = {
  // Verduras
  "Tomates": 7.50, "Lechuga": 4.00, "Cebollas": 5.50, "Zanahorias": 5.00,
  "Papas": 6.50, "Acelga": 3.50, "Brócoli": 9.00, "Coliflor": 8.00,
  "Pimientos": 10.00, "Apio": 5.00, "Remolacha": 5.50, "Zapallo": 6.00,
  "Choclo": 4.00, "Habas": 8.00, "Arvejas": 9.00, "Espinaca": 4.50,
  "Rabanitos": 3.00, "Vainitas": 7.00, "Perejil": 2.00, "Cilantro": 2.00,
  "Ajo": 15.00, "Jengibre": 18.00, "Locoto": 12.00, "Cebolla verde": 3.50,
  "Berenjenas": 8.00,
  // Pollo
  "Pollo entero": 28.00, "Pechuga": 35.00, "Piernas y muslos": 30.00,
  "Alitas": 25.00, "Suprema de pollo": 38.00, "Menudencias": 15.00,
  "Pollo troceado": 32.00, "Pollo entero grande": 32.00,
  "Pechuga deshuesada": 42.00, "Pollo para sopa": 24.00, "Hígados": 18.00,
  "Pollo orgánico": 35.00, "Muslos": 28.00, "Alas de pollo": 22.00,
  "Pollo marinado": 33.00, "Pollo fresco": 29.00, "Pierna con encuentro": 26.00,
  "Pechuga con hueso": 32.00, "Carcasa para caldo": 12.00,
  // Carne
  "Carne de res": 42.00, "Lomo": 55.00, "Costillas": 38.00,
  "Carne molida": 35.00, "Bistec": 45.00, "Chuletas": 40.00,
  "Osobuco": 38.00, "Falda": 35.00, "Carne para estofado": 38.00,
  "T-bone": 58.00, "Asado de tira": 44.00, "Carne para milanesa": 46.00,
  "Carne para parrilla": 48.00, "Medallones": 52.00, "Punta de anca": 46.00,
  "Chorizo criollo": 34.00, "Lomo fino": 60.00, "Carne picada": 36.00,
  "Costillar": 42.00, "Nalga": 44.00,
};

export function generatePriceHistory(currentPrice: number): PriceHistory[] {
  const dates = ["15 Ene", "22 Ene", "29 Ene", "5 Feb", "12 Feb", "19 Feb", "26 Feb", "4 Mar"];
  const history: PriceHistory[] = dates.map((date, i) => {
    const variation = (Math.random() - 0.5) * 0.2;
    const price = currentPrice * (1 + variation - 0.1 * (dates.length - i) / dates.length);
    return { date, price: Math.max(price, currentPrice * 0.8) };
  });
  history.push({ date: "Hoy", price: currentPrice });
  return history;
}

export const INITIAL_MARKETS: Market[] = [
  {
    id: "1", name: "Verduras Doña María", category: "Verduras", isOpen: true,
    marketLocation: "Mercado Central", color: "#4caf50",
    products: [
      { id: "p1", name: "Tomates", price: 8.00, available: true },
      { id: "p2", name: "Lechuga", price: 4.00, available: true },
      { id: "p3", name: "Cebollas", price: 6.00, available: true },
      { id: "p4", name: "Zanahorias", price: 5.00, available: true },
      { id: "p5", name: "Papas", price: 7.00, available: true },
    ],
    rating: 4.5,
    reviews: [
      { id: "r1", userName: "María González", rating: 5, comment: "Siempre tienen verduras frescas. Doña María es muy amable y los precios son justos.", date: "28 Feb 2026" },
      { id: "r2", userName: "Carlos Ramírez", rating: 4, comment: "Buena calidad de verduras. Todo está fresco y limpio.", date: "25 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1747503331142-27f458a1498c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Verduras frescas de la región. Productos de temporada y calidad garantizada.",
    hours: "Lun-Sáb: 7:00 AM - 6:00 PM",
  },
  {
    id: "2", name: "Pollería El Gallo de Oro", category: "Pollo", isOpen: true,
    marketLocation: "Mercado Central", color: "#ff9800",
    products: [
      { id: "p6", name: "Pollo entero", price: 28.00, available: true },
      { id: "p7", name: "Pechuga", price: 35.00, available: true },
      { id: "p8", name: "Piernas y muslos", price: 30.00, available: true },
      { id: "p9", name: "Alitas", price: 25.00, available: true },
    ],
    rating: 4.8,
    reviews: [
      { id: "r3", userName: "Ana Martínez", rating: 5, comment: "El pollo más fresco del mercado. Siempre compro aquí, excelente calidad.", date: "1 Mar 2026" },
    ],
    image: "https://images.unsplash.com/photo-1759493321741-883fbf9f433c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Pollo fresco de granja. Criado naturalmente sin hormonas.",
    hours: "Mar-Dom: 6:00 AM - 3:00 PM",
  },
  {
    id: "3", name: "Carnicería Don José", category: "Carne", isOpen: true,
    marketLocation: "Mercado Central", color: "#f44336",
    products: [
      { id: "p10", name: "Carne de res", price: 42.00, available: true },
      { id: "p11", name: "Lomo", price: 55.00, available: true },
      { id: "p12", name: "Costillas", price: 38.00, available: true },
      { id: "p13", name: "Carne molida", price: 35.00, available: true },
    ],
    rating: 4.7,
    reviews: [
      { id: "r4", userName: "Pedro Sánchez", rating: 5, comment: "Don José siempre te da el mejor corte. Carne de primera calidad.", date: "27 Feb 2026" },
      { id: "r5", userName: "Laura Díaz", rating: 4, comment: "Muy buena carne. Los precios son competitivos.", date: "24 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1740586222627-48338edac67d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Carnes frescas de res. Más de 30 años sirviendo a la comunidad.",
    hours: "Mar-Dom: 7:00 AM - 4:00 PM",
  },
  {
    id: "4", name: "Verduras Don Pedro", category: "Verduras", isOpen: true,
    marketLocation: "Mercado del Puerto", color: "#8bc34a",
    products: [
      { id: "p14", name: "Acelga", price: 3.50, available: true },
      { id: "p15", name: "Brócoli", price: 9.00, available: true },
      { id: "p16", name: "Coliflor", price: 8.00, available: true },
      { id: "p17", name: "Pimientos", price: 10.00, available: true },
      { id: "p18", name: "Apio", price: 5.00, available: true },
    ],
    rating: 4.6,
    reviews: [
      { id: "r6", userName: "Isabel Torres", rating: 5, comment: "Verduras muy frescas. Don Pedro siempre tiene variedad.", date: "26 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1665315302321-46989ca7829a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Verduras frescas del valle. Gran variedad y buenos precios.",
    hours: "Lun-Sáb: 7:00 AM - 5:00 PM",
  },
  {
    id: "5", name: "Pollería La Granja", category: "Pollo", isOpen: false,
    marketLocation: "Mercado del Puerto", color: "#ffa726",
    products: [
      { id: "p19", name: "Pollo entero", price: 27.00, available: true },
      { id: "p20", name: "Suprema de pollo", price: 38.00, available: true },
      { id: "p21", name: "Menudencias", price: 15.00, available: true },
      { id: "p22", name: "Pollo troceado", price: 32.00, available: true },
    ],
    rating: 4.4,
    reviews: [
      { id: "r7", userName: "Roberto Fernández", rating: 4, comment: "Buen pollo, aunque a veces cierran temprano.", date: "2 Mar 2026" },
    ],
    image: "https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Pollo de granja criado naturalmente. Calidad garantizada.",
    hours: "Lun-Vie: 6:00 AM - 2:00 PM",
  },
  {
    id: "6", name: "Carnicería La Paz", category: "Carne", isOpen: true,
    marketLocation: "Mercado Norte", color: "#d32f2f",
    products: [
      { id: "p23", name: "Bistec", price: 45.00, available: true },
      { id: "p24", name: "Chuletas", price: 40.00, available: true },
      { id: "p25", name: "Osobuco", price: 38.00, available: true },
      { id: "p26", name: "Falda", price: 35.00, available: true },
    ],
    rating: 4.5,
    reviews: [
      { id: "r8", userName: "Carmen López", rating: 5, comment: "Excelente carne y muy limpio todo. Los recomiendo.", date: "29 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1632154023554-c2975e9be348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Carnes selectas de res. Cortes especiales para cada ocasión.",
    hours: "Mar-Dom: 7:00 AM - 5:00 PM",
  },
  {
    id: "7", name: "Verduras Frescas El Campo", category: "Verduras", isOpen: true,
    marketLocation: "Mercado Norte", color: "#66bb6a",
    products: [
      { id: "p27", name: "Remolacha", price: 5.50, available: true },
      { id: "p28", name: "Zapallo", price: 6.00, available: true },
      { id: "p29", name: "Choclo", price: 4.00, available: true },
      { id: "p30", name: "Habas", price: 8.00, available: true },
      { id: "p31", name: "Arvejas", price: 9.00, available: true },
    ],
    rating: 4.7,
    reviews: [
      { id: "r9", userName: "Juana Pérez", rating: 5, comment: "Todo fresco directo del campo. Me encanta comprar aquí.", date: "1 Mar 2026" },
    ],
    image: "https://images.unsplash.com/photo-1631067776332-4f2d55453125?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Verduras directo del campo. Productos orgánicos y de temporada.",
    hours: "Lun-Sáb: 6:00 AM - 5:00 PM",
  },
  {
    id: "8", name: "Pollería San Juan", category: "Pollo", isOpen: true,
    marketLocation: "Mercado Norte", color: "#fb8c00",
    products: [
      { id: "p32", name: "Pollo entero grande", price: 32.00, available: true },
      { id: "p33", name: "Pechuga deshuesada", price: 42.00, available: true },
      { id: "p34", name: "Pollo para sopa", price: 24.00, available: true },
      { id: "p35", name: "Hígados", price: 18.00, available: true },
    ],
    rating: 4.6,
    reviews: [
      { id: "r10", userName: "Andrés Morales", rating: 5, comment: "Pollo de excelente calidad. Siempre fresco.", date: "28 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Pollos frescos de granja propia. Calidad y frescura garantizada.",
    hours: "Lun-Dom: 6:00 AM - 4:00 PM",
  },
  {
    id: "9", name: "Carnicería El Matadero", category: "Carne", isOpen: true,
    marketLocation: "Mercado Central", color: "#c62828",
    products: [
      { id: "p36", name: "Carne para estofado", price: 38.00, available: true },
      { id: "p37", name: "T-bone", price: 58.00, available: true },
      { id: "p38", name: "Asado de tira", price: 44.00, available: true },
      { id: "p39", name: "Carne para milanesa", price: 46.00, available: true },
    ],
    rating: 4.8,
    reviews: [
      { id: "r11", userName: "Fernando Castro", rating: 5, comment: "La mejor carne del mercado. Siempre tierna y fresca.", date: "2 Mar 2026" },
    ],
    image: "https://images.unsplash.com/photo-1700481158997-60ff09259f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Carnes premium de res. Especialistas en cortes finos.",
    hours: "Mar-Sáb: 7:00 AM - 5:00 PM",
  },
  {
    id: "10", name: "Verduras La Cancha", category: "Verduras", isOpen: false,
    marketLocation: "Mercado Central", color: "#689f38",
    products: [
      { id: "p40", name: "Espinaca", price: 4.50, available: true },
      { id: "p41", name: "Rabanitos", price: 3.00, available: true },
      { id: "p42", name: "Vainitas", price: 7.00, available: true },
      { id: "p43", name: "Perejil", price: 2.00, available: true },
      { id: "p44", name: "Cilantro", price: 2.00, available: true },
    ],
    rating: 4.3,
    reviews: [
      { id: "r12", userName: "Silvia Rojas", rating: 4, comment: "Buenos precios y verduras frescas.", date: "25 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1665315302321-46989ca7829a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Verduras y hierbas frescas. Productos del día.",
    hours: "Lun-Vie: 7:00 AM - 3:00 PM",
  },
  {
    id: "11", name: "Pollería Doña Rosa", category: "Pollo", isOpen: true,
    marketLocation: "Mercado del Puerto", color: "#ff6f00",
    products: [
      { id: "p45", name: "Pollo orgánico", price: 35.00, available: true },
      { id: "p46", name: "Muslos", price: 28.00, available: true },
      { id: "p47", name: "Alas de pollo", price: 22.00, available: true },
      { id: "p48", name: "Pollo marinado", price: 33.00, available: true },
    ],
    rating: 4.9,
    reviews: [
      { id: "r13", userName: "Ricardo Quispe", rating: 5, comment: "Doña Rosa tiene el mejor pollo del mercado. Súper fresco y limpio.", date: "27 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1759493321741-883fbf9f433c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Pollo fresco y de calidad. Atención personalizada.",
    hours: "Lun-Dom: 6:00 AM - 3:00 PM",
  },
  {
    id: "12", name: "Carnicería Los Andes", category: "Carne", isOpen: true,
    marketLocation: "Mercado del Puerto", color: "#b71c1c",
    products: [
      { id: "p49", name: "Carne para parrilla", price: 48.00, available: true },
      { id: "p50", name: "Medallones", price: 52.00, available: true },
      { id: "p51", name: "Punta de anca", price: 46.00, available: true },
      { id: "p52", name: "Chorizo criollo", price: 34.00, available: true },
    ],
    rating: 4.7,
    reviews: [
      { id: "r14", userName: "Patricia Condori", rating: 5, comment: "Carne de excelente calidad. Los chorizos son deliciosos.", date: "1 Mar 2026" },
    ],
    image: "https://images.unsplash.com/photo-1632154023554-c2975e9be348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Carnes selectas y embutidos artesanales. Tradición familiar.",
    hours: "Mar-Dom: 7:00 AM - 5:00 PM",
  },
  {
    id: "13", name: "Verduras Orgánicas El Valle", category: "Verduras", isOpen: true,
    marketLocation: "Mercado Norte", color: "#558b2f",
    products: [
      { id: "p53", name: "Ajo", price: 15.00, available: true },
      { id: "p54", name: "Jengibre", price: 18.00, available: true },
      { id: "p55", name: "Locoto", price: 12.00, available: true },
      { id: "p56", name: "Cebolla verde", price: 3.50, available: true },
      { id: "p57", name: "Berenjenas", price: 8.00, available: true },
    ],
    rating: 4.8,
    reviews: [
      { id: "r15", userName: "Jorge Mamani", rating: 5, comment: "Verduras 100% orgánicas. Se nota la calidad.", date: "26 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1631067776332-4f2d55453125?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Verduras orgánicas certificadas. Sin pesticidas ni químicos.",
    hours: "Lun-Sáb: 7:00 AM - 6:00 PM",
  },
  {
    id: "14", name: "Pollería El Pollito Feliz", category: "Pollo", isOpen: false,
    marketLocation: "Mercado Central", color: "#f57c00",
    products: [
      { id: "p58", name: "Pollo fresco", price: 29.00, available: true },
      { id: "p59", name: "Pierna con encuentro", price: 26.00, available: true },
      { id: "p60", name: "Pechuga con hueso", price: 32.00, available: true },
      { id: "p61", name: "Carcasa para caldo", price: 12.00, available: true },
    ],
    rating: 4.4,
    reviews: [
      { id: "r16", userName: "Daniela Vargas", rating: 4, comment: "Buen pollo a precio accesible.", date: "29 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Pollos frescos a precios económicos. Buena relación calidad-precio.",
    hours: "Lun-Sáb: 6:00 AM - 2:00 PM",
  },
  {
    id: "15", name: "Carnicería Santa Cruz", category: "Carne", isOpen: true,
    marketLocation: "Mercado Norte", color: "#e53935",
    products: [
      { id: "p62", name: "Lomo fino", price: 60.00, available: true },
      { id: "p63", name: "Carne picada", price: 36.00, available: true },
      { id: "p64", name: "Costillar", price: 42.00, available: true },
      { id: "p65", name: "Nalga", price: 44.00, available: true },
    ],
    rating: 4.6,
    reviews: [
      { id: "r17", userName: "Eduardo Paz", rating: 5, comment: "Carne de primera. Muy buenos cortes y excelente atención.", date: "28 Feb 2026" },
    ],
    image: "https://images.unsplash.com/photo-1700481158997-60ff09259f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description: "Especialistas en cortes premium de carne. Atención de calidad.",
    hours: "Mar-Dom: 7:00 AM - 5:00 PM",
  },
];