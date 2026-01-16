export default function SchemaJsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rig Builders",
    "url": "https://www.rigbuilders.in",
    "logo": "https://www.rigbuilders.in/icons/navbar/logo.png",
    "sameAs": [
      "https://instagram.com/rigbuilders",
      "https://twitter.com/rigbuilders"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service",
      "areaServed": "IN"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Rig Builders",
    "url": "https://www.rigbuilders.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.rigbuilders.in/products?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}