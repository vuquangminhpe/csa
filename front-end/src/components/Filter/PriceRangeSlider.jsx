import React, { useState, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import styled from "styled-components";
import { PriceLabel, PriceRangeWrapper } from "../../config/baseBoostrap";

const PriceRangeSlider = ({ minPrice, maxPrice, onApply }) => {
  const [range, setRange] = useState([minPrice, maxPrice]);
  useEffect(() => {
    setRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);
  const handleChange = (newRange) => {
    setRange(newRange);
    onApply({ min: newRange[0], max: newRange[1] });
  };

  return (
    <PriceRangeWrapper>
      <PriceLabel>
        <span>{range[0].toLocaleString()}đ</span>
        <span>{range[1].toLocaleString()}đ</span>
      </PriceLabel>
      <Slider
        range
        min={minPrice}
        max={maxPrice}
        value={range}
        onChange={handleChange}
        trackStyle={[{ backgroundColor: "red", height: 6 }]}
        handleStyle={[
          { borderColor: "red", backgroundColor: "white" },
          { borderColor: "red", backgroundColor: "white" },
        ]}
      />
    </PriceRangeWrapper>
  );
};

export default PriceRangeSlider;
