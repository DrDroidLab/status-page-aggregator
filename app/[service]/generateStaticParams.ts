import { servicesCatalog } from "@/lib/servicesCatalog";

export async function generateStaticParams() {
  return servicesCatalog.map((service) => ({
    service: service.slug,
  }));
}
