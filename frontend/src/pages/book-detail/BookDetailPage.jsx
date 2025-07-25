import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BookDetailPage.css';
import PublicHeader from '../../components/common/PublicHeader';
import { getBookById } from '../../services/BookService';
import { addToCart } from '../../services/CartService';
import { useAuth } from '../../contexts/AuthContext';
import { rateBook, getRatingsByBookID, hasPurchasedBook } from '../../services/RatingService';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loadCartCount } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canRate, setCanRate] = useState(false);

  // Lấy dữ liệu sách từ backend
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBookById(id);
        setBook(data);
      } catch (err) {
        setError('Không tìm thấy thông tin sách');
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id]);

  // Lấy đánh giá từ backend
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const data = await getRatingsByBookID(id);
        setReviews(data);
        // Nếu user đã đánh giá, điền sẵn
        if (user) {
          const myReview = data.find(r => r.user_id === user.id);
          if (myReview) {
            setMyRating(myReview.rating);
            setMyComment(myReview.comment || '');
          }
        }
      } catch (e) {
        setReviews([]);
      }
    };
    fetchRatings();
  }, [id, user]);

  // Kiểm tra quyền đánh giá (user đã mua sách)
  useEffect(() => {
    const checkCanRate = async () => {
      if (!user) {
        setCanRate(false);
        return;
      }
      try {
        const purchased = await hasPurchasedBook(id);
        setCanRate(purchased);
      } catch {
        setCanRate(false);
      }
    };
    checkCanRate();
  }, [user, id]);

  // Tính toán giá sau giảm (chỉ khi book đã load)
  const discountedPrice = book && typeof book.price !== 'undefined' ? Number(book.price) : 0;
  const originalPrice = book && typeof book.originalPrice !== 'undefined' ? Number(book.originalPrice) : 0;
  const savings = (originalPrice && discountedPrice) ? (originalPrice - discountedPrice) : 0;

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (newQuantity) => {
    if (book && newQuantity >= 1 && newQuantity <= (book.stock || book.quantity_in_stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!book) return;
    
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sách vào giỏ hàng');
      navigate('/login');
      return;
    }

    try {
      const response = await addToCart(book.id, quantity);
      if (response.success) {
        alert(`Đã thêm ${quantity} cuốn "${book.title || book.name}" vào giỏ hàng!`);
        // Cập nhật số lượng trong context
        await loadCartCount();
      } else {
        alert(response.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng: ' + error.message);
    }
  };

  // Xử lý mua ngay
  const handleBuyNow = async () => {
    if (!book) return;
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }
    // Tạo dữ liệu sản phẩm mua ngay
    const cartData = {
      cartItems: [
        {
          id: book.id,
          bookId: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          originalPrice: book.originalPrice || book.price,
          discount: book.originalPrice ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0,
          image_path: book.imageUrls && book.imageUrls[0],
          quantity: quantity,
          stock: book.stock || book.quantity_in_stock || 0
        }
      ],
      appliedCoupon: null
    };
    navigate('/checkout', { state: { cartData } });
  };

  // Xử lý thêm vào yêu thích
  const handleToggleFavorite = async () => {
    if (!book) return;
    try {
      if (isFavorite) {
        console.log('Đã xóa khỏi yêu thích!');
        alert('Đã xóa khỏi yêu thích!');
      } else {
        console.log('Đã thêm vào yêu thích!');
        alert('Đã thêm vào yêu thích! Bạn có thể xem trong trang Yêu thích.');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  // Gửi đánh giá
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!myRating) {
      alert('Vui lòng chọn số sao!');
      return;
    }
    setSubmitting(true);
    try {
      const res = await rateBook(id, myRating, myComment);
      if (res.error) {
        alert(res.error);
      } else {
        alert(res.message || 'Đánh giá thành công!');
        // Reload lại đánh giá
        const data = await getRatingsByBookID(id);
        setReviews(data);
      }
    } catch (err) {
      alert('Có lỗi khi gửi đánh giá!');
    } finally {
      setSubmitting(false);
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="book-detail-page">
        <PublicHeader />
        <div className="book-detail-container">
          <div className="loading">Đang tải thông tin sách...</div>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error || !book) {
    return (
      <div className="book-detail-page">
        <PublicHeader />
        <div className="book-detail-container">
          <div className="error">
            {error || 'Không tìm thấy thông tin sách'}
            <button onClick={() => navigate('/books')}>Quay lại danh sách sách</button>
          </div>
        </div>
      </div>
    );
  }

  // Tính toán đánh giá trung bình và thống kê
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  // Tính toán thống kê đánh giá
  const getRatingStats = () => {
    if (!reviews) return {};
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      stats[review.rating]++;
    });
    const total = reviews.length;
    return {
      counts: stats,
      percentages: {
        1: total > 0 ? Math.round((stats[1] / total) * 100) : 0,
        2: total > 0 ? Math.round((stats[2] / total) * 100) : 0,
        3: total > 0 ? Math.round((stats[3] / total) * 100) : 0,
        4: total > 0 ? Math.round((stats[4] / total) * 100) : 0,
        5: total > 0 ? Math.round((stats[5] / total) * 100) : 0
      }
    };
  };
  const ratingStats = getRatingStats();

  // Hàm lấy URL ảnh đúng chuẩn backend
  const getBookImageUrl = (book, idx = 0) => {
    if (!book.imageUrls || book.imageUrls.length === 0) return '';
    const url = book.imageUrls[idx] || book.imageUrls[0];
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <div className="book-detail-page">
      <PublicHeader />
      <div className="book-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span> / </span>
          <span onClick={() => navigate('/books')}>Sách</span>
          <span> / </span>
          <span>{book.title || book.name}</span>
        </div>
        {/* Thông tin sách chính */}
        <div className="book-detail-main">
          {/* Hình ảnh sách */}
          <div className="book-images">
            <div className="main-image">
              <img
                src={getBookImageUrl(book, selectedImage) || '/assets/book-placeholder.jpg'}
                alt={book.title || book.name}
              />
            </div>
            <div className="image-thumbnails">
              {book.imageUrls && book.imageUrls.length > 0 ? (
                book.imageUrls.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`}
                    alt={`${book.title || book.name} ${idx + 1}`}
                    className={selectedImage === idx ? 'active' : ''}
                    onClick={() => setSelectedImage(idx)}
                    style={{ cursor: 'pointer' }}
                  />
                ))
              ) : (
                <img
                  src="/assets/book-placeholder.jpg"
                  alt="placeholder"
                  className="active"
                />
              )}
            </div>
          </div>
          {/* Thông tin sách */}
          <div className="book-info">
            <h1 className="book-title">{book.title || book.name || 'Không rõ'}</h1>
            <p className="book-author">Tác giả: {book.author || 'Không rõ'}</p>
            {/* Đánh giá */}
            <div className="book-rating">
              <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= averageRating ? 'star filled' : 'star'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="rating-text">{averageRating.toFixed(1)} ({reviews ? reviews.length : 0} đánh giá)</span>
            </div>
            {/* Giá */}
            <div className="book-price">
              <span className="current-price">{discountedPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
              {originalPrice > discountedPrice && (
                <>
                  <span className="original-price">{originalPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                  {book.discount && <span className="discount">-{book.discount}%</span>}
                </>
              )}
            </div>
            {/* Thông tin cơ bản */}
            <div className="book-meta">
              <div className="meta-item">
                <span className="label">Thể loại:</span>
                <span className="value">{book.category || 'Không rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Nhà xuất bản:</span>
                <span className="value">{book.publisher || 'Không rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Năm xuất bản:</span>
                <span className="value">{book.publicationYear || 'Không rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Tồn kho:</span>
                <span className="value">{book.stock || book.quantity_in_stock || 0} cuốn</span>
              </div>
            </div>
            {/* Tình trạng kho */}
            <div className="stock-status">
              <span className={`status ${(book.stock || book.quantity_in_stock) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {(book.stock || book.quantity_in_stock) > 0 ? 'Còn hàng' : 'Hết hàng'}
              </span>
              {(book.stock || book.quantity_in_stock) > 0 && <span className="stock-count">({book.stock || book.quantity_in_stock} cuốn)</span>}
            </div>
            {/* Chọn số lượng */}
            <div className="quantity-selector">
              <span className="label">Số lượng:</span>
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={book.stock || book.quantity_in_stock || 1}
                />
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= (book.stock || book.quantity_in_stock)}
                >
                  +
                </button>
              </div>
            </div>
            {/* Nút hành động */}
            <div className="action-buttons">
              <button className="btn-add-cart" onClick={handleAddToCart}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007 17h10a1 1 0 00.95-.68L21 13M7 13V6a1 1 0 011-1h6a1 1 0 011 1v7"/>
                </svg>
                Thêm vào giỏ hàng
              </button>
              <button className="btn-buy-now" onClick={handleBuyNow}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Mua ngay
              </button>
            </div>
            {/* Thông tin giao hàng */}
            <div className="delivery-info">
              <div className="delivery-item">
                <span className="icon">🚚</span>
                <span>Miễn phí vận chuyển cho đơn hàng từ 200.000đ</span>
              </div>
              <div className="delivery-item">
                <span className="icon">🔄</span>
                <span>Đổi trả trong 30 ngày</span>
              </div>
              <div className="delivery-item">
                <span className="icon">🛡️</span>
                <span>Bảo hành chính hãng</span>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs thông tin chi tiết */}
        <div className="book-detail-tabs">
          <div className="tab-headers">
            <button 
              className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Mô tả
            </button>
            <button 
              className={`tab-header ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({reviews ? reviews.length : 0})
            </button>
            <button 
              className={`tab-header ${activeTab === 'related' ? 'active' : ''}`}
              onClick={() => setActiveTab('related')}
            >
              Sách liên quan
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-content">
                <h3>Mô tả sản phẩm</h3>
                <p>{book.description || 'Chưa có mô tả chi tiết cho sách này.'}</p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="reviews-summary">
                  <div className="rating-overview">
                  <div className="average-rating">
                    <span className="rating-number">{averageRating.toFixed(1)}</span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= averageRating ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="total-reviews">{reviews ? reviews.length : 0} đánh giá</span>
                    </div>
                    <div className="rating-stats">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="rating-bar-item">
                          <span className="rating-label">{rating} sao</span>
                          <div className="rating-bar">
                            <div 
                              className="rating-bar-fill" 
                              style={{ width: `${ratingStats.percentages?.[rating] || 0}%` }}
                            ></div>
                          </div>
                          <span className="rating-count">{ratingStats.counts?.[rating] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {user && canRate && (
                  <form className="review-form" onSubmit={handleSubmitRating} style={{marginBottom: 24, background: '#f0f9f9', padding: 16, borderRadius: 8}}>
                    <div style={{marginBottom: 8}}>
                      <span style={{fontWeight: 500}}>Đánh giá của bạn:</span>
                      <div style={{display: 'inline-block', marginLeft: 8}}>
                        {[1,2,3,4,5].map(star => (
                          <span
                            key={star}
                            className={star <= myRating ? 'star filled' : 'star'}
                            style={{fontSize: 22, cursor: 'pointer', color: star <= myRating ? '#fbbf24' : '#e2e8f0'}}
                            onClick={() => setMyRating(star)}
                          >★</span>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={myComment}
                      onChange={e => setMyComment(e.target.value)}
                      placeholder="Viết nhận xét của bạn..."
                      rows={3}
                      style={{width: '100%', borderRadius: 6, border: '1px solid #e2e8f0', padding: 8, marginBottom: 8}}
                    />
                    <button type="submit" className="btn-add-cart" disabled={submitting} style={{width: 180}}>
                      {submitting ? 'Đang gửi...' : (myRating && reviews.find(r => r.user_id === user.id) ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                    </button>
                  </form>
                )}
                {user && !canRate && (
                  <div style={{marginBottom: 24, color: '#e53e3e', fontStyle: 'italic'}}>
                    Bạn chỉ có thể đánh giá khi đã mua sách này.
                  </div>
                )}
                <div className="reviews-list">
                  {reviews && reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                        <span className="reviewer-name">{review.user_name}</span>
                          <div className="review-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={star <= review.rating ? 'star filled' : 'star'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="review-date">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <p>Chưa có đánh giá nào cho sách này.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'related' && (
              <div className="related-content">
                <div className="related-books">
                  <div className="no-related">
                    <p>Chưa có sách liên quan.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetailPage; 