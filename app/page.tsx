"use client";
import { useEffect, useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Github, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  fetchServiceStatus,
  getStatusColor,
  getStatusText,
  type ServiceStatus,
} from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { StatusMonitorClient } from "./components/StatusMonitorClient";

// ServiceStatus type is imported from @/lib/status

interface Service {
  name: string;
  status?: ServiceStatus;
  statusUrl: string;
  communityUrl: string;
  slug: string;
  tags: string[];
}

interface StatusMap {
  [key: string]: {
    status: ServiceStatus;
    last_incident?: {
      createdAt: string;
    };
  };
}

const services: Service[] = [
  // Cloud Providers
  {
    name: "OpenAI",
    statusUrl: "https://status.openai.com/",
    communityUrl: "https://community.openai.com/",
    slug: "openai",
    tags: ["LLM Provider"],
  },
  {
    name: "Cursor",
    statusUrl: "https://status.cursor.com/",
    communityUrl: "https://forum.cursor.com/",
    slug: "cursor",
    tags: ["AI-Code Editor"],
  },
  {
    name: "Anthropic",
    statusUrl: "https://status.anthropic.com/",
    communityUrl: "https://reddit.com/r/Anthropic",
    slug: "anthropic",
    tags: ["LLM Provider"],
  },
  {
    name: "Google Cloud",
    statusUrl: "https://status.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    slug: "google-cloud",
    tags: ["LLM Provider"],
  },
  {
    name: "DeepMind",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "google-deepmind",
    tags: ["LLM Provider"],
  },
  {
    name: "Meta",
    statusUrl: "https://metastatus.com/",
    communityUrl: "https://reddit.com/r/Meta",
    slug: "meta-ai",
    tags: ["LLM Provider"],
  },
  {
    name: "Mistral AI",
    statusUrl: "https://status.mistral.ai/",
    communityUrl: "https://reddit.com/r/MistralAI",
    slug: "mistral-ai",
    tags: ["LLM Provider"],
  },
  {
    name: "Cohere",
    statusUrl: "https://status.cohere.ai/",
    communityUrl: "https://cohere.com/blog/building-community",
    slug: "cohere",
    tags: ["LLM Provider"],
  },
  {
    name: "AWS Bedrock",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-bedrock",
    tags: ["LLM Provider"],
  },
  {
    name: "xAI",
    statusUrl: "https://status.x.ai/",
    communityUrl: "https://reddit.com/r/xAI",
    slug: "xai",
    tags: ["LLM Provider"],
  },
  {
    name: "Together AI",
    statusUrl: "https://status.together.ai/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "together-ai",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Fireworks AI",
    statusUrl: "https://status.fireworks.ai/",
    communityUrl: "https://discord.gg/mMqQxvFD9A",
    slug: "fireworks-ai",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Hugging Face Inference Endpoints",
    statusUrl: "https://status.huggingface.co/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "huggingface",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Replicate",
    statusUrl: "https://status.replicate.com/",
    communityUrl: "https://replicate.com/explore",
    slug: "replicate",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Anyscale",
    statusUrl: "https://status.anyscale.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "anyscale",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "OctoML",
    statusUrl: "https://status.octoml.ai/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "octoml",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Modal",
    statusUrl: "https://status.modal.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "modal",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "RunPod",
    statusUrl: "https://status.runpod.io/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "runpod",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "Hyperbolic",
    statusUrl: "https://status.hyperbolic.xyz/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "hyperbolic",
    tags: ["LLM Inference Layer Companies"],
  },
  {
    name: "AssemblyAI",
    statusUrl: "https://status.assemblyai.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "assemblyai",
    tags: ["Voice AI API"],
  },
  {
    name: "Deepgram",
    statusUrl: "https://status.deepgram.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "deepgram",
    tags: ["Voice AI API"],
  },
  {
    name: "Google Speech-to-Text",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    slug: "google-speech-to-text",
    tags: ["Voice AI API"],
  },
  {
    name: "AWS Transcribe",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-transcribe",
    tags: ["Voice AI API"],
  },
  {
    name: "Microsoft Azure Speech",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    slug: "azure-speech",
    tags: ["Voice AI API"],
  },
  {
    name: "Speechmatics",
    statusUrl: "https://status.speechmatics.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "speechmatics",
    tags: ["Voice AI API"],
  },
  {
    name: "ElevenLabs",
    statusUrl: "https://status.elevenlabs.io/",
    communityUrl: "https://reddit.com/r/ElevenLabs",
    slug: "elevenlabs",
    tags: ["Voice AI API"],
  },
  {
    name: "OpenAI TTS",
    statusUrl: "https://status.openai.com/",
    communityUrl: "https://reddit.com/r/OpenAI",
    slug: "openai-tts",
    tags: ["Voice AI API"],
  },
  {
    name: "AWS Polly",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-polly",
    tags: ["Voice AI API"],
  },
  {
    name: "Google WaveNet",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    slug: "google-wavenet",
    tags: ["Voice AI API"],
  },
  {
    name: "Azure Neural TTS",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    slug: "azure-neural-tts",
    tags: ["Voice AI API"],
  },
  {
    name: "Rev.ai",
    statusUrl: "https://status.rev.ai/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "rev-ai",
    tags: ["Voice AI API"],
  },
  {
    name: "Pinecone",
    statusUrl: "https://status.pinecone.io/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "pinecone",
    tags: ["Vector Database"],
  },
  {
    name: "Weaviate",
    statusUrl: "https://status.weaviate.io/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "weaviate",
    tags: ["Vector Database"],
  },
  {
    name: "Milvus (Zilliz Cloud)",
    statusUrl: "https://status.zilliz.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "milvus-zilliz",
    tags: ["Vector Database"],
  },
  {
    name: "Qdrant",
    statusUrl: "https://status.qdrant.io/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "qdrant",
    tags: ["Vector Database"],
  },
  {
    name: "Chroma",
    statusUrl: "https://status.trychroma.com/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "chroma",
    tags: ["Vector Database"],
  },
  {
    name: "Vespa",
    statusUrl: "https://status.vespa.ai/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "vespa",
    tags: ["Vector Database"],
  },
  {
    name: "Deep Lake",
    statusUrl: "https://status.activeloop.ai/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    slug: "deep-lake",
    tags: ["Vector Database"],
  },
  {
    name: "Cloudflare",
    statusUrl: "https://www.cloudflarestatus.com/",
    communityUrl: "https://reddit.com/r/CloudFlare",
    slug: "cloudflare",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Fastly",
    statusUrl: "https://status.fastly.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "fastly",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Akamai",
    statusUrl: "https://cloudharmony.com/status-of-akamai",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "akamai",
    tags: ["CDN & Hosting"],
  },
  {
    name: "AWS CloudFront",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-cloudfront",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Google Cloud CDN",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    slug: "google-cloud-cdn",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Azure Front Door/CDN",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    slug: "azure-front-door-cdn",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Netlify Edge",
    statusUrl: "https://www.netlifystatus.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "netlify-edge",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Vercel Edge",
    statusUrl: "https://www.vercel-status.com/",
    communityUrl: "https://github.com/vercel/vercel/discussions",
    slug: "vercel-edge",
    tags: ["CDN & Hosting"],
  },
  {
    name: "StackPath",
    statusUrl: "https://status.stackpath.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "stackpath",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Bunny.net",
    statusUrl: "https://status.bunny.net/",
    communityUrl: "https://bunny.net/blog/join-us-on-discord/",
    slug: "bunny-net",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Netlify",
    statusUrl: "https://www.netlifystatus.com/",
    communityUrl: "https://answers.netlify.com/",
    slug: "netlify",
    tags: ["CDN & Hosting"],
  },
  {
    name: "BitBucket",
    statusUrl: "https://bitbucket.status.atlassian.com/",
    communityUrl:
      "https://community.atlassian.com/forums/Bitbucket/ct-p/bitbucket",
    slug: "bitbucket",
    tags: ["CDN & Hosting"],
  },
  {
    name: "Redis",
    statusUrl: "https://status.redis.com/",
    communityUrl: "https://forum.redis.io/",
    slug: "redis",
    tags: ["Database Provider"],
  },
  {
    name: "Upstash",
    statusUrl: "https://status.upstash.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "upstash",
    tags: ["Database Provider"],
  },
  {
    name: "Confluent",
    statusUrl: "https://status.confluent.io/",
    communityUrl: "https://developer.confluent.io/community/",
    slug: "confluent",
    tags: ["Database Provider"],
  },
  {
    name: "RedPanda",
    statusUrl: "https://status.redpanda.com/",
    communityUrl: "https://reddit.com/r/apachekafka",
    slug: "redpanda",
    tags: ["Database Provider"],
  },
  {
    name: "Snowflake",
    statusUrl: "https://status.snowflake.com/",
    communityUrl: "https://community.snowflake.com/s/",
    slug: "snowflake",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "Vercel",
    statusUrl: "https://status.vercel.com/",
    communityUrl: "https://community.vercel.com/",
    slug: "vercel",
    tags: ["CDN & Hosting", "Serverless"],
  },
  {
    name: "Render",
    statusUrl: "https://status.render.com/",
    communityUrl: "https://community.render.com/",
    slug: "render",
    tags: ["CDN & Hosting", "Serverless"],
  },
  {
    name: "Google BigQuery",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    slug: "google-bigquery",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "Amazon Redshift",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "amazon-redshift",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "Databricks SQL Warehouse",
    statusUrl: "https://status.databricks.com/",
    communityUrl: "https://reddit.com/r/databricks",
    slug: "databricks-sql-warehouse",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "Azure Synapse Analytics",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    slug: "azure-synapse-analytics",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "MongoDB Atlas",
    statusUrl: "https://status.mongodb.com/",
    communityUrl: "https://reddit.com/r/mongodb",
    slug: "mongodb-atlas",
    tags: ["Database Provider"],
  },
  {
    name: "PlanetScale",
    statusUrl: "https://www.planetscalestatus.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "planetscale",
    tags: ["Database Provider"],
  },
  {
    name: "CockroachDB Cloud",
    statusUrl: "https://status.cockroachlabs.cloud/",
    communityUrl: "https://reddit.com/r/CockroachDB",
    slug: "cockroachdb-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "ClickHouse Cloud",
    statusUrl: "https://status.clickhouse.com/",
    communityUrl: "https://reddit.com/r/ClickHouse",
    slug: "clickhouse-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "Firebolt",
    statusUrl: "https://status.firebolt.io/",
    communityUrl: "https://reddit.com/r/dataengineering",
    slug: "firebolt",
    tags: ["Data Warehouse Provider"],
  },
  {
    name: "Neon",
    statusUrl: "https://status.neon.tech/",
    communityUrl: "https://reddit.com/r/PostgreSQL",
    slug: "neon",
    tags: ["Database Provider"],
  },
  {
    name: "Supabase",
    statusUrl: "https://status.supabase.com/",
    communityUrl: "https://github.com/orgs/supabase/discussions",
    slug: "supabase",
    tags: ["Database Provider"],
  },
  {
    name: "InfluxDB Cloud",
    statusUrl: "https://status.influxdata.com/",
    communityUrl: "https://reddit.com/r/influxdb",
    slug: "influxdb-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "Timescale Cloud",
    statusUrl: "https://status.timescale.com/",
    communityUrl: "https://reddit.com/r/PostgreSQL",
    slug: "timescale-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "VictoriaMetrics Cloud",
    statusUrl: "https://status.victoriametrics.com/",
    communityUrl: "https://reddit.com/r/monitoring",
    slug: "victoriametrics-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "Grafana Cloud",
    statusUrl: "https://status.grafana.com/",
    communityUrl: "https://reddit.com/r/grafana",
    slug: "grafana-cloud",
    tags: ["Database Provider"],
  },
  {
    name: "Stripe Billing",
    statusUrl: "https://status.stripe.com/",
    communityUrl: "https://reddit.com/r/stripe",
    slug: "stripe-billing",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Chargebee",
    statusUrl: "https://status.chargebee.com/",
    communityUrl: "https://www.chargebee.com/community/",
    slug: "chargebee",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Recurly",
    statusUrl: "https://status.recurly.com/",
    communityUrl: "https://reddit.com/r/SaaS",
    slug: "recurly",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Zuora",
    statusUrl: "https://trust.zuora.com/",
    communityUrl: "https://reddit.com/r/SaaS",
    slug: "zuora",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Paddle",
    statusUrl: "https://status.paddle.com/",
    communityUrl: "https://reddit.com/r/SaaS",
    slug: "paddle",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Braintree Recurring",
    statusUrl: "https://status.braintreepayments.com/",
    communityUrl: "https://reddit.com/r/payments",
    slug: "braintree-recurring",
    tags: ["Billing & Subscriptions FinTech API"],
  },
  {
    name: "Stripe Checkout",
    statusUrl: "https://status.stripe.com/",
    communityUrl: "https://reddit.com/r/stripe",
    slug: "stripe-checkout",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "PayPal Checkout",
    statusUrl: "https://www.paypal-status.com/",
    communityUrl: "https://reddit.com/r/paypal",
    slug: "paypal-checkout",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "Square",
    statusUrl: "https://status.squareup.com/",
    communityUrl: "https://reddit.com/r/Square",
    slug: "square",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "Adyen",
    statusUrl: "https://status.adyen.com/",
    communityUrl: "https://reddit.com/r/payments",
    slug: "adyen",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "Checkout.com",
    statusUrl: "https://status.checkout.com/",
    communityUrl: "https://reddit.com/r/payments",
    slug: "checkout-com",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "Razorpay",
    statusUrl: "https://status.razorpay.com/",
    communityUrl: "https://reddit.com/r/india",
    slug: "razorpay",
    tags: ["Checkouts & Payment Gateway FinTech API"],
  },
  {
    name: "QuickBooks Online API",
    statusUrl: "https://status.developer.intuit.com/",
    communityUrl: "https://reddit.com/r/QuickBooks",
    slug: "quickbooks-online-api",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "Xero API",
    statusUrl: "https://status.xero.com/",
    communityUrl: "https://reddit.com/r/xero",
    slug: "xero-api",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "FreshBooks API",
    statusUrl: "https://status.freshbooks.com/",
    communityUrl: "https://reddit.com/r/smallbusiness",
    slug: "freshbooks-api",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "Zoho Invoice",
    statusUrl: "https://status.zoho.com/",
    communityUrl: "https://reddit.com/r/zoho",
    slug: "zoho-invoice",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "Stripe Invoicing",
    statusUrl: "https://status.stripe.com/",
    communityUrl: "https://reddit.com/r/stripe",
    slug: "stripe-invoicing",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "Bill.com",
    statusUrl: "https://status.bill.com/",
    communityUrl: "https://reddit.com/r/smallbusiness",
    slug: "bill-com",
    tags: ["Invoicing FinTech API"],
  },
  {
    name: "Twilio",
    statusUrl: "https://status.twilio.com/",
    communityUrl: "https://reddit.com/r/twilio",
    slug: "twilio",
    tags: ["SMS Communication API"],
  },
  {
    name: "Vonage/Nexmo",
    statusUrl: "https://status.vonage.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "vonage-nexmo",
    tags: ["SMS Communication API"],
  },
  {
    name: "Plivo",
    statusUrl: "https://status.plivo.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "plivo",
    tags: ["SMS Communication API"],
  },
  {
    name: "Sinch",
    statusUrl: "https://status.sinch.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "sinch",
    tags: ["SMS Communication API"],
  },
  {
    name: "MessageBird",
    statusUrl: "https://status.messagebird.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "messagebird",
    tags: ["SMS Communication API"],
  },
  {
    name: "Telnyx",
    statusUrl: "https://status.telnyx.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "telnyx",
    tags: ["SMS Communication API"],
  },
  {
    name: "SendGrid",
    statusUrl: "https://status.sendgrid.com/",
    communityUrl: "https://sendgrid.com/en-us/blog/category/community",
    slug: "sendgrid",
    tags: ["Email Communication API"],
  },
  {
    name: "Mailgun",
    statusUrl: "https://status.mailgun.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "mailgun",
    tags: ["Email Communication API"],
  },
  {
    name: "Postmark",
    statusUrl: "https://status.postmarkapp.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "postmark",
    tags: ["Email Communication API"],
  },
  {
    name: "Amazon SES",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "amazon-ses",
    tags: ["Email Communication API"],
  },
  {
    name: "SparkPost",
    statusUrl: "https://status.sparkpost.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "sparkpost",
    tags: ["Email Communication API"],
  },
  {
    name: "Mailjet",
    statusUrl: "https://status.mailjet.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "mailjet",
    tags: ["Email Communication API"],
  },
  {
    name: "Firebase Cloud Messaging",
    statusUrl: "https://status.firebase.google.com/",
    communityUrl: "https://reddit.com/r/Firebase",
    slug: "firebase-cloud-messaging",
    tags: ["Push Communication API"],
  },
  {
    name: "OneSignal",
    statusUrl: "https://status.onesignal.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "onesignal",
    tags: ["Push Communication API"],
  },
  {
    name: "Pusher Beams",
    statusUrl: "https://status.pusher.com/",
    communityUrl: "https://reddit.com/r/webdev",
    slug: "pusher-beams",
    tags: ["Push Communication API"],
  },
  {
    name: "Airship",
    statusUrl: "https://status.airship.com/",
    communityUrl: "https://reddit.com/r/marketing",
    slug: "airship",
    tags: ["Push Communication API"],
  },
  {
    name: "AWS SNS",
    statusUrl: "https://health.aws.amazon.com/health/status",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-sns",
    tags: ["Push Communication API"],
  },
  {
    name: "Expo Push",
    statusUrl: "https://status.expo.io/",
    communityUrl: "https://reddit.com/r/reactnative",
    slug: "expo-push",
    tags: ["Push Communication API"],
  },
  {
    name: "Twilio Voice",
    statusUrl: "https://status.twilio.com/",
    communityUrl: "https://reddit.com/r/twilio",
    slug: "twilio-voice",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Vonage Voice",
    statusUrl: "https://status.vonage.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "vonage-voice",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Plivo Voice",
    statusUrl: "https://status.plivo.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "plivo-voice",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Sinch Voice",
    statusUrl: "https://status.sinch.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "sinch-voice",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Telnyx Voice",
    statusUrl: "https://status.telnyx.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "telnyx-voice",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Bandwidth",
    statusUrl: "https://status.bandwidth.com/",
    communityUrl: "https://reddit.com/r/VoIP",
    slug: "bandwidth",
    tags: ["Voice/Calls Communication API"],
  },
  {
    name: "Slack",
    statusUrl: "https://status.slack.com/",
    communityUrl:
      "https://trailhead.salesforce.com/trailblazer-community/neighborhoods/slack",
    slug: "slack",
    tags: ["Communication", "Collaboration", "Chat"],
  },
  {
    name: "Microsoft Teams",
    statusUrl: "https://portal.office.com/servicestatus",
    communityUrl: "https://reddit.com/r/MicrosoftTeams",
    slug: "microsoft-teams",
    tags: ["Communication", "Collaboration", "Chat", "Microsoft"],
  },
  {
    name: "Discord",
    statusUrl: "https://discordstatus.com/",
    communityUrl: "https://reddit.com/r/discordapp",
    slug: "discord",
    tags: ["Communication", "Chat", "Gaming"],
  },
  {
    name: "JIRA",
    statusUrl: "https://status.atlassian.com/",
    communityUrl: "https://community.atlassian.com/forums/Jira/ct-p/jira",
    slug: "jira",
    tags: ["Project Management", "Issue Tracking", "Atlassian"],
  },
  {
    name: "ServiceNow",
    statusUrl: "https://status.servicenow.com/",
    communityUrl: "https://reddit.com/r/servicenow",
    slug: "servicenow",
    tags: ["ITSM", "Workflow", "Enterprise"],
  },
  {
    name: "Confluence",
    statusUrl: "https://status.atlassian.com/",
    communityUrl:
      "https://community.atlassian.com/forums/Confluence/ct-p/confluence",
    slug: "confluence",
    tags: ["Documentation", "Collaboration", "Atlassian"],
  },
  {
    name: "Trello",
    statusUrl: "https://trello.status.atlassian.com/",
    communityUrl: "https://community.atlassian.com/forums/Trello/ct-p/trello",
    slug: "trello",
    tags: ["Project Management", "Kanban", "Atlassian"],
  },
  {
    name: "Auth0",
    statusUrl: "https://status.auth0.com/",
    communityUrl: "https://reddit.com/r/auth0",
    slug: "auth0",
    tags: ["Authentication", "Identity", "Okta"],
  },
  {
    name: "Firebase Auth",
    statusUrl: "https://status.firebase.google.com/",
    communityUrl: "https://reddit.com/r/Firebase",
    slug: "firebase-auth",
    tags: ["Authentication", "Google", "Firebase"],
  },
  {
    name: "Amazon Cognito",
    statusUrl: "https://status.aws.amazon.com/",
    communityUrl: "https://reddit.com/r/aws",
    slug: "amazon-cognito",
    tags: ["Authentication", "AWS", "Identity"],
  },
  {
    name: "Clerk",
    statusUrl: "https://status.clerk.dev/",
    communityUrl: "https://dev.to/clerk",
    slug: "clerk",
    tags: ["Authentication", "Identity", "User Management"],
  },
  {
    name: "Supabase Auth",
    statusUrl: "https://status.supabase.com/",
    communityUrl: "https://reddit.com/r/Supabase",
    slug: "supabase-auth",
    tags: ["Authentication", "Supabase", "Open Source"],
  },
  {
    name: "Stytch",
    statusUrl: "https://status.stytch.com/",
    communityUrl: "https://reddit.com/r/stytch",
    slug: "stytch",
    tags: ["Authentication", "Passwordless", "Identity"],
  },
  {
    name: "SuperTokens",
    statusUrl: "https://status.supertokens.com/",
    communityUrl: "https://reddit.com/r/supertokens",
    slug: "supertokens",
    tags: ["Authentication", "Open Source", "Self-hosted"],
  },
  {
    name: "Descope",
    statusUrl: "https://status.descope.com/",
    communityUrl: "https://reddit.com/r/descope",
    slug: "descope",
    tags: ["Authentication", "No-Code", "Identity"],
  },
  {
    name: "AWS",
    statusUrl: "https://status.aws.amazon.com/",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws",
    tags: ["Cloud", "Infrastructure"],
  },
  {
    name: "Microsoft Azure",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    slug: "microsoft-azure",
    tags: ["Cloud", "Infrastructure", "Microsoft"],
  },
  {
    name: "Google Cloud Platform",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/googlecloud",
    slug: "google-cloud-platform",
    tags: ["Cloud", "Infrastructure", "Google"],
  },
  {
    name: "Alibaba Cloud",
    statusUrl: "https://status.alibabacloud.com/",
    communityUrl: "https://reddit.com/r/alibabacloud",
    slug: "alibaba-cloud",
    tags: ["Cloud", "Infrastructure", "Alibaba"],
  },
  {
    name: "Oracle Cloud Infrastructure",
    statusUrl: "https://ocistatus.oraclecloud.com/",
    communityUrl: "https://reddit.com/r/oraclecloud",
    slug: "oracle-cloud-infrastructure",
    tags: ["Cloud", "Infrastructure", "Oracle"],
  },
  {
    name: "IBM Cloud",
    statusUrl: "https://cloud.ibm.com/status",
    communityUrl: "https://reddit.com/r/IBMCloud",
    slug: "ibm-cloud",
    tags: ["Cloud", "Infrastructure", "IBM"],
  },
  {
    name: "DigitalOcean",
    statusUrl: "https://status.digitalocean.com/",
    communityUrl: "https://www.digitalocean.com/community",
    slug: "digitalocean",
    tags: ["Cloud", "Infrastructure", "VPS"],
  },
  {
    name: "Tencent Cloud",
    statusUrl: "https://status.tencentcloud.com/",
    communityUrl: "https://reddit.com/r/tencentcloud",
    slug: "tencent-cloud",
    tags: ["Cloud", "Infrastructure", "Tencent"],
  },
  {
    name: "OVH Cloud",
    statusUrl: "https://status.ovhcloud.com/",
    communityUrl: "https://reddit.com/r/ovh",
    slug: "ovh-cloud",
    tags: ["Cloud", "Infrastructure", "European"],
  },
  {
    name: "Linode",
    statusUrl: "https://status.linode.com/",
    communityUrl: "https://www.linode.com/community/questions/",
    slug: "linode",
    tags: ["Cloud", "Infrastructure", "VPS", "Akamai"],
  },
  {
    name: "Heroku",
    statusUrl: "https://status.heroku.com/",
    communityUrl: "https://reddit.com/r/Heroku",
    slug: "heroku",
    tags: ["Cloud", "PaaS", "Salesforce"],
  },
  {
    name: "Kong Gateway",
    statusUrl: "https://status.konghq.com/",
    communityUrl: "https://reddit.com/r/kong",
    slug: "kong-gateway",
    tags: ["API Gateway", "Microservices", "Kong"],
  },
  {
    name: "Apigee X",
    statusUrl: "https://status.cloud.google.com/",
    communityUrl: "https://reddit.com/r/apigee",
    slug: "apigee-x",
    tags: ["API Gateway", "Google", "API Management"],
  },
  {
    name: "AWS API Gateway",
    statusUrl: "https://status.aws.amazon.com/",
    communityUrl: "https://reddit.com/r/aws",
    slug: "aws-api-gateway",
    tags: ["API Gateway", "AWS", "Serverless"],
  },
  {
    name: "MuleSoft Anypoint",
    statusUrl: "https://status.mulesoft.com/",
    communityUrl: "https://reddit.com/r/mulesoft",
    slug: "mulesoft-anypoint",
    tags: ["API Platform", "Integration", "Salesforce"],
  },
  {
    name: "Postman API Hub",
    statusUrl: "https://status.postman.com/",
    communityUrl: "https://reddit.com/r/postman",
    slug: "postman-api-hub",
    tags: ["API Platform", "Testing", "Development"],
  },
  {
    name: "RapidAPI",
    statusUrl: "https://status.rapidapi.com/",
    communityUrl: "https://reddit.com/r/rapidapi",
    slug: "rapidapi",
    tags: ["API Marketplace", "API Platform"],
  },
  {
    name: "Tyk",
    statusUrl: "https://status.tyk.io/",
    communityUrl: "https://reddit.com/r/tyk",
    slug: "tyk",
    tags: ["API Gateway", "Open Source", "API Management"],
  },
  {
    name: "Gravitee",
    statusUrl: "https://status.gravitee.io/",
    communityUrl: "https://reddit.com/r/gravitee",
    slug: "gravitee",
    tags: ["API Gateway", "Open Source", "API Management"],
  },
  {
    name: "Red Hat 3scale",
    statusUrl: "https://status.redhat.com/",
    communityUrl: "https://reddit.com/r/redhat",
    slug: "red-hat-3scale",
    tags: ["API Management", "Red Hat", "Enterprise"],
  },
  {
    name: "IBM API Connect",
    statusUrl: "https://cloud.ibm.com/status",
    communityUrl: "https://reddit.com/r/IBMCloud",
    slug: "ibm-api-connect",
    tags: ["API Management", "IBM", "Enterprise"],
  },
];

