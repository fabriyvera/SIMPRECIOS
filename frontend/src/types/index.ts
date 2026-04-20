export interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Market {
  id: string;
  name: string;
  category: string;
  isOpen: boolean;
  products: Product[];
  rating: number;
  reviews: Review[];
  image: string;
  description: string;
  hours: string;
  marketLocation: string;
  color: string;
  vendorId?: string;
}

export interface PriceHistory {
  date: string;
  price: number;
}

export type AppView = "home" | "map" | "ai" | "vendor";

export interface CurrentUser {
  name: string;
  avatar: string;
  isVendor: boolean;
}