import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://www.apple.com/newsroom/images/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/tile/Apple-iPhone-16-Pro-hero-240909-lp.jpg.landing-big_2x.jpg",
      title: "Điện Thoại Chất Lượng",
      subtitle: "Trải nghiệm mua sắm tốt nhất với các sản phẩm cao cấp"
    },
    {
      image: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/07/SCam-CellphoneS.jpeg",
      title: "Khuyến Mãi Đặc Biệt",
      subtitle: "Giảm giá lên đến 40% cho các sản phẩm điện thoại"
    },
    {
      image: "https://cdn.prod.website-files.com/61742d08844b8d983f1fa303/643d5497f490a85a4b2b57bf_LGK_banner_16x9_3.webp",
      title: "Bộ Sưu Tập Mới",
      subtitle: "Khám phá các sản phẩm mới nhất của chúng tôi"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => 
        prevSlide === slides.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, );

  return (
    <div style={styles.heroContainer}>
      {/* Left Advertisement */}
      <Link to="/products/gaming-mouse" style={styles.adContainer}>
        <div style={styles.adCard}>
          <img 
            src="https://product.hstatic.net/200000409445/product/22_adc19b9d3fa148c09d64dd5cced09c15_master.jpg" 
            alt="iPhone 16 Pro Max"
            style={styles.adImage}
          />
          <div style={styles.adContent}>
            <h3 style={styles.adTitle}>iPhone 16 Pro Max</h3>
            <p style={styles.adPrice}>Giá chỉ từ 32.790.000đ</p>
          </div>
        </div>
      </Link>

      {/* Main Banner */}
      <div style={styles.banner}>
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              ...styles.slide,
              opacity: currentSlide === index ? 1 : 0,
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div style={styles.overlay}></div>
            <div style={styles.content}>
              <h1 style={styles.title}>{slide.title}</h1>
              <p style={styles.subtitle}>{slide.subtitle}</p>
              {/* <div style={styles.buttonContainer}>
                <Link to="/products" style={styles.shopButton}>
                  Mua sắm ngay
                </Link>
              </div> */}
            </div>
          </div>
        ))}

        <div style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <button
              key={index}
              style={{
                ...styles.dot,
                backgroundColor: currentSlide === index ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Right Advertisement */}
      <Link to="/products/gaming-keyboard" style={styles.adContainer}>
        <div style={styles.adCard}>
          <img 
            src="https://samcenter.vn/images/uploaded/24u.png" 
            alt="Samsung Galaxy S25 Ultra 256GB"
            style={styles.adImage}
          />
          <div style={styles.adContent}>
            <h3 style={styles.adTitle}>Samsung Galaxy S25 Ultra 256GB</h3>
            <p style={styles.adPrice}>Giá chỉ từ 30.990.000đ</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

const styles = {
  heroContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    maxWidth: '1800px',
    margin: '0 auto',
  },
  banner: {
    height: '400px',
    width: '800px',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  adContainer: {
    textDecoration: 'none',
    color: 'inherit',
    width: '300px',
    height: '400px',
  },
  adCard: {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)',
    },
  },
  adImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  adContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    color: 'white',
  },
  adTitle: {
    fontSize: '20px',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  adPrice: {
    fontSize: '16px',
    color: '#ffd700',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 0.5s ease-in-out',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    textAlign: 'center',
    padding: '0 20px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  subtitle: {
    fontSize: '20px',
    marginBottom: '25px',
    maxWidth: '600px',
    lineHeight: '1.4',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
  },
  shopButton: {
    padding: '12px 30px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '25px',
    transition: 'all 0.3s ease',
    border: '2px solid #007bff',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    zIndex: 2,
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default Banner;