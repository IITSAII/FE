import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            // iPad Typography Tokens
            "ipad-heading-1-medium-36",
            "ipad-heading-1-medium",
            "ipad-heading-2-medium",
            "ipad-body-1-light",
            "ipad-body-2-light",

            // iPhone Typography Tokens
            "iphone-heading-1-semibold",
            "iphone-heading-1-medium",
            "iphone-heading-2-medium",
            "iphone-body-1-light",
            "iphone-body-1-regular",
            "iphone-body-1-semibold",
            "iphone-body-2-light",
            "iphone-body-2-regular",

            // Common / Alias Typography Tokens
            "heading-1-semibold",
            "heading-1-medium",
            "heading-2-medium",
            "body-1-light",
            "body-1-regular",
            "body-1-semibold",
            "body-2-light",
            "body-2-regular",

            // 동적 커스텀 타이포그래피 패턴 (예: text-label-2-medium, text-caption-1-regular 등)
            (value: string) =>
              /^(ipad-|iphone-)?(heading|body|label|caption|title|display)-/i.test(
                value,
              ),
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
