import ServicePageClient from './ServicePageClient';

export default function ServicePage({ params }) {
  console.log('Service Page Params:', params); // Debug log
  
  return <ServicePageClient id={params.id} />;
}