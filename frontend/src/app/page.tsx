// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const token = cookies().get('token');
  
  if (!token) {
    redirect('/login');
  } else {
    redirect('/prompts/1');
  }
}