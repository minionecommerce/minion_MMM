import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Items | Minion' };

// The Items module looks like the Quotes screens (the same Inter / light wrapper)
export { default } from '../quotes/layout';
