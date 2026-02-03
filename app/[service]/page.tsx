export const revalidate = 0;
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Github,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchServiceStatus,
  fetchServiceStatusFromAPI,
  fetchServiceStatusFromAtom,
  fetchServiceStatusFromBetterStack,
  getStatusColor,
  getStatusText,
  type ServiceStatusData,
} from "@/lib/status";

const serviceData = {
  aws: {
    name: "Amazon Web Services (AWS)",
    slug: "aws",
    statusUrl: "https://status.aws.amazon.com/",
    communityUrl: "https://reddit.com/r/aws",
    tags: ["Cloud", "Infrastructure"],
    description:
      "Amazon Web Services is a comprehensive cloud computing platform offering over 200 services including compute, storage, database, networking, and more.",
    faq: [
      {
        question: "Is AWS down right now?",
        answer:
          "Check the current AWS status above. AWS typically maintains 99.95% uptime across their services. If you're experiencing issues, check the official AWS Status page for real-time updates.",
      },
      {
        question: "How do I check AWS service status?",
        answer:
          "Visit status.aws.amazon.com for official status updates, or use this page for a quick overview. AWS also provides RSS feeds and can send notifications via SNS.",
      },
      {
        question: "What should I do if AWS is down?",
        answer:
          "First, check if it's a regional issue by testing different AWS regions. Check the AWS Status page for official updates and estimated resolution times. Consider implementing multi-region architecture for critical applications.",
      },
      {
        question: "How often does AWS go down?",
        answer:
          "AWS maintains high availability with 99.95%+ uptime. Major outages are rare, but regional issues can occur. AWS provides SLA credits for downtime that exceeds their commitments.",
      },
      {
        question: "Where can I get AWS outage notifications?",
        answer:
          "Subscribe to AWS Status page notifications, follow @AWSSupport on Twitter, or set up CloudWatch alarms for your specific services.",
      },
    ],
  },
  "google-cloud": {
    name: "Google Cloud Platform (GCP)",
    slug: "google-cloud",
    statusUrl: "https://status.google.com/",
    communityUrl: "https://reddit.com/r/GoogleCloud",
    tags: ["Cloud", "Infrastructure"],
    description:
      "Google Cloud Platform provides cloud computing services including compute, storage, big data, machine learning and application development.",
    faq: [
      {
        question: "Is Google Cloud down?",
        answer:
          "Check the current status indicator above. Google Cloud maintains excellent uptime across their global infrastructure. For detailed service status, visit status.cloud.google.com.",
      },
      {
        question: "How to check GCP service health?",
        answer:
          "Use the Google Cloud Status page at status.cloud.google.com or the Cloud Console. You can also subscribe to status notifications via email or RSS.",
      },
      {
        question: "What to do during a GCP outage?",
        answer:
          "Check if the issue is region-specific and consider switching to another region. Monitor the official status page for updates and implement multi-region deployments for critical workloads.",
      },
      {
        question: "How reliable is Google Cloud?",
        answer:
          "Google Cloud offers industry-leading uptime with 99.95%+ SLA for most services. They provide detailed SLA documentation and credits for any downtime.",
      },
      {
        question: "Where to report GCP issues?",
        answer:
          "Use Google Cloud Support, the Cloud Console, or community forums. For status updates, follow @googlecloud on Twitter or subscribe to status notifications.",
      },
    ],
  },
  azure: {
    name: "Microsoft Azure",
    slug: "azure",
    statusUrl: "https://status.azure.com/",
    communityUrl: "https://reddit.com/r/AZURE",
    tags: ["Cloud", "Infrastructure"],
    description:
      "Microsoft Azure is a cloud computing platform offering services for building, testing, deploying, and managing applications through Microsoft-managed data centers.",
    faq: [
      {
        question: "Is Microsoft Azure down?",
        answer:
          "Check the status indicator above for current Azure health. Azure maintains high availability across global regions. Visit status.azure.com for detailed service status.",
      },
      {
        question: "How to monitor Azure service status?",
        answer:
          "Use the Azure Status page, Azure Portal Service Health, or Azure mobile app. You can set up alerts and notifications for services you use.",
      },
      {
        question: "What to do if Azure is experiencing issues?",
        answer:
          "Check Service Health in Azure Portal for personalized impact assessment. Consider using multiple regions and availability zones for critical applications.",
      },
      {
        question: "How often does Azure have outages?",
        answer:
          "Azure maintains 99.95%+ uptime with comprehensive SLAs. Major global outages are rare, with most issues being regional or service-specific.",
      },
      {
        question: "How to get Azure outage alerts?",
        answer:
          "Configure Service Health alerts in Azure Portal, follow @AzureSupport on Twitter, or integrate with Stripe's webhook system for real-time updates.",
      },
    ],
  },
  openai: {
    name: "OpenAI",
    slug: "openai",
    statusUrl: "https://status.openai.com/",
    communityUrl: "https://community.openai.com/",
    tags: ["AI/ML", "LLM"],
    description:
      "OpenAI provides cutting-edge AI models including GPT-4, DALL-E, and Whisper through their API platform for developers and businesses.",
    faq: [
      {
        question: "Is OpenAI API down?",
        answer:
          "Check the current status above. OpenAI's API typically maintains high availability. For real-time updates, visit status.openai.com or check their Twitter @OpenAI.",
      },
      {
        question: "Why is ChatGPT not working?",
        answer:
          "ChatGPT issues can be due to high demand, maintenance, or technical problems. Check the OpenAI status page for current service health and any ongoing incidents.",
      },
      {
        question: "How to check OpenAI API limits?",
        answer:
          "Monitor your usage in the OpenAI dashboard. Rate limits vary by model and subscription tier. Implement proper error handling for rate limit responses (HTTP 429).",
      },
      {
        question: "What to do during OpenAI outages?",
        answer:
          "Implement fallback mechanisms, cache responses when possible, and consider using multiple AI providers for critical applications. Monitor the status page for updates.",
      },
      {
        question: "How reliable is OpenAI's service?",
        answer:
          "OpenAI maintains 99.9%+ uptime for their API services. They provide status updates and incident reports for transparency during any service disruptions.",
      },
    ],
  },
  cursor: {
    name: "Cursor",
    slug: "cursor",
    statusUrl: "https://status.cursor.com/",
    communityUrl: "https://forum.cursor.com/",
    tags: ["AI/ML", "LLM"],
    description:
      "Cursor is an AI-powered code editor that enhances developer productivity with smart code completion, error detection, and real-time collaboration features.",
    faq: [
      {
        question: "Is Cursor API down?",
        answer:
          "Check the current status above. Cursor's API typically maintains high availability. For real-time updates, visit status.cursor.com or check their Twitter @cursor_ai.",
      },
      {
        question: "Why is Cursor not working?",
        answer:
          "Cursor issues can be due to multiple reasons -- the platform having issues(authentication, service down) or LLM provider having issue (OpenAI/Claude having issue) or your internet having issues. Check the cursor status page for current service health and any ongoing incidents.",
      },
      {
        question: "How to check cursor rate limits?",
        answer:
          "Check for warnings in your cursor IDE. Rate limits vary by model and subscription tier. If you're using a custom model (e.g. v0), monitor your usage in the API provider.",
      },
      {
        question: "What to do during Cursor outages?",
        answer: "Use another IDE like VSCode or PyCharm.",
      },
      {
        question: "How reliable is Cursor's service?",
        answer:
          "Cursor maintains high uptime for their services. They provide status updates and incident reports for transparency during any service disruptions.",
      },
    ],
  },
  anthropic: {
    name: "Anthropic (Claude)",
    slug: "anthropic",
    statusUrl: "https://status.anthropic.com/",
    communityUrl: "https://reddit.com/r/Anthropic",
    tags: ["AI/ML", "LLM"],
    description:
      "Anthropic develops Claude, a helpful, harmless, and honest AI assistant, offering API access for developers and businesses.",
    faq: [
      {
        question: "Is Claude API down?",
        answer:
          "Check the current status indicator above. Anthropic maintains high service availability. Visit status.anthropic.com for detailed service health information.",
      },
      {
        question: "How does Claude compare to other LLMs?",
        answer:
          "Claude is designed to be helpful, harmless, and honest. It excels at reasoning, analysis, and following instructions while maintaining safety guidelines.",
      },
      {
        question: "What are Claude's rate limits?",
        answer:
          "Rate limits depend on your subscription tier. Monitor usage in your Anthropic console and implement proper retry logic for rate-limited requests.",
      },
      {
        question: "How to handle Claude API errors?",
        answer:
          "Implement exponential backoff for retries, handle rate limits gracefully, and monitor the status page during any service disruptions.",
      },
      {
        question: "Is Claude suitable for production use?",
        answer:
          "Yes, Claude offers enterprise-grade reliability with comprehensive API documentation, SDKs, and support for production deployments.",
      },
    ],
  },
  jira: {
    name: "Atlassian Jira",
    slug: "jira",
    statusUrl: "https://status.atlassian.com/",
    communityUrl: "https://community.atlassian.com/forums/Jira/ct-p/jira",
    tags: ["Productivity", "Project Management"],
    description:
      "Jira is a project management and issue tracking tool used by agile teams to plan, track, and manage software development projects.",
    faq: [
      {
        question: "Is Jira down right now?",
        answer:
          "Check the status indicator above. Jira Cloud maintains high availability across global instances. Visit status.atlassian.com for detailed service status.",
      },
      {
        question: "Why is Jira running slow?",
        answer:
          "Slow performance can be due to large datasets, complex queries, or network issues. Check the Atlassian status page and consider optimizing your Jira configuration.",
      },
      {
        question: "How to check Jira service health?",
        answer:
          "Monitor status.atlassian.com, check your Jira admin console, and subscribe to status notifications for your specific Jira instance.",
      },
      {
        question: "What to do during Jira outages?",
        answer:
          "Document issues offline, communicate with your team about the outage, and check the Atlassian status page for estimated resolution times.",
      },
      {
        question: "How reliable is Jira Cloud?",
        answer:
          "Jira Cloud maintains 99.9%+ uptime with enterprise-grade infrastructure, automatic backups, and disaster recovery capabilities.",
      },
    ],
  },
  stripe: {
    name: "Stripe",
    slug: "stripe",
    statusUrl: "https://status.stripe.com/",
    communityUrl: "https://reddit.com/r/stripe",
    tags: ["Payments", "E-commerce"],
    description:
      "Stripe is a payment processing platform that enables businesses to accept payments online and in mobile apps.",
    faq: [
      {
        question: "Is Stripe down?",
        answer:
          "Check the current status above. Stripe maintains exceptional uptime for payment processing. Visit status.stripe.com for real-time service health.",
      },
      {
        question: "Why are payments failing?",
        answer:
          "Payment failures can be due to various reasons including card issues, network problems, or service disruptions. Check Stripe's status page and your dashboard for details.",
      },
      {
        question: "How to handle Stripe outages?",
        answer:
          "Implement retry logic, queue failed payments, and provide clear error messages to users. Monitor the status page for incident updates.",
      },
      {
        question: "What is Stripe's uptime guarantee?",
        answer:
          "Stripe maintains 99.99%+ uptime with comprehensive SLAs and provides credits for any downtime that affects your payment processing.",
      },
      {
        question: "How to get Stripe status notifications?",
        answer:
          "Subscribe to status updates at status.stripe.com, follow @StripeDev on Twitter, or integrate with Stripe's webhook system for real-time updates.",
      },
    ],
  },
  cloudflare: {
    name: "Cloudflare",
    slug: "cloudflare",
    statusUrl: "https://www.cloudflarestatus.com/",
    communityUrl: "https://reddit.com/r/CloudFlare",
    tags: ["CDN", "Security", "DNS", "Infrastructure"],
    description:
      "Cloudflare provides global CDN, DDoS protection, DNS services, and web security solutions to millions of websites and applications worldwide.",
    faq: [
      {
        question: "Is Cloudflare down?",
        answer:
          "Check the current status above. Cloudflare operates a global network with built-in redundancy. For real-time updates, visit cloudflarestatus.com or follow @cloudflare on Twitter.",
      },
      {
        question: "Why is my website slow despite using Cloudflare?",
        answer:
          "Slow performance can be due to origin server issues, cache misses, or network congestion. Check your origin server performance, cache settings, and Cloudflare analytics for optimization opportunities.",
      },
      {
        question: "How to troubleshoot Cloudflare DNS issues?",
        answer:
          "Use DNS lookup tools to verify records, check TTL settings, and ensure proper configuration. Cloudflare's DNS propagation can take up to 24 hours for new changes to fully propagate globally.",
      },
      {
        question: "What to do during Cloudflare outages?",
        answer:
          "Enable 'Always Online' mode, consider DNS failover to backup providers, and implement proper error handling. Monitor the status page and consider using multiple CDN providers for critical applications.",
      },
      {
        question: "How reliable is Cloudflare's network?",
        answer:
          "Cloudflare maintains 99.99%+ uptime across their global network of 300+ data centers. They provide detailed incident reports and real-time status updates for complete transparency.",
      },
    ],
  },
  fastly: {
    name: "Fastly",
    slug: "fastly",
    statusUrl: "https://www.fastlystatus.com/",
    communityUrl: "https://reddit.com/r/fastly",
    tags: ["CDN", "Edge Computing", "Infrastructure"],
    description:
      "Fastly is an edge cloud platform providing CDN, security, and compute services with real-time visibility and instant purging capabilities.",
    faq: [
      {
        question: "Is Fastly down?",
        answer:
          "Check the current status above. Fastly operates a global edge platform with high availability. Visit fastlystatus.com for real-time service health updates.",
      },
      {
        question: "Why is my content not loading from Fastly CDN?",
        answer:
          "Content delivery issues can be due to cache configuration, origin server problems, or network connectivity. Check your service configuration and origin server status.",
      },
      {
        question: "How to troubleshoot Fastly performance issues?",
        answer:
          "Review your cache settings, check edge server performance, verify SSL configurations, and analyze traffic patterns in your Fastly dashboard.",
      },
      {
        question: "What to do during Fastly outages?",
        answer:
          "Enable origin fallback, use multiple CDN providers, implement proper error handling, and monitor the status page for incident resolution updates.",
      },
      {
        question: "How reliable is Fastly's edge network?",
        answer:
          "Fastly provides enterprise-grade reliability with a global edge network, automatic failover, and real-time performance monitoring across all regions.",
      },
    ],
  },
  slack: {
    name: "Slack",
    slug: "slack",
    statusUrl: "https://status.slack.com/",
    communityUrl:
      "https://trailhead.salesforce.com/trailblazer-community/neighborhoods/slack",
    tags: ["Communication", "Productivity"],
    description:
      "Slack is a business communication platform offering organized team conversations in channels, direct messaging, and file sharing for modern workplaces.",
    faq: [
      {
        question: "Is Slack down right now?",
        answer:
          "Check the current status above. Slack maintains high availability across their global infrastructure. Visit status.slack.com for real-time service health updates.",
      },
      {
        question: "Why can't I send messages on Slack?",
        answer:
          "Message delivery issues can be due to network connectivity, Slack service disruptions, or workspace settings. Check the status page and your internet connection first.",
      },
      {
        question: "How to troubleshoot Slack connectivity issues?",
        answer:
          "Try refreshing the app, clearing cache, checking firewall settings, or switching networks. Ensure your Slack app is updated to the latest version.",
      },
      {
        question: "What to do during Slack outages?",
        answer:
          "Use alternative communication channels like email or phone. Monitor the official status page for updates and estimated resolution times.",
      },
      {
        question: "How reliable is Slack's uptime?",
        answer:
          "Slack maintains 99.99% uptime SLA for paid plans with redundant infrastructure across multiple data centers and regions worldwide.",
      },
    ],
  },
  render: {
    name: "Render",
    slug: "render",
    statusUrl: "https://status.render.com/",
    communityUrl: "https://community.render.com/",
    tags: ["Cloud", "Hosting", "DevOps"],
    description:
      "Render is a cloud platform for hosting static sites, web services, databases, and more with automatic deployments from Git.",
    faq: [
      {
        question: "Is Render down?",
        answer:
          "Check the current status above. Render provides reliable cloud hosting with automatic scaling. Visit status.render.com for detailed service health information.",
      },
      {
        question: "Why is my Render service not deploying?",
        answer:
          "Deployment issues can be due to build failures, resource limits, or service disruptions. Check your build logs and the Render status page for any ongoing issues.",
      },
      {
        question: "How to troubleshoot Render connectivity?",
        answer:
          "Verify your service URL, check DNS settings, and ensure your service is running. Review deployment logs and resource usage in your Render dashboard.",
      },
      {
        question: "What to do during Render outages?",
        answer:
          "Monitor the status page for updates, consider backup hosting options, and implement health checks for automatic failover if needed.",
      },
      {
        question: "How reliable is Render's infrastructure?",
        answer:
          "Render provides enterprise-grade reliability with automatic scaling, health checks, and distributed infrastructure for high availability.",
      },
    ],
  },
  vercel: {
    name: "Vercel",
    slug: "vercel",
    statusUrl: "https://status.vercel.com/",
    communityUrl: "https://community.vercel.com/",
    tags: ["Cloud", "Hosting", "Frontend"],
    description:
      "Vercel is a cloud platform for static sites and serverless functions, offering instant global deployments with automatic scaling.",
    faq: [
      {
        question: "Is Vercel down?",
        answer:
          "Check the current status above. Vercel operates a global edge network with high availability. Visit vercel-status.com for real-time service updates.",
      },
      {
        question: "Why is my Vercel deployment failing?",
        answer:
          "Deployment failures can be due to build errors, function timeouts, or service limits. Check your build logs and function logs in the Vercel dashboard.",
      },
      {
        question: "How to troubleshoot Vercel performance issues?",
        answer:
          "Review your bundle size, optimize images, check function execution times, and verify edge caching settings. Use Vercel Analytics for insights.",
      },
      {
        question: "What to do during Vercel outages?",
        answer:
          "Monitor the status page, consider backup deployment strategies, and implement proper error handling for your applications.",
      },
      {
        question: "How reliable is Vercel's edge network?",
        answer:
          "Vercel provides 99.99% uptime with a global edge network spanning 40+ regions, automatic failover, and instant cache invalidation.",
      },
    ],
  },
  clerk: {
    name: "Clerk",
    slug: "clerk",
    statusUrl: "https://status.clerk.dev/",
    communityUrl: "https://dev.to/clerk",
    tags: ["Authentication", "Security"],
    description:
      "Clerk provides complete user management and authentication solutions with built-in security features for modern web applications.",
    faq: [
      {
        question: "Is Clerk authentication down?",
        answer:
          "Check the current status above. Clerk maintains high availability for authentication services. Visit status.clerk.com for real-time service health.",
      },
      {
        question: "Why can't users sign in with Clerk?",
        answer:
          "Sign-in issues can be due to service disruptions, incorrect configuration, or network problems. Check the status page and your Clerk dashboard settings.",
      },
      {
        question: "How to troubleshoot Clerk integration issues?",
        answer:
          "Verify API keys, check CORS settings, review webhook configurations, and ensure your domain is properly configured in the Clerk dashboard.",
      },
      {
        question: "What to do during Clerk outages?",
        answer:
          "Implement graceful degradation, cache user sessions when possible, and provide clear error messages. Monitor the status page for updates.",
      },
      {
        question: "How secure and reliable is Clerk?",
        answer:
          "Clerk provides enterprise-grade security with 99.99% uptime, SOC 2 compliance, and redundant infrastructure across multiple regions.",
      },
    ],
  },
  xai: {
    name: "xAI",
    slug: "xai",
    statusUrl: "https://status.x.ai/",
    communityUrl: "https://reddit.com/r/xAI",
    tags: ["AI/ML", "LLM"],
    description:
      "xAI develops Grok, an AI assistant with real-time knowledge and advanced reasoning capabilities, offering API access for developers.",
    faq: [
      {
        question: "Is xAI API down?",
        answer:
          "Check the current status above. xAI maintains reliable service for their Grok AI model. Visit status.x.ai for detailed service health information.",
      },
      {
        question: "Why is Grok not responding?",
        answer:
          "API issues can be due to rate limits, service disruptions, or incorrect request formatting. Check your API usage and the xAI status page.",
      },
      {
        question: "How to handle xAI rate limits?",
        answer:
          "Implement exponential backoff, monitor your usage limits, and consider request batching. Check your xAI dashboard for current rate limit information.",
      },
      {
        question: "What to do during xAI outages?",
        answer:
          "Implement fallback mechanisms, cache responses when possible, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is xAI's service?",
        answer:
          "xAI provides enterprise-grade reliability with comprehensive monitoring, automatic scaling, and transparent status reporting for all services.",
      },
    ],
  },
  elevenlabs: {
    name: "ElevenLabs",
    slug: "elevenlabs",
    statusUrl: "https://status.elevenlabs.io/",
    communityUrl: "https://reddit.com/r/ElevenLabs",
    tags: ["AI/ML", "Voice", "Audio"],
    description:
      "ElevenLabs provides AI-powered voice synthesis and cloning technology, offering realistic text-to-speech and voice generation APIs.",
    faq: [
      {
        question: "Is ElevenLabs API down?",
        answer:
          "Check the current status above. ElevenLabs maintains high availability for voice generation services. Visit status.elevenlabs.io for real-time updates.",
      },
      {
        question: "Why is voice generation failing?",
        answer:
          "Generation issues can be due to service limits, API errors, or invalid input. Check your API usage, input text format, and the ElevenLabs status page.",
      },
      {
        question: "How to troubleshoot ElevenLabs voice quality?",
        answer:
          "Verify input text formatting, check voice model settings, adjust stability and clarity parameters, and ensure proper audio format specifications.",
      },
      {
        question: "What to do during ElevenLabs outages?",
        answer:
          "Implement retry logic with exponential backoff, cache generated audio when possible, and consider backup voice generation services.",
      },
      {
        question: "How reliable is ElevenLabs' voice API?",
        answer:
          "ElevenLabs provides enterprise-grade reliability with global infrastructure, automatic scaling, and comprehensive API monitoring for consistent service delivery.",
      },
    ],
  },
  pinecone: {
    name: "Pinecone",
    slug: "pinecone",
    statusUrl: "https://status.pinecone.io/",
    communityUrl: "https://reddit.com/r/MachineLearning",
    tags: ["Database", "AI/ML", "Vector Search"],
    description:
      "Pinecone is a fully managed vector database for machine learning applications, providing fast similarity search and recommendations at scale.",
    faq: [
      {
        question: "Is Pinecone down?",
        answer:
          "Check the current status above. Pinecone maintains high availability for vector database operations. Visit status.pinecone.io for service health details.",
      },
      {
        question: "Why are my Pinecone queries slow?",
        answer:
          "Slow queries can be due to index size, query complexity, or service load. Check your index configuration, query parameters, and the Pinecone status page.",
      },
      {
        question: "How to troubleshoot Pinecone indexing issues?",
        answer:
          "Verify your vector dimensions, check API limits, ensure proper authentication, and review your index configuration in the Pinecone console.",
      },
      {
        question: "What to do during Pinecone outages?",
        answer:
          "Implement local caching for critical queries, use read replicas if available, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is Pinecone's vector database?",
        answer:
          "Pinecone provides enterprise-grade reliability with 99.99% uptime, automatic scaling, multi-region support, and comprehensive monitoring.",
      },
    ],
  },
  "mongodb-atlas": {
    name: "MongoDB Atlas",
    slug: "mongodb-atlas",
    statusUrl: "https://status.mongodb.com/",
    communityUrl: "https://reddit.com/r/mongodb",
    tags: ["Database", "Cloud", "NoSQL"],
    description:
      "MongoDB Atlas is a fully managed cloud database service for modern applications, offering automated scaling, backup, and security features.",
    faq: [
      {
        question: "Is MongoDB Atlas down?",
        answer:
          "Check the current status above. MongoDB Atlas maintains high availability across global regions. Visit status.mongodb.com for detailed service health.",
      },
      {
        question: "Why can't I connect to my Atlas cluster?",
        answer:
          "Connection issues can be due to network settings, authentication problems, or service disruptions. Check your connection string, IP whitelist, and Atlas status.",
      },
      {
        question: "How to troubleshoot Atlas performance issues?",
        answer:
          "Review your queries, check index usage, monitor cluster metrics in Atlas, and ensure proper connection pooling in your application.",
      },
      {
        question: "What to do during Atlas outages?",
        answer:
          "Use replica sets for automatic failover, implement connection retry logic, and consider multi-region deployments for critical applications.",
      },
      {
        question: "How reliable is MongoDB Atlas?",
        answer:
          "MongoDB Atlas provides 99.95%+ uptime with automated backups, point-in-time recovery, and global cluster deployments for maximum availability.",
      },
    ],
  },
  supabase: {
    name: "Supabase",
    slug: "supabase",
    statusUrl: "https://status.supabase.com/",
    communityUrl: "https://github.com/orgs/supabase/discussions",
    tags: ["Database Provider"],
    description:
      "Supabase is an open source Firebase alternative providing a Postgres database, Authentication, instant APIs, Edge Functions, and Real-time subscriptions.",
    faq: [
      {
        question: "Is Supabase down?",
        answer:
          "Check the current status above. Supabase maintains high availability for their hosted platform. Visit status.supabase.com for detailed service health information.",
      },
      {
        question: "Why can't I connect to my Supabase project?",
        answer:
          "Connection issues can be due to database limits, API rate limiting, or service disruptions. Check your project dashboard and the Supabase status page.",
      },
      {
        question: "How to troubleshoot Supabase API issues?",
        answer:
          "Verify your API keys, check row level security policies, review database connection limits, and ensure your requests are properly formatted.",
      },
      {
        question: "What to do during Supabase outages?",
        answer:
          "Implement connection retry logic, cache data when possible, and monitor the status page for updates. Consider implementing graceful degradation.",
      },
      {
        question: "How reliable is Supabase?",
        answer:
          "Supabase provides enterprise-grade reliability with automatic backups, read replicas, and point-in-time recovery for production workloads.",
      },
    ],
  },
  redis: {
    name: "Redis",
    slug: "redis",
    statusUrl: "https://status.redis.com/",
    communityUrl: "https://forum.redis.io/",
    tags: ["Database Provider"],
    description:
      "Redis is an open source, in-memory data structure store used as a database, cache, and message broker with support for various data structures.",
    faq: [
      {
        question: "Is Redis Cloud down?",
        answer:
          "Check the current status above. Redis Cloud maintains high availability across global regions. Visit status.redis.com for real-time service updates.",
      },
      {
        question: "Why is my Redis instance slow?",
        answer:
          "Performance issues can be due to memory limits, complex operations, or network latency. Check your memory usage and optimize your Redis commands.",
      },
      {
        question: "How to troubleshoot Redis connectivity?",
        answer:
          "Verify connection strings, check firewall settings, ensure proper authentication, and review memory and connection limits in your Redis dashboard.",
      },
      {
        question: "What to do during Redis outages?",
        answer:
          "Implement connection pooling with retries, use local caching when possible, and consider setting up Redis Sentinel for high availability.",
      },
      {
        question: "How reliable is Redis Cloud?",
        answer:
          "Redis Cloud provides 99.99% uptime with automatic failover, data persistence, and multi-zone deployments for mission-critical applications.",
      },
    ],
  },
  cohere: {
    name: "Cohere",
    slug: "cohere",
    statusUrl: "https://status.cohere.ai/",
    communityUrl: "https://cohere.com/blog/building-community",
    tags: ["LLM Provider"],
    description:
      "Cohere provides large language models and NLP tools designed for business applications, offering text generation, embeddings, and classification APIs.",
    faq: [
      {
        question: "Is Cohere API down?",
        answer:
          "Check the current status above. Cohere maintains reliable API services for language model inference. Visit status.cohere.ai for service health details.",
      },
      {
        question: "Why are my Cohere API calls failing?",
        answer:
          "API failures can be due to rate limits, authentication issues, or input validation errors. Check your API key and request format.",
      },
      {
        question: "How to handle Cohere rate limits?",
        answer:
          "Implement exponential backoff, monitor your usage quotas, and consider upgrading your plan for higher rate limits if needed.",
      },
      {
        question: "What to do during Cohere outages?",
        answer:
          "Implement fallback mechanisms, queue requests for retry, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is Cohere's API?",
        answer:
          "Cohere provides enterprise-grade reliability with global infrastructure, automatic scaling, and comprehensive monitoring for consistent API performance.",
      },
    ],
  },
  linode: {
    name: "Linode",
    slug: "linode",
    statusUrl: "https://status.linode.com/",
    communityUrl: "https://www.linode.com/community/questions/",
    tags: ["Cloud", "Infrastructure", "VPS", "Akamai"],
    description:
      "Linode provides cloud computing services including virtual private servers, managed databases, and developer tools with predictable pricing.",
    faq: [
      {
        question: "Is Linode down?",
        answer:
          "Check the current status above. Linode maintains high availability across global data centers. Visit status.linode.com for real-time service updates.",
      },
      {
        question: "Why is my Linode instance unreachable?",
        answer:
          "Connectivity issues can be due to network problems, server configuration, or data center issues. Check the status page and your server logs.",
      },
      {
        question: "How to troubleshoot Linode performance issues?",
        answer:
          "Monitor CPU, memory, and disk usage through Linode's dashboard. Check for network issues and consider upgrading your plan if resources are maxed out.",
      },
      {
        question: "What to do during Linode outages?",
        answer:
          "Implement multi-region deployments, use load balancers for failover, and monitor the status page for updates and estimated resolution times.",
      },
      {
        question: "How reliable is Linode's infrastructure?",
        answer:
          "Linode provides 99.9%+ uptime with global data centers, automated backups, and enterprise-grade hardware for reliable cloud services.",
      },
    ],
  },
  digitalocean: {
    name: "DigitalOcean",
    slug: "digitalocean",
    statusUrl: "https://status.digitalocean.com/",
    communityUrl: "https://www.digitalocean.com/community",
    tags: ["Cloud", "Infrastructure", "VPS"],
    description:
      "DigitalOcean provides cloud infrastructure for developers with virtual machines, managed databases, and application deployment platforms.",
    faq: [
      {
        question: "Is DigitalOcean down?",
        answer:
          "Check the current status above. DigitalOcean maintains high availability across multiple regions. Visit status.digitalocean.com for service health details.",
      },
      {
        question: "Why is my Droplet not responding?",
        answer:
          "Droplet issues can be due to resource exhaustion, network problems, or configuration errors. Check your monitoring dashboard and server logs.",
      },
      {
        question: "How to troubleshoot DigitalOcean networking issues?",
        answer:
          "Verify firewall rules, check VPC settings, ensure proper DNS configuration, and review network usage in your DigitalOcean dashboard.",
      },
      {
        question: "What to do during DigitalOcean outages?",
        answer:
          "Use multiple regions for redundancy, implement health checks, and monitor the status page for incident updates and resolution timelines.",
      },
      {
        question: "How reliable is DigitalOcean?",
        answer:
          "DigitalOcean provides 99.99% uptime SLA with automated backups, monitoring, and distributed infrastructure across global data centers.",
      },
    ],
  },
  replicate: {
    name: "Replicate",
    slug: "replicate",
    statusUrl: "https://status.replicate.com/",
    communityUrl: "https://replicate.com/explore",
    tags: ["LLM Inference Layer Companies"],
    description:
      "Replicate lets you run machine learning models in the cloud with a simple API, offering access to popular open-source models and custom deployments.",
    faq: [
      {
        question: "Is Replicate down?",
        answer:
          "Check the current status above. Replicate maintains reliable infrastructure for ML model inference. Visit status.replicate.com for service updates.",
      },
      {
        question: "Why are my Replicate predictions failing?",
        answer:
          "Prediction failures can be due to invalid inputs, model timeouts, or service limits. Check your input format and the model's requirements.",
      },
      {
        question: "How to troubleshoot Replicate API issues?",
        answer:
          "Verify your API token, check input validation, review prediction logs, and ensure your requests match the model's expected format.",
      },
      {
        question: "What to do during Replicate outages?",
        answer:
          "Implement retry logic with backoff, cache results when possible, and consider using multiple ML providers for critical applications.",
      },
      {
        question: "How reliable is Replicate's platform?",
        answer:
          "Replicate provides enterprise-grade reliability with automatic scaling, global infrastructure, and comprehensive monitoring for ML workloads.",
      },
    ],
  },
  bitbucket: {
    name: "BitBucket",
    slug: "bitbucket",
    statusUrl: "https://bitbucket.status.atlassian.com/",
    communityUrl:
      "https://community.atlassian.com/forums/Bitbucket/ct-p/bitbucket",
    tags: ["CDN & Hosting"],
    description:
      "Bitbucket is a Git-based code and CI/CD tool that teams use to collaborate on code, build, test, and deploy applications.",
    faq: [
      {
        question: "Is Bitbucket down?",
        answer:
          "Check the current status above. Bitbucket maintains high availability for code repositories and CI/CD pipelines. Visit bitbucket.status.atlassian.com for updates.",
      },
      {
        question: "Why can't I push to my Bitbucket repository?",
        answer:
          "Push issues can be due to permission problems, repository size limits, or service disruptions. Check your access rights and repository settings.",
      },
      {
        question: "How to troubleshoot Bitbucket Pipelines issues?",
        answer:
          "Review pipeline logs, check your bitbucket-pipelines.yml file, verify environment variables, and ensure proper Docker image configurations.",
      },
      {
        question: "What to do during Bitbucket outages?",
        answer:
          "Use local Git repositories for temporary work, implement backup remote repositories, and monitor the status page for incident updates.",
      },
      {
        question: "How reliable is Bitbucket?",
        answer:
          "Bitbucket provides enterprise-grade reliability with automatic backups, global CDN, and 99.9%+ uptime for code hosting and CI/CD services.",
      },
    ],
  },
  confluence: {
    name: "Confluence",
    slug: "confluence",
    statusUrl: "https://status.atlassian.com/",
    communityUrl:
      "https://community.atlassian.com/forums/Confluence/ct-p/confluence",
    tags: ["Documentation", "Collaboration", "Atlassian"],
    description:
      "Confluence is a collaboration and documentation platform where teams create, organize, and discuss work in a central, searchable location.",
    faq: [
      {
        question: "Is Confluence down?",
        answer:
          "Check the current status above. Confluence maintains high availability for documentation and collaboration. Visit status.atlassian.com for service health.",
      },
      {
        question: "Why is Confluence running slowly?",
        answer:
          "Performance issues can be due to large page loads, indexing operations, or high user activity. Check your space content and user activity.",
      },
      {
        question: "How to troubleshoot Confluence sync issues?",
        answer:
          "Verify your permissions, check network connectivity, clear browser cache, and ensure your Confluence app is updated to the latest version.",
      },
      {
        question: "What to do during Confluence outages?",
        answer:
          "Use offline documentation tools, save work locally, and monitor the Atlassian status page for estimated resolution times.",
      },
      {
        question: "How reliable is Confluence Cloud?",
        answer:
          "Confluence Cloud provides 99.9%+ uptime with enterprise-grade security, automatic backups, and global infrastructure for reliable collaboration.",
      },
    ],
  },
  trello: {
    name: "Trello",
    slug: "trello",
    statusUrl: "https://trello.status.atlassian.com/",
    communityUrl: "https://community.atlassian.com/forums/Trello/ct-p/trello",
    tags: ["Project Management", "Kanban", "Atlassian"],
    description:
      "Trello is a visual project management tool that uses boards, lists, and cards to help teams organize and prioritize projects.",
    faq: [
      {
        question: "Is Trello down?",
        answer:
          "Check the current status above. Trello maintains high availability for project management workflows. Visit trello.status.atlassian.com for updates.",
      },
      {
        question: "Why aren't my Trello cards syncing?",
        answer:
          "Sync issues can be due to network connectivity, browser cache, or temporary service disruptions. Try refreshing your browser or clearing cache.",
      },
      {
        question: "How to troubleshoot Trello notification issues?",
        answer:
          "Check your notification settings, verify email preferences, ensure browser notifications are enabled, and review your Trello account settings.",
      },
      {
        question: "What to do during Trello outages?",
        answer:
          "Use offline project management tools, document current progress locally, and monitor the status page for service restoration updates.",
      },
      {
        question: "How reliable is Trello?",
        answer:
          "Trello provides 99.9%+ uptime with enterprise-grade infrastructure, automatic data synchronization, and reliable project management capabilities.",
      },
    ],
  },
  snowflake: {
    name: "Snowflake",
    slug: "snowflake",
    statusUrl: "https://status.snowflake.com/",
    communityUrl: "https://community.snowflake.com/s/",
    tags: ["Data Warehouse Provider"],
    description:
      "Snowflake is a cloud-based data platform that provides data warehousing, data lakes, data engineering, and data science solutions.",
    faq: [
      {
        question: "Is Snowflake down?",
        answer:
          "Check the current status above. Snowflake maintains high availability across cloud regions. Visit status.snowflake.com for detailed service health.",
      },
      {
        question: "Why are my Snowflake queries slow?",
        answer:
          "Query performance can be affected by warehouse size, data clustering, or complex operations. Optimize your queries and consider warehouse scaling.",
      },
      {
        question: "How to troubleshoot Snowflake connection issues?",
        answer:
          "Verify connection parameters, check network configuration, ensure proper authentication, and review warehouse state in your Snowflake console.",
      },
      {
        question: "What to do during Snowflake outages?",
        answer:
          "Use cached data when possible, implement query retry logic, and monitor the status page for incident updates and resolution timelines.",
      },
      {
        question: "How reliable is Snowflake?",
        answer:
          "Snowflake provides 99.9%+ uptime with automatic scaling, data replication, and enterprise-grade reliability across multiple cloud providers.",
      },
    ],
  },
  confluent: {
    name: "Confluent",
    slug: "confluent",
    statusUrl: "https://status.confluent.io/",
    communityUrl: "https://developer.confluent.io/community/",
    tags: ["Database Provider"],
    description:
      "Confluent provides a cloud-native Apache Kafka platform for real-time data streaming and event-driven architectures.",
    faq: [
      {
        question: "Is Confluent Cloud down?",
        answer:
          "Check the current status above. Confluent maintains high availability for streaming data platforms. Visit status.confluent.io for service updates.",
      },
      {
        question: "Why are my Kafka messages not being delivered?",
        answer:
          "Message delivery issues can be due to producer/consumer configuration, topic partitioning, or network connectivity. Check your Kafka settings.",
      },
      {
        question: "How to troubleshoot Confluent streaming issues?",
        answer:
          "Monitor consumer lag, verify topic configurations, check producer acknowledgments, and review connector status in your Confluent dashboard.",
      },
      {
        question: "What to do during Confluent outages?",
        answer:
          "Implement message buffering, use multiple clusters for redundancy, and monitor the status page for incident resolution updates.",
      },
      {
        question: "How reliable is Confluent Cloud?",
        answer:
          "Confluent Cloud provides 99.95%+ uptime with multi-zone replication, automatic scaling, and enterprise-grade reliability for streaming data.",
      },
    ],
  },
  chargebee: {
    name: "Chargebee",
    slug: "chargebee",
    statusUrl: "https://status.chargebee.com/",
    communityUrl: "https://www.chargebee.com/community/",
    tags: ["Billing & Subscriptions FinTech API"],
    description:
      "Chargebee is a subscription billing and revenue management platform that automates recurring billing, invoicing, and subscription analytics.",
    faq: [
      {
        question: "Is Chargebee down?",
        answer:
          "Check the current status above. Chargebee maintains high availability for billing operations. Visit status.chargebee.com for real-time service health.",
      },
      {
        question: "Why are subscription charges failing?",
        answer:
          "Billing failures can be due to payment method issues, gateway problems, or service disruptions. Check your payment gateway and customer billing details.",
      },
      {
        question: "How to troubleshoot Chargebee webhook issues?",
        answer:
          "Verify webhook endpoints, check authentication settings, review webhook logs, and ensure your server can handle incoming notifications.",
      },
      {
        question: "What to do during Chargebee outages?",
        answer:
          "Queue billing operations for retry, notify customers of potential delays, and monitor the status page for service restoration updates.",
      },
      {
        question: "How reliable is Chargebee?",
        answer:
          "Chargebee provides 99.99% uptime with redundant infrastructure, automatic failover, and enterprise-grade reliability for subscription billing.",
      },
    ],
  },
  twilio: {
    name: "Twilio",
    slug: "twilio",
    statusUrl: "https://status.twilio.com/",
    communityUrl: "https://reddit.com/r/twilio",
    tags: ["SMS Communication API"],
    description:
      "Twilio provides cloud communications APIs for SMS, voice, video, and authentication, enabling developers to build communication features into applications.",
    faq: [
      {
        question: "Is Twilio down?",
        answer:
          "Check the current status above. Twilio maintains high availability for communication services. Visit status.twilio.com for detailed service health.",
      },
      {
        question: "Why are my SMS messages not being delivered?",
        answer:
          "Message delivery issues can be due to carrier filtering, invalid numbers, or service limits. Check your message content and recipient validation.",
      },
      {
        question: "How to troubleshoot Twilio API issues?",
        answer:
          "Verify your Account SID and Auth Token, check API request format, review error codes, and ensure proper webhook configuration.",
      },
      {
        question: "What to do during Twilio outages?",
        answer:
          "Implement retry logic for failed messages, use backup communication channels, and monitor the status page for incident updates.",
      },
      {
        question: "How reliable is Twilio?",
        answer:
          "Twilio provides 99.95%+ uptime with global infrastructure, redundant carriers, and enterprise-grade reliability for communication services.",
      },
    ],
  },
  sendgrid: {
    name: "SendGrid",
    slug: "sendgrid",
    statusUrl: "https://status.sendgrid.com/",
    communityUrl: "https://sendgrid.com/en-us/blog/category/community",
    tags: ["Email Communication API"],
    description:
      "SendGrid is a cloud-based email delivery platform that provides transactional and marketing email services with advanced analytics and deliverability tools.",
    faq: [
      {
        question: "Is SendGrid down?",
        answer:
          "Check the current status above. SendGrid maintains high availability for email delivery services. Visit status.sendgrid.com for service health details.",
      },
      {
        question: "Why are my emails not being delivered?",
        answer:
          "Delivery issues can be due to reputation problems, content filtering, or recipient blocking. Check your sender reputation and email content.",
      },
      {
        question: "How to troubleshoot SendGrid delivery issues?",
        answer:
          "Review activity logs, check suppression lists, verify domain authentication, and monitor your sender reputation in the SendGrid dashboard.",
      },
      {
        question: "What to do during SendGrid outages?",
        answer:
          "Use backup email providers, queue emails for retry, implement fallback notification methods, and monitor the status page for updates.",
      },
      {
        question: "How reliable is SendGrid?",
        answer:
          "SendGrid provides 99.99% uptime with global infrastructure, redundant email delivery paths, and enterprise-grade reliability for email services.",
      },
    ],
  },
  modal: {
    name: "Modal",
    slug: "modal",
    statusUrl: "https://status.modal.com/",
    communityUrl: "https://discord.gg/8nTGNSYWmA",
    tags: ["AI/ML", "Serverless", "GPU Compute"],
    description:
      "Modal provides serverless GPU compute for AI/ML workloads, offering instant scaling, container-based deployments, and high-performance inference.",
    faq: [
      {
        question: "Is Modal down?",
        answer:
          "Check the current status above. Modal maintains high availability for GPU compute workloads. Visit status.modal.com for real-time service health updates.",
      },
      {
        question: "Why are my Modal functions failing?",
        answer:
          "Function failures can be due to resource limits, cold starts, or service disruptions. Check your function logs and the Modal status page for any ongoing incidents.",
      },
      {
        question: "How to troubleshoot Modal GPU issues?",
        answer:
          "Verify your GPU requirements, check memory usage, review container configurations, and ensure proper dependencies are installed in your Modal environment.",
      },
      {
        question: "What to do during Modal outages?",
        answer:
          "Implement fallback mechanisms, use local development environments for testing, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is Modal's infrastructure?",
        answer:
          "Modal provides enterprise-grade reliability with automatic scaling, distributed GPU clusters, and comprehensive monitoring for AI/ML workloads.",
      },
    ],
  },
  netlify: {
    name: "Netlify",
    slug: "netlify",
    statusUrl: "https://status.netlify.com/",
    communityUrl: "https://answers.netlify.com/",
    tags: ["CDN & Hosting", "JAMstack", "Frontend"],
    description:
      "Netlify is a cloud platform for deploying and hosting static sites and serverless functions with continuous deployment from Git repositories.",
    faq: [
      {
        question: "Is Netlify down?",
        answer:
          "Check the current status above. Netlify maintains high availability for static site hosting and deployments. Visit status.netlify.com for service health details.",
      },
      {
        question: "Why is my Netlify site not deploying?",
        answer:
          "Deployment issues can be due to build failures, quota limits, or service disruptions. Check your build logs and deployment settings in the Netlify dashboard.",
      },
      {
        question: "How to troubleshoot Netlify site issues?",
        answer:
          "Verify your build configuration, check DNS settings, review function logs, and ensure your repository is properly connected to Netlify.",
      },
      {
        question: "What to do during Netlify outages?",
        answer:
          "Use alternative hosting providers, implement backup deployment strategies, and monitor the status page for incident updates.",
      },
      {
        question: "How reliable is Netlify?",
        answer:
          "Netlify provides 99.99% uptime with global CDN, automatic scaling, and enterprise-grade infrastructure for frontend applications.",
      },
    ],
  },
  "bunny-net": {
    name: "Bunny.net",
    slug: "bunny-net",
    statusUrl: "https://status.bunny.net/",
    communityUrl: "https://support.bunny.net/",
    tags: ["CDN", "Hosting", "Storage", "Video Streaming"],
    description:
      "Bunny.net is a next-generation CDN and edge storage platform offering global content delivery, video streaming, and storage solutions with performance optimization.",
    faq: [
      {
        question: "Is Bunny.net down?",
        answer:
          "Check the current status above. Bunny.net maintains high availability across their global CDN network. Visit status.bunny.net for real-time service health updates.",
      },
      {
        question: "Why is my content not loading from Bunny CDN?",
        answer:
          "Content delivery issues can be due to cache misses, origin server problems, or network connectivity. Check your pull zone configuration and origin server status.",
      },
      {
        question: "How to troubleshoot Bunny.net performance issues?",
        answer:
          "Review your cache settings, check edge server locations, verify SSL certificates, and analyze traffic patterns in your Bunny.net dashboard.",
      },
      {
        question: "What to do during Bunny.net outages?",
        answer:
          "Enable origin fallback, use multiple CDN providers, implement proper error handling, and monitor the status page for incident resolution updates.",
      },
      {
        question: "How reliable is Bunny.net's CDN?",
        answer:
          "Bunny.net provides 99.9%+ uptime with a global network of edge servers, automatic failover, and real-time performance monitoring across all regions.",
      },
    ],
  },
  qdrant: {
    name: "Qdrant",
    slug: "qdrant",
    statusUrl: "https://status.qdrant.io/",
    communityUrl: "https://discord.gg/tdtYvXjC4h",
    tags: ["Database", "Vector Search", "AI/ML", "Open Source"],
    description:
      "Qdrant is an open-source vector database and similarity search engine designed for machine learning applications, offering high-performance vector operations and filtering.",
    faq: [
      {
        question: "Is Qdrant Cloud down?",
        answer:
          "Check the current status above. Qdrant Cloud maintains high availability for vector database operations. Visit status.qdrant.io for real-time service health updates.",
      },
      {
        question: "Why are my vector searches slow?",
        answer:
          "Slow searches can be due to large vector dimensions, complex filters, or cluster load. Optimize your vector indexing, check HNSW parameters, and review query complexity.",
      },
      {
        question: "How to troubleshoot Qdrant connection issues?",
        answer:
          "Verify your API endpoint, check authentication tokens, ensure proper network connectivity, and review collection configurations in your Qdrant dashboard.",
      },
      {
        question: "What to do during Qdrant outages?",
        answer:
          "Implement local fallbacks, use read replicas if available, cache frequent queries, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is Qdrant Cloud?",
        answer:
          "Qdrant Cloud provides enterprise-grade reliability with automatic scaling, data replication, and comprehensive monitoring for vector search workloads.",
      },
    ],
  },
  huggingface: {
    name: "Hugging Face",
    slug: "huggingface",
    statusUrl: "https://status.huggingface.co/",
    communityUrl: "https://discuss.huggingface.co/",
    tags: ["AI/ML", "Model Hosting", "Open Source", "LLM"],
    description:
      "Hugging Face is the AI community platform providing model hosting, datasets, and machine learning infrastructure for collaborative AI development and deployment.",
    faq: [
      {
        question: "Is Hugging Face down?",
        answer:
          "Check the current status above. Hugging Face maintains high availability for model hosting and inference. Visit status.huggingface.co for real-time service health updates.",
      },
      {
        question: "Why are my model inferences slow?",
        answer:
          "Slow inference can be due to model size, cold starts, or high demand. Consider using dedicated endpoints, optimizing model configurations, or caching frequently used models.",
      },
      {
        question: "How to troubleshoot Hugging Face API issues?",
        answer:
          "Verify your API tokens, check rate limits, ensure proper model names, and review your request format. Monitor usage in your Hugging Face dashboard.",
      },
      {
        question: "What to do during Hugging Face outages?",
        answer:
          "Use local model deployments, implement fallback providers, cache model outputs when possible, and monitor the status page for incident updates.",
      },
      {
        question: "How reliable is Hugging Face's infrastructure?",
        answer:
          "Hugging Face provides enterprise-grade reliability with global CDN, automatic scaling, and comprehensive monitoring for AI/ML workloads and model hosting.",
      },
    ],
  },
  inkeep: {
    name: "Inkeep",
    slug: "inkeep",
    statusUrl: "https://status.inkeep.com/",
    communityUrl: "https://www.inkeep.com/",
    tags: ["AI/ML", "Search", "Documentation"],
    description:
      "Inkeep provides AI-powered search and support solutions for documentation, enabling developers to build intelligent search experiences with natural language understanding.",
    faq: [
      {
        question: "Is Inkeep down?",
        answer:
          "Check the current status above. Inkeep maintains high availability for AI-powered search services. Visit status.inkeep.com for real-time service health updates.",
      },
      {
        question: "Why is search not working?",
        answer:
          "Search issues can be due to indexing delays, API rate limits, or service disruptions. Check your API configuration and the Inkeep status page for any ongoing incidents.",
      },
      {
        question: "How to troubleshoot Inkeep API issues?",
        answer:
          "Verify your API keys, check rate limits, ensure proper search query formatting, and review your integration settings in the Inkeep dashboard.",
      },
      {
        question: "What to do during Inkeep outages?",
        answer:
          "Implement fallback search mechanisms, use cached search results when possible, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is Inkeep's service?",
        answer:
          "Inkeep provides enterprise-grade reliability with global infrastructure, automatic scaling, and comprehensive monitoring for AI-powered search workloads.",
      },
    ],
  },
  assemblyai: {
    name: "AssemblyAI",
    slug: "assemblyai",
    statusUrl: "https://status.assemblyai.com/",
    communityUrl: "https://community.assemblyai.com/",
    tags: ["AI/ML", "LLM"],
    description:
      "AssemblyAI provides AI-powered transcription and translation services, enabling developers to build speech-to-text and text-to-speech capabilities into their applications.",
    faq: [
      {
        question: "Is AssemblyAI down?",
        answer:
          "Check the current status above. AssemblyAI maintains high availability for transcription and translation services. Visit status.assemblyai.com for real-time updates.",
      },
      {
        question: "Why is transcription failing?",
        answer:
          "Transcription failures can be due to service limits, API errors, or input issues. Check your input audio quality, format, and the AssemblyAI status page.",
      },
      {
        question: "How to troubleshoot AssemblyAI API issues?",
        answer:
          "Verify your API key, check rate limits, ensure proper model selection, and review your request format. Monitor usage in your AssemblyAI dashboard.",
      },
      {
        question: "What to do during AssemblyAI outages?",
        answer:
          "Implement fallback mechanisms, use local transcription tools, and monitor the status page for estimated resolution times.",
      },
      {
        question: "How reliable is AssemblyAI's service?",
        answer:
          "AssemblyAI provides enterprise-grade reliability with global infrastructure, automatic scaling, and comprehensive monitoring for AI/ML workloads and transcription services.",
      },
    ],
  },
  deepgram: {
    name: "Deepgram",
    slug: "deepgram",
    statusUrl: "https://status.deepgram.com/",
    communityUrl: "https://discord.gg/xWRaCDBtW4",
    tags: ["AI/ML", "Voice", "Audio", "Speech Recognition"],
    description:
      "Deepgram provides AI-powered speech recognition and voice analytics APIs, enabling developers to build voice-enabled applications with real-time transcription.",
    faq: [
      {
        question: "Is Deepgram API down?",
        answer:
          "Check the current status above. Deepgram maintains high availability for speech recognition services. Visit status.deepgram.com for real-time service health updates.",
      },
      {
        question: "Why is speech recognition failing?",
        answer:
          "Recognition failures can be due to audio quality, format issues, or service limits. Check your audio input quality, format specifications, and the Deepgram status page.",
      },
      {
        question: "How to troubleshoot Deepgram API issues?",
        answer:
          "Verify your API key, check rate limits, ensure proper audio format, and review your request configuration. Monitor usage in your Deepgram dashboard.",
      },
      {
        question: "What to do during Deepgram outages?",
        answer:
          "Implement fallback mechanisms, use local speech recognition tools, cache transcription results when possible, and monitor the status page for updates.",
      },
      {
        question: "How reliable is Deepgram's service?",
        answer:
          "Deepgram provides enterprise-grade reliability with global infrastructure, automatic scaling, and comprehensive monitoring for speech recognition workloads.",
      },
    ],
  },
};

