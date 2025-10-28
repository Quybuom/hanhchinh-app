import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSIGNEES } from "@shared/schema";

interface AssigneeInputProps {
  value: string | null;
  onChange: (value: string) => void;
  testId?: string;
}

export default function AssigneeInput({ value, onChange, testId }: AssigneeInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Combine default assignees with current value if it's custom
  const customValue = value && !ASSIGNEES.includes(value) ? [value] : [];
  const allAssignees = Array.from(new Set([...ASSIGNEES, ...customValue]));
  
  const filteredAssignees = searchQuery
    ? allAssignees.filter(assignee =>
        assignee.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allAssignees;

  const displayValue = value || "Chưa phân công";
  const hasValue = Boolean(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[180px] justify-between",
            !hasValue && "text-muted-foreground"
          )}
          data-testid={testId}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm hoặc nhập tên..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredAssignees.length === 0 && searchQuery && (
              <CommandEmpty>
                <div className="py-2 text-center text-sm">
                  <p className="text-muted-foreground mb-2">Không tìm thấy</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      onChange(searchQuery);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    data-testid="button-add-new-assignee"
                  >
                    Thêm "{searchQuery}"
                  </Button>
                </div>
              </CommandEmpty>
            )}
            <CommandGroup>
              {hasValue && (
                <CommandItem
                  value="unassigned"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Bỏ phân công
                </CommandItem>
              )}
              {filteredAssignees.map((assignee) => (
                <CommandItem
                  key={assignee}
                  value={assignee}
                  onSelect={() => {
                    onChange(assignee);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === assignee ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {assignee}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
