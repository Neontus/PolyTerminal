export interface Market {
  id: string;
  question: string;
  slug: string;
  volume: number;
  tokens: {
    tokenId: string;
    price: number;
    outcome: string;
    winner: boolean;
  }[];
  endDate: string;
  active: boolean;
  eventId?: string;
  // Computed on frontend
  currentPrice: number;
  category: string; 
}
