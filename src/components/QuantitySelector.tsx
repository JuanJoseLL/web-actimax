"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  label,
  className,
}: QuantitySelectorProps) {
  return (
    <ButtonGroup className={className} aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Disminuir ${label}`}
      >
        <MinusIcon />
      </Button>
      <ButtonGroupText className="min-w-10 justify-center font-mono tabular-nums" aria-live="polite">
        {value}
      </ButtonGroupText>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        aria-label={`Aumentar ${label}`}
      >
        <PlusIcon />
      </Button>
    </ButtonGroup>
  );
}
