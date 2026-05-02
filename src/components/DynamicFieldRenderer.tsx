import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryField } from "@/lib/categoryFields";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  fields: CategoryField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export default function DynamicFieldRenderer({ fields, values, onChange }: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      {fields.map((f) => {
        const v = values[f.key];
        const id = `field-${f.key}`;
        return (
          <div key={f.id}>
            <Label htmlFor={id} className="text-xs">
              {f.label}
              {f.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>

            {f.field_type === "text" && (
              <Input
                id={id}
                value={(v as string) ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder ?? undefined}
              />
            )}

            {f.field_type === "textarea" && (
              <Textarea
                id={id}
                value={(v as string) ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder ?? undefined}
                rows={3}
              />
            )}

            {f.field_type === "number" && (
              <Input
                id={id}
                type="number"
                value={(v as string) ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder ?? undefined}
              />
            )}

            {f.field_type === "date" && (
              <Input
                id={id}
                type="date"
                value={(v as string) ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}

            {f.field_type === "time" && (
              <Input
                id={id}
                type="time"
                value={(v as string) ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}

            {f.field_type === "select" && f.options && (
              <Select
                value={(v as string) ?? ""}
                onValueChange={(val) => onChange(f.key, val)}
              >
                <SelectTrigger id={id}>
                  <SelectValue placeholder={f.placeholder ?? "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {f.field_type === "multiselect" && f.options && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {f.options.map((o) => {
                  const arr = Array.isArray(v) ? (v as string[]) : [];
                  const on = arr.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        onChange(
                          f.key,
                          on ? arr.filter((x) => x !== o.value) : [...arr, o.value],
                        )
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border hover:border-primary/40"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}

            {f.field_type === "days" && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DAYS.map((d) => {
                  const arr = Array.isArray(v) ? (v as string[]) : [];
                  const on = arr.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        onChange(
                          f.key,
                          on ? arr.filter((x) => x !== d) : [...arr, d],
                        )
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border hover:border-primary/40"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            {f.help_text && (
              <p className="mt-1 text-[11px] text-muted-foreground">{f.help_text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
