// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const token = await cookies().get('token');
  
  if (!token) {
    redirect('/login');
  } else {
    redirect('/prompts/1');
  }
}