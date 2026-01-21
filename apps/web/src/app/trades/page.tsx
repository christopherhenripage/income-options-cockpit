import { redirect } from 'next/navigation';

// Redirect to dashboard - all trade functionality is now there
export default function TradesPage() {
  redirect('/dashboard');
}
