import ServicePageClient from './ServicePageClient';

export default async function ServicePage({ params }) {
  // Extraer id usando await
  const { id } = await params;
  return <ServicePageClient id={id} />;
}