import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Modal, Form } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";

function ManageDiscount() {
    const [discounts, setDiscounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 1,
        min_order_value: 1,
        max_discount: 1,
        start_date: "",
        end_date: "",
        usage_limit: 1,
        active: false,
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const response = await axios.get("http://localhost:9999/api/discounts/list");
            // Kiểm tra và cập nhật trạng thái dựa trên ngày kết thúc
            const updatedDiscounts = response.data.map(discount => {
                const endDate = new Date(discount.end_date);
                const today = new Date();
                
                // Nếu ngày kết thúc đã qua, tự động chuyển trạng thái thành không hoạt động
                if (endDate < today && discount.active) {
                    updateDiscountStatus(discount._id, false);
                    return { ...discount, active: false };
                }
                return discount;
            });
            
            setDiscounts(updatedDiscounts);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách mã giảm giá!");
        }
    };

    // Hàm cập nhật trạng thái mã giảm giá
    const updateDiscountStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:9999/api/discounts/update/${id}`, { active: status });
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái mã giảm giá:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: ["discount_value", "min_order_value", "max_discount"].includes(name)
                ? Math.max(1, Number(value)) // Validation: Không nhỏ hơn 1
                : value,
        }));
    };

    const handleShowModal = (discount = null) => {
        if (discount) {
            setEditingId(discount._id);
            setFormData({
                ...discount,
                start_date: discount.start_date ? discount.start_date.split("T")[0] : "",
                end_date: discount.end_date ? discount.end_date.split("T")[0] : "",
            });
        } else {
            setEditingId(null);
            setFormData({
                code: "",
                description: "",
                discount_type: "percentage",
                discount_value: 1,
                min_order_value: 1,
                max_discount: 1,
                start_date: "",
                end_date: "",
                usage_limit: 1,
                active: false,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Kiểm tra giá trị giảm tối đa không được lớn hơn giá trị đơn hàng tối thiểu
        if (formData.max_discount > formData.min_order_value) {
            toast.error("Giá trị giảm tối đa không được lớn hơn giá trị đơn hàng tối thiểu!");
            return;
        }
        
        try {
            if (editingId) {
                await axios.put(`http://localhost:9999/api/discounts/update/${editingId}`, formData);
                toast.success("Cập nhật mã giảm giá thành công!");
            } else {
                await axios.post("http://localhost:9999/api/discounts/add", formData);
                toast.success("Thêm mã giảm giá thành công!");
            }
            fetchDiscounts();
            handleCloseModal();
        } catch (error) {
            toast.error("Lỗi khi lưu mã giảm giá!");
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:9999/api/discounts/delete/${deleteId}`);
            toast.success("Xóa mã giảm giá thành công!");
            fetchDiscounts();
            setShowConfirm(false);
        } catch (error) {
            toast.error("Lỗi khi xóa mã giảm giá!");
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowConfirm(true);
    };

    return (
        <div className="container mt-4">
            <ToastContainer />
            <h2 className="mb-3">Quản lý Mã Giảm Giá</h2>

            <Button variant="primary" onClick={() => handleShowModal()}>
                Thêm Mã Giảm Giá
            </Button>

            <Table striped bordered hover className="mt-3">
                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Mô tả</th>
                        <th>Loại</th>
                        <th>Giá trị</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {discounts.map((discount) => (
                        <tr key={discount._id}>
                            <td>{discount.code}</td>
                            <td>{discount.description}</td>
                            <td>{discount.discount_type === "percentage" ? "Phần trăm" : "Giá cố định"}</td>
                            <td>{discount.discount_value}</td>
                            <td style={{ color: discount.active ? "green" : "red", fontWeight: "bold" }}>
                                {discount.active ? "Hoạt động" : "Không hoạt động"}
                            </td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShowModal(discount)}>
                                    Sửa
                                </Button>{" "}
                                <Button variant="danger" size="sm" onClick={() => confirmDelete(discount._id)}>
                                    Xóa
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal Thêm/Sửa */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? "Chỉnh Sửa" : "Thêm"} Mã Giảm Giá</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group>
                            <Form.Label>Mã Giảm Giá</Form.Label>
                            <Form.Control type="text" name="code" value={formData.code} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control type="text" name="description" value={formData.description} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Loại Giảm Giá</Form.Label>
                            <Form.Control as="select" name="discount_type" value={formData.discount_type} onChange={handleChange}>
                                <option value="percentage">Phần trăm</option>
                                <option value="fixed">Giá cố định</option>
                            </Form.Control>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Giá Trị Giảm</Form.Label>
                            <Form.Control
                                type="number"
                                name="discount_value"
                                value={formData.discount_value}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Giá Trị Đơn Hàng Tối Thiểu</Form.Label>
                            <Form.Control
                                type="number"
                                name="min_order_value"
                                value={formData.min_order_value}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Giảm Tối Đa</Form.Label>
                            <Form.Control
                                type="number"
                                name="max_discount"
                                value={formData.max_discount}
                                onChange={handleChange}
                            />
                            {formData.max_discount > formData.min_order_value && (
                                <div className="text-danger mt-1">
                                    Giá trị giảm tối đa không được lớn hơn giá trị đơn hàng tối thiểu!
                                </div>
                            )}
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Ngày Bắt Đầu</Form.Label>
                            <Form.Control type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Ngày Kết Thúc</Form.Label>
                            <Form.Control type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Giới Hạn Sử Dụng</Form.Label>
                            <Form.Control
                                type="number"
                                name="usage_limit"
                                value={formData.usage_limit}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="mt-3"
                            disabled={formData.max_discount > formData.min_order_value}
                        >
                            {editingId ? "Cập Nhật" : "Thêm"} Mã Giảm Giá
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal Xác Nhận Xóa */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa mã giảm giá này?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirm(false)}>Hủy</Button>
                    <Button variant="danger" onClick={handleDelete}>Xóa</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ManageDiscount;
