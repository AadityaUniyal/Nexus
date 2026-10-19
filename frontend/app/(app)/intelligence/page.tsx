import { redirect } from 'next/navigation';

export default function DeferredIntelligencePage(): never {
  redirect('/incidents');
}
