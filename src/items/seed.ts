import { Item } from './item.types';

/**
 * Seed de demonstração — os mesmos 6 itens do supabase/schema.sql.
 * Usado quando a API roda em modo local (sem credenciais do Supabase).
 */
export const ITENS_SEED: Omit<Item, 'id' | 'createdAt'>[] = [
  {
    name: 'Espresso Duplo',
    description:
      'Dose dupla de grãos torrados na casa, corpo intenso e crema aveludada.',
    price: 8.5,
    category: 'Bebidas',
    imageUrl:
      'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80',
    available: true,
  },
  {
    name: 'Cappuccino Cremoso',
    description: 'Espresso, leite vaporizado e uma nuvem de espuma com canela.',
    price: 12,
    category: 'Bebidas',
    imageUrl:
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80',
    available: true,
  },
  {
    name: 'Cheesecake de Frutas Vermelhas',
    description:
      'Base crocante, creme suave e calda artesanal de frutas da estação.',
    price: 16,
    category: 'Doces',
    imageUrl:
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
    available: true,
  },
  {
    name: 'Cookie Duplo Chocolate',
    description:
      'Assado toda manhã, macio por dentro, com gotas de chocolate meio amargo.',
    price: 9,
    category: 'Doces',
    imageUrl:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
    available: false,
  },
  {
    name: 'Croissant de Presunto e Queijo',
    description: 'Massa folhada amanteigada, presunto cru e queijo gratinado.',
    price: 13.5,
    category: 'Salgados',
    imageUrl:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    available: true,
  },
  {
    name: 'Granola com Iogurte e Mel',
    description: 'Iogurte natural, granola artesanal, mel e frutas frescas.',
    price: 14,
    category: 'Outros',
    imageUrl:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    available: true,
  },
];
