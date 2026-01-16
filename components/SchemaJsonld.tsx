export default function SchemaJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rig Builders",
    "url": "https://www.rigbuilders.in",
    "logo": "https://www.rigbuilders.in/icons/navbar/logo.png", // Must be absolute URL
    "sameAs": [
      "https://instagram.com/rigbuilders", // Add your socials
      "https://twitter.com/rigbuilders"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX", // Add your support number
      "contactType": "customer service",
      "areaServed": "IN"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}