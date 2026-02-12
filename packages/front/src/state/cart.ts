import { atom } from 'recoil';

export interface CartItem {
  id: string;
  type: 'product' | 'kit';
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

const storedCart = localStorage.getItem('cart');

export const cartState = atom<CartItem[]>({
  key: 'cartState',
  default: storedCart ? JSON.parse(storedCart) : [],
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        localStorage.setItem('cart', JSON.stringify(newValue));
      });
    },
  ],
});