type PageProps = {
  params: { service: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

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
    "Project Management": "bg-indigo-100 text-indigo-800",
  };
  return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

const getRssUrl = (service: any) => {
  switch (service.slug) {
    // case "openai":
    //   return "https://status.openai.com/feed.rss";
    case "slack":
      return "https://slack-status.com/feed/rss";
    case "render":
      return "https://status.render.com/history.rss";
    case "vercel":
      return "https://www.vercel-status.com/history.rss";
    case "clerk":
      return "https://status.clerk.com/feed.rss";
    case "xai":
      return "https://status.x.ai/feed.xml";
    case "elevenlabs":
      return "https://status.elevenlabs.io/feed.rss";
    case "pinecone":
      return "https://status.pinecone.io/history.rss";
    case "mongodb-atlas":
      return "https://status.mongodb.com/history.rss";
    case "assemblyai":
      return "https://status.assemblyai.com/history.rss";
    case "huggingface":
      return "https://status.huggingface.co/feed.rss";
    case "qdrant":
      return "https://status.qdrant.io/feed.rss";
    case "modal":
      return "https://status.modal.com/feed.rss";
    case "bunny-net":
      return "https://status.bunny.net/history.rss";
    case "netlify":
      return "https://www.netlifystatus.com/history.rss";
    case "aws":
      return "https://status.aws.amazon.com/rss/all.rss";
    case "fireworks-ai":
      return "https://status.fireworks.ai/feed.rss";
    case "together-ai":
      return "https://status.together.ai/feed.rss";
    case "paypal-checkout":
      return "https://status.paypal.com/feed/rss";
    default:
      return null;
  }
};

const getStatusAPIUrl = (service: any) => {
  switch (service.slug) {
    case "cloudflare":
      return {
        status: "https://www.cloudflarestatus.com/api/v2/summary.json",
        incidents: "https://www.cloudflarestatus.com/api/v2/incidents.json",
      };
    case "fastly":
      return {
        status: "https://www.fastlystatus.com/status.json",
        incidents: "https://www.fastlystatus.com/incidents.json",
      };
    case "supabase":
      return {
        status: "https://status.supabase.com/api/v2/status.json",
        incidents: "https://status.supabase.com/api/v2/incidents.json",
      };
    case "redis":
      return {
        status: "https://status.redis.io/api/v2/status.json",
        incidents: "https://status.redis.io/api/v2/incidents.json",
      };
    case "cursor":
      return {
        status: "https://status.cursor.com/api/v2/status.json",
        incidents: "https://status.cursor.com/api/v2/incidents.json",
      };
    case "anthropic":
      return {
        status: "https://status.anthropic.com/api/v2/status.json",
        incidents: "https://status.anthropic.com/api/v2/incidents.json",
      };
    case "cohere":
      return {
        status: "https://status.cohere.com/api/v2/status.json",
        incidents: "https://status.cohere.com/api/v2/incidents.json",
      };
    case "linode":
      return {
        status: "https://status.linode.com/api/v2/status.json",
        incidents: "https://status.linode.com/api/v2/incidents.json",
      };
    case "digitalocean":
      return {
        status: "https://status.digitalocean.com/api/v2/status.json",
        incidents: "https://status.digitalocean.com/api/v2/incidents.json",
      };
    case "replicate":
      return {
        status: "https://replicatestatus.com/api/v2/status.json",
        incidents: "https://replicatestatus.com/api/v2/incidents.json",
      };
    case "jira":
      return {
        status: "https://jira-software.status.atlassian.com/api/v2/status.json",
        incidents:
          "https://jira-software.status.atlassian.com/api/v2/incidents.json",
      };
    case "bitbucket":
      return {
        status: "https://bitbucket.status.atlassian.com/api/v2/status.json",
        incidents:
          "https://bitbucket.status.atlassian.com/api/v2/incidents.json",
      };
    case "confluence":
      return {
        status: "https://confluence.status.atlassian.com/api/v2/status.json",
        incidents:
          "https://confluence.status.atlassian.com/api/v2/incidents.json",
      };
    case "trello":
      return {
        status: "https://trello.status.atlassian.com/api/v2/status.json",
        incidents: "https://trello.status.atlassian.com/api/v2/incidents.json",
      };
    case "snowflake":
      return {
        status: "https://status.snowflake.com/api/v2/summary.json",
        incidents: "https://status.snowflake.com/api/v2/incidents.json",
      };
    case "confluent":
      return {
        status: "https://status.confluent.cloud/api/v2/summary.json",
        incidents: "https://status.confluent.cloud/api/v2/incidents.json",
      };
    case "chargebee":
      return {
        status: "https://status.chargebee.com/api/v2/summary.json",
        incidents: "https://status.chargebee.com/api/v2/incidents.json",
      };
    case "twilio":
      return {
        status: "https://status.twilio.com/api/v2/summary.json",
        incidents: "https://status.twilio.com/api/v2/incidents.json",
      };
    case "sendgrid":
      return {
        status: "https://status.sendgrid.com/api/v2/summary.json",
        incidents: "https://status.sendgrid.com/api/v2/incidents.json",
      };
    case "openai":
      return {
        status: "https://status.openai.com/api/v2/summary.json",
        incidents: "https://status.openai.com/api/v2/incidents.json",
      };
    case "mailgun":
      return {
        status: "https://status.mailgun.com/api/v2/status.json",
        incidents: "https://status.mailgun.com/api/v2/incidents.json",
      };
    case "oracle-cloud-infrastructure":
      return {
        status: "https://ocistatus.oraclecloud.com/api/v2/status.json",
        incidents: "https://ocistatus.oraclecloud.com/api/v2/incidents.json",
      };
    case "stripe-checkout":
    case "stripe-billing":
    case "stripe-invoicing":
      return {
        status: "https://www.stripestatus.com/api/v2/status.json",
        incidents: "https://www.stripestatus.com/api/v2/incidents.json",
      };
    default:
      return null;
  }
};

const getAtomUrl = (service: any) => {
  switch (service.slug) {
    case "google-cloud":
      return "https://status.cloud.google.com/en/feed.atom";
    case "deepgram":
      return "https://status.deepgram.com/history.atom";
    default:
      return null;
  }
};

const getBetterStackUrl = (service: any) => {
  switch (service.slug) {
    case "inkeep":
      return {
        json: "https://status.inkeep.com/index.json",
        rss: "https://status.inkeep.com/feed",
      };
    default:
      return null;
  }
};

export default async function ServiceStatusPage({ params }: PageProps) {
  // Use Promise.resolve to properly handle dynamic params
  const { service: serviceSlug } = await Promise.resolve(params);
  const service = serviceData[serviceSlug as keyof typeof serviceData];

  if (!service) {
    notFound();
  }

  // Fetch real-time status if RSS feed, Atom feed, Better Stack, or API endpoints are available
  const rssUrl = getRssUrl(service);
  const atomUrl = getAtomUrl(service);
  const betterStackUrl = getBetterStackUrl(service);
  const apiUrls = getStatusAPIUrl(service);

  let statusData: ServiceStatusData;

  if (rssUrl) {
    statusData = await fetchServiceStatus(rssUrl);
  } else if (atomUrl) {
    statusData = await fetchServiceStatusFromAtom(atomUrl);
  } else if (betterStackUrl) {
    statusData = await fetchServiceStatusFromBetterStack(
      betterStackUrl.json,
      betterStackUrl.rss
    );
  } else if (apiUrls) {
    statusData = await fetchServiceStatusFromAPI(
      apiUrls.status,
      apiUrls.incidents
    );
  } else {
    statusData = {
      status: "unknown" as const,
      incidents: [],
    };
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                prefetch={true}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="https://www.drdroid.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}/logos/drdroid-logo.svg`}
                    alt="DrDroid Logo"
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                </Link>
                <h1 className="text-xl font-semibold text-primary tracking-tight">Debug Production At Machine Speed</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Status Checker
              </Badge>
              <div className="relative">
                {/* Sparkle animations */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute -top-2 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
                <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-500"></div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="relative bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Link
                    href="https://github.com/DrDroidLab/status-page-aggregator"
                    className="flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800">
                    <Github className="w-4 h-4" />⭐ Star on GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{service.name} Status</h1>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${getStatusColor(
              statusData.status
            )}`}
          >
            <span className="text-sm font-medium">
              {getStatusText(statusData.status)}
            </span>
          </div>
          {statusData.lastIncident && (
            <p className="text-muted-foreground">
              Last incident:{" "}
              {new Date(statusData.lastIncident.createdAt).toLocaleDateString()}
            </p>
          )}
          {!rssUrl && !atomUrl && !apiUrls && (
            <p className="text-muted-foreground mt-2">
              Real-time status updates are not available for this service.
            </p>
          )}
        </div>

        {/* Status Details */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overall Status</span>
                  <span className={getStatusColor(statusData.status)}>
                    {getStatusText(statusData.status)}
                  </span>
                </div>
                {statusData.lastIncident && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Last Incident
                      </span>
                      <span>{statusData.lastIncident.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Incident Status
                      </span>
                      <span>{statusData.lastIncident.status}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        {statusData.incidents.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {statusData.incidents.slice(0, 5).map((incident, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                    <CardDescription>
                      {new Date(incident.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none mb-4"
                      dangerouslySetInnerHTML={{
                        __html: incident.htmlDescription,
                      }}
                    />
                    {incident.components.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Affected Components:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {incident.components.map((component, i) => (
                            <Badge key={i} variant="secondary">
                              {component}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Button size="lg" asChild>
            <Link href={service.statusUrl} className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Official Status Page
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link
              href={service.communityUrl}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Community Discussion
            </Link>
          </Button>
        </div>

        {/* DrDroid AI SRE Agent */}
        <div className="max-w-4xl mx-auto mb-12">
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
                    Tired of manual incident investigations?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    <strong>DrDroid</strong> is the AI SRE Agent that understands your production system. Connect your monitoring stack and get root cause analysis in seconds.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">⚡</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Auto-investigate alerts & find root causes</h4>
                        <p className="text-sm text-gray-600">When alerts fire, DrDroid automatically correlates metrics, logs, and deployments to surface root causes in seconds</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">💬</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Ask questions in plain English</h4>
                        <p className="text-sm text-gray-600">Query your production system through Slack: "Why is API latency spiking?" and get instant investigation results</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href="https://aiops.drdroid.io/sign-up" target="_blank" className="flex items-center gap-2">
                        Try Cloud
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                      <Link href="https://drdroid.io/mac-app" target="_blank" className="flex items-center gap-2">
                        Try Locally
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="absolute top-2 right-2 text-blue-300 text-xs opacity-50">
                  90% faster incident resolution
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {service.faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Related Services */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Check Other Services
          </h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {Object.entries(serviceData)
              .filter(([key]) => key !== serviceSlug)
              .slice(0, 4)
              .map(([key, data]) => (
                <Button key={key} variant="outline" asChild>
                  <Link href={`/${key}`}>{data.name}</Link>
                </Button>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Use Promise.resolve to properly handle dynamic params
  const { service: serviceSlug } = await Promise.resolve(params);
  const service = serviceData[serviceSlug as keyof typeof serviceData];

  if (!service) {
    return {
      title: "Service Not Found",
      description: "The requested service status page could not be found.",
    };
  }

  return {
    title: `${service.name} Status | Is ${service.name} Down?`,
    description: `Check the current status of ${service.name}. ${
      service.description ||
      `Monitor ${service.name}'s service status, uptime, and recent incidents.`
    }`,
    openGraph: {
      title: `${service.name} Status | Is ${service.name} Down?`,
      description: `Check the current status of ${service.name}. ${
        service.description ||
        `Monitor ${service.name}'s service status, uptime, and recent incidents.`
      }`,
      url: `https://status-page-aggregator.vercel.app/${service.slug}`,
    },
    twitter: {
      title: `${service.name} Status | Is ${service.name} Down?`,
      description: `Check the current status of ${service.name}. ${
        service.description ||
        `Monitor ${service.name}'s service status, uptime, and recent incidents.`
      }`,
    },
  };
}

export const dynamic = "force-dynamic";
