import { motion, LayoutGroup } from "framer-motion";
import { SavingsCard } from "./cards/SavingsCard";
import { UnitPriceCard } from "./cards/UnitPriceCard";
import { WhatYouCanBuildCard } from "./cards/WhatYouCanBuildCard";
import { VsLovableCard } from "./cards/VsLovableCard";

interface Props {
  credits: number;
  total: number;
  savings: number;
  discountPct: number;
}

export function DynamicCardsGrid({ credits, total, savings, discountPct }: Props) {
  return (
    <LayoutGroup>
      <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4">
        <SavingsCard savings={savings} discountPct={discountPct} />
        <UnitPriceCard total={total} credits={credits} />
        <VsLovableCard credits={credits} total={total} />
        <WhatYouCanBuildCard credits={credits} />
      </motion.div>
    </LayoutGroup>
  );
}
