import type { FC } from "react";
import { LettermatchIcon } from "@/components/app-icons/LettermatchIcon";
import { IssueAggregatorIcon } from "@/components/app-icons/IssueAggregatorIcon";
import { LockIcon } from "@/components/app-icons/LockIcon";

export type AppIcon = FC<{ size: number }>;

export type App = {
  slug: string;
  name: string;
  pitch?: string;
  tagline?: string;
  href?: string;
  comingSoon: boolean;
  accent: string;
  mark: string;
  Icon?: AppIcon;
  width?: number;
  height?: number;
};

export const apps: App[] = [
  {
    slug: "lettermatch",
    name: "LetterMatch",
    pitch: "Find movies your whole group wants to watch.",
    href: "https://lettermatch.app",
    comingSoon: false,
    accent: "#2eba68",
    mark: "L",
    Icon: LettermatchIcon,
  },
  {
    slug: "issueaggregator",
    name: "IssueAggregator",
    tagline: "Open-source issues with bounties.",
    pitch: "Fix issues, help projects, get paid.",
    href: "https://issue-aggregator-psi.vercel.app/",
    comingSoon: false,
    accent: "#146ef5",
    mark: "I",
    Icon: IssueAggregatorIcon,
  },
  {
    slug: "secret1",
    name: "Secret App #1",
    pitch: "Building in stealth - a tool for founders and creators.",
    comingSoon: true,
    accent: "#6b6f76",
    mark: "?",
    Icon: LockIcon,
  },
  {
    slug: "secret2",
    name: "Secret App #2",
    pitch: "Building in stealth - an app for sharpening something you use every day.",
    comingSoon: true,
    accent: "#7a726a",
    mark: "?",
    Icon: LockIcon,
  },
  {
    slug: "terminal",
    name: "Terminal – Signup",
    comingSoon: false,
    accent: "#1c1b19",
    mark: "›",
    width: 280,
    height: 380,
  },
];
