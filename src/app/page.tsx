import { redirect } from 'next/navigation';

export default function Home() {
  // Immediately show the Applicant view by default
  redirect('/apply');
}
