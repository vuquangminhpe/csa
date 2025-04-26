import React from "react";

const AttributeFilter = ({ filters, selectedFilters, onFilterChange }) => {
  return (
    <>
      {filters.length > 0 &&
        filters.map(({ attribute, values }) => (
          <div key={attribute} className="col-md-6">
            <h6 className="fw-bold">{attribute.charAt(0).toUpperCase() + attribute.slice(1)}</h6>
            <div className="d-flex flex-wrap gap-2">
              {values.map((option) => (
                <button
                  key={option.value}
                  className={`btn ${selectedFilters[attribute] === option.value ? "btn btn-outline-danger" : "btn-light border"}`}
                  onClick={() => onFilterChange(attribute, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
    </>
  );
};

export default AttributeFilter;
