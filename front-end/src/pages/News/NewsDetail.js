import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import "./NewsDetail.css";
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";

const NewsDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9999/api/posts/${id}`
        );
        setPost(response.data);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải thông tin bài viết. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Lỗi khi tải chi tiết bài viết:", err);
      }
    };

    fetchPostDetail();
  }, [id]);

  if (loading)
    return (
      <>
        <Header />
        <div className="news-detail__loading">Đang tải bài viết...</div>
        <Footer />
      </>
    );

  if (error)
    return (
      <>
        <Header />
        <div className="news-detail__error">{error}</div>
        <Footer />
      </>
    );

  if (!post)
    return (
      <>
        <Header />
        <div className="news-detail__error">Không tìm thấy bài viết</div>
        <Footer />
      </>
    );

  return (
    <>
      <Header />
      <div className="news-detail">
        <div className="news-detail__container">
          <div className="news-detail__header">
            <Link to="/news" className="news-detail__back-button">
              <i className="fas fa-arrow-left"></i> Quay lại tin tức
            </Link>
            <h1 className="news-detail__title">{post.title}</h1>
            <div className="news-detail__meta">
              <span className="news-detail__date">
                Đăng ngày:{" "}
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          {post.images && post.images.length > 0 && (
            <div className="news-detail__image">
              <img
                src={
                  post.images[0].startsWith("http")
                    ? post.images[0]
                    : `http://localhost:9999${post.images[0]}`
                }
                alt={post.title}
              />
            </div>
          )}

          {post.images && post.images.length > 1 && (
            <div className="news-detail__gallery">
              <h3 className="news-detail__gallery-title text-center">Hình ảnh</h3>
              <div className="news-detail__gallery-grid">
                {post.images.slice(1).map((image, index) => (
                  <div className="news-detail__gallery-item" key={index}>
                    <img
                      src={
                        image.startsWith("http")
                          ? image
                          : `http://localhost:9999${image}`
                      }
                      alt={`${post.title} - ảnh ${index + 2}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <br></br>
          <div
            className="news-detail__content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          ></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NewsDetail;
