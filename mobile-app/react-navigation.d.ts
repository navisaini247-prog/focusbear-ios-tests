import type { theme } from "@/theme";

declare module "@react-navigation/native" {
  export function useTheme(): typeof theme.light;
}
