import { fiOrganizationContact } from "@/lib/fi-organization-contact";
import { fiSeoProductName, hunchSummary } from "@/lib/hunch-content";

export const buildFiJsonLd = ({ origin }: { origin: string }) => {
  const url = origin.replace(/\/$/u, "");
  const contact = fiOrganizationContact;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        description: hunchSummary,
        name: fiSeoProductName,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        operatingSystem: "Web",
        url,
      },
      {
        "@type": "Organization",
        address: {
          "@type": "PostalAddress",
          ...contact.address,
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: contact.contactType,
          email: contact.email,
          telephone: contact.telephone,
        },
        name: contact.name,
        url,
      },
    ],
  };
};
