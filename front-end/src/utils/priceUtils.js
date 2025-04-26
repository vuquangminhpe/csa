export const getPriceRange = (products) => {
    let min = Infinity,
      max = -Infinity;
  
    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (variant.price) {
          min = Math.min(min, variant.price);
          max = Math.max(max, variant.price);
        }
      });
    });
  
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 10000000 : max };
  };
  