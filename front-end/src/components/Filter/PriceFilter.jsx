import React from "react";
import PriceRangeSlider from "./PriceRangeSlider";

const PriceFilter = ({ priceRange, onFilterChange }) => {
  return (
    <div className="col-md-6">
      <h6 className="fw-bold">Khoảng giá</h6>
      <PriceRangeSlider
        minPrice={priceRange.min}
        maxPrice={priceRange.max}
        onApply={(selectedRange) => onFilterChange("price", selectedRange)}
      />
    </div>
  );
};

export default PriceFilter;
