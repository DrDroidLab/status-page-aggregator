"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CTATemplate {
  title: string;
  description: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  buttons: Array<{
    text: string;
    href: string;
    variant: "primary" | "secondary";
  }>;
}

const ctaTemplates: CTATemplate[] = [
  {
    title: "Missing Critical Issues due to Alert Noise?",
    description: "",
    features: [
      {
        icon: "🔕",
        title: "DrDroid suppresses noisy alerts",
        description: "Intelligent filtering reduces false positives by 90%"
      },
      {
        icon: "🔍",
        title: "DrDroid investigates and groups genuine alerts by root cause",
        description: "Automated correlation and investigation saves hours of manual work"
      }
    ],
    buttons: [
      {
        text: "Try Now",
        href: "https://aiops.drdroid.io/sign-up",
        variant: "primary"
      },
      {
        text: "Read more",
        href: "https://drdroid.io/",
        variant: "secondary"
      }
    ]
  },
  {
    title: "Find it too difficult to debug production issues?",
    description: "Connect DrDroid to your stack and get answers faster",
    features: [
      {
        icon: "🧠",
        title: "Auto-creates a memory / knowledge graph about your company",
        description: "Learns your system architecture and failure patterns over time"
      },
      {
        icon: "🔧",
        title: "Integrates with 80+ monitoring tools",
        description: "Seamlessly connects with your existing observability stack"
      }
    ],
    buttons: [
      {
        text: "Try on cloud",
        href: "https://aiops.drdroid.io/sign-up",
        variant: "primary"
      },
      {
        text: "Try locally",
        href: "https://drdroid.io/mac-app",
        variant: "secondary"
      }
    ]
  }
];

export function DrDroidCTA() {
  const [selectedTemplate, setSelectedTemplate] = useState<CTATemplate | null>(null);

  useEffect(() => {
    // Randomly select a template on component mount
    const randomIndex = Math.floor(Math.random() * ctaTemplates.length);
    setSelectedTemplate(ctaTemplates[randomIndex]);
  }, []);

  // Don't render until we have a selected template to avoid hydration mismatch
  if (!selectedTemplate) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                🤖
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedTemplate.title}
              </h3>
              {selectedTemplate.description && (
                <p className="text-gray-700 mb-4">
                  <strong>{selectedTemplate.description}</strong>
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {selectedTemplate.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{feature.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedTemplate.buttons.map((button, index) => (
                  <Button
                    key={index}
                    asChild
                    className={
                      button.variant === "primary"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        : "border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                    }
                    variant={button.variant === "primary" ? "default" : "outline"}
                  >
                    <Link href={button.href} target="_blank" className="flex items-center gap-2">
                      {button.text}
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}