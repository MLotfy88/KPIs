import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ratingCircleVariants = cva(
  "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-300 bg-white text-gray-400",
        selected: "border-primary bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface RatingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  onChange: (value: number) => void;
}

const RatingCircles: React.FC<RatingCirclesProps> = ({ value, onChange, className, ...props }) => {
  return (
    <div className={cn("flex gap-2", className)} {...props}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <div
          key={rating}
          className={cn(ratingCircleVariants({ variant: value === rating ? "selected" : "default" }))}
          onClick={() => onChange(rating)}
        >
          {rating}
        </div>
      ))}
    </div>
  );
};

export { RatingCircles };
