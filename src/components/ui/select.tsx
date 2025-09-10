import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
};

const Select = ({ children, value, onValueChange }: { 
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();
  
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  const { open, setOpen } = useSelectContext();
  
  if (!open) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-[100]"
        onClick={() => setOpen(false)}
      />
      <div className="absolute top-full left-0 right-0 z-[110] min-w-[8rem] max-h-60 overflow-auto rounded-md border bg-white p-1 text-gray-900 shadow-lg animate-in fade-in-0 zoom-in-95">
        {children}
      </div>
    </>
  );
};

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = useSelectContext();
  const isSelected = selectedValue === value;
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900 transition-colors",
        isSelected && "bg-blue-100 text-blue-900 font-medium",
        className
      )}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4 text-blue-600" />
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectValue = ({ placeholder }: { placeholder: string }) => {
  const { value } = useSelectContext();
  
  return (
    <span className={cn("truncate", !value && "text-gray-500")}>
      {value || placeholder}
    </span>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }