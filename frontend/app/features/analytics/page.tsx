import { redirect } from 'next/navigation';

export default function DeferredFeaturePage(): never {
  redirect('/#product');
}