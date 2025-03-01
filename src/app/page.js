'use client';

import MachinesRegistry from '@/components/MachinesRegistry';

export default function Home() {
  console.log('Rendering Home component');
  return (
    <main className="container mx-auto px-4">
      <MachinesRegistry />
    </main>
  );
}