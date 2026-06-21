import { useParams } from "react-router-dom";
import { getSeoPageBySlug } from "./data/seoPages";
import { ComparisonPage } from "./templates/ComparisonPage";
import { GuidePage } from "./templates/GuidePage";
import { ProductPage } from "./templates/ProductPage";
import { BaitPage } from "./templates/BaitPage";
import NotFound from "@/pages/NotFound";

const templates = {
  comparison: ComparisonPage,
  guide: GuidePage,
  product: ProductPage,
  bait: BaitPage,
} as const;

export default function SeoRouter() {
  const params = useParams();
  // Reconstruct slug from wildcard
  const slug = params["*"] || "";
  const page = getSeoPageBySlug(slug);

  if (!page) return <NotFound />;

  const Template = templates[page.template];
  return <Template page={page} />;
}
