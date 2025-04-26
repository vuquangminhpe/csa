import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSortAmountDown,
  faSortAmountUp,
  faFilter,
  faMoneyBillTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import BaseModal from "../Modal/BaseModal";
import { Container } from "../../config/baseBoostrap";
import { extractVariantAttributes } from "../../utils/filterUtils";
import { getPriceRange } from "../../utils/priceUtils";
import PriceRangeSlider from "./PriceRangeSlider";
import PriceFilter from "./PriceFilter";
import AttributeFilter from "./AttributeFilter";

const ProductFilterSort = ({ onUpdateProducts, products }) => {
  const [selectedSort, setSelectedSort] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [appliedFilters, setAppliedFilters] = useState({});

  const sortOptions = [
    { value: "desc", label: "Giá Cao - Thấp", icon: faSortAmountDown },
    { value: "asc", label: "Giá Thấp - Cao", icon: faSortAmountUp },
  ];

  const stockOptions = [
    { value: "inStock", label: "Còn hàng" },
    { value: "outOfStock", label: "Hết hàng" },
  ];
  useEffect(() => {
    setAttributeFilters(extractVariantAttributes(products));
    setPriceRange(getPriceRange(products));
  }, [products]);
  
  const handleFilterChange = (attribute, value) => {
    setSelectedFilters((prevFilters) => {
      const updatedFilters = {
        ...prevFilters,
        [attribute]: value,
      };
      console.log(" Updated Filters:", updatedFilters); 
      return updatedFilters;
    });
  };

  const handleSortChange = (option) => {
    setSelectedSort(option.value);
    onUpdateProducts(selectedFilters, option.value);
  };

  const applyFilters = () => {
    console.log("✅ Applying Filters:", selectedFilters);
    const {price}=selectedFilters;
    onUpdateProducts({
      ...selectedFilters,
      minPrice: price?.min||priceRange.min,
      maxPrice: price?.max||priceRange.max,
      
    });
    setIsFilterOpen(false);
    setSelectedFilters({});
  };
  const handleFilterChanges = (selected) => {
    const updatedFilters = {
      ...selectedFilters,
      stockStatus: selected?.value || null,
    };
    setSelectedFilters(updatedFilters);
    onUpdateProducts(updatedFilters, selectedSort);
  };
  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <span className="fw-bold text-dark">Sắp xếp theo:</span>
      <div className="d-flex gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={`btn border-1 ${
              selectedSort === option.value
                ? "border-danger text-danger bg-white"
                : "border-light text-dark bg-light"
            }`}
            onClick={() => handleSortChange(option)}
          >
            <FontAwesomeIcon icon={option.icon} className="me-2" />
            {option.label}
          </button>
        ))}
      </div>
      <div className="d-flex align-items-center gap-2">
        <FontAwesomeIcon icon={faMoneyBillTrendUp} />
        <Select
          options={stockOptions}
          placeholder="Bộ lọc..."
          className="w-100"
          onChange={handleFilterChanges}
        />
      </div>
      <button
        className="btn btn-outline-primary d-flex align-items-center gap-2"
        onClick={() => setIsFilterOpen(true)}
      >
        <FontAwesomeIcon icon={faFilter} />
        Bộ lọc
      </button>
      <BaseModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Bộ Lọc Sản Phẩm"
        onApply={applyFilters}
      >
       <Container>
          <div className="row">
          <AttributeFilter filters={attributeFilters} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
          <PriceFilter priceRange={priceRange} onFilterChange={handleFilterChange} />
          </div>
        </Container>
    
      </BaseModal>
     
    </div>
  );
};

export default ProductFilterSort;
