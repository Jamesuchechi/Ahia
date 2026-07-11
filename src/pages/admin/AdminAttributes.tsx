import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sliders, Plus, Trash2, Loader2, Tag, ChevronRight, Settings } from "lucide-react";

interface Attribute {
  id: string;
  name: string;
  created_at: string;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  created_at: string;
}

const AdminAttributes: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  const [loadingValues, setLoadingValues] = useState(false);

  // Form State
  const [attributeName, setAttributeName] = useState("");
  const [isSubmittingAttr, setIsSubmittingAttr] = useState(false);

  const [newValue, setNewValue] = useState("");
  const [isSubmittingValue, setIsSubmittingValue] = useState(false);

  const fetchAttributes = useCallback(async () => {
    setLoadingAttributes(true);
    try {
      const { data, error } = await supabase
        .from("attributes")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setAttributes(data || []);
      
      // Auto-select the first attribute if none is selected
      if (data && data.length > 0 && !selectedAttribute) {
        setSelectedAttribute(data[0]);
      }
    } catch {
      console.error("Failed to fetch attributes");
      toast.error("Failed to fetch attributes");
    } finally {
      setLoadingAttributes(false);
    }
  }, [selectedAttribute, setAttributes, setLoadingAttributes, setSelectedAttribute]); // toast is stable from sonner

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    if (selectedAttribute) {
      fetchAttributeValues(selectedAttribute.id);
    } else {
      setAttributeValues([]);
    }
  }, [selectedAttribute]);

  // Fetch values for a given attribute
  const fetchAttributeValues = async (attributeId: string) => {
    setLoadingValues(true);
    try {
      const { data, error } = await supabase
        .from("attribute_values")
        .select("*")
        .eq("attribute_id", attributeId)
        .order("value", { ascending: true });

      if (error) throw error;
      setAttributeValues(data || []);
    } catch (err) {
      console.error("Failed to fetch attribute values", err);
      toast.error("Failed to fetch attribute values");
    } finally {
      setLoadingValues(false);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeName.trim()) return;

    setIsSubmittingAttr(true);
    try {
      const { data, error } = await supabase
        .from("attributes")
        .insert({ name: attributeName })
        .select()
        .single();

      if (error) throw error;

      toast.success("Attribute created successfully");
      setAttributeName("");
      fetchAttributes();
      if (data) {
        setSelectedAttribute(data as Attribute);
      }
    } catch {
      console.error("Failed to create attribute");
      toast.error("Failed to create attribute");
    } finally {
      setIsSubmittingAttr(false);
    }
  };

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute || !newValue.trim()) return;

    setIsSubmittingValue(true);
    try {
      const { error } = await supabase
        .from("attribute_values")
        .insert({
          attribute_id: selectedAttribute.id,
          value: newValue,
        });

      if (error) throw error;

      toast.success("Value added successfully");
      setNewValue("");
      fetchAttributeValues(selectedAttribute.id);
    } catch {
      console.error("Failed to add value");
      toast.error("Failed to add value");
    } finally {
      setIsSubmittingValue(false);
    }
  };

  const handleDeleteAttribute = async (id: string, name: string) => {
    // Check if this attribute has active product variants using it
    try {
      const { data, error } = await supabase
        .from("variant_attribute_values")
        .select("variant_id")
        .eq("attribute_value_id", id) // Wait, check if any value under this attribute is used in variants
        .limit(1); // Wait, this is slightly complex. Let's select all attribute values for this ID first
      
      const { data: attrVals } = await supabase
        .from("attribute_values")
        .select("id")
        .eq("attribute_id", id);
      
      if (attrVals && attrVals.length > 0) {
        const valIds = attrVals.map(v => v.id);
        const { data: usedVariants, error: useErr } = await supabase
          .from("variant_attribute_values")
          .select("variant_id")
          .in("attribute_value_id", valIds)
          .limit(1);

        if (useErr) throw useErr;

        if (usedVariants && usedVariants.length > 0) {
          toast.error(`Cannot delete attribute "${name}": It is used in product variants.`);
          return;
        }
      }

      if (!confirm(`Are you sure you want to delete attribute "${name}"? This will delete all its values.`)) return;

      const { error: delErr } = await supabase
        .from("attributes")
        .delete()
        .eq("id", id);

      if (delErr) throw delErr;

      toast.success("Attribute deleted successfully");
      if (selectedAttribute?.id === id) {
        setSelectedAttribute(null);
      }
      fetchAttributes();
    } catch {
      console.error("Failed to delete attribute");
      toast.error("Failed to delete attribute");
    }
  };

  const handleDeleteValue = async (valueId: string, valueName: string) => {
    // Check if this value is used in active product variants
    try {
      const { data: usedVariants, error: useErr } = await supabase
        .from("variant_attribute_values")
        .select("variant_id")
        .eq("attribute_value_id", valueId)
        .limit(1);

      if (useErr) throw useErr;

      if (usedVariants && usedVariants.length > 0) {
        toast.error(`Cannot delete value "${valueName}": It is currently assigned to product variants.`);
        return;
      }

      if (!confirm(`Are you sure you want to delete value "${valueName}"?`)) return;

      const { error } = await supabase
        .from("attribute_values")
        .delete()
        .eq("id", valueId);

      if (error) throw error;

      toast.success("Value deleted successfully");
      if (selectedAttribute) {
        fetchAttributeValues(selectedAttribute.id);
      }
    } catch {
      console.error("Failed to delete value");
      toast.error("Failed to delete value");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight flex items-center gap-2">
          <Sliders className="h-8 w-8 text-primary" />
          <span>Attribute Configurations</span>
        </h1>
        <p className="text-muted-foreground font-light text-sm">
          Define global product options like Size, Color, Storage, or Material to generate variations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Attributes List */}
        <Card className="md:col-span-1 border border-border">
          <CardHeader>
            <CardTitle className="font-normal text-lg flex items-center gap-2">
              <Settings size={18} />
              <span>Attributes</span>
            </CardTitle>
            <CardDescription className="font-light">
              Manage custom catalog options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form */}
            <form onSubmit={handleAddAttribute} className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. Storage"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                disabled={isSubmittingAttr}
                className="font-light bg-background"
                required
              />
              <Button type="submit" size="icon" disabled={isSubmittingAttr || !attributeName.trim()}>
                {isSubmittingAttr ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              {loadingAttributes ? (
                <div className="flex justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : attributes.length === 0 ? (
                <p className="text-sm font-light text-muted-foreground text-center py-4">No attributes created.</p>
              ) : (
                <div className="space-y-1">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      onClick={() => setSelectedAttribute(attr)}
                      className={`flex justify-between items-center px-3 py-2.5 rounded-md cursor-pointer text-sm transition-colors ${
                        selectedAttribute?.id === attr.id
                          ? "bg-primary text-primary-foreground font-normal"
                          : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="truncate">{attr.name}</span>
                      <div className="flex items-center gap-2">
                        {selectedAttribute?.id === attr.id ? (
                          <ChevronRight size={14} className="opacity-80" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttribute(attr.id, attr.name);
                            }}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Selected Attribute Values */}
        <Card className="md:col-span-2 border border-border">
          <CardHeader>
            <CardTitle className="font-normal text-lg flex items-center gap-2">
              <Tag size={18} />
              <span>Options for "{selectedAttribute?.name || "No Selection"}"</span>
            </CardTitle>
            <CardDescription className="font-light">
              Add individual options (like "Small" or "Gold") that variants can take.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedAttribute ? (
              <p className="text-sm font-light text-muted-foreground text-center py-12 bg-muted/10 rounded border border-dashed">
                Select or create an attribute from the left sidebar to configure values.
              </p>
            ) : (
              <>
                {/* Form */}
                <form onSubmit={handleAddValue} className="flex gap-2 max-w-md">
                  <Input
                    type="text"
                    placeholder={`e.g. ${selectedAttribute.name === "Size" ? "Medium" : "128GB"}`}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    disabled={isSubmittingValue}
                    className="font-light bg-background"
                    required
                  />
                  <Button type="submit" className="font-light" disabled={isSubmittingValue || !newValue.trim()}>
                    {isSubmittingValue ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Adding...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus size={14} />
                        <span>Add Value</span>
                      </span>
                    )}
                  </Button>
                </form>

                <div className="border-t border-border pt-4">
                  {loadingValues ? (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : attributeValues.length === 0 ? (
                    <p className="text-sm font-light text-muted-foreground text-center py-12 bg-muted/5 border border-dashed rounded-md">
                      No values defined for this attribute yet. Add one above.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {attributeValues.map((val) => (
                        <div
                          key={val.id}
                          className="flex justify-between items-center p-3 rounded-md bg-muted/20 border border-border text-sm"
                        >
                          <span className="truncate font-light text-foreground">{val.value}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                            onClick={() => handleDeleteValue(val.id, val.value)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAttributes;
