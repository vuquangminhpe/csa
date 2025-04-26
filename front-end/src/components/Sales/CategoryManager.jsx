import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import './CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:9999/api/categories');
      setCategories(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách danh mục');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Edit category
  const handleEdit = (record) => {
    setEditingCategory(record);
    const formData = {
      ...record,
      sub_categories: record.sub_categories?.map(sub => ({
        name: sub.name
      }))
    };
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  // Delete category
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:9999/api/categories/${id}`);
      message.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (error) {
      message.error('Không thể xóa danh mục');
    }
  };

  // Submit form
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedData = {
        name: values.name,
        description: values.description,
        sub_categories: values.sub_categories?.map(sub => ({
          name: sub.name.trim()
        })) || []
      };

      if (editingCategory) {
        await axios.put(`http://localhost:9999/api/categories/${editingCategory._id}`, formattedData);
        message.success('Cập nhật danh mục thành công');
      } else {
        await axios.post('http://localhost:9999/api/categories', formattedData);
        message.success('Thêm danh mục thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      console.error('Error:', error);
      message.error('Có lỗi xảy ra: ' + error.message);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thương hiệu',
      key: 'sub_categories',
      render: (_, record) => (
        <span>
          {record.sub_categories?.map(sub => sub.name).join(', ') || 'Không có'}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="category-manager">
      <div className="category-manager__header">
        <h2>Quản lý danh mục</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="add-category"
        >
          Thêm danh mục
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="_id"
        pagination={{ 
          pageSize: 5,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục` 
        }}
        className="category-table"
      />

      <Modal
        title={editingCategory ? "✏️ Sửa danh mục" : "➕ Thêm danh mục mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCategory(null);
        }}
        footer={null}
        width={800}
        className="category-modal"
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="category-form"
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea placeholder="Nhập mô tả danh mục" rows={4} />
          </Form.Item>

          <Divider>Thương hiệu</Divider>
          
          <Form.List name="sub_categories" initialValue={[]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, width: '100%' }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu' }]}
                      style={{ width: '100%' }}
                    >
                      <Input placeholder={`Tên thương hiệu ${index + 1}`} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: '18px', color: '#ff4d4f' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm thương hiệu
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCategory ? '💾 Cập nhật' : '💾 Thêm mới'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                ❌ Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManager; 