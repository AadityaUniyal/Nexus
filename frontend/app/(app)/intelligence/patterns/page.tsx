import { redirect } from 'next/navigation';

export default function DeferredPatternPage(): never {
  redirect('/incidents');
}
