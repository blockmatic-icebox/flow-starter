import { contactBody } from "@/lib/fi-agent-surfaces-content";
import { fiOrganizationContact } from "@/lib/fi-organization-contact";

export default function ContactPage() {
  const { address, contactType, email, name, telephone } =
    fiOrganizationContact;

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Contact</h1>
      <p>{contactBody}</p>
      <h2>{name}</h2>
      <ul>
        <li>
          Email: <a href={`mailto:${email}`}>{email}</a> ({contactType})
        </li>
        <li>Phone: {telephone}</li>
        <li>
          Address: {address.streetAddress}, {address.addressLocality},{" "}
          {address.addressRegion} {address.postalCode}, {address.addressCountry}
        </li>
      </ul>
    </article>
  );
}
