import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ManagePosts.css';

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [deleteOldImages, setDeleteOldImages] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('authToken');

  // Fetch tất cả bài đăng
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:9999/api/posts');
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách bài đăng');
      setLoading(false);
      console.error('Lỗi khi tải bài đăng:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Cấu hình các module cho Quill
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // định dạng text
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // danh sách
      ['link'],                                          // liên kết
      ['clean']                                          // xóa định dạng
    ],
  };
  
  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  // Xử lý thay đổi input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Xử lý thay đổi file hình ảnh
  const handleImageChange = (e) => {
    // Thay vì thay thế hoàn toàn, chúng ta sẽ thêm các file mới vào danh sách hiện tại
    const newFiles = Array.from(e.target.files);
    console.log('New selected files:', newFiles);
    
    // Kết hợp file mới với file đã chọn trước đó
    setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Reset input để có thể chọn cùng file nhiều lần nếu cần
    e.target.value = '';
  };

  // Thêm hàm xóa file đã chọn
  const removeSelectedFile = (index) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Mở form tạo bài đăng mới
  const openCreateForm = () => {
    setCurrentPost(null);
    setFormData({
      title: '',
      content: '',
    });
    setImageFiles([]);
    setDeleteOldImages(false);
    setImagesToDelete([]);
    setShowForm(true);
  };

  // Mở form chỉnh sửa bài đăng
  const openEditForm = (post) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      content: post.content,
    });
    setImageFiles([]);
    setDeleteOldImages(false);
    setImagesToDelete([]);
    setShowForm(true);
  };

  // Đóng form
  const closeForm = () => {
    setShowForm(false);
    setCurrentPost(null);
  };

  // Xử lý thay đổi nội dung từ Quill
  const handleContentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      content: value
    }));
  };

  // Xử lý xóa ảnh
  const handleDeleteImage = (imageIndex) => {
    if (currentPost && currentPost.images) {
      // Thêm đường dẫn ảnh vào danh sách cần xóa
      setImagesToDelete([...imagesToDelete, currentPost.images[imageIndex]]);
      
      // Cập nhật danh sách ảnh hiện tại (chỉ UI, chưa lưu vào DB)
      const updatedImages = [...currentPost.images];
      updatedImages.splice(imageIndex, 1);
      setCurrentPost({
        ...currentPost,
        images: updatedImages
      });
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('author_id', user._id);
      
      // Thêm các file ảnh mới
      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });
      
      if (currentPost) {
        // Cập nhật bài đăng
        formDataToSend.append('deleteOldImages', deleteOldImages);
        
        // Thêm danh sách ảnh cần xóa
        if (imagesToDelete.length > 0) {
          formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
        }
        
        await axios.put(
          `http://localhost:9999/api/posts/${currentPost._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        alert('Cập nhật bài đăng thành công!');
      } else {
        // Tạo bài đăng mới
        await axios.post(
          'http://localhost:9999/api/posts',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        alert('Tạo bài đăng mới thành công!');
      }
      
      // Reset form và đóng modal
      closeForm();
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi xử lý bài đăng:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  // Xử lý xóa bài đăng
  const handleDelete = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không?')) {
      try {
        await axios.delete(
          `http://localhost:9999/api/posts/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        alert('Xóa bài đăng thành công!');
        fetchPosts();
      } catch (err) {
        alert(`Lỗi: ${err.response?.data?.message || 'Không thể xóa bài đăng'}`);
        console.error('Lỗi khi xóa bài đăng:', err);
      }
    }
  };

  if (loading) return <div className="manage-posts__loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="manage-posts__error">{error}</div>;

  return (
    <div className="manage-posts">
      <div className="manage-posts__header">
        <h2 className="manage-posts__title">Quản lý bài đăng</h2>
        <button 
          className="manage-posts__add-button" 
          onClick={openCreateForm}
        >
          <i className="fas fa-plus"></i> Thêm bài đăng mới
        </button>
      </div>

      {/* Danh sách bài đăng */}
      <div className="manage-posts__list">
        <table className="manage-posts__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tiêu đề</th>
              <th>Ngày tạo</th>
              <th>Hình ảnh</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="5" className="manage-posts__empty">Chưa có bài đăng nào</td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr key={post._id}>
                  <td>{index + 1}</td>
                  <td>{post.title}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {post.images && post.images.length > 0 ? (
                      <img 
                        src={post.images[0].startsWith('http') 
                          ? post.images[0] 
                          : `http://localhost:9999${post.images[0]}`} 
                        alt={post.title} 
                        className="manage-posts__thumbnail" 
                      />
                    ) : (
                      <span>Không có hình ảnh</span>
                    )}
                  </td>
                  <td className="manage-posts__actions">
                    <button 
                      className="manage-posts__edit-button"
                      onClick={() => openEditForm(post)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="manage-posts__delete-button"
                      onClick={() => handleDelete(post._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form thêm/sửa bài đăng */}
      {showForm && (
        <div className="manage-posts__form-overlay">
          <div className="manage-posts__form-container">
            <div className="manage-posts__form-header">
              <h3>{currentPost ? 'Chỉnh sửa bài đăng' : 'Thêm bài đăng mới'}</h3>
              <button 
                className="manage-posts__close-button"
                onClick={closeForm}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="manage-posts__form">
              <div className="manage-posts__form-group">
                <label htmlFor="title">Tiêu đề:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="manage-posts__input"
                />
              </div>
              
              <div className="manage-posts__form-group">
                <label htmlFor="content">Nội dung:</label>
                <ReactQuill
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={modules}
                  formats={formats}
                  className="manage-posts__rich-editor"
                />
              </div>
              
              <div className="manage-posts__form-group">
                <label htmlFor="images">Hình ảnh:</label>
                <input
                  type="file"
                  id="images"
                  onChange={handleImageChange}
                  multiple
                  accept=".png,.jpg,.jpeg"
                  className="manage-posts__file-input"
                />
                <small className="manage-posts__help-text">Chọn một hoặc nhiều file ảnh (PNG, JPG) - Tối đa 10 ảnh</small>
                
                {imageFiles.length > 0 && (
                  <div className="manage-posts__selected-files">
                    <p>Đã chọn {imageFiles.length} file:</p>
                    <ul>
                      {imageFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {currentPost && currentPost.images && currentPost.images.length > 0 && (
                  <div className="manage-posts__current-images">
                    <p>Ảnh hiện tại:</p>
                    <div className="manage-posts__image-preview">
                      {currentPost.images.map((image, index) => (
                        <div key={index} className="manage-posts__image-item">
                          <img 
                            src={image.startsWith('http') 
                              ? image 
                              : `http://localhost:9999${image}`} 
                            alt={`Ảnh ${index + 1}`} 
                          />
                          <button 
                            type="button"
                            className="manage-posts__delete-image"
                            onClick={() => handleDeleteImage(index)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="manage-posts__checkbox-group">
                      <input
                        type="checkbox"
                        id="deleteOldImages"
                        checked={deleteOldImages}
                        onChange={(e) => setDeleteOldImages(e.target.checked)}
                        disabled={currentPost.images.length === 0}
                      />
                      <label htmlFor="deleteOldImages">
                        Xóa tất cả ảnh cũ khi thêm ảnh mới
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="manage-posts__form-actions">
                <button 
                  type="button" 
                  onClick={closeForm}
                  className="manage-posts__cancel-button"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="manage-posts__submit-button"
                >
                  {currentPost ? 'Cập nhật' : 'Tạo bài đăng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePosts; 