export const extractVariantAttributes = (products) => {
  const attributeMap = new Map();

  products.forEach((product) => {
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        Object.keys(variant).forEach((key) => {
          if (key !== "_id" && key !== "stock" && key !== "price") {
            if (!attributeMap.has(key)) {
              attributeMap.set(key, new Set());
            }
            attributeMap.get(key).add(variant[key]);
          }
        });
      });
    }
  });

  return Array.from(attributeMap.entries()).map(([attribute, values]) => ({
    attribute,
    values: Array.from(values).map((value) => ({
      value,
      label: value,
    })),
  }));
};

  // const handleFilterChange = (selected) => {
  //   const updatedFilters = {
  //     ...selectedFilters,
  //     stockStatus: selected?.value || null,
  //   };
  //   setSelectedFilters(updatedFilters);
  //   onUpdateProducts(updatedFilters, selectedSort);
  // };