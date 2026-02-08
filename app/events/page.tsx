"use client";
import { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-stone-500">Loading...</p></div>}>
      <ClientPage />
    </Suspense>
  );
}