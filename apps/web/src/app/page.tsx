import { redirect } from 'next/navigation';

// Root "/" always redirects to /dashboard (middleware handles auth guard)
export default function RootPage() {
  redirect('/dashboard');
}
