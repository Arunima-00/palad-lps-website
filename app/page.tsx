import { redirect } from 'next/navigation';

// Redirect root "/" to the default locale "/ml"
export default function RootPage() {
  redirect('/ml');
}
