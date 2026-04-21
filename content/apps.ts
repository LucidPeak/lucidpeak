import type { FC } from "react";
import { LettermatchIcon } from "@/components/app-icons/LettermatchIcon";
import { IssueAggregatorIcon } from "@/components/app-icons/IssueAggregatorIcon";
import { HiRelayIcon } from "@/components/app-icons/HiRelayIcon";
import { BuildMeThisIcon } from "@/components/app-icons/BuildMeThisIcon";

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
    name: "Lettermatch",
    pitch: "Compare Letterboxd and MAL watchlists to find your shared taste.",
    tagline: "What should we watch? Decide in 30 seconds.",
    href: "https://lettermatch.app",
    comingSoon: false,
    accent: "#e5a853",
    mark: "L",
    Icon: LettermatchIcon,
  },
  {
    slug: "issueaggregator",
    name: "IssueAggregator",
    pitch: "A unified board of open-source issues and bounties across GitHub.",
    href: "https://github.com/teodor-i/IssueAggregator",
    comingSoon: true,
    accent: "#7c8ef0",
    mark: "I",
    Icon: IssueAggregatorIcon,
  },
  {
    slug: "hirelay",
    name: "hiRelay",
    pitch: "Content OS for solo creators — one idea, five platform-native outputs, your voice.",
    comingSoon: true,
    accent: "#5ed4b3",
    mark: "R",
    Icon: HiRelayIcon,
  },
  {
    slug: "buildmethis",
    name: "BuildMeThis",
    pitch: "A community board where people post problems and builders ship solutions.",
    tagline: "Wishes meet builders.",
    comingSoon: true,
    accent: "#ef6f8c",
    mark: "B",
    Icon: BuildMeThisIcon,
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