function StatusIndicator({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
      case "incident":
        return "bg-yellow-500";
      case "outage":
        return "bg-red-500";
      case "maintenance":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`} />;
}

function getTagColor(tag: string) {
  const colors = {
    Cloud: "bg-blue-100 text-blue-800",
    Infrastructure: "bg-gray-100 text-gray-800",
    "AI/ML": "bg-purple-100 text-purple-800",
    LLM: "bg-indigo-100 text-indigo-800",
    Database: "bg-green-100 text-green-800",
    DevOps: "bg-orange-100 text-orange-800",
    Payments: "bg-yellow-100 text-yellow-800",
    Communication: "bg-pink-100 text-pink-800",
    Productivity: "bg-cyan-100 text-cyan-800",
    Monitoring: "bg-red-100 text-red-800",
    Email: "bg-teal-100 text-teal-800",
    CDN: "bg-violet-100 text-violet-800",
    "E-commerce": "bg-emerald-100 text-emerald-800",
    Hosting: "bg-lime-100 text-lime-800",
    Security: "bg-rose-100 text-rose-800",
  };
  return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

function StatusMonitor() {
  const [statusRows, setStatusRows] = useState<any[] | null>(null);
  const [error, setError] = useState<any>(null);
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});

  useEffect(() => {
    // Debug: Log environment variables (they will be undefined in the browser due to NEXT_PUBLIC_ prefix)
    console.log(
      "Supabase URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10) + "...",
    );
    console.log(
      "Supabase Key exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    // Fetch statuses from Supabase
    const fetchStatuses = async () => {
      const { data, error } = await supabase.from("service_status").select("*");
      setStatusRows(data);
      setError(error);
      // Map statuses by slug for easy lookup
      const statusMap = (data || []).reduce(
        (acc: Record<string, any>, row: any) => {
          acc[row.service_slug] = {
            status: row.status,
            last_incident: row.last_incident
              ? {
                  createdAt: row.last_incident,
                }
              : undefined,
          };
          return acc;
        },
        {} as Record<string, any>,
      );
      setStatusMap(statusMap);
    };
    fetchStatuses();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading status dashboard...</p>
          </div>
        </div>
      }>
      <StatusMonitorClient services={services} statusMap={statusMap} />
    </Suspense>
  );
}

export default StatusMonitor;
