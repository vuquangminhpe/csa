import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './News.css';
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";

const News = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:9999/api/posts');
        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải tin tức. Vui lòng thử lại sau.');
        setLoading(false);
        console.error('Lỗi khi tải tin tức:', err);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return (
    <>
      <Header />
      <div className="news__loading">Đang tải tin tức...</div>
      <Footer />
    </>
  );
  
  if (error) return (
    <>
      <Header />
      <div className="news__error">{error}</div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <div className="news">
        <div className="news__container">
          <h1 className="news__title">Tin tức công nghệ mới nhất</h1>
          
          <div className="news__grid">
            {posts.map(post => (
              <div className="news-card" key={post._id}>
                {post.images && post.images.length > 0 && (
                  <div className="news-card__image">
                    <img 
                      src={post.images[0].startsWith('http') 
                        ? post.images[0] 
                        : `http://localhost:9999${post.images[0]}`} 
                      alt={post.title} 
                    />
                  </div>
                )}
                <div className="news-card__content">
                  <h2 className="news-card__title">
                    <Link to={`/news/${post._id}`}>{post.title}</Link>
                  </h2>
                  <p className="news-card__excerpt">
                    {post.content.length > 150 
                      ? `${post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...` 
                      : post.content.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="news-card__footer">
                    <span className="news-card__date">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <Link to={`/news/${post._id}`} className="news-card__read-more">
                      Đọc tiếp
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default News; 