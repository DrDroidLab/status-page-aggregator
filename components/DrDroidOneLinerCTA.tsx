"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const oneLiners = [
  {
    text: "Missing alerts due to noise?",
    cta: "Let DrDroid filter & investigate",
    href: "https://aiops.drdroid.io/sign-up"
  },
  {
    text: "Struggling with incident debugging?",
    cta: "Try DrDroid's AI investigation",
    href: "https://aiops.drdroid.io/sign-up"
  }
];

export function DrDroidOneLinerCTA() {
  const [selectedOneLiner, setSelectedOneLiner] = useState<typeof oneLiners[0] | null>(null);

  useEffect(() => {
    // Randomly select a one-liner on component mount
    const randomIndex = Math.floor(Math.random() * oneLiners.length);
    setSelectedOneLiner(oneLiners[randomIndex]);
  }, []);

  // Don't render until we have a selected one-liner to avoid hydration mismatch
  if (!selectedOneLiner) {
    return null;
  }

  return (
    <div className="text-center mb-6">
      <p className="text-sm text-muted-foreground mb-3">
        {selectedOneLiner.text}{" "}
        <Button
          variant="link"
          asChild
          className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
        >
          <Link href={selectedOneLiner.href} target="_blank" className="inline-flex items-center gap-1">
            {selectedOneLiner.cta}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </p>
    </div>
  );
}