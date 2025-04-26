import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  max-width: 1320px; 
  margin: 0 auto; 
  padding: 0 15px; 
`;


export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
`;


export const ModalWrapper = styled.div`
  background: #fff;
  width: 90%;
  max-width: 700px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-in-out;
  max-height: 90vh; 
  overflow-y: auto;  

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;


export const ModalHeader = styled.div`
  background: #f8f9fa;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
`;

export const ModalBody = styled.div`
  padding: 20px;
`;


export const ModalFooter = styled.div`
  padding: 15px;
  background: #f8f9fa;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #555;
`;
export const PriceRangeWrapper = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 15px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
`;

export const PriceLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

export const Button = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  ${({ primary }) =>
    primary
      ? "background: red; color: white;"
      : "background: #f8d7da; color: red;"}
`;

