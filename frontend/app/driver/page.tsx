import { redirect } from 'next/navigation';

export default function DriverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  redirect('/driver-pass');
}
