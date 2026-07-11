import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount: number;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}

const FilterSortBar = ({ filtersOpen, setFiltersOpen, itemCount, searchParams, setSearchParams }: FilterSortBarProps) => {
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");

  const categories = ["earrings", "bracelets", "rings", "necklaces"];
  const priceRanges = [
    { value: "under-1000", label: "Under €1,000" },
    { value: "1000-2000", label: "€1,000 - €2,000" },
    { value: "2000-3000", label: "€2,000 - €3,000" },
    { value: "over-3000", label: "Over €3,000" },
  ];
  const materials = ["gold", "silver", "cotton", "plated"];

  const selectedCategories = useMemo(() => searchParams.getAll("category"), [searchParams]);
  const selectedPrices = useMemo(() => searchParams.getAll("price"), [searchParams]);
  const selectedMaterials = useMemo(() => searchParams.getAll("material"), [searchParams]);

  const updateQueryParams = (updates: Record<string, string | string[] | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      nextParams.delete(key);
      if (value === null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => nextParams.append(key, entry));
      } else {
        nextParams.set(key, value);
      }
    });
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const toggleValue = (key: "category" | "price" | "material", value: string) => {
    const currentValues = searchParams.getAll(key);
    const nextValues = currentValues.includes(value) ? currentValues.filter((entry) => entry !== value) : [...currentValues, value];
    updateQueryParams({ [key]: nextValues.length > 0 ? nextValues : null });
  };

  const clearAll = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("price");
    nextParams.delete("material");
    nextParams.delete("page");
    nextParams.set("sort", "featured");
    setSearchParams(nextParams);
  };

  return (
    <>
      <section className="w-full px-6 mb-8 border-b border-border pb-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-light text-muted-foreground">
            {itemCount} items
          </p>
          
          <div className="flex items-center gap-4">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="font-light hover:bg-transparent"
                >
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background border-none shadow-none">
                <SheetHeader className="mb-6 border-b border-border pb-4">
                  <SheetTitle className="text-lg font-light">Filters</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-8">
                  {/* Category Filter */}
                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Category</h3>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-3">
                          <Checkbox id={category} checked={selectedCategories.includes(category)} onCheckedChange={() => toggleValue("category", category)} className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                          <Label htmlFor={category} className="text-sm font-light text-foreground cursor-pointer">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="border-border" />

                  {/* Price Filter */}
                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Price</h3>
                    <div className="space-y-3">
                      {priceRanges.map((range) => (
                        <div key={range.value} className="flex items-center space-x-3">
                          <Checkbox id={range.value} checked={selectedPrices.includes(range.value)} onCheckedChange={() => toggleValue("price", range.value)} className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                          <Label htmlFor={range.value} className="text-sm font-light text-foreground cursor-pointer">
                            {range.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="border-border" />

                  {/* Material Filter */}
                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Material</h3>
                    <div className="space-y-3">
                      {materials.map((material) => (
                        <div key={material} className="flex items-center space-x-3">
                          <Checkbox id={material} checked={selectedMaterials.includes(material)} onCheckedChange={() => toggleValue("material", material)} className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                          <Label htmlFor={material} className="text-sm font-light text-foreground cursor-pointer">
                            {material.charAt(0).toUpperCase() + material.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="border-border" />

                  <div className="flex flex-col gap-2 pt-4">
                    <Button variant="ghost" size="sm" className="w-full border-none hover:bg-transparent hover:underline font-normal text-left justify-start" onClick={() => setFiltersOpen(false)}>
                      Apply Filters
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full border-none hover:bg-transparent hover:underline font-light text-left justify-start" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              updateQueryParams({ sort: value });
            }}>
              <SelectTrigger className="w-auto border-none bg-transparent text-sm font-light shadow-none rounded-none pr-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="shadow-none border-none rounded-none bg-background">
                <SelectItem value="featured" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Featured</SelectItem>
                <SelectItem value="price-low" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: Low to High</SelectItem>
                <SelectItem value="price-high" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: High to Low</SelectItem>
                <SelectItem value="newest" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Newest</SelectItem>
                <SelectItem value="name" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </>
  );
};

export default FilterSortBar;