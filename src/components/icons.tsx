
import { LucideProps, Loader2, User } from "lucide-react";

export const Icons = {
  spinner: Loader2,
  logo: User,
  user: User,
};

export type Icon = keyof typeof Icons;
