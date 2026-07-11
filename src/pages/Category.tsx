import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { getCatalogProducts, type CatalogProduct } from "@/lib/catalog";

const Category = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const sortBy = searchParams.get("sort") || "featured";
  const page = Number(searchParams.get("page") || 1);
  const categorySlug = category || "all";

  const selectedCategories = useMemo(() => searchParams.getAll("category"), [searchParams]);
  const selectedPrices = useMemo(() => searchParams.getAll("price"), [searchParams]);
  const selectedMaterials = useMemo(() => searchParams.getAll("material"), [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { products: nextProducts, count: nextCount, totalPages: nextTotalPages } = await getCatalogProducts({
        categorySlug,
        search: searchParams.get("q"),
        sortBy,
        page,
        pageSize: 8,
        selectedCategories,
        selectedPrices,
        selectedMaterials,
      });
      setProducts(nextProducts);
      setCount(nextCount);
      setTotalPages(nextTotalPages);
      setLoading(false);
    };

    loadProducts();
  }, [categorySlug, page, searchParams, selectedCategories, selectedPrices, selectedMaterials, sortBy]);

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-6">
        <CategoryHeader
          category={category || 'All Products'}
        />

        <FilterSortBar
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={count}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />

        <ProductGrid products={products} loading={loading} page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </main>

      <Footer />
    </div>
  );
};

export default Category;